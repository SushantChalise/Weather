# Architecture — Himalayan Atlas

How Himalayan Atlas is built underneath. If this conflicts with PRODUCT.md, PRODUCT.md wins on intent; this file wins on technical specifics.

---

## 1. Stack overview

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) + TypeScript strict | Server components, edge cache, ISR, file-based routing; existing |
| **Map engine** | MapLibre GL | Open, performant, raster + vector, existing |
| **3D / extras** | React Three Fiber + drei | Tilt mode, future glacier 3D; existing |
| **Charting** | Observable Plot (preferred) / Recharts (existing fallback) | Plot is small, designed for data viz, SSR-friendly |
| **Styling** | Tailwind CSS v4 | Existing, design tokens locked in DESIGN.md |
| **State (client)** | Zustand (multi-store) | Granular subscriptions, no Context re-render storms |
| **Data fetching (client)** | SWR | Existing |
| **Database** | Postgres + PostGIS + TimescaleDB | Spatial + time-series + relational in one engine |
| **ORM** | Drizzle (preferred for type safety + minimal overhead) or Prisma | Decision deferred to hour 0 |
| **Hosting (DB)** | Neon (free tier) → Vercel Postgres later | Native Postgres, generous free tier |
| **Hosting (app)** | Vercel | Existing |
| **Tile / blob storage** | Vercel Blob | Existing for Himawari tiles |
| **Cold object storage** | Vercel Blob (initial) → Cloudflare R2 (when egress matters) | Raw archive copies of NetCDF / GRIB |
| **Cron / ingestion runtime** | GitHub Actions | Free for public repos, existing pattern, durable |
| **Heavy compute (escalation)** | Modal.com or Fly.io workers | When CMIP6 / ERA5 jobs exceed Actions limits |
| **Lint / format** | Biome | Existing |
| **Type safety** | TypeScript strict + `noUncheckedIndexedAccess` | Existing |

---

## 2. The single-engine database choice — Postgres + PostGIS + TimescaleDB

The product touches three data shapes: relational (places, datasets, citations), spatial (glacier outlines, watersheds, river segments), and time-series (climate observations at place × time × variable). Three databases would be overkill. Postgres handles all three with extensions:

| Need | Extension |
|---|---|
| Place geometries (point / polygon / linestring) | **PostGIS** |
| Glacier outlines, basin polygons, river segments | **PostGIS** |
| Climate observation time-series (millions of rows / variable) | **TimescaleDB hypertables** (auto-partitioned by time) |
| Pre-computed climatology / anomalies | Plain Postgres tables |

Single engine, one connection pool, one backup story, one access-control model. Simpler is better.

**Why not separate time-series DB (InfluxDB, ClickHouse, etc.):** added operational surface, no real benefit at our scale. TimescaleDB does what we need for years of climate data without a second system to operate.

**Why not file-based (Parquet on Blob with DuckDB):** considered. Wins for cold analytics, loses for serving live charts under request latency budget. Postgres + materialised views is the right primary; Parquet/DuckDB layer can be added later for heavy analytics if needed.

---

## 3. Database design

### 3.1 Schema sketch

See PRODUCT.md §11 for the full schema. Summary:

| Schema / table | Role |
|---|---|
| `places` | Canonical place registry — every glacier, peak, lake, river point, trek destination, city. PostGIS geometry, place class. |
| `datasets` | Registered data sources with version, license, citation, source URL |
| `obs_weather_daily` | TimescaleDB hypertable: time × place × variable × source (daily) |
| `obs_weather_hourly` | (Future) hourly hypertable for sub-daily variables |
| `obs_climatology` | Pre-computed 30-year baseline (mean / p05 / p25 / p50 / p75 / p95) per place × variable × day-of-year |
| `cryo_glacier_outlines` | Time-versioned glacier polygons (PostGIS multipolygon) |
| `cryo_glacier_mass_balance` | TimescaleDB hypertable for mass balance time series |
| `cryo_glacial_lakes` | Lake polygons with risk attributes |
| `proj_cmip6_summaries` | Place-level scenario summaries (mean / p10 / p90 / model count) |
| `events_historical` | Notable events (storms, GLOFs, earthquakes) with affected places + evidence JSON |
| `events_active` | Live events (FIRMS fires, HydroSAR floods, GDACS alerts) |
| `photos_archive` | Curated and ingested photos with provenance |

