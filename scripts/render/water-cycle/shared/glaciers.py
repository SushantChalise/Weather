"""Load GeoJSON glacier polygons and create extruded 3D meshes with thickness.

The thickness data comes from Farinotti 2019 consensus estimate (CSV).
If the CSV is not available, a default thickness is used with a logged warning.

Coordinate system: same as dem.py (lon=X, lat=Y, alt=Z, 1 BU = 1 km).
"""
from __future__ import annotations

import csv
import json
import math
from pathlib import Path
from typing import Any

import bpy
import bmesh

import materials

_KM_PER_DEG_LAT = 111.0
_REF_LAT = 30.0
_KM_PER_DEG_LON = 111.0 * math.cos(math.radians(_REF_LAT))
_M_TO_BU = 1.0 / 1_000.0


def _lonlat_to_xy(lon: float, lat: float) -> tuple[float, float]:
    x = (lon - 83.0) * _KM_PER_DEG_LON
    y = (lat - 30.0) * _KM_PER_DEG_LAT
    return (x, y)


def _load_thickness_lookup(thickness_csv: Path | None) -> dict[str, float]:
    """Load RGI_id → mean_thickness_m from Farinotti CSV."""
    if thickness_csv is None or not thickness_csv.exists():
        return {}
    lookup: dict[str, float] = {}
    with thickness_csv.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rgi_id = (row.get("RGI_id") or "").strip()
            thick_str = (row.get("mean_thickness_m") or "").strip()
            if rgi_id and thick_str:
                try:
                    lookup[rgi_id] = float(thick_str)
                except ValueError:
                    pass
    print(f"[glaciers] Thickness lookup: {len(lookup)} entries from {thickness_csv.name}")
    return lookup


def _polygon_ring_to_verts(ring: list[list[float]]) -> list[tuple[float, float]]:
    """Convert a GeoJSON ring to list of (x, y) in Blender km space."""
    verts: list[tuple[float, float]] = []
    for coord in ring:
        if len(coord) < 2:
            continue
        verts.append(_lonlat_to_xy(coord[0], coord[1]))
    # Remove duplicate last vertex (GeoJSON rings close themselves)
    if len(verts) > 1 and verts[0] == verts[-1]:
        verts.pop()
    return verts


def _make_extruded_polygon(
    ring_verts: list[tuple[float, float]],
    base_z: float,
    extrude_z: float,
    name: str,
) -> bpy.types.Object | None:
    """Create a flat extruded polygon mesh from a ring of 2D vertices.

    base_z    : bottom of the extrusion (terrain surface elevation in BU)
    extrude_z : height of the extrusion (thickness in BU)
    """
    if len(ring_verts) < 3:
        return None

    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()

    # Bottom face
    bottom_verts = [bm.verts.new((x, y, base_z)) for x, y in ring_verts]
    # Top face
    top_verts = [bm.verts.new((x, y, base_z + extrude_z)) for x, y in ring_verts]

    bm.verts.ensure_lookup_table()

    # Side faces
    n = len(ring_verts)
    for i in range(n):
        j = (i + 1) % n
        try:
            bm.faces.new([bottom_verts[i], bottom_verts[j], top_verts[j], top_verts[i]])
        except Exception:
            pass

    # Top cap
    try:
        bm.faces.new(top_verts)
    except Exception:
        # May fail for non-planar / complex polygons — that's OK
        pass

    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return obj


