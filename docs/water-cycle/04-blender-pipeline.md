# 04 — Blender Pipeline

## The contract

Every chapter render is a single Python script under `scripts/render/water-cycle/ch{N}_*.py`. Run with:

```bash
"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" \
  --background \
  --python scripts/render/water-cycle/ch0_reservoir.py \
  -- \
  --output public/water-cycle/ch0/cinematic.webm \
  --provenance public/water-cycle/ch0/provenance.json
```

Verified working: Blender 5.1.1, Python 3.13.9, `bpy` headless mode, on Windows.

Each script:

1. Reads pre-staged data from `data/water-cycle/`
2. Builds the scene procedurally (no .blend file needed in repo)
3. Renders frame sequence
4. Encodes to AV1 + H.264 + low-bitrate scrub master
5. Writes provenance.json
6. Reports status to stdout (parseable by Mother)

## Shared modules

`scripts/render/water-cycle/shared/` contains reusable bpy modules that all chapter scripts import:

```
shared/
├── __init__.py
├── dem.py             # load GeoTIFF DEM, generate displaced mesh
├── glaciers.py        # load GeoJSON glacier polygons, extrude with thickness model
├── lakes.py           # load GeoJSON lake polygons, animate growth keyframes
├── cameras.py         # camera path utilities (orbital, regional, valley, macro presets)
├── materials.py       # locked material library (sky-blue ice, teal lake, etc.)
├── text.py            # 3D type for diegetic data
├── provenance.py      # write provenance.json from scene metadata
├── encode.py          # ffmpeg wrapper for AV1+H.264+scrub master
├── render_settings.py # locked Cycles presets per scale band
└── seed.py            # deterministic seed setting (fix random seeds for reproducibility)
```

### `shared/dem.py`

```python
"""Load a GeoTIFF DEM and create a displaced mesh in the active scene."""
import bpy
from pathlib import Path

def load_dem_as_mesh(
    geotiff_path: Path,
    name: str,
    bounds_lonlat: tuple[float, float, float, float],
    resolution: int = 512,
    z_scale_m: float = 1.0,
) -> bpy.types.Object:
    """
    Loads a GeoTIFF, samples it onto a planar mesh of `resolution`×`resolution` quads,
    displaces vertices by elevation × z_scale_m, and returns the bpy object.
    Mesh is positioned in WGS84-equivalent coords (lon = X, lat = Y, alt = Z meters).
    """
    # Implementation: use rasterio or GDAL to read GeoTIFF, sample on grid, create mesh
    ...
```

### `shared/glaciers.py`

```python
"""Load GeoJSON glacier polygons and extrude into 3D meshes with thickness."""
import bpy
import json
from pathlib import Path

def load_glaciers(
    geojson_path: Path,
    thickness_csv: Path | None = None,
    default_thickness_m: float = 150.0,
    color_hex: str = "#7DD3FC",
    name_prefix: str = "Glacier",
) -> list[bpy.types.Object]:
    """
    Reads a GeoJSON FeatureCollection of glacier polygons.
    For each feature, looks up thickness in thickness_csv (Farinotti 2019) by GLIMS_ID
    or RGI_ID, falling back to default_thickness_m if not found.
    Creates a polygon mesh, extrudes it by thickness_m / 1000 (km units in Blender),
    applies the locked sky-blue material.
    Returns list of created objects, all parented to a Collection named `{name_prefix}-{year}`.
    """
    ...
```

### `shared/cameras.py` — camera presets

```python
"""Camera path utilities. Each chapter declares keyframes; this module animates."""
import bpy

# Locked focal lengths per scale band (mm equivalent)
CAMERA_PRESETS = {
    "orbital":  {"focal_mm": 35,  "alt_m": 200_000, "pitch": -45},
    "regional": {"focal_mm": 50,  "alt_m": 8_000,   "pitch": -55},
    "valley":   {"focal_mm": 70,  "alt_m": 5_000,   "pitch": -60},
    "macro":    {"focal_mm": 100, "alt_m": 2_000,   "pitch": -75},
}

def animate_camera(
    keyframes: list[tuple[int, float, float, float, float, float, float]],
    """frame, lon, lat, alt_m, pitch_deg, yaw_deg, focal_mm"""
):
    """Adds keyframes to the active camera. Hidden cuts are achieved by inserting
    two keyframes one frame apart with different positions — Blender's interpolation
    on a single-frame gap = step change, which scrub-masters render as a hard cut."""
    ...
```

