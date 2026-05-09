# Data — Sources, Ingestion, Validation, Provenance

Operational source-of-truth for everything in `obs.*`, `cryo.*`, `proj.*`, `events.*`, and `photos.*` schemas. What we ingest, how often, where it comes from, what license, what validates it, and what breaks if it disappears.

If this conflicts with PRODUCT.md §6, PRODUCT.md wins on the *what*; this file wins on the *how*.

---

## 1. Data principles

These are mandatory. PR review checks each.

1. **Ingested, never live-fetched.** Every dataset lands in our database via a scraper. The frontend reads our database, never a third-party API at request time. (Exception: per-user real-time forecast lookups via Open-Meteo, capped and cached.)
2. **Version-pinned with provenance.** Each row carries `source_dataset_id`, `source_version`, `ingested_at`, `license`, and `citation`. We can reproduce any chart from raw archives.
3. **Validated before serve.** Every ingestion run validates schema, checks expected ranges, compares to last successful run, and refuses to overwrite if validation fails.
4. **License-respected.** Every dataset has a license field in `datasets`. Display attribution per source's terms. Remove anything we cannot license cleanly.
5. **Long-term durable.** Source URLs change, APIs deprecate, governments rotate keys. Our copy of the data does not. Cold archive copies of source data live in object storage under `archive/<dataset_slug>/<version>/`.

---

## 2. Source classes — the inventory

13 classes, ordered by build sequence (see BUILD_PLAN.md).

### A. ICIMOD Regional Data Service — the foundation

**1,206 datasets cataloged** in `output/icimod-rds-all.json` and `output/icimod-rds-ranked.csv` (879 spatially overlap Nepal). The catalog was scraped via `scripts/scrape-icimod-rds.mjs`.

**License posture:** majority CC BY 4.0 — usable with attribution. A handful are non-commercial. Per-dataset licenses live in `datasets.license`.

**The 12 anchoring ICIMOD datasets:**

| # | Dataset (slug) | Coverage | Update | License | Why it's gold |
|---|---|---|---|---|---|
| 1 | `icimod-rikha-samba-mb` — Glacier mass balance, Hidden Valley / Mustang | 2011–present, annual | When ICIMOD publishes | CC BY 4.0 | Decade of direct in-situ measurement |
| 2 | `icimod-yala-mb` — Glacier mass balance, Langtang | 2011–present, biannual | When published | CC BY 4.0 | Seasonal-split mass balance |
| 3 | `icimod-decadal-glacier-changes-1990-2020` | 1990, 2000, 2010, 2020 snapshots | One-off | CC BY 4.0 | Time-lapse base for Glacier Atlas |
| 4 | `icimod-glaciers-nepal-1980` | 1980 baseline | Static | CC BY 4.0 | The "before" picture |
| 5 | `icimod-status-glaciers-hkh` | 2018 snapshot | Static | CC BY 4.0 | Pan-region inventory, citation-friendly |
| 6 | `icimod-glacial-lakes-koshi-gandaki-karnali` + 3 sister inventories | Multi-year, multi-basin | Periodic | CC BY 4.0 | GLOF Watch List foundation |
| 7 | `icimod-hydrosar-hydro30` — Surface water extent | Daily, 30m, 2022– | Daily | CC BY 4.0 with attribution | Monsoon-season flood mapping |
| 8 | `icimod-hycos-aws-network` — Humla, Baitadi, Jumla, Chainpur, Dhankuta, Okhaldhunga, Korilla (Bhutan) | Hourly, multi-year | Real-time-ish | Mixed CC | Ground-truth point validation |
| 9 | `icimod-yala-micromet-1/2/3` + `pluviometer-langshisha` + `pluviometer-morimoto` | Hourly, multi-year | Real-time-ish | CC BY 4.0 | Finest-grained alpine micrometeorology in Nepal |
| 10 | `icimod-gorkha-2015-landslide-hazard` (8 sister datasets, 30m) | Static, 2015 event | One-off | CC BY 4.0 | Anchors Historical Event Archive |
| 11 | `icimod-cmip6-south-asia` | 2015–2100 | When updated | Non-commercial (varies by model) | Saves months of GRIB / NetCDF wrangling |
| 12 | `icimod-hi-sphy-mid-century-4.5` — Hydrology projections | Static | One-off | CC BY 4.0 | Rare downscaled HKH-specific hydrology |

