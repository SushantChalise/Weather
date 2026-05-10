# Water-Cycle Render Scripts

Blender 5.1 bpy scripts that produce the cinematic videos for `/atlas/water-cycle`.

## Requirements

- Blender 5.1 at `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe`
- ffmpeg (install: `winget install --id Gyan.FFmpeg`)
- Python 3.x with rasterio (optional — for real DEM; `pip install rasterio`)
- Pre-staged data in `data/water-cycle/` (run transform scripts first)

## Shared modules

All chapter scripts import from `shared/`:

| Module            | Purpose                                              |
|-------------------|------------------------------------------------------|
| `seed.py`         | Deterministic render seeds (sha256 of script)        |
| `materials.py`    | Locked color grammar (#7DD3FC ice, #0E7490 lake, etc)|
| `render_settings.py` | Cycles presets (preview/scrub/production)         |
| `cameras.py`      | Camera path animation, hidden cuts                   |
| `dem.py`          | SRTM DEM → Blender mesh (procedural fallback if absent) |
| `glaciers.py`     | GeoJSON glacier polygons → extruded 3D meshes        |
| `lakes.py`        | GeoJSON lake polygons → flat meshes + keyframes      |
| `text.py`         | 3D diegetic text (year ticker, mass counter)         |
| `provenance.py`   | Write & validate provenance.json                     |
| `encode.py`       | ffmpeg AV1 + H.264 + VP9 scrub master + poster       |

## Running a chapter render

```bash
# Preview: Eevee, 360p, ~2-5 min
blender --background --python scripts/render/water-cycle/ch0_reservoir.py -- \
    --output public/water-cycle/ch0/cinematic.webm \
    --provenance public/water-cycle/ch0/provenance.json \
    --preset preview

# Scrub: Cycles 64spp, 480p, ~30-60 min
blender --background --python scripts/render/water-cycle/ch0_reservoir.py -- \
    --output public/water-cycle/ch0/cinematic.webm \
    --provenance public/water-cycle/ch0/provenance.json \
    --preset scrub

# Production: Cycles 128spp, 720p, 2-4 hours
blender --background --python scripts/render/water-cycle/ch0_reservoir.py -- \
    --output public/water-cycle/ch0/cinematic.webm \
    --provenance public/water-cycle/ch0/provenance.json \
    --preset production
```

## Validate provenance

```bash
npm run validate:water-cycle-provenance ch0
```

## Output contract

Each chapter dir `public/water-cycle/ch{N}/` must contain:

```
cinematic.webm       AV1, ≤ 24 MiB
cinematic.mp4        H.264, ≤ 24 MiB
cinematic-scrub.webm VP9 480p, dense keyframes
poster.jpg           Final frame, 1920×1080
provenance.json      Data source contract (schema in 01-architecture.md)
```

## Notes

- No `.blend` files in repo — all scenes built procedurally.
- DEM is optional: render falls back to procedural terrain if `srtm-hkh-30m.tif` absent.
- Renders are deterministic: same script → same output (sha256-seeded Cycles).
- GPU: OPTIX used if NVIDIA GPU present; falls back to CPU.