### 3.2 Indexing strategy

| Table | Index |
|---|---|
| `places` | GIST on `geom`, btree on `(class)`, btree on `(slug)` |
| `obs_weather_daily` | TimescaleDB time_bucket on `time`, btree on `(place_id, variable, time)` |
| `obs_climatology` | btree on `(place_id, variable, doy, baseline_period)` |
| `cryo_glacier_outlines` | GIST on `geom`, btree on `(place_id, outline_year)` |
| `events_historical` | btree on `(time_start)`, GIN on `affected_places` array |
| `photos_archive` | btree on `(place_id, capture_time)` |

### 3.3 Materialised views

For the heaviest read paths — `Now vs Normal` for top places, monthly climatology lookups for the Climate Time Machine — pre-compute into materialised views, refreshed by an ingestion-side cron. Application code reads the materialised views, not the underlying time-series.

---

## 4. Ingestion pipeline — the long-term durability layer

**Principle:** every dataset is ingested locally, never live-fetched. Data sources change URLs, deprecate APIs, and rotate auth. Our copy of the data does not. This is non-negotiable.

### 4.1 Per-dataset four-stage pattern

Every ingested dataset lives at `scripts/ingestion/<dataset_slug>/` with this structure:

```
scripts/ingestion/<dataset_slug>/
├── scrape.py            # Stage 1: pull from source (API, FTP, S3, web)
├── validate.py          # Stage 2: schema check, range check, freshness, diff vs last
├── transform.py         # Stage 3: crop to HKH bbox, downsample, compute aggregates
├── load.py              # Stage 4: UPSERT into Postgres or upload to Blob
├── manifest.json        # Source URL, license, version, citation, columns mapped
└── README.md            # What this dataset is, why we have it, gotchas
```

Shared utilities live at `scripts/ingestion/_shared/`:

```
scripts/ingestion/_shared/
├── postgres.py          # Connection helpers, upsert builders, hypertable helpers
├── validation.py        # Common range checks, schema diffing, expected-value rules
├── geo.py               # HKH bbox crop, lat/lon to grid index, Web Mercator helpers
└── citations.py         # Per-source citation builders (BibTeX, Wikipedia ref tags)
```

### 4.2 GitHub Actions orchestration

Each dataset has its own workflow:

```
.github/workflows/
├── ingest-himawari.yml                  # cron: */30 min (existing, reorg)
├── ingest-era5-monthly.yml              # cron: monthly (after ECMWF release)
├── ingest-chirps-daily.yml              # cron: daily
├── ingest-modis-snow.yml                # cron: daily
├── ingest-gpm-imerg.yml                 # cron: hourly during monsoon
├── ingest-icimod-glacier-mass-balance.yml  # cron: monthly (slow-changing)
├── ingest-icimod-glacial-lakes.yml      # cron: weekly
├── ingest-icimod-hydrosar.yml           # cron: daily during monsoon
├── ingest-firms-fires.yml               # cron: hourly during fire season
├── ingest-tropomi-aod.yml               # cron: daily
├── ingest-grace.yml                     # cron: monthly
├── ingest-photos-curate.yml             # manual + human review
└── ...one per dataset
```

Pattern for each workflow:

```yaml
jobs:
  ingest:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11", cache: pip }
      - run: pip install -r scripts/ingestion/<dataset>/requirements.txt
      - run: python scripts/ingestion/<dataset>/scrape.py
      - run: python scripts/ingestion/<dataset>/validate.py
        # validate.py exits non-zero on bad data → workflow fails → no overwrite
      - run: python scripts/ingestion/<dataset>/transform.py
      - run: python scripts/ingestion/<dataset>/load.py
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - name: Upload validation report
        if: always()
        uses: actions/upload-artifact@v4
        with: { name: validation-<dataset>-${{ github.run_id }}, path: validation_report.json }
```

