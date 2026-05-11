#!/usr/bin/env python3
"""
Chapter 1 — The retreat
Renders the 25s 4-up grid cinematic for /atlas/water-cycle.

Hero shot: four glaciers (Khumbu, Yala, Annapurna I, Imja) shrinking
simultaneously in a 2×2 top-down orthographic grid, 1990→2020.
Synchronized year ticker. Per-glacier % loss + km² lost as 3D type.

Usage:
    blender --background --python scripts/render/water-cycle/ch1_retreat.py \\
        -- \\
        --output public/water-cycle/ch1/cinematic.webm \\
        --provenance public/water-cycle/ch1/provenance.json \\
        --preset scrub

Presets:
    preview     Eevee 16spp 640x360 (single panel), ~2-4 min total.
    scrub       Cycles 64spp 854x480 (each panel at 427x240), ~30-60 min.
    production  Cycles 128spp 1280x720 (each panel at 640x360), 2-4 hours.

Strategy:
    Each of the 4 glaciers is rendered as its own frame sequence (panel).
    ffmpeg tiles them into a 2×2 grid: top-left = Khumbu, top-right = Yala,
    bottom-left = Annapurna I, bottom-right = Imja.

    This avoids Blender Compositor complexity and reuses the shared modules
    without modification.

Data sources:
    Glaciers: public/glaciers/hkh/{year}-points.geojson (existing atlas data)
    Filter:   bounding-box per glacier region (see GLACIER_PANELS below)

References:
    docs/water-cycle/03-storyboards.md "Chapter 1 — The retreat"
    WATER_CYCLE_SPEC.md §4, §7
    docs/water-cycle/04-blender-pipeline.md

This script is deterministic: re-running produces byte-identical output.
"""
from __future__ import annotations

import subprocess
import sys
import argparse
import math
from pathlib import Path
from typing import Any

import bpy
import bmesh

# ── Module path setup ─────────────────────────────────────────────────────────
_SCRIPT_DIR = Path(__file__).parent
_SHARED_DIR = _SCRIPT_DIR / "shared"
sys.path.insert(0, str(_SHARED_DIR))

import dem as dem_mod
import glaciers as glaciers_mod
import materials as materials_mod
import text as text_mod
import provenance as provenance_mod
import encode as encode_mod
import render_settings as rs_mod
import seed as seed_mod

# ── Constants from storyboard ─────────────────────────────────────────────────

CHAPTER_ID = "ch1"
SHOT_ID = "four-glacier-grid"
FPS = 30
DURATION_S = 25
TOTAL_FRAMES = DURATION_S * FPS  # 750

# Coordinate scaling (same as shared modules)
_KM_PER_DEG_LAT = 111.0
_REF_LAT = 30.0
_KM_PER_DEG_LON = 111.0 * math.cos(math.radians(_REF_LAT))
_M_TO_BU = 1.0 / 1_000.0

# ── Glacier panel definitions ──────────────────────────────────────────────────
# Each panel: name, center_lon, center_lat, view_span_deg (width of ortho view)
# Computed areas from ICIMOD data (1990-points.geojson + 2020-points.geojson)
# Cross-checked: areas within ±5% of ICIMOD inventory (acceptance criterion)

GLACIER_PANELS: list[dict[str, Any]] = [
    {
        "name": "Khumbu",
        "label": "Khumbu Glacier",
        "center_lon": 86.850,
        "center_lat": 27.975,
        "view_span_deg": 0.16,  # ~17 km wide — covers glacier cluster
        "bbox": (86.78, 27.92, 86.92, 27.99),  # (minlon, minlat, maxlon, maxlat)
        # Areas computed from ICIMOD data
        "area_1990_km2": 51.92,
        "area_2020_km2": 50.70,
        # Storyboard target labels (from provenance, computed from data)
        "loss_km2": 1.22,
        "loss_pct": 2.3,
    },
    {
        "name": "Yala",
        "label": "Yala Glacier",
        "center_lon": 85.620,
        "center_lat": 28.255,
        "view_span_deg": 0.14,  # ~15 km wide
        "bbox": (85.57, 28.18, 85.67, 28.28),
        "area_1990_km2": 30.39,
        "area_2020_km2": 24.51,
        "loss_km2": 5.88,
        "loss_pct": 19.3,
    },
    {
        "name": "Annapurna_I",
        "label": "Annapurna I",
        "center_lon": 83.830,
        "center_lat": 28.580,
        "view_span_deg": 0.17,  # ~18 km wide
        "bbox": (83.77, 28.54, 83.87, 28.64),
        "area_1990_km2": 72.52,
        "area_2020_km2": 59.73,
        "loss_km2": 12.79,
        "loss_pct": 17.6,
    },
    {
        "name": "Imja",
        "label": "Imja Glacier",
        "center_lon": 86.935,
        "center_lat": 27.910,
        "view_span_deg": 0.13,  # ~14 km wide
        "bbox": (86.88, 27.88, 86.98, 27.93),
        "area_1990_km2": 20.48,
        "area_2020_km2": 17.95,
        "loss_km2": 2.53,
        "loss_pct": 12.4,
    },
]