**Access pattern:** ICIMOD RDS datasets have stable landing pages (`https://rds.icimod.org/Home/DataDetail?metadataId=NNNN`) with downloadable assets. Our scraper reads metadata + downloads the asset, computes a content hash, and only re-runs the load if the hash changed.

### B. Long-term reanalysis — climate baseline backbone

| Dataset (slug) | Variables | Resolution | Coverage | Cadence | Access | License |
|---|---|---|---|---|---|---|
| `era5-land` | t2m, tp, sf, sd, swh, geopotential, fl | 0.1° (~9km) | 1950–present, hourly | Monthly batch | Copernicus CDS API (free, registration) | Copernicus license |
| `era5` | All ERA5-Land + ocean + upper-air | 0.25° | 1940–present, hourly | Monthly batch | Copernicus CDS API | Copernicus license |
| `chirps-v2` | Daily precipitation, gauge-blended | 0.05° (~5km) | 1981–present | Daily | THREDDS / Google Earth Engine | CC BY 3.0 |
| `terraclimate` | Temp, precip, water balance, monthly | ~4km | 1958–present, monthly | Monthly | Direct NetCDF / GEE | Open |
| `cru-ts-v4` | T, precip, vapor pressure | 0.5° | 1901–present, monthly | Annual | UEA CRU portal | Open |
| `merra2` | T, precip, wind, aerosol, hourly | 0.5° × 0.625° | 1980–present | Monthly | NASA GES DISC | Free |
| `jra-3q` | All-variable Japanese reanalysis | 40km | 1947–present, 6-hourly | When released | JMA portal | Free with login |
| `aphrodite` | Asian gauge-only precipitation | 0.25° | 1951–2015, daily | One-off | DIAS Japan | Free |

**Why ERA5 + CHIRPS as the core:** ERA5 underestimates orographic precipitation in the Himalaya by 30–50% (Khadka et al. 2022). CHIRPS is gauge-blended and corrects this. We use ERA5 for temperature / wind / radiation / freezing level; CHIRPS for precipitation. State this honestly in source attribution.

### C. Real-time satellite

| Dataset (slug) | What | Resolution | Cadence | Access | License |
|---|---|---|---|---|---|
| `himawari-9-b13` (existing) | Thermal IR cloud | ~2km | 10 min | AWS Open Data, no auth | Free |
| `himawari-9-rgb` (planned) | True-colour day cloud | ~0.5–2km | 10 min | AWS Open Data | Free |
| `gpm-imerg` | Precipitation | ~10km | 30 min, NRT | NASA GES DISC | Free |
| `sentinel-1` | All-weather radar | 5–20m | ~6 day | Copernicus / AWS | Open |
| `sentinel-2` | Optical | 10–60m | ~5 day | Copernicus / AWS | Open |
| `sentinel-5p-tropomi` | NO₂ / SO₂ / CO / O₃ / aerosol | 7×3.5km | Daily | Copernicus / GEE | Open |
| `firms-viirs` | Active fires | 375m | Sub-hourly | NASA FIRMS API | Free |
| `firms-modis` | Active fires | 1km | Sub-hourly | NASA FIRMS API | Free |
| `mod10a1` | MODIS Terra Snow Cover | 500m | Daily | NASA NSIDC | Free |
| `myd10a1` | MODIS Aqua Snow Cover | 500m | Daily | NASA NSIDC | Free |
| `mod11a1` | MODIS LST | 1km | Daily | NASA LP DAAC | Free |
| `mod13q1` | MODIS NDVI/EVI | 250m | 16-day | NASA LP DAAC | Free |

### D. Climate projections