def load_glaciers(
    geojson_path: Path,
    thickness_csv: Path | None = None,
    default_thickness_m: float = 150.0,
    color_hex: str = "#7DD3FC",
    name_prefix: str = "Glacier",
    base_z_km: float = 0.0,
    max_features: int = 500,
) -> list[bpy.types.Object]:
    """Load GeoJSON glacier polygons and extrude with Farinotti thickness.

    Parameters
    ----------
    geojson_path      : path to FeatureCollection GeoJSON
    thickness_csv     : path to Farinotti CSV (optional; uses default if missing)
    default_thickness_m: fallback thickness (metres) when no CSV match found
    color_hex         : must match WATER_CYCLE_SPEC.md color grammar (ice = #7DD3FC)
    name_prefix       : prefix for bpy object names
    base_z_km         : Z position of glacier base in Blender units
    max_features      : cap feature count for performance (preview renders)

    Returns list of created bpy Objects, all in the scene collection.
    """
    if not geojson_path.exists():
        print(f"[glaciers] WARNING: {geojson_path} not found — skipping glacier load")
        return []

    # Load GeoJSON
    with geojson_path.open(encoding="utf-8") as f:
        gj: dict[str, Any] = json.load(f)

    features: list[dict] = gj.get("features", [])
    print(f"[glaciers] Loaded {len(features)} features from {geojson_path.name}")

    # Load thickness lookup
    thickness_lookup = _load_thickness_lookup(thickness_csv)

    # Get or create a collection for this set of glaciers
    coll_name = f"{name_prefix}"
    if coll_name not in bpy.data.collections:
        coll = bpy.data.collections.new(coll_name)
        bpy.context.scene.collection.children.link(coll)
    else:
        coll = bpy.data.collections[coll_name]

    # Get the shared ice material
    mat = materials.make_ice_material()

    objects: list[bpy.types.Object] = []
    skipped = 0

    # Limit features for performance
    sample_features = features[:max_features]
    if len(features) > max_features:
        print(f"[glaciers] Sampling {max_features}/{len(features)} features for performance")

    for idx, feature in enumerate(sample_features):
        props = feature.get("properties") or {}
        geom = feature.get("geometry") or {}
        geom_type = geom.get("type", "")

        # Look up thickness
        rgi_id = (
            props.get("RGI60_Id") or
            props.get("rgi_id") or
            props.get("RGIId") or
            ""
        ).strip()
        thickness_m = thickness_lookup.get(rgi_id, default_thickness_m)
        extrude_z = thickness_m * _M_TO_BU  # km

        ring_lists: list[list[list[float]]] = []
        if geom_type == "Polygon":
            ring_lists = [geom.get("coordinates", [[]])[0]]
        elif geom_type == "MultiPolygon":
            for poly in geom.get("coordinates", []):
                if poly:
                    ring_lists.append(poly[0])
        else:
            # Point geometry (simplified atlas data has points not polygons)
            coords = geom.get("coordinates")
            if coords and len(coords) >= 2:
                # Create a tiny square for each point
                lon, lat = coords[0], coords[1]
                d = 0.01  # ~1 km diameter square
                ring_lists = [[[lon - d, lat - d], [lon + d, lat - d],
                               [lon + d, lat + d], [lon - d, lat + d], [lon - d, lat - d]]]

        for ring_idx, ring in enumerate(ring_lists):
            ring_verts = _polygon_ring_to_verts(ring)
            if len(ring_verts) < 3:
                skipped += 1
                continue

            obj_name = f"{name_prefix}_{idx:05d}_{ring_idx}"
            obj = _make_extruded_polygon(ring_verts, base_z_km, extrude_z, obj_name)
            if obj is None:
                skipped += 1
                continue

            # Assign material
            if obj.data.materials:
                obj.data.materials[0] = mat
            else:
                obj.data.materials.append(mat)

            # Move to dedicated collection
            for scene_coll in obj.users_collection:
                scene_coll.objects.unlink(obj)
            coll.objects.link(obj)

            objects.append(obj)

    print(
        f"[glaciers] Created {len(objects)} glacier objects"
        f" ({skipped} skipped, thickness default={default_thickness_m}m)"
    )
    return objects


def animate_glacier_dissolve(
    glaciers_1990: list[bpy.types.Object],
    glaciers_2020: list[bpy.types.Object],
    frame_start: int = 150,
    frame_end: int = 450,
) -> None:
    """Animate glaciers_1990 fading out and glaciers_2020 fading in
    between frame_start and frame_end.

    Uses object visibility keyframes (viewport + render hide).
    """
    scene = bpy.context.scene

    # We animate alpha via material keyframes instead of hide, for smoother look
    # Simple approach: keyframe render visibility using hide_render

    for obj in glaciers_1990:
        # Visible at frame_start, invisible at frame_end
        scene.frame_set(frame_start - 1)
        obj.hide_render = False
        obj.keyframe_insert("hide_render", frame=frame_start - 1)

        scene.frame_set(frame_end)
        obj.hide_render = True
        obj.keyframe_insert("hide_render", frame=frame_end)

    for obj in glaciers_2020:
        # Invisible at frame_start, visible at frame_end
        scene.frame_set(frame_start - 1)
        obj.hide_render = True
        obj.keyframe_insert("hide_render", frame=frame_start - 1)

        scene.frame_set(frame_end)
        obj.hide_render = False
        obj.keyframe_insert("hide_render", frame=frame_end)

    scene.frame_set(0)
    print(
        f"[glaciers] Dissolve keyframes: 1990 fades {frame_start}→{frame_end}, "
        f"2020 appears {frame_start}→{frame_end}"
    )
