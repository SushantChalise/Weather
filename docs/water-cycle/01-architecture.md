# 01 — Architecture

## System overview

Three layers, communicating via filesystem contracts (JSON manifests + standardized asset paths). Each layer is independently developable and testable.

```
┌──────────────────────────────────────────────────────────────────┐
│  Data Layer                                                      │
│  Sources: ICIMOD, Somos-Valenzuela 2014, OpenTopography (SRTM),  │
│           Rounce 2023, Miles 2021, Kaspari 2014                  │
│  Output:  data/water-cycle/{dem,glaciers,lakes,scenarios}/...    │
│           public/glaciers/hkh/{year}-points.geojson (existing)   │
└────────────────────────┬─────────────────────────────────────────┘
                         │ filesystem (GeoTIFF, GeoJSON, CSV)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Render Layer (Blender)                                          │
│  scripts/render/water-cycle/ch{0..6}.py                          │
│  Each script reads data/, runs `blender --background --python`,  │
│  outputs:                                                        │
│    public/water-cycle/ch{N}/cinematic.{mp4,webm}                 │
│    public/water-cycle/ch{N}/cinematic-scrub.webm  (low-bitrate)  │
│    public/water-cycle/ch{N}/poster.jpg            (final frame)  │
│    public/water-cycle/ch{N}/provenance.json       (data contract)│
└────────────────────────┬─────────────────────────────────────────┘
                         │ filesystem (video + JSON)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Frontend Layer (Next.js)                                        │
│  src/app/atlas/water-cycle/page.tsx (server component)           │
│  src/components/water-cycle/*.tsx (client components)            │
│  - Fetches provenance.json per chapter                           │
│  - Renders cinematic-scrub.{webm,mp4} with GSAP-driven scrub     │
│  - Provenance Peel toggle reveals data layers                    │
│  - Mobile card-stack variant for < 768px                         │
└──────────────────────────────────────────────────────────────────┘
```

## Layer contracts (do not break these)

### Data Layer → Render Layer

**Contract**: standardized GeoJSON / GeoTIFF in `data/water-cycle/`. Render scripts MUST NOT fetch from network during render. All data must be pre-staged.

**Required files** (each render task validates these exist before starting):

| Path | Format | Source | Used by |
|---|---|---|---|
| `data/water-cycle/dem/srtm-hkh-30m.tif` | GeoTIFF | OpenTopography API, SRTM 30m, HKH bbox | Ch 0, 1, 2, 6 |
| `data/water-cycle/dem/srtm-imja-30m.tif` | GeoTIFF | Same, Imja basin bbox | Ch 0, 2, 4 |
| `data/water-cycle/glaciers/icimod-1990.geojson` | GeoJSON Polygon | ICIMOD HKH 1990 inventory (already in `public/glaciers/hkh/`) | Ch 0, 1, 6 |
| `data/water-cycle/glaciers/icimod-2020.geojson` | GeoJSON Polygon | ICIMOD HKH 2020 inventory | Ch 0, 1, 2, 6 |
| `data/water-cycle/glaciers/imja-keyframes.geojson` | GeoJSON FeatureCollection | Digitized from Somos-Valenzuela 2014 Fig 2; 4 keyframes per year (1962, 1992, 2010, 2020) | Ch 0, 2, 4 |
| `data/water-cycle/lakes/imja-keyframes.geojson` | GeoJSON FeatureCollection | Digitized from Somos-Valenzuela 2014 Fig 4; 5 keyframes (1962, 1975, 1992, 2010, 2020) | Ch 0, 2, 4 |
| `data/water-cycle/lakes/icimod-current.geojson` | GeoJSON Polygon | Existing `public/glacial-lakes/current.geojson` | Ch 2, 4 |
| `data/water-cycle/scenarios/rounce-2023-imja.json` | JSON timeseries | Rounce et al. 2023 Imja-region projections SSP1-2.6, SSP5-8.5 | Ch 6 |
| `data/water-cycle/scenarios/rounce-2023-hkh-aggregate.json` | JSON timeseries | Rounce 2023 HKH aggregate by SSP | Ch 6 |
| `data/water-cycle/impurities/kaspari-2014-figure-data.json` | JSON | Albedo reduction values from Kaspari 2014 | Ch 5 |

### Render Layer → Frontend Layer

**Contract**: each chapter directory under `public/water-cycle/ch{N}/` must contain:

```
public/water-cycle/ch0/
  cinematic.webm       ← AV1, 1280×720, 24-bit, ~1.5 Mbps, ≤ 24 MiB
  cinematic.mp4        ← H.264, 1280×720, ~2 Mbps, ≤ 24 MiB (Safari fallback)
  cinematic-scrub.webm ← VP9, 854×480, dense keyframes (every 0.5s), ~600 Kbps
  poster.jpg           ← JPEG, 1920×1080, the marquee final frame
  provenance.json      ← see schema in 06-provenance-peel.md
```

**Sizes are checked by acceptance test**: any file > 24 MiB blocks ship. CI fails.

**Naming is contract**: frontend hardcodes these paths. Don't rename files; if a different aspect ratio or codec is needed, edit this doc and the frontend in the same PR.

### Frontend Layer

**Reads**:
- `public/water-cycle/ch{0..6}/provenance.json` at build time (statically bundled into the page)
- `public/water-cycle/ch{0..6}/cinematic-scrub.{webm,mp4}` as `<source>` in `<video>` tag
- `public/water-cycle/ch{0..6}/cinematic.{webm,mp4}` swapped in on play
- `public/water-cycle/citations.json` — consolidated bibliography from all chapters' provenance.json

