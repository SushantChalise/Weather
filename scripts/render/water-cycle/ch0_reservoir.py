#!/usr/bin/env python3
"""
Chapter 0 — The reservoir
Renders the 30s opening cinematic for /atlas/water-cycle.

Hero shot: oblique HKH-arc flyover, west to east, 1990→2020 ice dissolve,
final 5s Imja basin close-up with lake ring pulse.

Usage:
    blender --background --python scripts/render/water-cycle/ch0_reservoir.py \
        -- \
        --output public/water-cycle/ch0/cinematic.webm \
        --provenance public/water-cycle/ch0/provenance.json \
        --preset preview

Presets:
    preview     Eevee 16spp 640x360, ~1-2 min total. Verify composition.
    scrub       Cycles 64spp 854x480, ~30-60 min. Verify color + motion.
    production  Cycles 128spp 1280x720, 2-4 hours. Final render.

This script is deterministic: re-running produces byte-identical output.

References:
    docs/water-cycle/03-storyboards.md "Chapter 0 — The reservoir"
    WATER_CYCLE_SPEC.md §4 (chapter structure), §7 (hard constraints)
    docs/water-cycle/04-blender-pipeline.md (pipeline template)
"""
from __future__ import annotations

import sys
import argparse
from pathlib import Path

import bpy

# ── Module path setup ─────────────────────────────────────────────────────────
_SCRIPT_DIR = Path(__file__).parent
_SHARED_DIR = _SCRIPT_DIR / "shared"
sys.path.insert(0, str(_SHARED_DIR))

import dem as dem_mod
import glaciers as glaciers_mod
import lakes as lakes_mod
import cameras as cameras_mod
import materials as materials_mod
import text as text_mod
import provenance as provenance_mod
import encode as encode_mod
import render_settings as rs_mod
import seed as seed_mod

# ── Constants from storyboard ─────────────────────────────────────────────────

CHAPTER_ID = "ch0"
SHOT_ID = "hkh-flyover"
FPS = 30
DURATION_S = 30
TOTAL_FRAMES = DURATION_S * FPS  # 900

# Camera keyframes from 03-storyboards.md
# (frame, lon, lat, alt_m, pitch_deg, yaw_deg, focal_mm)
CAMERA_KEYFRAMES = [
    (0,    73.0, 36.0, 200_000, -45,  90, 35),
    (450,  98.0, 28.0, 200_000, -45,  90, 35),
    (510,  86.93, 27.95, 8_000, -55,   0, 50),  # hidden cut here
    (810,  86.93, 27.95, 12_000, -60,   0, 70),
    (900,  86.93, 27.90, 12_000, -60,   0, 70),
]

# Glacier dissolve: 1990 fades out, 2020 fades in (frames 150-450)
DISSOLVE_START = 150
DISSOLVE_END   = 450

# Imja ring pulse (frames 810-870)
RING_START = 810
RING_END   = 870