### `shared/materials.py` — color grammar enforcement

```python
"""Locked material library. ALL materials must come from this module."""
import bpy

# Color tokens from WATER_CYCLE_SPEC.md §7
COLORS = {
    "ice":       (0.49, 0.83, 0.99, 1.0),  # #7DD3FC
    "lake":      (0.05, 0.45, 0.56, 1.0),  # #0E7490
    "river":     (0.22, 0.74, 0.97, 1.0),  # #38BDF8
    "loss":      (0.97, 0.44, 0.44, 1.0),  # #F87171
    "heat":      (0.98, 0.75, 0.14, 1.0),  # #FBBF24
    "people":    (0.98, 0.83, 0.30, 1.0),  # #FCD34D
    "terrain":   (0.28, 0.33, 0.41, 1.0),  # #475569
}

def make_ice_material(transparent: bool = False, volumetric: bool = False) -> bpy.types.Material:
    """Returns the locked ice material. transparent=True for ghost-glacier overlay (Ch 6)."""
    ...

def make_lake_material(depth_m: float = 0.0) -> bpy.types.Material:
    """Returns the locked lake material. depth_m drives the opacity gradient."""
    ...

# ... and so on. NEVER create materials inline in chapter scripts.
```

### `shared/render_settings.py` — locked presets per scale

```python
"""Cycles render presets. Production = 128 spp + denoise minimum (Codex caveat)."""
import bpy

PRESETS = {
    "preview": {
        "engine": "BLENDER_EEVEE_NEXT",  # fast feedback
        "samples": 16,
        "denoise": False,
        "resolution": (640, 360),
    },
    "scrub": {
        "engine": "CYCLES",
        "samples": 64,
        "denoise": True,
        "denoiser": "OPENIMAGEDENOISE",
        "resolution": (854, 480),
    },
    "production": {
        "engine": "CYCLES",
        "samples": 128,
        "denoise": True,
        "denoiser": "OPENIMAGEDENOISE",
        "resolution": (1280, 720),
        "use_motion_blur": False,  # Codex caveat: never on scrub masters
    },
    "production_atmosphere": {
        # For chapters with volumetrics (Ch 0 orbital, Ch 5 impurities)
        "engine": "CYCLES",
        "samples": 256,
        "denoise": True,
        "volumetric_steps_max": 64,
        "resolution": (1280, 720),
        "use_motion_blur": False,
    },
}

def apply_preset(name: str):
    s = bpy.context.scene
    p = PRESETS[name]
    s.render.engine = p["engine"]
    if p["engine"] == "CYCLES":
        s.cycles.samples = p["samples"]
        s.cycles.use_denoising = p["denoise"]
        if "denoiser" in p:
            s.cycles.denoiser = p["denoiser"]
        if "volumetric_steps_max" in p:
            s.cycles.volume_max_steps = p["volumetric_steps_max"]
    s.render.resolution_x = p["resolution"][0]
    s.render.resolution_y = p["resolution"][1]
    s.render.use_motion_blur = p.get("use_motion_blur", False)
```

### `shared/seed.py` — deterministic renders

```python
"""Fix all random seeds for reproducibility."""
import bpy
import random
import hashlib
from pathlib import Path

def lock_seeds(script_path: Path):
    """
    Compute sha256 of the calling script and use as seed for:
    - Cycles
    - Particle systems
    - Python random
    Returns the hash for inclusion in provenance.json.
    """
    h = hashlib.sha256(script_path.read_bytes()).hexdigest()
    seed = int(h[:8], 16)
    random.seed(seed)
    bpy.context.scene.cycles.seed = seed
    return h
```

### `shared/encode.py` — ffmpeg pipeline