### 4.3 Validation gate

Every ingestion run produces `validation_report.json`. The validate stage exits non-zero if:

- Schema drift (column names / types changed at source)
- Values out of expected range (e.g., temperature outside [-60, +60] °C)
- Source unreachable / empty response
- Diff vs last successful run exceeds threshold (e.g., > 50% of values changed unexpectedly)

When validation fails, **the load stage does not run**. The prior good copy in Postgres is preserved. The workflow fails loudly. A notification fires.

### 4.4 Idempotency

Every load is `UPSERT` keyed on `(source_id, place_id, time, variable)` (or equivalent for non-time-series). Running an ingestion twice is a no-op. This makes retries safe and makes "re-run from scratch" a one-command operation.

### 4.5 Provenance

Every row carries `source_dataset_id`, `source_version`, `ingested_at`. We can reconstruct any chart from raw archives. Cold archive copies of source data live in Vercel Blob (or R2) under `archive/<dataset_slug>/<version>/`.

### 4.6 New-dataset onboarding (Claude Code-aided)

When adding a new dataset for the first time:

1. A Claude Code session inspects the source (URL, schema, sample data).
2. Drafts the four scripts using the template at `scripts/ingestion/_template/`.
3. Runs once locally against a dev Postgres.
4. Writes the validation report.
5. Commits with the manifest + README.

Human review at this step is mandatory: a human checks the manifest, README, and validation rules before the first PR merges. The user explicitly directed this hybrid pattern (Claude Code + human inputs) — not Claude API calls inside the production runtime.

---

## 5. Storage tiers

| Tier | What lives here | Lifetime | Access |
|---|---|---|---|
| **Postgres (hot)** | Place registry, derived observations, climatology, projections, citations, photos metadata | Permanent | Read at request time |
| **Vercel Blob (warm)** | Tile sets (Himawari, MODIS Snow, satellite cloud), processed images, place hero photos | Tiles: rolling 30 days; images: permanent | CDN-served via public URL |
| **Vercel Blob / R2 (cold)** | Raw archive copies of source data (ERA5 monthly NetCDF, CMIP6 daily, MODIS HDF, ICIMOD CSVs) | Permanent (long-term durability) | Accessed by ingestion pipelines, not requests |
| **GitHub repo** | Code, ingestion scripts, small reference datasets, validation snapshots | Permanent | git operations |

### 5.1 Why Vercel Blob now, R2 later

Vercel Blob is already integrated and works for the current scale. Cloudflare R2 wins on egress cost (free) when the cold archive grows past tens of GB and we serve large raw files externally. Migration is a script, not a redesign.

---

## 6. Frontend rendering pipeline

```
User request
    ↓
Next.js Edge / Server Component
    ↓
Drizzle / Prisma → Postgres query
    ↓
ISR cache (Vercel Edge Cache, varies by route)
    ↓
React Server Component renders HTML + chart SVG (Plot SSR)
    ↓
Client receives HTML; hydrates only interactive components
    ↓
Interactive layers (MapLibre, hover, scrub) hydrate
```

**Charts pre-rendered server-side** wherever possible. Observable Plot supports SSR-friendly rendering — the initial paint shows the chart as plain SVG, then JS upgrades it for interactivity. First Contentful Paint is essentially "the chart, fully visible, before JS loads."

**No live third-party fetches at request time** — only Postgres and Vercel Blob (both ours). Open-Meteo per-request lookup is the one exception, capped and cached.

### 6.1 Cache hierarchy