| Dataset (slug) | Variables | Resolution | Coverage | Access | License |
|---|---|---|---|---|---|
| `nex-gddp-cmip6` | T, precip, daily, bias-corrected | ~25km | 1950–2100 | NASA NEX, AWS Open Data | Free |
| `cmip6-raw` | All CMIP6 variables | ~100km, varies | 2015–2100 | Pangeo / ESGF | Free |
| `cordex-core-sa` | Dynamically downscaled | ~25km | 1950–2100 | ESGF, IITM Pune | Free |
| `worldclim-future` | Bioclimatic | ~1km | 2021–2100, monthly | WorldClim portal | Free |
| `ipcc-ar6-atlas` | Regional summaries | Coarse | Aggregated | IPCC Atlas | Free |
| `icimod-cmip6-south-asia` | Regional CMIP6 | Regional | 2015–2100 | ICIMOD RDS | Non-commercial varies by model |

**Pragmatic stack:** start with `icimod-cmip6-south-asia` (pre-processed) + `nex-gddp-cmip6` (NASA's bias-corrected daily downscaled). Always show 3 scenarios (SSP1-2.6 / 2-4.5 / 5-8.5) with model spread (p10 / p90 across models). Never a single line.

### E. Cryosphere — beyond ICIMOD

| Dataset (slug) | What | Coverage | Access | License |
|---|---|---|---|---|
| `hugonnet-2021` | Glacier elevation change | 2000–2019, global | Theia / direct | CC BY 4.0 |
| `brun-2017-hma` | HMA glacier mass balance | 2000–2016 | Direct download | CC BY 4.0 |
| `farinotti-2019-thickness` | Global ice thickness | Static | WGMS | CC BY 4.0 |
| `rgi-v7` | Glacier outlines | Static | NSIDC | CC BY 4.0 |
| `glims` | Multi-snapshot outlines | Multi-decade | NSIDC | CC BY 4.0 |
| `wgms-mb-bulletin` | Direct mass balance | 50+ years | WGMS portal | Free with attribution |
| `avhrr-snow-pp` | Polar Pathfinder snow | 1981–present | NSIDC | Free |
| `nasa-hma-snow-reanalysis` | Daily SWE, 90m | 1985–present | NASA | Free |
| `amsr2-swe` | Microwave SWE | Daily | JAXA G-Portal | Free |
| `grace-grace-fo` | Total water mass change | 2002–present, monthly | NASA / GFZ | Free |

**Killer dataset for snow line:** `nasa-hma-snow-reanalysis` is daily SWE at 90m back to 1985 — the highest-resolution long-record snow product for the region.

### F. Hydrology

| Dataset (slug) | What | Access | License |
|---|---|---|---|
| `gldas` | Land data assimilation | NASA GES DISC | Free |
| `glofas` | Global flood awareness | Copernicus | Free |
| `pekel-jrc-gsw` | Global Surface Water | EC JRC, GEE | Open |
| `hydrosheds` | River network, watersheds | WWF | CC BY |
| `hydrolakes` | Global lake inventory | WWF | CC BY |
| `nepal-dhm-stations` | Real-time + historical river levels | DHM portal (scrape) | Government data, attribution |

### G. Air quality

| Dataset (slug) | What | Access | License |
|---|---|---|---|
| `tropomi-no2` | Tropospheric NO₂ | Copernicus, GEE | Open |
| `tropomi-aerosol` | Aerosol index, AOD | Copernicus, GEE | Open |
| `modis-aod` | Aerosol optical depth | NASA LAADS | Free |
| `firms-fires` (already in C) | Active fires | NASA FIRMS API | Free |
| `openaq-stations` | Ground-station PM2.5 | OpenAQ API | CC BY 4.0 |
| `cams-forecasts` | Aerosol + ozone forecasts | Copernicus ADS | Open |
| `nepal-doe-aqi` | National AQI authority | Manual scrape | Government data |

### H. Topography

| Dataset (slug) | What | Resolution | Access |
|---|---|---|---|
| `fabdem` (existing) | Bare-earth DEM | 30m | Open data |
| `glo-30` (existing) | Copernicus DEM | 30m | Free |
| `nasadem` | Improved SRTM | 30m | NASA |
| `aw3d30` | ALOS World 3D | 30m | JAXA |
| `aster-gdem-v3` | ASTER global DEM | 30m | NASA |

### I. Vegetation / land cover

| Dataset (slug) | What | Access |
|---|---|---|
| `mod13q1` (in C) | MODIS NDVI/EVI | NASA |
| `esa-worldcover` | 10m global land cover | Open |
| `esa-cci-lc` | 300m, 1992–present | Open |
| `hansen-gfc` | Global Forest Change | Direct |

### J. Disasters / hazards

| Dataset (slug) | What | Access |
|---|---|---|
| `usgs-eq-catalog` | Earthquakes | API |
| `emsc-events` | Cross-validation | API |
| `gdacs-alerts` | Global disaster alerts | RSS / API |
| `em-dat` | Disaster losses 1900+ | Free with registration |

### K. Photo archives

Onboarded via dedicated scrapers + human curation (per the user's directive). Each photo gets a manifest entry with provenance, capture time, license, and source.

| Source | Strategy |
|---|---|
| `nasa-worldview-gibs` | API for satellite snapshots from 2000+ |
| `usgs-earthexplorer` | Login + scraper for Landsat 1972+ |
| `esa-heritage` | Login + scraper for early satellite |
| `royal-geographical-society` | Manual curation, paid licensing for hero photos |
| `mountain-heritage-trust` | Direct request, free with attribution |
| `alpine-club-london` | Direct request |
| `university-theses` | Open access |
| `public-domain-expedition-photos` | Wikimedia Commons + national archives |

### L. Population / exposure

| Dataset (slug) | What | Access |
|---|---|---|
| `worldpop-100m` | Population grid | Portal |
| `ghs-pop` | Global Human Settlement | EC JRC |
| `hot-osm-buildings` | Building footprints | HOT export |
| `osm-overpass` | Trails, lodges, roads | API |
| `nepal-cbs-census` | Demographics | CBS Nepal |

### M. Tibet / China-side data

| Dataset (slug) | What | Access |
|---|---|---|
| `tpdc-third-pole-env-db` | Tibetan plateau climate, glaciers | Beijing portal |
| `nasa-hma-family` | Region-wide products (snow, glacier, climate) | NASA |
| `jaxa-amsr2` | Microwave SWE | JAXA |
| `cma-reanalysis` | Where accessible | CMA portal |

---

## 3. Per-dataset ingestion specs

Every dataset has a `manifest.json` at `scripts/ingestion/<slug>/manifest.json` with this minimum structure:

```json
{
  "slug": "era5-land",
  "name": "ERA5-Land",
  "publisher": "Copernicus / ECMWF",
  "license": "Copernicus license",
  "license_url": "https://...",
  "citation": "Hersbach et al. 2023, ERA5 monthly averaged data on single levels from 1940 to present, Copernicus Climate Change Service (C3S) Climate Data Store (CDS), DOI: 10.24381/cds.f17050d7",
  "doi": "10.24381/cds.f17050d7",
  "source_url": "https://cds.climate.copernicus.eu/...",
  "download_pattern": "...",
  "spatial_resolution": "0.1 degree (~9km)",
  "temporal_resolution": "hourly",
  "temporal_coverage": "1950-present",
  "variables": ["t2m", "tp", "sf", "sd", "geopotential_height_500hPa", "freezing_level"],
  "bbox": [60, 15, 105, 40],
  "ingestion_cadence": "monthly",
  "validation_rules": [
    { "rule": "schema_match", "expected_columns": ["..."] },
    { "rule": "value_range", "variable": "t2m", "min": -60, "max": 60, "unit": "C" }
  ],
  "load_pattern": "upsert",
  "load_target": "obs_weather_daily",
  "primary_key": ["time", "place_id", "variable", "source_id"]
}
```

The manifest is the contract between the ingestion pipeline and the application. Changing it requires bumping `source_version` and re-running validation against historical data.

---

## 4. Validation strategy

Each ingestion's `validate.py` runs four checks. Any failure short-circuits the workflow and preserves the last good copy.

| Check | What it does |
|---|---|
| **Schema diff** | Compare current columns / types to manifest. Fail on drift. |
| **Range bounds** | Per-variable min/max from manifest. Fail on values outside (e.g., t2m outside [-60, +60] C). |
| **Diff vs last** | Compare value distribution to last successful run. Fail if > 50% of values changed unexpectedly (catches source corruption). |
| **Freshness** | If source advertises a publication date, fail if our pull predates the advertised "should be available by". |

Output: `validation_report.json` artifact uploaded by every workflow run.

---

## 5. Caching strategy

| Cache layer | TTL | Purpose |
|---|---|---|
| Postgres materialised views | refreshed on ingestion cron | Heavy aggregates (Now vs Normal, monthly climatology) |
| Vercel ISR | 10 min — 24 h depending on route | Page-level cache |
| Vercel Edge cache | varies | Geographic edge |
| Browser cache (HTTP) | 1 h charts, 24 h static | Re-visit performance |
| Service worker (future) | 1 day | Offline last-good place page |

**Cache invalidation**: ingestion runs that successfully load new data trigger an ISR purge for affected routes (via Vercel API). Materialised views are refreshed within the same workflow.

---

## 6. Failure modes per source

| Source | Common failure | Fallback |
|---|---|---|
| **ICIMOD RDS** | Page redirect / metadata schema change | Validation fails, last good preserved, manifest updated manually |
| **Copernicus CDS (ERA5)** | API maintenance windows | Workflow retries with backoff; if persistent, monthly schedule absorbs delay |
| **NASA Earthdata** | Auth token expiry | Rotate token; re-run |
| **Open-Meteo** | Rate limit | Falls back to cached forecast in Postgres (last hourly snapshot) |
| **Vercel Blob** | Quota exceeded | Workflow fails loudly; archive cleanup script to free space |
| **Himawari S3** | Bucket reorganisation (rare) | Manifest updated, scraper adapts |
| **OpenAQ** | Station goes offline | Visible in source attribution UI ("station offline since X") |

**Honest staleness > silent fallback**: the user always sees when data is degraded. This is part of the trust mechanism.

---

## 7. Storage cost projections

Rough estimates for the first year:

| Data class | Estimated size |
|---|---|
| ERA5 daily aggregates, 100 places, 30 years, 10 vars | ~10 MB (compact in Postgres after aggregation) |
| ERA5 raw archive (cold) | ~50 GB across HKH crop, 1991–present |
| CHIRPS daily, 100 places, 30 years | ~5 MB aggregated; ~20 GB raw cold |
| CMIP6 NEX-GDDP summaries | ~20 MB summaries; ~100 GB raw cold |
| MODIS Snow tiles | ~1 GB hot (rolling 30 days) |
| Himawari tiles | ~100 MB hot (rolling 24 h) |
| Glacier outlines (PostGIS) | ~50 MB |
| Glacial lakes | ~5 MB |
| Photos archive | ~500 MB (curated photos in Blob) |
| Total Postgres hot | ~500 MB year 1 (within Neon free tier of 0.5 GB — we'll cross over by end of year 1, plan migration) |
| Total Vercel Blob warm | ~5 GB year 1 |
| Total cold object storage | ~200 GB year 1 (R2 free tier covers 10 GB; pay ~$3/month for the rest) |

Crossing Neon's free tier triggers a migration plan: either upgrade to paid Neon (~$19/mo for 10 GB) or migrate to Vercel Postgres / Supabase. The schema is portable; migration is a script.

---

## 8. License compliance & attribution display

Every data display surface — chart, number, map layer — must carry attribution per source's terms. The `<SourceAttributionPill>` component (described in ARCHITECTURE.md §10) is the implementation.

Per source:

| License class | Display requirement |
|---|---|
| **CC BY 4.0** | "Source: <Publisher>, <Dataset>, <Year>." Click → modal with full citation + DOI + license link |
| **Open / public domain** | "Source: <Publisher>, <Dataset>." |
| **Copernicus license** | Full Copernicus attribution per their template |
| **Non-commercial** | Clearly labelled; product is non-commercial; include the restriction in citation modal |
| **Government data** | Per government terms (usually attribution + no claim of endorsement) |

The `MethodologyPage` route (`/methodology/<dataset_slug>`) is a per-dataset citation page — the canonical citation home for journalists / Wikipedia editors.

---

## 9. What this document deliberately does NOT do

- Specify per-table SQL — that's PRODUCT.md §11
- Define the build sequence — that's BUILD_PLAN.md
- Describe component-level UI — that's DESIGN.md
- Enumerate features — that's PRODUCT.md
- Define commit / branch / CI conventions — that's CONTRIBUTING.md