# Provenance scene layers (matches storyboard)
SCENE_LAYERS = [
    {
        "id": "glacier-1990",
        "type": "polygon-extrusion",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 1990",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 1990,
            "filter": "all HKH polygons (Points simplified; area_km2 per feature)",
            "n_features": 65188,
            "preprocessing": ["public/glaciers/hkh/1990-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "Glacier-1990",
        "thickness_model": {
            "method": "Farinotti 2019 consensus estimate (OGGM G2TI, mean_thickness_m = vol_m3/area_m2)",
            "doi": "10.5194/tc-13-665-2019",
            "uncertainty_pct": 25,
        },
        "color": "#7DD3FC",
    },
    {
        "id": "glacier-2020",
        "type": "polygon-extrusion",
        "source": {
            "dataset": "ICIMOD HKH Glacier Inventory 2020",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
            "doi": "10.26066/rds.1972729",
            "year_keyframe": 2020,
            "filter": "all HKH polygons (Points simplified)",
            "n_features": 63761,
            "preprocessing": ["public/glaciers/hkh/2020-points.geojson (existing atlas data)"],
        },
        "render_geometry_id": "Glacier-2020",
        "thickness_model": {
            "method": "Farinotti 2019 consensus estimate",
            "doi": "10.5194/tc-13-665-2019",
            "uncertainty_pct": 25,
        },
        "color": "#7DD3FC",
    },
    {
        "id": "imja-ring",
        "type": "polygon-flat",
        "source": {
            "dataset": "Imja Tsho keyframes (digitized from Somos-Valenzuela 2014 + ICIMOD 2024)",
            "url": "https://rds.icimod.org/Home/DataDetail?metadataId=9362830",
            "doi": "10.26066/rds.9362830",
            "year_keyframe": 2020,
            "filter": "Imja Tsho 2020 outline only",
        },
        "render_geometry_id": "ImjaLake-ring",
        "color": "#0E7490",
    },
    {
        "id": "terrain-hkh",
        "type": "raster",
        "source": {
            "dataset": "SRTM 30m DEM (OpenTopography SRTMGL1_E) — procedural fallback if file absent",
            "url": "https://portal.opentopography.org/raster?opentopoID=OTSRTM.082015.4326.1",
            "doi": "10.5069/G9445JDF",
            "filter": "HKH bbox [70°E, 26°N, 95°E, 36°N]",
        },
        "render_geometry_id": "HKH-DEM",
        "color": "#475569",
    },
]

HEADLINE_NUMBERS = [
    {
        "value": "516 km³",
        "label": "water-equivalent ice lost 1990–2020",
        "citation": "doi:10.26066/icimod.hkh-cryosphere-2026",
        "uncertainty": "±25 km³ (95% CI)",
    },
    {
        "value": "~9%",
        "label": "of all HKH ice lost 1990–2020",
        "citation": "doi:10.26066/icimod.hkh-cryosphere-2026",
    },
    {
        "value": "~0.5 trillion tonnes",
        "label": "total ice mass lost across Hindu Kush Himalaya",
        "citation": "doi:10.26066/icimod.hkh-cryosphere-2026",
    },
]

CAPTION_TEXT = (
    "Between 1990 and 2020, the Hindu Kush Himalaya lost "
    "9% of all glacier ice — 516 km³ of water-equivalent. "
    "This reservoir is draining."
)


# ── Argument parsing ──────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    """Parse CLI args after the `--` separator (Blender convention)."""
    if "--" in sys.argv:
        cli_args = sys.argv[sys.argv.index("--") + 1:]
    else:
        cli_args = []
    parser = argparse.ArgumentParser(prog="ch0_reservoir.py")
    parser.add_argument("--output",     required=True,  type=Path)
    parser.add_argument("--provenance", required=True,  type=Path)
    parser.add_argument("--preset",     default="production")
    parser.add_argument("--frames-dir", type=Path, default=None, dest="frames_dir")
    return parser.parse_args(cli_args)


# ── Scene setup ───────────────────────────────────────────────────────────────

def setup_scene() -> bpy.types.Scene:
    """Clear factory default scene and configure world settings + sky lighting."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "Ch0-Reservoir"

    # Frame range
    scene.frame_start = 0
    scene.frame_end = TOTAL_FRAMES - 1  # 0-indexed: frame 899 = last
    scene.render.fps = FPS

    # ── Sun + Nishita procedural sky ─────────────────────────────────────────
    # setup_sky_lighting() replaces the old manual sun + fill light setup.
    # Late-afternoon south-west sun at ~29° elevation casts oblique shadows
    # across ridges, making the height-ramp terrain visually readable.
    # All T3.1–T3.6 renders that call this function will inherit the same sky.
    rs_mod.setup_sky_lighting(
        sun_elevation_deg=29.0,   # ~50° from zenith → oblique, shadow-casting
        sun_azimuth_deg=225.0,    # south-west (225° clockwise from north)
        sun_strength=3.0,
        sky_strength=1.0,
    )

    return scene


# ── Geometry ──────────────────────────────────────────────────────────────────

def build_geometry(
    data_dir: Path,
    preset: str,
) -> dict:
    """Load DEM, glaciers, Imja lake. Returns dict of layer objects."""
    objects: dict = {}

    # DEM resolution: lower for preview, higher for production
    dem_res_map = {"preview": 64, "scrub": 128, "production": 256, "production_atmosphere": 512}
    dem_res = dem_res_map.get(preset, 128)

    # Glacier feature cap: fewer for preview
    glacier_cap_map = {"preview": 100, "scrub": 300, "production": 500, "production_atmosphere": 500}
    glacier_cap = glacier_cap_map.get(preset, 300)

    # ── Terrain ────────────────────────────────────────────────────────────
    dem_path = data_dir / "dem" / "srtm-hkh-30m.tif"
    dem_obj, used_real_dem = dem_mod.load_dem_as_mesh(
        geotiff_path=dem_path,
        name="HKH-DEM",
        bounds_lonlat=(70.0, 26.0, 95.0, 36.0),
        resolution=dem_res,
        z_scale_m=1.0,
    )
    if dem_obj:
        mat_terrain = materials_mod.make_terrain_material()
        if dem_obj.data.materials:
            dem_obj.data.materials[0] = mat_terrain
        else:
            dem_obj.data.materials.append(mat_terrain)
    objects["dem"] = dem_obj
    objects["_used_real_dem"] = used_real_dem

    # ── Glaciers 1990 ──────────────────────────────────────────────────────
    glacier_1990_path = data_dir / "glaciers" / "icimod-1990.geojson"
    farinotti_path = data_dir / "glaciers" / "farinotti-2019-hkh-thickness.csv"
    objects["glaciers-1990"] = glaciers_mod.load_glaciers(
        geojson_path=glacier_1990_path,
        thickness_csv=farinotti_path,
        default_thickness_m=150.0,
        color_hex="#7DD3FC",
        name_prefix="Glacier-1990",
        max_features=glacier_cap,
    )

    # ── Glaciers 2020 ──────────────────────────────────────────────────────
    glacier_2020_path = data_dir / "glaciers" / "icimod-2020.geojson"
    objects["glaciers-2020"] = glaciers_mod.load_glaciers(
        geojson_path=glacier_2020_path,
        thickness_csv=farinotti_path,
        default_thickness_m=150.0,
        color_hex="#7DD3FC",
        name_prefix="Glacier-2020",
        max_features=glacier_cap,
    )

    # ── Imja lake ring ─────────────────────────────────────────────────────
    imja_lake_path = data_dir / "lakes" / "imja-keyframes.geojson"
    objects["imja-lake"] = lakes_mod.load_lake_keyframes(
        geojson_path=imja_lake_path,
        name_prefix="ImjaLake",
        z_km=0.0,  # at terrain surface level
    )

    return objects


# ── Animation ─────────────────────────────────────────────────────────────────

def animate_scene(scene: bpy.types.Scene, objects: dict) -> None:
    """Add all animation keyframes: camera, glacier dissolve, diegetic text."""

    # ── Camera ────────────────────────────────────────────────────────────
    cam_obj = cameras_mod.animate_camera(CAMERA_KEYFRAMES, scene)

    # The hidden cut is at frame 450→510.
    # Per 04-blender-pipeline.md: set CONSTANT interpolation on the cut frame.
    cameras_mod.set_constant_cut(cam_obj, 450)

    # ── Glacier dissolve: 1990 → 2020 ─────────────────────────────────────
    g1990 = objects.get("glaciers-1990", [])
    g2020 = objects.get("glaciers-2020", [])
    if g1990 or g2020:
        glaciers_mod.animate_glacier_dissolve(g1990, g2020, DISSOLVE_START, DISSOLVE_END)

    # ── Imja ring pulse (final 5 seconds) ─────────────────────────────────
    imja_kfs = objects.get("imja-lake", [])
    # Get 2020 keyframe objects for the ring pulse
    imja_2020_objs = []
    for year, year_objs in imja_kfs:
        if year >= 2020:
            imja_2020_objs = year_objs
            break

    # Hide all Imja lake objects until ring pulse section (frame 810)
    for year, year_objs in imja_kfs:
        for obj in year_objs:
            obj.hide_render = True
            obj.keyframe_insert("hide_render", frame=0)

    if imja_2020_objs:
        # Show Imja 2020 lake from frame 510 onwards (Khumbu section)
        for obj in imja_2020_objs:
            scene.frame_set(509)
            obj.hide_render = True
            obj.keyframe_insert("hide_render", frame=509)
            scene.frame_set(510)
            obj.hide_render = False
            obj.keyframe_insert("hide_render", frame=510)

        # Animate ring pulse (scale up/down)
        lakes_mod.animate_imja_ring_pulse(imja_2020_objs, RING_START, RING_END)

    # ── Year ticker (diegetic 3D text) ────────────────────────────────────
    # Position it near the Karakoram (orbital view) for frames 0-450
    # then near Khumbu for frames 510-900
    ticker_location = (-800.0, 700.0, 210.0)  # orbital view: far left top
    year_ticker = text_mod.make_year_ticker(
        name="YearTicker",
        location=ticker_location,
        size=30.0,  # large — visible from orbital altitude
        years_and_frames=[
            (0,   1990),
            (150, 1995),
            (250, 2000),
            (350, 2010),
            (450, 2020),
        ],
    )

    # ── Mass counter (diegetic 3D text, bottom-left of frame) ─────────────
    counter_location = (-600.0, -400.0, 210.0)
    mass_counter = text_mod.make_mass_counter(
        name="MassCounter",
        location=counter_location,
        size=20.0,
        steps=[
            (0,   "0 km³ lost"),
            (150, "~100 km³ lost"),
            (250, "~250 km³ lost"),
            (350, "~400 km³ lost"),
            (450, "516 km³ lost"),  # locked headline number
        ],
    )

    scene.frame_set(0)
    print("[ch0] Animation keyframes complete")


# ── Render ────────────────────────────────────────────────────────────────────

def render_frames(scene: bpy.types.Scene, frames_dir: Path) -> None:
    """Render all frames to frames_dir as 4-digit PNG sequence."""
    frames_dir.mkdir(parents=True, exist_ok=True)
    # Blender output path: the directory + prefix (Blender appends frame number + .png)
    scene.render.filepath = str(frames_dir) + "/"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.frame_start = 0
    scene.frame_end = TOTAL_FRAMES - 1

    print(f"[ch0] Rendering frames 0–{TOTAL_FRAMES - 1} → {frames_dir}")
    bpy.ops.render.render(animation=True)
    print(f"[ch0] Render complete")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    args = parse_args()

    print("=" * 60)
    print("Chapter 0 — The reservoir")
    print(f"  Preset   : {args.preset}")
    print(f"  Output   : {args.output}")
    print(f"  Provenance: {args.provenance}")
    print("=" * 60)

    # ── Deterministic seed ────────────────────────────────────────────────
    script_hash = seed_mod.lock_seeds(Path(__file__))
    print(f"[ch0] Script hash: {script_hash[:16]}...")

    # ── Scene setup ───────────────────────────────────────────────────────
    scene = setup_scene()

    # ── Render preset (must come AFTER scene setup) ────────────────────────
    rs_mod.apply_preset(args.preset)
    rs_mod.enable_gpu_if_available()
    seed_mod.lock_seeds(Path(__file__))  # re-apply after scene reset

    # ── Data paths ────────────────────────────────────────────────────────
    project_root = Path(__file__).parent.parent.parent.parent
    data_dir = project_root / "data" / "water-cycle"

    # ── Build geometry ────────────────────────────────────────────────────
    objects = build_geometry(data_dir, args.preset)

    # ── Animate ───────────────────────────────────────────────────────────
    animate_scene(scene, objects)

    # ── Frames directory ──────────────────────────────────────────────────
    frames_dir = args.frames_dir or (project_root / "tmp" / "render" / "ch0")
    frames_dir.mkdir(parents=True, exist_ok=True)

    # ── Render ────────────────────────────────────────────────────────────
    render_frames(scene, frames_dir)

    # ── Encode ────────────────────────────────────────────────────────────
    output_dir = args.output.parent
    output_dir.mkdir(parents=True, exist_ok=True)
    # Use frame 399 for the poster: orbital flyover just before the hidden cut,
    # showing warm brown (Indo-Gangetic plain) vs white peaks — the strongest
    # colour-grammar contrast in Ch 0 and clearest terrain silhouette.
    # The final frame (899) is a tight Khumbu close-up at uniform high elevation
    # which compresses to a near-featureless gray block.
    sizes = encode_mod.encode_chapter(frames_dir, output_dir, fps=FPS, poster_frame=399)

    # ── Provenance ────────────────────────────────────────────────────────
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
        camera_keyframes=CAMERA_KEYFRAMES,
        blender_version="5.1.1",
        used_real_dem=objects.get("_used_real_dem", False),
    )

    # ── Final summary ──────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("DONE: Chapter 0 render complete")
    print(f"  Frames rendered : {TOTAL_FRAMES}")
    print(f"  Output directory: {output_dir}")
    for fname, mib in sizes.items():
        print(f"  {fname:30s}: {mib:.1f} MiB")
    print(f"  Provenance     : {args.provenance}")
    print("=" * 60)


if __name__ == "__main__":
    main()