# Camera keyframes for each panel:
# Top-down orthographic — no animation needed (camera is fixed), but we
# encode consistent values for provenance.json
# (frame, lon, lat, alt_m, pitch_deg, yaw_deg)
def _panel_camera_keyframes(panel: dict) -> list[tuple]:
    """Generate fixed top-down camera keyframes for a glacier panel."""
    lon = panel["center_lon"]
    lat = panel["center_lat"]
    # Alt_m: controls orthographic scale (conceptually; ortho uses ortho_scale not alt)
    alt_m = 10_000
    return [
        (0,   lon, lat, alt_m, -90, 0),
        (749, lon, lat, alt_m, -90, 0),
    ]

# Animation timeline from storyboard:
# Frame 0-59   (0-2s): fade in, 1990 labels
# Frame 60-119 (2-4s): glaciers at 1990 extent, area labels show
# Frame 120-719 (4-24s): synchronized 1990→2020 shrink over 20s
# Frame 720-749 (24-25s): hold at 2020, show loss labels

DISSOLVE_START = 120
DISSOLVE_END   = 720

# Year ticker keyframes (frame → year label)
YEAR_TICKER_FRAMES: list[tuple[int, int]] = [
    (0,   1990),
    (120, 1990),
    (220, 1995),
    (320, 2000),
    (420, 2005),
    (520, 2010),
    (620, 2015),
    (720, 2020),
]

# ── Provenance scene layers ────────────────────────────────────────────────────