```python
"""Encode a frame sequence to AV1, H.264, and low-bitrate scrub master."""
import subprocess
from pathlib import Path

def encode_chapter(
    frames_dir: Path,
    output_dir: Path,
    fps: int = 30,
):
    """
    Reads PNG frames from frames_dir and writes to output_dir:
    - cinematic.webm (AV1, ~1.5 Mbps, 1280×720)
    - cinematic.mp4 (H.264, ~2 Mbps, 1280×720, Safari fallback)
    - cinematic-scrub.webm (VP9, ~600 Kbps, 854×480, dense keyframes every 0.5s)
    - poster.jpg (last frame as JPEG, 1920×1080 upscale)
    
    Critical: validate each output is < 24 MiB. If not, raise.
    """
    av1_cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(frames_dir / "%04d.png"),
        "-c:v", "libsvtav1",
        "-crf", "32",
        "-preset", "8",
        "-pix_fmt", "yuv420p",
        str(output_dir / "cinematic.webm"),
    ]
    h264_cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(frames_dir / "%04d.png"),
        "-c:v", "libx264",
        "-crf", "23",
        "-preset", "slow",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(output_dir / "cinematic.mp4"),
    ]
    scrub_cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", str(frames_dir / "%04d.png"),
        "-vf", "scale=854:480",
        "-c:v", "libvpx-vp9",
        "-b:v", "600k",
        "-g", str(fps // 2),  # keyframe every 0.5s for scrub
        str(output_dir / "cinematic-scrub.webm"),
    ]
    poster_cmd = [
        "ffmpeg", "-y",
        "-i", str(frames_dir / sorted(frames_dir.glob("*.png"))[-1].name),
        "-vf", "scale=1920:1080",
        "-q:v", "2",
        str(output_dir / "poster.jpg"),
    ]
    for cmd in [av1_cmd, h264_cmd, scrub_cmd, poster_cmd]:
        subprocess.check_call(cmd)
    
    # Validate sizes
    for path in [output_dir / "cinematic.webm", output_dir / "cinematic.mp4"]:
        size_mib = path.stat().st_size / (1024 * 1024)
        if size_mib > 24:
            raise RuntimeError(f"{path.name} is {size_mib:.1f} MiB, exceeds 24 MiB Cloudflare cap")
```

### `shared/provenance.py`

```python
"""Generate provenance.json for a chapter. Strict schema enforcement."""
import json
from pathlib import Path
from typing import TypedDict

class SceneLayer(TypedDict, total=False):
    id: str
    type: str  # one of: polygon-extrusion, polygon-flat, raster, particle-system, text-3d, camera-marker, station-pin
    source: dict
    render_geometry_id: str
    color: str
    thickness_model: dict | None

class HeadlineNumber(TypedDict, total=False):
    value: str
    label: str
    citation: str
    uncertainty: str | None

def write_provenance(
    output_path: Path,
    chapter_id: str,
    shot_id: str,
    duration_s: float,
    fps: int,
    scene_layers: list[SceneLayer],
    headline_numbers: list[HeadlineNumber],
    caption_text: str,
    bpy_script_hash: str,
    camera_keyframes: list[tuple],
):
    """Validate all required fields and write to disk."""
    ...
```

## Chapter script template

Every `ch{N}_*.py` follows this template:

```python
#!/usr/bin/env python3
"""
Chapter N — Title
Renders the cinematic for chapter N of /atlas/water-cycle.

Usage:
    blender --background --python ch{N}_*.py -- --output public/water-cycle/chN/cinematic.webm

This script is deterministic: re-running produces byte-identical output.
"""
from __future__ import annotations
import sys
import argparse
from pathlib import Path

import bpy

# Add shared modules to path
sys.path.insert(0, str(Path(__file__).parent / "shared"))
import dem, glaciers, lakes, cameras, materials, text, provenance, encode, render_settings, seed


def parse_args() -> argparse.Namespace:
    """Parse args after `--` separator."""
    if "--" in sys.argv:
        cli_args = sys.argv[sys.argv.index("--") + 1:]
    else:
        cli_args = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--provenance", required=True, type=Path)
    parser.add_argument("--preset", default="production")
    parser.add_argument("--frames-dir", type=Path, default=None)
    return parser.parse_args(cli_args)


def setup_scene():
    """Clear scene, set up camera, lighting, materials."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    # ... add camera, sun, world settings
    return bpy.data.scenes[0]


def build_geometry(data_dir: Path):
    """Load DEM, glaciers, lakes. Returns dict of created objects keyed by layer id."""
    objects = {}
    objects["dem"] = dem.load_dem_as_mesh(
        data_dir / "dem" / "srtm-hkh-30m.tif",
        name="HKH-DEM",
        bounds_lonlat=(70.0, 26.0, 95.0, 36.0),
        resolution=1024,
    )
    objects["glaciers-1990"] = glaciers.load_glaciers(
        data_dir / "glaciers" / "icimod-1990.geojson",
        thickness_csv=data_dir / "glaciers" / "farinotti-2019-hkh-thickness.csv",
        color_hex="#7DD3FC",
        name_prefix="Glacier-1990",
    )
    objects["glaciers-2020"] = glaciers.load_glaciers(
        data_dir / "glaciers" / "icimod-2020.geojson",
        thickness_csv=data_dir / "glaciers" / "farinotti-2019-hkh-thickness.csv",
        color_hex="#7DD3FC",
        name_prefix="Glacier-2020",
    )
    return objects


def animate(scene, objects):
    """Add all keyframes for camera + glacier dissolve + diegetic data."""
    # Camera keyframes
    cameras.animate_camera([
        (0,    73.0, 36.0, 200_000, -45, 90, 35),
        (450,  98.0, 28.0, 200_000, -45, 90, 35),
        (510,  86.93, 27.95, 8_000, -55, 0, 50),  # hidden cut
        (810,  86.93, 27.95, 5_000, -60, 0, 70),
        (900,  86.93, 27.90, 5_000, -60, 0, 70),
    ])
    # Glacier dissolve: 1990 fades out from frame 150-450, 2020 fades in same window
    # ... etc


def render(scene, frames_dir: Path):
    """Render the frame sequence."""
    scene.render.filepath = str(frames_dir / "")
    scene.render.image_settings.file_format = "PNG"
    scene.frame_start = 0
    scene.frame_end = 900
    bpy.ops.render.render(animation=True)


def main():
    args = parse_args()
    
    # Lock random seeds
    script_hash = seed.lock_seeds(Path(__file__))
    
    # Apply render preset
    render_settings.apply_preset(args.preset)
    
    # Setup
    project_root = Path(__file__).parent.parent.parent.parent
    data_dir = project_root / "data" / "water-cycle"
    
    scene = setup_scene()
    objects = build_geometry(data_dir)
    animate(scene, objects)
    
    # Render frames
    frames_dir = args.frames_dir or (project_root / "tmp" / "render" / "ch0")
    frames_dir.mkdir(parents=True, exist_ok=True)
    render(scene, frames_dir)
    
    # Encode
    output_dir = args.output.parent
    output_dir.mkdir(parents=True, exist_ok=True)
    encode.encode_chapter(frames_dir, output_dir, fps=30)
    
    # Write provenance
    provenance.write_provenance(
        output_path=args.provenance,
        chapter_id="ch0",
        shot_id="hkh-flyover",
        duration_s=30,
        fps=30,
        scene_layers=[
            {
                "id": "glacier-1990",
                "type": "polygon-extrusion",
                "source": {
                    "dataset": "ICIMOD HKH Glacier Inventory 1990",
                    "url": "https://rds.icimod.org/...",
                    "doi": "10.26066/rds.1972729",
                    "year_keyframe": 1990,
                    "n_features": 65188,
                },
                "render_geometry_id": "Glacier-1990",
                "thickness_model": {
                    "method": "Farinotti 2019 consensus estimate",
                    "doi": "10.5194/tc-13-665-2019",
                    "uncertainty_pct": 25,
                },
                "color": "#7DD3FC",
            },
            # ... rest of layers
        ],
        headline_numbers=[
            {
                "value": "516 km³",
                "label": "water-equivalent ice lost 1990-2020",
                "citation": "doi:icimod-2026-cryosphere-assessment",
            },
        ],
        caption_text="9% of all HKH ice — 516 km³ of water.",
        bpy_script_hash=script_hash,
        camera_keyframes=[...],
    )
    
    print(f"DONE: rendered {scene.frame_end - scene.frame_start + 1} frames")


if __name__ == "__main__":
    main()
```