**Renders**:
- 7 sticky-pinned chapter sections, each with a `<video>` and overlay
- A persistent provenance-toggle button per chapter
- Floating chapter index (top-right) for keyboard navigation
- Mobile card-stack variant on small screens

## Data flow (one chapter, end to end)

```
1. Mother spawns "build Imja keyframes" task
   → Sonnet worker downloads Somos-Valenzuela 2014 PDF
   → Worker writes scripts/transform/water-cycle/build-imja-keyframes.ts
   → Worker runs script
   → Output: data/water-cycle/glaciers/imja-keyframes.geojson
             data/water-cycle/lakes/imja-keyframes.geojson
   → PR opened, acceptance: file exists, GeoJSON valid, ≥4 keyframes

2. Mother spawns "render Ch 2 lake bloom" task (depends on step 1)
   → Sonnet worker writes scripts/render/water-cycle/ch2_lake_bloom.py
   → Worker runs `blender --background --python ch2_lake_bloom.py`
   → Output: public/water-cycle/ch2/cinematic.webm
             public/water-cycle/ch2/cinematic.mp4
             public/water-cycle/ch2/cinematic-scrub.webm
             public/water-cycle/ch2/poster.jpg
             public/water-cycle/ch2/provenance.json
   → PR opened, acceptance: all 5 files exist, sizes < 24 MiB,
     provenance.json validates against schema, poster.jpg is final frame

3. Mother spawns "integrate Ch 2 in frontend" task
   → Sonnet worker writes src/components/water-cycle/per-chapter/ch2-lake-bloom.tsx
   → Worker imports the chapter into water-cycle-client.tsx
   → Worker runs `npm run dev`, captures screenshot via preview tools
   → PR opened, acceptance: chapter renders, scroll scrubs video,
     provenance toggle works, mobile variant works
```

## Critical contract: provenance.json

Every render task MUST emit a `provenance.json` validating against this schema:

```typescript
type Provenance = {
  chapter_id: "ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";
  shot_id: string; // human-readable, e.g., "hkh-flyover"
  duration_s: number;
  frames: number;
  fps: 30; // locked
  resolution: { w: 1280; h: 720 }; // locked
  camera_path: {
    keyframes: { t: number; lon: number; lat: number; alt_m: number; pitch_deg: number; yaw_deg: number }[];
  };
  scene_layers: SceneLayer[];
  headline_numbers: HeadlineNumber[];
  caption_text: string; // server-rendered HTML caption
  generated_at: string; // ISO8601
  blender_version: string;
  bpy_script_hash: string; // sha256 of the script that generated this
};

type SceneLayer = {
  id: string; // unique within chapter
  type: "polygon-extrusion" | "polygon-flat" | "raster" | "particle-system" | "text-3d" | "camera-marker" | "station-pin";
  source: {
    dataset: string; // human-readable
    url: string;
    doi?: string;
    version?: string;
    year_keyframe?: number;
    filter?: string;
    n_features?: number;
    preprocessing?: string[];
  };
  render_geometry_id: string; // bpy collection name
  thickness_model?: {
    method: string;
    doi?: string;
    uncertainty_pct: number;
  };
  color: string; // hex; must match color-grammar in spec §7
};

type HeadlineNumber = {
  value: string;
  label: string;
  citation: string; // doi: or url:
  uncertainty?: string; // e.g., "±25 km³ (95% CI)"
};
```

**Acceptance test**: render task PR fails CI if `provenance.json` doesn't validate against this schema. Schema lives at `scripts/render/water-cycle/shared/provenance-schema.ts`.

## Why this architecture

1. **Layer isolation = parallel work**. Data Layer can be filled in by one Sonnet worker while Render Layer can be drafted by another, while Frontend Layer can be scaffolded by a third.
2. **Filesystem contracts > runtime API**. Pre-rendered video + JSON manifests means the frontend doesn't depend on Blender or Python being available at request time. Cloudflare Workers serves static files; that's all.
3. **Provenance.json schema = the auditability ladder**. Without this contract, the Provenance Peel feature is hand-wavy. With it, every render scripts knows what it must declare.
4. **Reproducible renders**. `bpy_script_hash` in provenance.json + deterministic seeds mean re-running a render produces byte-identical output, so we can verify regressions.
5. **Cloudflare 25 MiB cap is enforced at the contract layer**. Acceptance test checks file size; CI fails if violated. No "we'll fix it later".

## Repo paths summary (canonical)

```
WATER_CYCLE_SPEC.md                                # this directory's parent
docs/water-cycle/                                  # all sub-docs
data/water-cycle/                                  # gitignored, local-only
public/water-cycle/                                # shipped, static assets
src/app/atlas/water-cycle/                         # Next.js route
src/components/water-cycle/                        # React components
scripts/render/water-cycle/                        # Blender bpy scripts
scripts/transform/water-cycle/                     # data ingestion / digitization
scripts/render/water-cycle/shared/                 # bpy helper modules
scripts/render/water-cycle/shared/provenance-schema.ts   # the contract
```

## Anti-architecture (do not do)

- ❌ Don't fetch DEM in the bpy script at render time. Pre-stage in `data/`.
- ❌ Don't hardcode citation strings in components. Read from provenance.json.
- ❌ Don't use a Python virtualenv outside Blender's bundled Python. Blender ships its own.
- ❌ Don't put video files in `data/`. They go in `public/water-cycle/ch{N}/`.
- ❌ Don't call Blender from CI. Renders happen on dev machines; output is committed via Git LFS or Cloudflare R2 if needed (TBD: ask Mother).
- ❌ Don't break the provenance.json schema without updating the schema file + all chapter scripts in the same PR.
