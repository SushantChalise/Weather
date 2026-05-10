"""Load GeoJSON lake polygons and animate growth between keyframes.

Coordinate system: same as dem.py (lon=X, lat=Y, alt=Z, 1 BU = 1 km).
"""
from __future__ import annotations

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


def _make_flat_polygon(
    ring_verts: list[tuple[float, float]],
    z: float,
    name: str,
) -> bpy.types.Object | None:
    """Create a flat polygon mesh (lake surface)."""
    if len(ring_verts) < 3:
        return None

    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    bm = bmesh.new()
    verts = [bm.verts.new((x, y, z)) for x, y in ring_verts]
    bm.verts.ensure_lookup_table()
    try:
        bm.faces.new(verts)
    except Exception:
        pass
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return obj


def _polygon_ring_to_verts(ring: list[list[float]]) -> list[tuple[float, float]]:
    verts: list[tuple[float, float]] = []
    for coord in ring:
        if len(coord) < 2:
            continue
        verts.append(_lonlat_to_xy(coord[0], coord[1]))
    if len(verts) > 1 and verts[0] == verts[-1]:
        verts.pop()
    return verts


def load_lakes(
    geojson_path: Path,
    depth_m: float = 0.0,
    z_km: float = 0.0,
    name_prefix: str = "Lake",
    max_features: int = 200,
) -> list[bpy.types.Object]:
    """Load GeoJSON lake polygons as flat meshes.

    Parameters
    ----------
    geojson_path : path to FeatureCollection GeoJSON
    depth_m      : average depth in metres (drives material opacity)
    z_km         : Blender Z position of lake surface (km)
    name_prefix  : prefix for bpy object names
    max_features : cap feature count for performance
    """
    if not geojson_path.exists():
        print(f"[lakes] WARNING: {geojson_path} not found — skipping lake load")
        return []

    with geojson_path.open(encoding="utf-8") as f:
        gj: dict[str, Any] = json.load(f)

    features: list[dict] = gj.get("features", [])
    print(f"[lakes] Loaded {len(features)} features from {geojson_path.name}")

    mat = materials.make_lake_material(depth_m=depth_m)

    coll_name = name_prefix
    if coll_name not in bpy.data.collections:
        coll = bpy.data.collections.new(coll_name)
        bpy.context.scene.collection.children.link(coll)
    else:
        coll = bpy.data.collections[coll_name]

    objects: list[bpy.types.Object] = []
    sample_features = features[:max_features]

    for idx, feature in enumerate(sample_features):
        geom = feature.get("geometry") or {}
        geom_type = geom.get("type", "")

        rings: list[list[list[float]]] = []
        if geom_type == "Polygon":
            rings = [geom.get("coordinates", [[]])[0]]
        elif geom_type == "MultiPolygon":
            for poly in geom.get("coordinates", []):
                if poly:
                    rings.append(poly[0])
        else:
            continue

        for ring_idx, ring in enumerate(rings):
            ring_verts = _polygon_ring_to_verts(ring)
            if len(ring_verts) < 3:
                continue
            obj_name = f"{name_prefix}_{idx:04d}_{ring_idx}"
            obj = _make_flat_polygon(ring_verts, z_km, obj_name)
            if obj is None:
                continue
            if obj.data.materials:
                obj.data.materials[0] = mat
            else:
                obj.data.materials.append(mat)
            for scene_coll in obj.users_collection:
                scene_coll.objects.unlink(obj)
            coll.objects.link(obj)
            objects.append(obj)

    print(f"[lakes] Created {len(objects)} lake polygon objects")
    return objects


def load_lake_keyframes(
    geojson_path: Path,
    name_prefix: str = "ImajaLake",
    z_km: float = 0.0,
) -> list[tuple[int, list[bpy.types.Object]]]:
    """Load a multi-keyframe lake GeoJSON (from digitize-imja.ts output).

    Expects a FeatureCollection where each feature has a 'year' property.
    Returns list of (year, objects) sorted by year.
    """
    if not geojson_path.exists():
        print(f"[lakes] WARNING: {geojson_path} not found")
        return []

    with geojson_path.open(encoding="utf-8") as f:
        gj: dict[str, Any] = json.load(f)

    features: list[dict] = gj.get("features", [])

    # Group by year
    by_year: dict[int, list[dict]] = {}
    for feat in features:
        props = feat.get("properties") or {}
        year_val = props.get("year")
        if year_val is not None:
            try:
                year = int(year_val)
            except (ValueError, TypeError):
                continue
            by_year.setdefault(year, []).append(feat)

    result: list[tuple[int, list[bpy.types.Object]]] = []
    mat = materials.make_lake_material(depth_m=30.0)

    for year in sorted(by_year.keys()):
        year_objects: list[bpy.types.Object] = []
        for idx, feature in enumerate(by_year[year]):
            geom = feature.get("geometry") or {}
            geom_type = geom.get("type", "")
            rings: list[list[list[float]]] = []
            if geom_type == "Polygon":
                rings = [geom.get("coordinates", [[]])[0]]
            elif geom_type == "MultiPolygon":
                for poly in geom.get("coordinates", []):
                    if poly:
                        rings.append(poly[0])
            for ring_idx, ring in enumerate(rings):
                ring_verts = _polygon_ring_to_verts(ring)
                if len(ring_verts) < 3:
                    continue
                obj_name = f"{name_prefix}_{year}_{idx}_{ring_idx}"
                obj = _make_flat_polygon(ring_verts, z_km, obj_name)
                if obj is None:
                    continue
                if obj.data.materials:
                    obj.data.materials[0] = mat
                else:
                    obj.data.materials.append(mat)
                year_objects.append(obj)
        result.append((year, year_objects))

    print(
        f"[lakes] Keyframes loaded: {[y for y, _ in result]} "
        f"({sum(len(o) for _, o in result)} total objects)"
    )
    return result


def animate_imja_ring_pulse(
    lake_objects: list[bpy.types.Object],
    frame_start: int = 810,
    frame_end: int = 870,
) -> None:
    """Animate the Imja Tsho ring pulse (Ch 0 final 5 seconds).

    Scales the lake polygon up and back down to create a 'ring' pulse effect.
    """
    scene = bpy.context.scene
    for obj in lake_objects:
        # Scale from 1.0 to 1.15 and back to 1.0
        for frame, scale in [(frame_start, 1.0), ((frame_start + frame_end) // 2, 1.15), (frame_end, 1.0)]:
            scene.frame_set(frame)
            obj.scale = (scale, scale, 1.0)
            obj.keyframe_insert("scale", frame=frame)

    scene.frame_set(0)
    print(f"[lakes] Imja ring pulse: frames {frame_start}→{frame_end}")
