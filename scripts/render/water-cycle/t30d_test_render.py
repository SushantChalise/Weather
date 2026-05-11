#!/usr/bin/env python3
"""
T3.0d single-frame test render — smooth shading verification.

Renders frame 0 of ch0 at preview preset (Eevee 640×360) using the updated
shared/dem.py (smooth shading + SubSurf modifier).  Saves the result as:
  tests/fixtures/water-cycle/t30d-terrain-smooth-test.jpg

Usage (from project root):
    "C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe" \\
        --background \\
        --python scripts/render/water-cycle/t30d_test_render.py \\
        -- \\
        --output tests/fixtures/water-cycle/t30d-terrain-smooth-test.jpg

Acceptance checks logged to stdout:
  - "SubSurf modifier added" confirms the modifier was applied
  - "Smooth shading applied" confirms shade_smooth ran
  - Final "DONE" line with file size confirms JPEG was written
"""
from __future__ import annotations

import sys
import argparse
from pathlib import Path

import bpy

# ── Module path setup ──────────────────────────────────────────────────────────
_SCRIPT_DIR = Path(__file__).parent
_SHARED_DIR = _SCRIPT_DIR / "shared"
sys.path.insert(0, str(_SHARED_DIR))

import dem as dem_mod
import materials as materials_mod
import render_settings as rs_mod
import seed as seed_mod


def parse_args() -> argparse.Namespace:
    if "--" in sys.argv:
        cli_args = sys.argv[sys.argv.index("--") + 1:]
    else:
        cli_args = []
    parser = argparse.ArgumentParser(prog="t30d_test_render.py")
    parser.add_argument("--output", type=Path,
                        default=None,
                        help="Output JPEG path (default: tests/fixtures/water-cycle/t30d-terrain-smooth-test.jpg)")
    return parser.parse_args(cli_args)


def main() -> None:
    args = parse_args()

    print("=" * 60)
    print("T3.0d — Terrain smooth-shading test render")
    print("  Frame 0, preview preset (Eevee 640×360)")
    print("=" * 60)

    # ── Deterministic seed ─────────────────────────────────────────────────
    seed_mod.lock_seeds(Path(__file__))

    # ── Scene setup ────────────────────────────────────────────────────────
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "T30d-SmoothTest"
    scene.frame_start = 0
    scene.frame_end = 0
    scene.render.fps = 30

    # Sky + sun (same as ch0 setup_scene)
    rs_mod.setup_sky_lighting(
        sun_elevation_deg=29.0,
        sun_azimuth_deg=225.0,
        sun_strength=3.0,
        sky_strength=1.0,
    )

    # ── Render preset: preview (Eevee, fast) ──────────────────────────────
    rs_mod.apply_preset("preview")

    # ── Resolve project root ───────────────────────────────────────────────
    # This script lives at scripts/render/water-cycle/t30d_test_render.py
    project_root = _SCRIPT_DIR.parent.parent.parent
    data_dir = project_root / "data" / "water-cycle"

    # ── DEM: preview resolution (64×64) with smooth shading ───────────────
    dem_path = data_dir / "dem" / "srtm-hkh-30m.tif"
    dem_obj, used_real_dem = dem_mod.load_dem_as_mesh(
        geotiff_path=dem_path,
        name="HKH-DEM-SmoothTest",
        bounds_lonlat=(70.0, 26.0, 95.0, 36.0),
        resolution=64,      # small for fast preview render
        z_scale_m=1.0,
        subdiv_levels=1,    # T3.0d: SubSurf level 1
    )
    if dem_obj:
        mat = materials_mod.make_terrain_material()
        if dem_obj.data.materials:
            dem_obj.data.materials[0] = mat
        else:
            dem_obj.data.materials.append(mat)

    print(f"[t30d] DEM: {'real' if used_real_dem else 'procedural'} terrain")

    # ── Camera: orbital view matching Ch 0 frame 0 keyframe ───────────────
    # (lon=73, lat=36, alt=200,000m, pitch=-45, yaw=90, focal=35mm)
    # Simple static camera — no animation needed for single-frame test.
    bpy.ops.object.camera_add(location=(0, 0, 200))
    cam = bpy.context.active_object
    cam.name = "T30d-Camera"
    scene.camera = cam

    # Approximate the orbital altitude in Blender units (km)
    _KM_PER_DEG_LAT = 111.0
    import math
    _KM_PER_DEG_LON = 111.0 * math.cos(math.radians(30.0))
    lon, lat, alt_m = 73.0, 36.0, 200_000.0
    cam.location.x = (lon - 83.0) * _KM_PER_DEG_LON
    cam.location.y = (lat - 30.0) * _KM_PER_DEG_LAT
    cam.location.z = alt_m / 1_000.0  # km

    # Tilt camera down at -45° pitch
    cam.rotation_euler = (math.radians(45.0), 0.0, math.radians(90.0))
    cam.data.lens = 35.0  # 35mm focal length

    # ── Output path ────────────────────────────────────────────────────────
    if args.output is not None:
        output_path = args.output.resolve()
    else:
        output_path = (project_root / "tests" / "fixtures" / "water-cycle"
                       / "t30d-terrain-smooth-test.jpg").resolve()

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Render single frame to a temp PNG then convert, OR render as JPEG directly.
    scene.render.filepath = str(output_path.with_suffix(""))  # Blender adds extension
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 90
    scene.frame_set(0)

    print(f"[t30d] Rendering frame 0 → {output_path}")
    bpy.ops.render.render(write_still=True)

    # ── Report ─────────────────────────────────────────────────────────────
    # Blender appends frame number + extension when filepath is a dir prefix.
    # For write_still=True with an explicit filepath it writes directly.
    # Find the output file.
    candidates = [
        output_path,
        output_path.with_name(output_path.stem + "0001.jpg"),
        output_path.with_name(output_path.stem + "0000.jpg"),
        output_path.parent / (output_path.stem + "0001.jpg"),
        output_path.parent / (output_path.stem + "0000.jpg"),
    ]
    written = None
    for c in candidates:
        if c.exists():
            written = c
            break

    if written:
        size_kb = written.stat().st_size / 1024
        print(f"\nDONE: {written} ({size_kb:.0f} KB)")
        print("Acceptance checks:")
        print("  - Smooth shading: see '[dem] Smooth shading applied' above")
        print("  - SubSurf modifier: see '[dem] SubSurf modifier added' above")
        print(f"  - Color ramp: terrain material uses locked §7 ramp (unchanged)")
        print(f"  - Sun + sky: Nishita sky texture applied (see render_settings log)")
    else:
        print(f"\nWARNING: could not find rendered output near {output_path}")
        print("Render may have succeeded — check Blender's default output path.")


if __name__ == "__main__":
    main()