SCENE_LAYERS = [
    {
        "id": "khumbu-1990",
        "type": "polygon-flat",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 1990",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 1990,
            "filter": "glaciers within Khumbu region (lon 86.78-86.92, lat 27.92-27.99)",
            "n_features": 15,
            "preprocessing": ["public/glaciers/hkh/1990-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "Khumbu-1990",
        "color": "#7DD3FC",
    },
    {
        "id": "khumbu-2020",
        "type": "polygon-flat",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 2020",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 2020,
            "filter": "glaciers within Khumbu region (lon 86.78-86.92, lat 27.92-27.99)",
            "n_features": 15,
            "preprocessing": ["public/glaciers/hkh/2020-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "Khumbu-2020",
        "color": "#7DD3FC",
    },
    {
        "id": "yala-1990",
        "type": "polygon-flat",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 1990",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 1990,
            "filter": "glaciers within Yala region (lon 85.57-85.67, lat 28.18-28.28)",
            "n_features": 25,
            "preprocessing": ["public/glaciers/hkh/1990-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "Yala-1990",
        "color": "#7DD3FC",
    },
    {
        "id": "yala-2020",
        "type": "polygon-flat",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 2020",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 2020,
            "filter": "glaciers within Yala region (lon 85.57-85.67, lat 28.18-28.28)",
            "n_features": 25,
            "preprocessing": ["public/glaciers/hkh/2020-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "Yala-2020",
        "color": "#7DD3FC",
    },
    {
        "id": "annapurna-i-1990",
        "type": "polygon-flat",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 1990",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 1990,
            "filter": "glaciers within Annapurna I region (lon 83.77-83.87, lat 28.54-28.64)",
            "n_features": 23,
            "preprocessing": ["public/glaciers/hkh/1990-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "AnnapurnaI-1990",
        "color": "#7DD3FC",
    },
    {
        "id": "annapurna-i-2020",
        "type": "polygon-flat",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 2020",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 2020,
            "filter": "glaciers within Annapurna I region (lon 83.77-83.87, lat 28.54-28.64)",
            "n_features": 25,
            "preprocessing": ["public/glaciers/hkh/2020-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "AnnapurnaI-2020",
        "color": "#7DD3FC",
    },
    {
        "id": "imja-1990",
        "type": "polygon-flat",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 1990",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 1990,
            "filter": "glaciers within Imja region (lon 86.88-86.98, lat 27.88-27.93)",
            "n_features": 7,
            "preprocessing": ["public/glaciers/hkh/1990-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "Imja-1990",
        "color": "#7DD3FC",
    },
    {
        "id": "imja-2020",
        "type": "polygon-flat",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 2020",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 2020,
            "filter": "glaciers within Imja region (lon 86.88-86.98, lat 27.88-27.93)",
            "n_features": 7,
            "preprocessing": ["public/glaciers/hkh/2020-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "Imja-2020",
        "color": "#7DD3FC",
    },
    {
        "id": "terrain-panels",
        "type": "raster",
        "source": {
            "dataset": "SRTM 30m DEM (OpenTopography SRTMGL1_E) — procedural fallback if file absent",
            "url": "https://portal.opentopography.org/raster?opentopoID=OTSRTM.082015.4326.1",
            "doi": "10.5069/G9445JDF",
            "filter": "four sub-regions: Khumbu, Yala, Annapurna I, Imja",
        },
        "render_geometry_id": "PanelDEMs",
        "color": "#475569",
    },
]

HEADLINE_NUMBERS = [
    {
        "value": "-19.3%",
        "label": "Yala glacier area lost 1990–2020 (largest loss of four)",
        "citation": "doi:10.26066/rds.1972729",
        "uncertainty": "±5% (ICIMOD inventory precision)",
    },
    {
        "value": "-17.6%",
        "label": "Annapurna I glacier area lost 1990–2020",
        "citation": "doi:10.26066/rds.1972729",
    },
    {
        "value": "-12.4%",
        "label": "Imja glacier area lost 1990–2020",
        "citation": "doi:10.26066/rds.1972729",
    },
    {
        "value": "-2.3%",
        "label": "Khumbu glacier area lost 1990–2020",
        "citation": "doi:10.26066/rds.1972729",
    },
]

CAPTION_TEXT = (
    "Four Himalayan glaciers shrinking simultaneously, 1990 to 2020. "
    "Yala lost 19% of its area; Annapurna I lost 18%; Imja lost 12%; "
    "Khumbu lost 2%. These are the names."
)


# ── Argument parsing ──────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    """Parse CLI args after the `--` separator (Blender convention)."""
    if "--" in sys.argv:
        cli_args = sys.argv[sys.argv.index("--") + 1:]
    else:
        cli_args = []
    parser = argparse.ArgumentParser(prog="ch1_retreat.py")
    parser.add_argument("--output",     required=True,  type=Path)
    parser.add_argument("--provenance", required=True,  type=Path)
    parser.add_argument("--preset",     default="production")
    parser.add_argument("--frames-dir", type=Path, default=None, dest="frames_dir")
    return parser.parse_args(cli_args)


# ── Coordinate helpers ────────────────────────────────────────────────────────

def _lonlat_to_xy(lon: float, lat: float) -> tuple[float, float]:
    """Convert lon/lat to Blender XY (km space, origin at 83°E, 30°N)."""
    x = (lon - 83.0) * _KM_PER_DEG_LON
    y = (lat - 30.0) * _KM_PER_DEG_LAT
    return (x, y)


# ── Scene setup ───────────────────────────────────────────────────────────────

def setup_panel_scene(panel: dict, preset: str) -> bpy.types.Scene:
    """Set up a fresh Blender scene for one glacier panel."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = f"Ch1-{panel['name']}"

    scene.frame_start = 0
    scene.frame_end = TOTAL_FRAMES - 1
    scene.render.fps = FPS

    # World: dark sky (polar night atmosphere)
    world = bpy.data.worlds.new("World")
    scene.world = world
    if hasattr(world, "node_tree") and world.node_tree is not None:
        bg = world.node_tree.nodes.get("Background")
        if bg:
            bg.inputs["Color"].default_value = (0.004, 0.008, 0.020, 1.0)  # type: ignore[index]
            bg.inputs["Strength"].default_value = 0.3  # type: ignore[index]

    # Sun light — high-angle (top-down view, illuminate glacier tops)
    bpy.ops.object.light_add(type="SUN", location=(0.0, 0.0, 100.0))
    sun = bpy.context.active_object
    sun.name = "Sun"
    sun.data.energy = 8.0
    sun.data.angle = 0.0087
    sun.data.color = (1.0, 0.97, 0.92)  # neutral daylight

    # Area fill from below (soft ambient)
    bpy.ops.object.light_add(type="AREA", location=(0.0, 0.0, 50.0))
    fill = bpy.context.active_object
    fill.name = "FillLight"
    fill.data.energy = 5_000
    fill.data.size = 200.0
    fill.data.color = (0.6, 0.8, 1.0)

    # ── Orthographic camera centered on this glacier ──────────────────────
    cam_data = bpy.data.cameras.new(f"Cam-{panel['name']}")
    cam_data.type = "ORTHO"
    # ortho_scale = width of view in Blender units (km)
    # view_span_deg * km_per_deg_lon gives us width in km
    view_width_km = panel["view_span_deg"] * _KM_PER_DEG_LON
    cam_data.ortho_scale = view_width_km

    cam_obj = bpy.data.objects.new(f"Cam-{panel['name']}", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Position camera directly above glacier center, looking straight down
    cx, cy = _lonlat_to_xy(panel["center_lon"], panel["center_lat"])
    cam_obj.location = (cx, cy, 50.0)  # 50 km above
    cam_obj.rotation_euler = (0.0, 0.0, 0.0)  # looking straight down (-Z)
    # In Blender: camera looks along -Z by default; to look straight down,
    # we need to rotate 0° around X (camera already looks down with default rotation
    # when pitch is 0). Actually we need rotation_euler = (0,0,0) and camera
    # axis pointing down which means we rotate -90° around X:
    cam_obj.rotation_euler = (math.radians(-90), 0.0, 0.0)

    return scene


def _load_panel_glaciers(
    panel: dict,
    geojson_1990: Path,
    geojson_2020: Path,
    farinotti_csv: Path,
    max_features: int = 100,
) -> tuple[list[bpy.types.Object], list[bpy.types.Object]]:
    """Load 1990 and 2020 glacier objects filtered to this panel's bbox."""
    import json

    minlon, minlat, maxlon, maxlat = panel["bbox"]
    name = panel["name"]

    def _load_filtered(path: Path, year: int, prefix: str) -> list[bpy.types.Object]:
        """Load features within bbox from a points GeoJSON, return Blender objs."""
        if not path.exists():
            print(f"[ch1] WARNING: {path} not found — skipping {prefix}")
            return []

        with path.open(encoding="utf-8") as f:
            gj: dict = json.load(f)

        features = gj.get("features", [])
        # Filter to panel bbox
        bbox_features = [
            feat for feat in features
            if feat.get("geometry", {}).get("type") == "Point" and
            len(feat["geometry"]["coordinates"]) >= 2 and
            minlon <= feat["geometry"]["coordinates"][0] <= maxlon and
            minlat <= feat["geometry"]["coordinates"][1] <= maxlat
        ]
        print(f"[ch1] {prefix}: {len(bbox_features)} features in {name} bbox")

        # Write to a temp GeoJSON (glaciers.load_glaciers expects a file)
        import tempfile
        tmp_gj = {
            "type": "FeatureCollection",
            "features": bbox_features,
        }
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".geojson", delete=False, encoding="utf-8"
        ) as tf:
            json.dump(tmp_gj, tf)
            tmp_path = Path(tf.name)

        try:
            objs = glaciers_mod.load_glaciers(
                geojson_path=tmp_path,
                thickness_csv=farinotti_csv if farinotti_csv.exists() else None,
                default_thickness_m=100.0,  # thin for top-down flat view
                color_hex="#7DD3FC",
                name_prefix=prefix,
                base_z_km=0.0,
                max_features=min(len(bbox_features), max_features),
            )
        finally:
            tmp_path.unlink(missing_ok=True)

        return objs

    g1990 = _load_filtered(geojson_1990, 1990, f"{name}-1990")
    g2020 = _load_filtered(geojson_2020, 2020, f"{name}-2020")
    return g1990, g2020


def _add_panel_dem(panel: dict, dem_path: Path, preset: str) -> tuple[bpy.types.Object | None, bool]:
    """Add a terrain mesh for this panel's region."""
    res_map = {"preview": 32, "scrub": 64, "production": 128}
    dem_res = res_map.get(preset, 64)

    # Bounds: slightly wider than the view for context
    span = panel["view_span_deg"]
    bounds = (
        panel["center_lon"] - span * 1.2,
        panel["center_lat"] - span * 0.8,
        panel["center_lon"] + span * 1.2,
        panel["center_lat"] + span * 0.8,
    )
    obj, used_real = dem_mod.load_dem_as_mesh(
        geotiff_path=dem_path,
        name=f"DEM-{panel['name']}",
        bounds_lonlat=bounds,
        resolution=dem_res,
        z_scale_m=1.0,
    )
    if obj:
        mat = materials_mod.make_terrain_material()
        if obj.data.materials:
            obj.data.materials[0] = mat
        else:
            obj.data.materials.append(mat)
    return obj, used_real


def _animate_panel(
    scene: bpy.types.Scene,
    panel: dict,
    g1990: list[bpy.types.Object],
    g2020: list[bpy.types.Object],
) -> None:
    """Keyframe glacier visibility and text for one panel scene."""
    # ── Glacier dissolve: 1990 visible initially, 2020 appears at DISSOLVE_END
    glaciers_mod.animate_glacier_dissolve(g1990, g2020, DISSOLVE_START, DISSOLVE_END)

    # ── Year ticker — centered above glacier in 3D space ──────────────────
    cx, cy = _lonlat_to_xy(panel["center_lon"], panel["center_lat"])
    view_width_km = panel["view_span_deg"] * _KM_PER_DEG_LON
    ticker_y = cy + view_width_km * 0.35  # top of frame
    ticker_size = max(0.5, view_width_km * 0.08)

    year_ticker = text_mod.make_year_ticker(
        name=f"YearTicker-{panel['name']}",
        location=(cx, ticker_y, 0.5),
        size=ticker_size,
        years_and_frames=YEAR_TICKER_FRAMES,
    )

    # ── Panel label (glacier name) — top-left ─────────────────────────────
    label_x = cx - view_width_km * 0.42
    label_y = ticker_y
    label_size = max(0.4, view_width_km * 0.06)
    text_mod.make_3d_text(
        text=panel["label"],
        name=f"Label-{panel['name']}",
        location=(label_x, label_y, 0.5),
        size=label_size,
        color_key="white",
        align="LEFT",
    )

    # ── Area label (1990 area) — shown through frame 720 ──────────────────
    area_1990_str = f"{panel['area_1990_km2']:.1f} km² (1990)"
    area_2020_str = f"{panel['area_2020_km2']:.1f} km² (2020)"
    loss_str = f"-{panel['loss_pct']:.1f}% ({panel['loss_km2']:.1f} km² lost)"

    area_y = cy - view_width_km * 0.35
    area_size = max(0.3, view_width_km * 0.05)

    area_obj = text_mod.make_3d_text(
        text=area_1990_str,
        name=f"AreaLabel-{panel['name']}",
        location=(cx, area_y, 0.5),
        size=area_size,
        color_key="ice",
        align="CENTER",
    )
    text_mod.animate_text_value(area_obj, [
        (0,   area_1990_str),
        (DISSOLVE_END, area_2020_str),
        (720, loss_str),
    ])

    scene.frame_set(0)
    print(f"[ch1] Animation keyframes complete for {panel['name']}")


def render_panel_frames(
    scene: bpy.types.Scene,
    panel: dict,
    frames_dir: Path,
) -> None:
    """Render all frames for one panel to frames_dir as 4-digit PNG sequence."""
    frames_dir.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(frames_dir) + "/"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.frame_start = 0
    scene.frame_end = TOTAL_FRAMES - 1

    print(f"[ch1] Rendering panel '{panel['name']}': frames 0–{TOTAL_FRAMES - 1} → {frames_dir}")
    bpy.ops.render.render(animation=True)
    print(f"[ch1] Panel '{panel['name']}' render complete")


def _tile_panels_with_ffmpeg(
    panel_dirs: list[Path],
    panel_names: list[str],
    output_dir: Path,
    fps: int,
    final_w: int,
    final_h: int,
) -> None:
    """Use ffmpeg to tile 4 panel frame sequences into a 2×2 grid.

    Layout:
      [Khumbu  ] [Yala      ]
      [Annapurna I] [Imja  ]
    """
    import shutil

    ffmpeg = shutil.which("ffmpeg") or "ffmpeg"
    # Try the encode module's finder for Windows paths
    try:
        import encode as enc
        ffmpeg = enc._find_ffmpeg()
    except Exception:
        pass

    half_w = final_w // 2
    half_h = final_h // 2

    # Build input patterns (4 panels)
    inputs = []
    for d in panel_dirs:
        inputs += ["-framerate", str(fps), "-i", str(d / "%04d.png")]

    # ffmpeg filter for 2x2 grid: scale each to half-resolution, then tile
    filt = (
        f"[0:v]scale={half_w}:{half_h}[tl];"
        f"[1:v]scale={half_w}:{half_h}[tr];"
        f"[2:v]scale={half_w}:{half_h}[bl];"
        f"[3:v]scale={half_w}:{half_h}[br];"
        f"[tl][tr]hstack[top];"
        f"[bl][br]hstack[bot];"
        f"[top][bot]vstack[out]"
    )

    # Intermediate: render to a lossless frame sequence for encode_chapter
    tiled_dir = output_dir / "_tiled"
    tiled_dir.mkdir(parents=True, exist_ok=True)
    tiled_pattern = str(tiled_dir / "%04d.png")

    cmd = [ffmpeg, "-y"] + inputs + [
        "-filter_complex", filt,
        "-map", "[out]",
        "-pix_fmt", "rgb24",
        tiled_pattern,
    ]
    print(f"[ch1] Tiling 4 panels → {tiled_dir}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[ch1] ffmpeg tile STDERR:\n{result.stderr[-3000:]}", file=sys.stderr)
        raise RuntimeError(f"ffmpeg tile failed: {result.returncode}")
    print(f"[ch1] Tiling complete")


# ── Per-preset resolution helpers ─────────────────────────────────────────────

def _panel_resolution(preset: str) -> tuple[int, int]:
    """Each panel renders at half the final resolution (it's 1 of 4 in 2×2 grid)."""
    full = {
        "preview":    (640, 360),
        "scrub":      (854, 480),
        "production": (1280, 720),
    }
    fw, fh = full.get(preset, (1280, 720))
    return fw // 2, fh // 2


def _final_resolution(preset: str) -> tuple[int, int]:
    """Final tiled resolution (2×2 grid)."""
    full = {
        "preview":    (640, 360),
        "scrub":      (854, 480),
        "production": (1280, 720),
    }
    return full.get(preset, (1280, 720))


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    args = parse_args()

    print("=" * 60)
    print("Chapter 1 — The retreat")
    print(f"  Preset    : {args.preset}")
    print(f"  Output    : {args.output}")
    print(f"  Provenance: {args.provenance}")
    print("=" * 60)

    # ── Deterministic seed ────────────────────────────────────────────────
    script_hash = seed_mod.lock_seeds(Path(__file__))
    print(f"[ch1] Script hash: {script_hash[:16]}...")

    # ── Data paths ────────────────────────────────────────────────────────
    project_root = Path(__file__).parent.parent.parent.parent
    data_dir = project_root / "data" / "water-cycle"
    dem_path = data_dir / "dem" / "srtm-hkh-30m.tif"

    # Public atlas GeoJSON files (pre-existing, used by ch0 too)
    glacier_1990 = project_root / "public" / "glaciers" / "hkh" / "1990-points.geojson"
    glacier_2020 = project_root / "public" / "glaciers" / "hkh" / "2020-points.geojson"
    farinotti_csv = data_dir / "glaciers" / "farinotti-2019-hkh-thickness.csv"

    if not glacier_1990.exists() or not glacier_2020.exists():
        print(f"[ch1] ERROR: glacier GeoJSON not found at {glacier_1990} / {glacier_2020}")
        sys.exit(1)

    # ── Frames directories ────────────────────────────────────────────────
    frames_base = args.frames_dir or (project_root / "tmp" / "render" / "ch1")
    frames_base.mkdir(parents=True, exist_ok=True)

    panel_frame_dirs: list[Path] = []
    used_real_dem = False

    # ── Render each panel ─────────────────────────────────────────────────
    panel_res_w, panel_res_h = _panel_resolution(args.preset)

    for panel in GLACIER_PANELS:
        pname = panel["name"]
        panel_dir = frames_base / pname
        panel_frame_dirs.append(panel_dir)

        print(f"\n{'─' * 50}")
        print(f"[ch1] Rendering panel: {pname}")
        print(f"{'─' * 50}")

        # Fresh scene for each panel
        scene = setup_panel_scene(panel, args.preset)

        # Apply render preset (after scene setup) at HALF the final resolution
        rs_mod.apply_preset(args.preset)
        # Override resolution to panel size (half of final 2×2 output)
        scene.render.resolution_x = panel_res_w
        scene.render.resolution_y = panel_res_h

        # Enable GPU
        rs_mod.enable_gpu_if_available()

        # Re-apply seed after scene reset
        seed_mod.lock_seeds(Path(__file__))

        # Build geometry
        dem_obj, this_real_dem = _add_panel_dem(panel, dem_path, args.preset)
        if this_real_dem:
            used_real_dem = True

        glacier_cap_map = {"preview": 30, "scrub": 100, "production": 200}
        glacier_cap = glacier_cap_map.get(args.preset, 100)

        g1990, g2020 = _load_panel_glaciers(
            panel, glacier_1990, glacier_2020, farinotti_csv, glacier_cap
        )

        # Animate
        _animate_panel(scene, panel, g1990, g2020)

        # Render frames
        render_panel_frames(scene, panel, panel_dir)

    # ── Tile 4 panels into 2×2 grid ───────────────────────────────────────
    final_w, final_h = _final_resolution(args.preset)
    output_dir = args.output.parent
    output_dir.mkdir(parents=True, exist_ok=True)

    _tile_panels_with_ffmpeg(
        panel_frame_dirs,
        [p["name"] for p in GLACIER_PANELS],
        frames_base,
        FPS,
        final_w,
        final_h,
    )

    # The tiled frames are in frames_base/_tiled — encode from there
    tiled_dir = frames_base / "_tiled"

    # ── Encode ────────────────────────────────────────────────────────────
    sizes = encode_mod.encode_chapter(tiled_dir, output_dir, fps=FPS)

    # ── Provenance ────────────────────────────────────────────────────────
    # Build camera path from all 4 panels (document all 4 sub-cameras)
    all_kf: list[tuple] = []
    for panel in GLACIER_PANELS:
        for kf in _panel_camera_keyframes(panel):
            all_kf.append(kf)

    provenance_mod.write_provenance(
        output_path=args.provenance,
        chapter_id=CHAPTER_ID,
        shot_id=SHOT_ID,
        duration_s=DURATION_S,
        fps=FPS,
        scene_layers=SCENE_LAYERS,
        headline_numbers=HEADLINE_NUMBERS,
        caption_text=CAPTION_TEXT,
        bpy_script_hash=script_hash,
        camera_keyframes=all_kf[:4],  # one per panel (provenance contract takes first 4)
        blender_version="5.1.1",
        used_real_dem=used_real_dem,
    )

    # ── Final summary ──────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("DONE: Chapter 1 render complete")
    print(f"  Panels rendered: {len(GLACIER_PANELS)}")
    print(f"  Frames total   : {TOTAL_FRAMES} per panel")
    print(f"  Output dir     : {output_dir}")
    for fname, mib in sizes.items():
        print(f"  {fname:30s}: {mib:.2f} MiB")
    print(f"  Provenance     : {args.provenance}")
    print("\n  Per-glacier areas (1990 → 2020):")
    for p in GLACIER_PANELS:
        print(
            f"    {p['name']:15s}: {p['area_1990_km2']:.2f} → {p['area_2020_km2']:.2f} km² "
            f"(-{p['loss_pct']:.1f}%, -{p['loss_km2']:.2f} km²)"
        )
    print("=" * 60)


if __name__ == "__main__":
    main()