| Layer | TTL | Purpose |
|---|---|---|
| **Postgres** | (source of truth) | All durable state |
| **Materialised views** | refreshed by cron | Common aggregates (Now vs Normal, monthly climatology) |
| **Next.js ISR** | 10 min – 24 h depending on route | Page-level cache |
| **Vercel Edge** | varies | Geographic edge cache for global users |
| **Browser** | 1 h for charts, 24 h for static | Re-visit performance |

---

## 7. State management (client)

Three focused Zustand stores. SWR handles the data cache.

```typescript
// 1. World state — camera, time, layers, performance
type WorldStore = {
  cameraMode: "topdown" | "tilt";
  selectedPlaceId: number | null;
  activeMapLayer: "clouds" | "snow" | "current" | "anomaly" | null;
  timeMode: "now" | "tomorrow_am" | "afternoon" | "last_24h";
  performanceTier: "low" | "medium" | "high";
  lowBandwidthMode: boolean;
  idle: boolean;
  set: (...) => void;
};

// 2. Visualization state — what cross-cutting view is open
type VisualizationStore = {
  openVisualization: "climate-time-machine" | "trek-window-shift" | "in-your-lifetime" | null;
  vizParams: Record<string, unknown>;  // viz-specific URL-sync state
  set: (...) => void;
};

// 3. Story / event state — current featured story or active event
type NarrativeStore = {
  currentFeaturedStorySlug: string | null;
  activeEventSlug: string | null;
  set: (...) => void;
};
```

**Why not Context:** Context re-renders every consumer on any change. Zustand selector subscriptions only re-render components whose specific slice changed.

**URL sync:** every cross-cutting view (Climate Time Machine, Trek Window Shift, In Your Lifetime) syncs its parameters to the URL (`?place=abc&variable=temp&month=10&period=1991-2020`) so any chart state is shareable and bookmarkable.

---

## 8. Place page architecture

The 4-tab spine on every place is generated from a single template:

```
src/app/places/[slug]/page.tsx                  # Top-level place page (server component)
src/app/places/[slug]/(tabs)/now/page.tsx       # Now tab
src/app/places/[slug]/(tabs)/normal/page.tsx    # Now vs Normal tab
src/app/places/[slug]/(tabs)/trend/page.tsx     # Last 30 years tab
src/app/places/[slug]/(tabs)/future/page.tsx    # Future tab
src/app/places/[slug]/(tabs)/health/page.tsx    # Health tab (glacier-only)
src/app/places/[slug]/(tabs)/climbing/page.tsx  # Climbing window (peak-only)
src/app/places/[slug]/(tabs)/flow/page.tsx      # River flow (river point only)
src/app/places/[slug]/(tabs)/aq/page.tsx        # Air quality (city-only)
```

Class-specific tabs are routed conditionally based on `places.class`. Pages query Postgres via Drizzle, render charts via Plot (SSR), and ship plain HTML + SVG to the client.

---

## 9. Performance budget

| Metric | Budget |
|---|---|
| Largest Contentful Paint | < 2.0s on simulated 3G |
| Time to Interactive | < 3.0s |
| Total page weight (engaged) | < 200 KB |
| Chart render (SSR) | < 200ms |
| Map first frame | < 1.0s |
| API route (Postgres-backed) | p95 < 300ms |
| Lighthouse | > 90 across all metrics |

**Mobile-first is enforced.** Every chart works at 375px wide. Every interaction is touch-first.

---

## 10. Trust mechanisms — technical implementation

The product principles in PRODUCT.md §3 (`source-attributed`, `honest about uncertainty`) are implemented as concrete UI components:

| Component | Where it lives | What it does |
|---|---|---|
| `<SourceAttributionPill>` | `src/components/trust/SourceAttributionPill.tsx` | Clickable pill on every chart and number → opens modal with dataset name, version, license, citation, methodology link |
| `<UncertaintyBand>` | `src/components/charts/UncertaintyBand.tsx` | Renders confidence interval as shaded region; never absent on projections |
| `<ResolutionDisclaimer>` | `src/components/trust/ResolutionDisclaimer.tsx` | Auto-shown when displaying gridded data at scales finer than the data resolution ("9km grid — interpret with care at village level") |
| `<MethodologyPage>` route | `/methodology/<dataset_slug>` | One page per dataset explaining what it is and what it cannot answer |
| `<ChangeLog>` route | `/changelog` | Open changelog of methodology changes, dated and version-stamped |
| `<CitationBlock>` | `src/components/trust/CitationBlock.tsx` | Auto-generated Wikipedia `<ref>` snippet on every page |
| `<ScreenshotBundle>` | `src/components/trust/ScreenshotBundle.tsx` | One-click "download for citation" — image + caption + sources + DOIs |

---

## 11. Security & access

- **Read-only public.** No user accounts in v1. No login required for any reading.
- **Climate Witness submissions** (future): if added, will use a dedicated workflow with auth + moderation.
- **Database credentials** never in client bundles. Only server components read from Postgres.
- **No third-party scripts** beyond Vercel analytics (privacy-respecting). No tracking pixels.
- **Environment variables**: `DATABASE_URL`, `HIMAWARI_STORE_ID`, `BLOB_READ_WRITE_TOKEN`, source-API tokens (e.g., Copernicus CDS API key) live in Vercel env + GitHub Actions secrets. Rotated on schedule.

---

## 12. Failure modes and fallbacks

| Failure | Fallback |
|---|---|
| Postgres unreachable | Static last-known-good snapshot served from `/public/snapshot.json` (regenerated nightly) |
| Vercel Blob unreachable | Browser-cached tiles + degraded "no live cloud overlay" state |
| Open-Meteo rate-limited | Falls back to cached forecast from Postgres (last hourly snapshot) |
| ICIMOD source URL changes | Ingestion fails loudly; previous data preserved; manual investigation |
| GitHub Actions fail consecutively | Notification fires; pipeline marked "broken" in source attribution UI; user sees "data ingestion paused — last update X hours ago" |

Honest staleness > silent fallback. The user always knows when data is degraded.

---

## 13. Why this isn't ICIMOD's portal

ICIMOD's RDS portal hosts the data; it doesn't render it. We render it. The technical positioning is "the modern frontend for ICIMOD + NASA + ESA + WGMS Himalayan datasets" — a specialised consumer of authoritative sources, with a single unified database, a single unified UI, and per-place narrative depth.

We do not duplicate ICIMOD's role as the data publisher. We do not claim authority over the underlying science. We make it accessible.

---

## 14. Cost envelope (free-tier-friendly)

| Service | Tier | Limit | Notes |
|---|---|---|---|
| Vercel | Hobby | 100 GB bandwidth, 6000 build minutes | Sufficient until ~50K MAU |
| Neon Postgres | Free | 0.5 GB storage, 100 hours compute | Sufficient for top 50 places × 30 years × ~10 variables |
| Vercel Blob | Hobby | 1 GB storage included | Tile rolling window keeps under |
| GitHub Actions | Free (public repo) | unlimited minutes | Effectively no limit |
| Cloudflare R2 | Free tier | 10 GB storage, 1M ops/month | Optional for cold archive |
| Open-Meteo | Free | 10K req/day, 5K/hour | Server-side cached aggressively |
| Copernicus CDS (ERA5) | Free | Personal-use rate cap | Monthly batch ingestion stays well under |
| NASA Earthdata | Free with login | None | All NASA data |
| ICIMOD RDS | Free CC BY | None | Direct download |

If we exceed any tier, the project pays its way at low single digits per month (Vercel Pro at $20/mo unlocks meaningfully more). No tier change is needed for the first year of operation as planned.

---

## 15. What this document deliberately does NOT do

- Specify per-component CSS — that's DESIGN.md
- Describe each dataset in detail — that's DATA.md
- Define the build sequence — that's BUILD_PLAN.md
- Enumerate features — that's PRODUCT.md
- Define commit / branch / CI conventions — that's CONTRIBUTING.md

This document defines how the system fits together. The sibling docs handle the rest.