## Render budget (realistic — Codex's correction)

For 128 spp Cycles + denoise on Imja-scale terrain, RTX-class GPU:

| Chapter | Duration | Frames | Per-frame | Total render |
|---|---|---|---|---|
| Ch 0 (volumetric, orbital) | 30s | 900 | 8-15s | 2-4 hours |
| Ch 1 (4-up grid) | 25s | 750 | 3-5s | 30-60 min |
| Ch 2 (lake bloom) | 25s | 750 | 4-7s | 50-90 min |
| Ch 3 (Sankey + landscape) | 15s | 450 | 5-8s | 40-60 min |
| Ch 4 (cinematic background only) | 20s | 600 | 3-5s | 30-50 min |
| Ch 5 (volumetric impurities) | 20s | 600 | 8-15s | 80-150 min |
| Ch 6 (split arc + ghost) | 30s | 900 | 6-10s | 90-150 min |
| **Total** | 165s | 4,950 frames | — | **8-12 hours** |

This is a real budget. Plan for it. Render overnight; iterate on preview presets during the day.

## Iteration workflow

1. **Block out** with `--preset preview` (Eevee, 16 spp, 360p, ~1 min total render). Validate composition, animation, materials. Iterate fast.
2. **Mid-fidelity** with `--preset scrub` (Cycles 64 spp, 480p). Validate light, materials, motion. ~10-30 min per chapter.
3. **Production** with `--preset production` or `--preset production_atmosphere`. Final render. Long.

## Anti-patterns (do not do)

- ❌ Don't fetch data over network from inside a `bpy` script. Pre-stage in `data/`.
- ❌ Don't open `.blend` files. All scenes built procedurally in code.
- ❌ Don't create materials inline. Use `shared/materials.py`.
- ❌ Don't enable motion blur on scrub-master encodes (will look smeary on scrub).
- ❌ Don't use `random.random()` without `seed.lock_seeds()` first (renders won't be deterministic).
- ❌ Don't render at higher than 1280×720 (file size cap will be exceeded).
- ❌ Don't change provenance.json schema mid-build. Update schema first, then all chapter scripts.
- ❌ Don't ship a render that has CYCLES warnings about volume step underflow. Increase `volume_max_steps`.

## Common gotchas

- **Single-frame hidden cut**: Blender interpolates linearly between keyframes. To force a hard cut at frame F, set the camera's interpolation type for that keyframe to `CONSTANT`, then add the next keyframe at F+1. The single-frame jump renders as a cut on encode.
- **Reproducibility**: `bpy.context.scene.cycles.seed` is per-scene. Set explicitly at scene setup.
- **Headless rendering**: Cycles GPU mode requires `bpy.context.preferences.addons["cycles"].preferences.compute_device_type = "OPTIX"` (NVIDIA) or `"HIP"` (AMD), enabled BEFORE scene setup. Add to chapter scripts.
- **Memory**: large DEM meshes can OOM Cycles. Decimate to ≤ 1024×1024 vertices per terrain chunk.
- **Script-hash determinism**: trailing whitespace and line endings affect the hash. Run `dos2unix` or strip trailing whitespace before computing.

## Useful resources

- Blender 5.1 Python API: https://docs.blender.org/api/5.1/
- bpy ops: https://docs.blender.org/api/5.1/bpy.ops.html
- Cycles render docs: https://docs.blender.org/manual/en/5.1/render/cycles/
- BlenderGIS plugin: https://github.com/domlysz/BlenderGIS (for SRTM ingestion if our shared/dem.py needs help)
- blosm: https://github.com/vvoovv/blosm (for OSM in Blender if needed for Khumbu villages)
