# Himalayan Atlas — Product Spec

**Status:** v2.0 — pivoted to climate-frontend positioning
**Last updated:** 2026-05-09
**Name:** Himalayan Atlas (locked)

---

## 0. Locking sentence

> Himalayan Atlas is the **modern frontend for Himalayan weather and climate data** — past, present, and future. Built place by place, sourced from every authoritative dataset that reaches the region, and honest about what the data can and cannot say.

The product is for two concentric audiences served by one surface: **trekkers and mountaineers** who need climate-aware decision support, and **climate-curious visitors** — researchers, journalists, students, NGO staff, climate-aware travelers — who need a beautiful, honest, citable interface to Himalayan climate at the place level.

This is the canonical climate atlas for the Hindu Kush Himalaya. ICIMOD has the data; we have the frontend.

---

## 1. The four-tab mental model

Every place in the product — every glacier, peak, lake, river segment, trekking destination, city — has the same four tabs in the same order:

| Tab | Question it answers | Latency expectation |
|---|---|---|
| **Now** | What's happening here right now? | Updates within an hour of source |
| **Now vs Normal** | How does this compare to the 30-year baseline? | Updated daily |
| **Last 30 years** | How has this place changed? | Updated monthly |
| **Future** | What is this place projected to look like? | Updated when projections refresh |

Some place classes get a fifth tab (glacier health for glaciers, basin flow for rivers, lake status for lakes). The four-tab spine is universal.

This is the spine of the product. Every feature lives inside one of these tabs or links across them.

---

## 2. Geographic scope — geography first, in favor of truth and narrative

**Climate is a regional system. The product follows the system, not political borders.**

| Tier | Coverage | Why |
|---|---|---|
| **Core** | Nepal | Origin focus, deepest data density, local audience |
| **Regional** | Hindu Kush Himalaya — Pakistan, India, Bhutan, Tibet/China, Nepal | Climate cannot be understood Nepal-only |
| **System** | Himalayan glaciers (Karakoram, Hindu Kush, Pamir, HKH proper) and the river systems originating from them — Indus, Ganges, Brahmaputra, Yangtze, Yellow, Mekong, Salween, Irrawaddy | The "Third Pole / Asian Water Tower" frame is the largest natural system the product touches |

Tibet / China-side data engagement is **explicit**: TPDC, Chinese Meteorological Administration, JAXA AMSR-2 (Japanese microwave snow), and HMA (NASA High Mountain Asia) datasets are first-class. North-face glaciers — Everest, Cho Oyu, Kangchenjunga — and the Tibetan plateau headwaters belong in the atlas. We do not let political maps dictate climate maps.

**Truth-and-narrative principle:** when a topic spans borders, the product covers the topic. Geography first.

---

## 3. The product principles

These are non-negotiable. Every PR is reviewed against them.

1. **Place-first, not data-first.** Users meet datasets through places, never through dataset names. "Tell me about Khumbu" beats "view ERA5 data."
2. **Source-attributed everywhere.** Every chart, number, and map layer carries dataset name, version, license, and citation. No exceptions.
3. **Honest about uncertainty.** Confidence bands on every projection. Plain-language disclaimers ("9km grid resolution — interpret with care at village level"). Uncertainty is a UI element, not a footnote.
4. **Narrative-bound.** Charts live inside place stories, not free-floating dashboards. The Himalaya doesn't make sense as numbers — it makes sense as places that are changing.
5. **Mobile-first.** Trekkers carry phones, not laptops. Every chart works at 375px wide.
6. **Ingested, never hot-fetched.** All data lands in our database via scrapers. We don't depend on third-party uptime at request time. Long-term durability is paramount.
7. **No false precision.** Resolution honesty, model spread visualization, and "this dataset cannot answer that question" labels.
8. **Code minimalism.** No unnecessary code. Simple, clean, beautiful. Refactor toward fewer lines, not more.
9. **Speed.** Every chart loads in under 2s on 3G. Animations are 60fps or absent.

---

## 4. Audience — concentric, not segmented

```
┌──────────────────────────────────────────────────┐
│  Trekkers / mountaineers                          │  ← practical climate-aware decisions
│  ┌────────────────────────────────────────────┐  │
│  │  Climate-aware travelers + Nepali public   │  │  ← context & local-news angle
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  Journalists + educators + students  │  │  │  ← need quotable, citable, embeddable
│  │  │  ┌────────────────────────────────┐  │  │  │
│  │  │  │  Researchers / NGO / scientific│  │  │  │  ← need provenance + downloads (later)
│  │  │  │  community                     │  │  │  │
│  │  │  └────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

The wedge is the **inner ring** (trekkers and mountaineers). Climate context makes their decisions more profound. The outer rings get value automatically because the product is honest, sourced, and beautifully presented — they don't need a separate product surface.

---

## 5. The catalogue — what's in the atlas

### 5.1 Place inventory

The atlas is built place by place. Each place gets the same template, populated according to its class.

#### Tier 1 places (ship in first build)

| Class | Places | Count |
|---|---|---|
| **Trekking destinations** (existing) | EBC, ABC, Poon Hill, Pokhara, Kathmandu, Jomsom (Mustang), Chitwan, Lukla | 8 |
| **Hero glaciers** | Khumbu, Annapurna South, Langtang (Yala), Imja, Rikha Samba, Ngozumpa, Yala, Khumbu Icefall | 8 |
| **Iconic peaks** | Everest, Annapurna I, Kanchenjunga, Manaslu, Dhaulagiri, Cho Oyu, Makalu, Lhotse | 8 |
| **Sacred + signal lakes** | Tilicho, Phewa, Imja Tsho, Tsho Rolpa, Rara | 5 |
| **River signal points** | Koshi @ Chatara, Karnali @ Chisapani, Gandaki @ Devghat | 3 |
| **Cities (climate signal)** | Kathmandu, Pokhara | 2 |
| **TOTAL TIER 1** | | **34** |

#### Tier 2 places (planned expansion — HKH-wide)

| Class | Examples | Estimated count |
|---|---|---|
| **Pakistan / Karakoram glaciers** | Baltoro, Hispar, Biafo, Siachen, Batura, Passu | 8–10 |
| **India / Indian Himalaya glaciers** | Gangotri, Pindari, Milam, Bara Shigri, Zemu | 6–8 |
| **Tibet / north-face glaciers** | Rongbuk (north Everest), Kangshung, Kharta | 4–6 |
| **Bhutan glaciers** | Lunana, Thorthormi | 2–4 |
| **Major rivers (full reach)** | Indus, Ganges, Brahmaputra, Mekong, Salween, Yangtze, Yellow, Irrawaddy with multiple sample points | 8 rivers × 3–5 points each |
| **Iconic non-Nepal peaks** | K2, Nanga Parbat, Nanda Devi, Kangchenjunga (Sikkim side) | 6–8 |

#### Tier 3 (open extension)

The schema accommodates arbitrary places. Adding a new place is a database insert plus a polygon, never a code change.

### 5.2 What every place page contains

Below the four-tab spine, the data shown adapts to the place class:

| Place class | Specific tabs / content |
|---|---|
| **Trekking destination** | Now / Normal / Trend / Future + "Trek window" sub-card showing % clear days by month, by decade |
| **Glacier** | + **Health** tab: extent over time, mass balance, ice thickness, photo timeline, downstream flow |
| **Peak** | + **Climbing window** tab: jet stream, freezing level, summit-day climatology |
| **Lake** | + **Lake health** tab: surface area over time, level, temperature, GLOF risk if relevant |
| **River point** | + **Flow** tab: discharge, snowmelt contribution, seasonal pattern, climate-projected change |
| **City** | + **Air quality** tab: PM2.5, NO₂, smoke source attribution, transboundary contribution |

### 5.3 Feature pillars

The atlas is built from five overlapping pillars. Every concrete feature lives inside one.

| # | Pillar | What it is | Audience served |
|---|---|---|---|
| **1** | **Place pages** | The 4-tab template populated for ~34 Tier-1 places | All audiences |
| **2** | **Cross-cutting visualizations** | Standalone analytical views that span places (Climate Time Machine, Trek Window Shift, In Your Lifetime, Glacier Atlas, Vanishing Photo Archive, Monsoon Tracker, Anomaly Map, Snow Line Tracker) | Climate-curious; viral artifacts |
| **3** | **Real-time + anomaly layer** | Now Map + active events panel + air quality + live monsoon module | Trekkers; local-news angle |
| **4** | **Research & journalism utility** | Source attribution UI, permanent URLs, embed code, print-ready exports, methodology pages, open changelog | Outer audience rings |
| **5** | **Storytelling** | Featured story, Historical Event Archive, Climate Witness program, glaciologist diaries | All audiences (the glue) |

### 5.4 Concrete feature list (ranked by leverage)

Following the Codex/Gemini council synthesis, ranked by "what makes the product canonical / shared / cited" first:

#### Tier A — ship first (these define the product)

| # | Feature | Pillar | What it does |
|---|---|---|---|
| 1 | **Now vs Normal context on every existing destination card** | 3 | Today's conditions overlaid with "12% above 30-year May average" — climate becomes a tool, not a feature |
| 2 | **Place-based Climate Time Machine** | 2 | Pick place + month → 30-year climatology + current overlay + decade slider, with confidence bands |
| 3 | **Trek Window Shift Index** | 2 | "% clear days for EBC October trek window has shifted from 78% (1990s) to 61% (2020s)" — the journalist-bait chart |
| 4 | **In Your Lifetime** | 2 | Birth year → personalized Nepal climate change story — the WhatsApp/Facebook viral artifact |
| 5 | **Glacier health page template** | 1 | Khumbu first — extent over time, mass balance, ice thickness, paired photo timeline |

#### Tier B — ship second (depth + virality)

| # | Feature | Pillar | What it does |
|---|---|---|---|
| 6 | **Vanishing Photo Archive** | 2 | 5–8 paired sliders (Khumbu 1953 vs today, etc.) — the Reddit/Facebook viral artifact |
| 7 | **Monsoon Tracker** | 3 | Onset / withdrawal / cumulative this year vs normal vs decade trend — local-news angle for 30M Nepalis |
| 8 | **Historical Event Archive** | 5 | 2014 Annapurna blizzard, 2015 quake aftermath weather, 2021 Melamchi flood, etc. — every entry tied to weather data + photos + impact |
| 9 | **Snow Line Tracker** | 3 | Real-time snow line elevation vs climatology — uses HMA Snow Reanalysis pipeline |
| 10 | **Air Quality / "Why is it hazy?" module** | 3 | PM2.5 + NO₂ + smoke source attribution — Kathmandu/Pokhara story |
| 11 | **Embeddable widgets for Tier-A charts only** | 4 | Wikipedia, NYT, journalists — once a chart is undeniable, ship its embed |

#### Tier C — ship third (depth + niches)

| # | Feature | Pillar | What it does |
|---|---|---|---|
| 12 | **River system pages** (Indus, Ganges, Brahmaputra) | 1 | Headwater glaciers, flow seasonality, snowmelt contribution, projected change |
| 13 | **Climate Witness program** | 5 | Activates `field-reported` Evidence tier — verified ground-truth from sherpas, lodge owners, guides paired with quantitative data |
| 14 | **GLOF Watch List (storytelling page, NOT interactive risk map)** | 5 | Curated overview of dangerous glacial lakes — uses ICIMOD's risk register, doesn't claim independent risk modeling |
| 15 | **Climbing window tab for iconic peaks** | 1 | Jet stream + freezing level + summit-day climatology for Everest, K2, Annapurna I — high-prestige niche, mountaineering credibility |
| 16 | **Climate Projections (reframed)** | 1 | Place-level scenario summaries with model spread + uncertainty — never a single SSP line |

#### Killed / banned

| Feature | Reason |
|---|---|
| **Data API for researchers** | Defer to v2 — fantasy + support nightmare; council unanimous |
| **Interactive GLOF Risk Map (with custom modeling)** | Reputational risk; not solo-dev safe; replaced by curated Watch List |
| **AI Climate Q&A interface** | Adds little, creates trust risk |
| **Real-time avalanche risk** | Needs domain partners we don't have |
| **Climate Projections SSP slider as single line** | False precision — must show spread or not show at all |

---

## 6. Data foundation

### 6.1 Data principles

1. **Ingested, not live-fetched.** Every dataset lands in our database via a scraper. The frontend reads our database, never a third-party API at request time. (Exception: per-user real-time forecast lookups via Open-Meteo, capped and cached.)
2. **Version-pinned with provenance.** Each row carries `source_dataset_id`, `source_version`, `ingested_at`, `license`, and `citation`. We can reproduce any chart from raw archives.
3. **Validated before serve.** Every ingestion run validates schema, checks expected ranges, compares to last successful run, and refuses to overwrite if validation fails.
4. **License-respected.** Every dataset has a license field. Display attribution per source's terms. Remove anything we can't license cleanly.
5. **Long-term durable.** Source URLs change, APIs deprecate, governments rotate keys. Our copy of the data does not.

### 6.2 Source classes (data inventory)

#### A. ICIMOD Regional Data Service (RDS) — the foundation

**1,206 datasets cataloged** in `output/icimod-rds-all.json` and `output/icimod-rds-ranked.csv`. 879 spatially overlap Nepal. Most under CC BY 4.0.

The 12 anchoring datasets:

| # | Dataset | License | Why it's gold |
|---|---|---|---|
| 1 | Glacier mass balance — Rikha Samba (2011–2020+) | CC BY 4.0 | Decade of direct in-situ measurement, Hidden Valley / Mustang |
| 2 | Glacier mass balance — Yala (Langtang, 2011–2020+) | CC BY 4.0 | Biannual seasonal-split mass balance |
| 3 | Decadal glacier changes 1990–2020 in HKH | CC BY 4.0 | Ready-made time-lapse base for Glacier Atlas |
| 4 | Glaciers of Nepal 1980 | CC BY 4.0 | The "before" baseline — without 1980, no 45-year story |
| 5 | Status of Glaciers in HKH | CC BY 4.0 | Pan-region inventory, citation-friendly |
| 6 | Glacial Lakes of HKH (multiple inventories) | CC BY 4.0 | GLOF Watch List foundation |
| 7 | HydroSAR Hydro30 Surface Water Extent | CC BY 4.0 | Daily 30m monsoon-season flood mapping |
| 8 | HYCOS AWS network (Humla, Baitadi, Jumla, Chainpur, Dhankuta, Okhaldhunga, Korilla — Bhutan) | Mixed CC | Ground-truth point validation across altitudes |
| 9 | Yala micromet stations 1/2/3 + Pluviometers Langshisha + Morimoto | CC BY 4.0 | Finest-grained alpine micrometeorology in Nepal |
| 10 | 2015 Gorkha Earthquake landslide hazard layers (8 datasets, 30m) | CC BY 4.0 | Anchors Historical Event Archive |
| 11 | CMIP6 datasets for South Asia (2015–2100) | Free for non-commercial | Saves months of GRIB/NetCDF wrangling |
| 12 | HI-SPHY mid-century 4.5 hydrology projections | CC BY 4.0 | Rare downscaled HKH-specific hydrology |

#### B. Long-term reanalysis (the climate baseline backbone)

| Dataset | Coverage | Resolution | Access | Use |
|---|---|---|---|---|
| **ERA5 / ERA5-Land** (ECMWF) | 1940–present, hourly | 0.25° / 0.1° (~9km) | Copernicus CDS API (free, registration) | Backbone for "30-year normal" calculations — temp, precip, wind, snow, freezing level |
| **CHIRPS** (UCSB / USGS) | 1981–present, daily | 0.05° (~5km) | THREDDS / GEE | Best precip product for Asia — gauge-blended, corrects ERA5's orographic underestimation |
| **TerraClimate** | 1958–present, monthly | ~4km | Direct NetCDF / GEE | High-res monthly + water balance |
| **CRU TS v4** | 1901–present, monthly | 0.5° | UEA portal | Longest gridded record for "100-year change" claims |
| **MERRA-2** (NASA) | 1980–present, hourly | 0.5° × 0.625° | NASA GES DISC | Cross-validation; aerosol product |
| **JRA-3Q** (JMA) | 1947–present, 6-hourly | 40km | JMA portal | Authority signal — Japan's reanalysis (resonates with Himawari sourcing) |
| **APHRODITE** | 1951–2015, daily | 0.25° | DIAS Japan | Asian gauge-only precipitation, regional standard |

**The argument for ERA5 + CHIRPS as the core**: ERA5 underestimates orographic precipitation in the Himalaya by 30–50% (Khadka et al. 2022). CHIRPS is gauge-blended and corrects this. Use ERA5 for temp / wind / radiation; CHIRPS for precipitation. State this honestly in attribution.

#### C. Real-time satellite

| Dataset | What | Resolution | Access | Use |
|---|---|---|---|---|
| **Himawari-9 B01–B16** | 16-band, every 10 min | 1–2km | AWS Open Data | Currently using B13 thermal only — extend to RGB, water vapor, day cloud |
| **GPM IMERG** | Precipitation, half-hourly | ~10km | NASA GES DISC, NRT | Real-time monsoon tracking |
| **Sentinel-1 SAR** | All-weather radar, 6-day | 5–20m | Copernicus / AWS | Monsoon-season flood + glacial lake extent |
| **Sentinel-2 MSI** | Optical, 5-day | 10–60m | Copernicus / AWS | Glacier monitoring, snow line, treeline |
| **Sentinel-5P TROPOMI** | NO₂ / SO₂ / CO / O₃ / aerosol | 7×3.5km | Copernicus / GEE | Air quality stories |
| **VIIRS / MODIS Active Fires (FIRMS)** | Real-time fires, <3h latency | 375m / 1km | NASA FIRMS API | Spring fire smoke is THE Nepal AQ story |
| **MODIS Snow Cover (MOD10A1, MYD10A1)** | Daily snow cover | 500m | NASA NSIDC | Snow line tracking |
| **MODIS LST (MOD11A1)** | Land surface temp, daily | 1km | NASA LP DAAC | Independent surface-temp anomaly |
| **MODIS NDVI/EVI (MOD13)** | Vegetation indices, 16-day | 250m | NASA LP DAAC | Treeline shifts, monsoon vegetation timing |

#### D. Climate projections

| Dataset | Coverage | Resolution | Access | Use |
|---|---|---|---|---|
| **NEX-GDDP-CMIP6** | 1950–2100, daily | ~25km | NASA NEX, AWS Open Data | **Starting point** — bias-corrected statistical downscaling, ready to use |
| **CMIP6 (raw)** | 2015–2100, multi-model | Variable, ~100km | Pangeo / ESGF | Source-of-truth where downscaling isn't available |
| **CORDEX-CORE / SA** | 1950–2100, daily | ~25km | ESGF, IITM Pune | Dynamically downscaled for South Asia |
| **WorldClim Future** | 2021–2100, monthly | ~1km | WorldClim portal | Bioclimatic — useful for treeline / vegetation projections |
| **IPCC AR6 Atlas** | Aggregated CMIP6 | Coarse | IPCC Atlas | Pre-computed regional summaries — directly quotable |
| **ICIMOD CMIP6 South Asia** (catalogued) | 2015–2100 | Regional | ICIMOD RDS | Pre-processed regional outputs |

**Pragmatic stack**: ICIMOD CMIP6 South Asia + NEX-GDDP-CMIP6 daily downscaled. Always show 3 scenarios (SSP1-2.6 / 2-4.5 / 5-8.5) with model spread. Never a single line.

#### E. Cryosphere — beyond ICIMOD

| Dataset | Access | Use |
|---|---|---|
| **Hugonnet et al. 2021** (Nature) | Theia / direct | Most-cited dataset for global glacier elevation change 2000–2019 |
| **Brun et al. 2017** | Direct | HMA glacier mass balance 2000–2016 |
| **Farinotti et al. 2019** | WGMS | Global ice thickness — needed for "% of Khumbu remaining" |
| **Randolph Glacier Inventory v7** | NSIDC | Canonical glacier outlines |
| **GLIMS** | NSIDC | Multi-snapshot outlines over decades |
| **WGMS Mass Balance Bulletin** | WGMS portal | Direct mass balance, 50+ years — Yala + Rikha Samba feed into this |
| **AVHRR Polar Pathfinder snow** | NSIDC | Longer history than MODIS (1981–) |
| **HMA Snow Reanalysis (NASA HMA SR1.0)** | NASA | **Killer dataset** — daily SWE, 90m, 1985–present, region-specific |
| **AMSR-2** (JAXA) | JAXA G-Portal | Independent SWE, cross-validation |
| **GRACE / GRACE-FO** | NASA / GFZ | Total water mass change 2002–present — single most powerful "water tower is losing water" chart |

#### F. Hydrology

| Dataset | Access | Use |
|---|---|---|
| **GLDAS** | NASA GES DISC | Soil moisture, runoff |
| **GloFAS** | Copernicus | Real-time flood probability |
| **JRC Global Surface Water (Pekel 2016)** | EC JRC, GEE | Lake-area history (Phewa, Tilicho, Imja over 40 years) |
| **HydroSHEDS** | WWF | Rivers, watersheds, basins — topology |
| **HydroLAKES** | WWF | Global lake inventory |
| **Nepal DHM stations** | DHM portal (scrape) | Real-time + historical river levels |
| **CMA China hydrology** (where accessible) | TPDC | Cross-border flow |

#### G. Air quality

| Dataset | Access | Use |
|---|---|---|
| **Sentinel-5P TROPOMI** | Copernicus, GEE | NO₂ / SO₂ / CO / O₃ / aerosol — daily |
| **MODIS AOD** | NASA LAADS | Long-record aerosol optical depth |
| **NASA FIRMS** | API + WMS | Active fires, <3h |
| **OpenAQ** | OpenAQ API | Ground-station PM2.5 — Kathmandu, Pokhara |
| **CAMS** | Copernicus ADS | Forecasts of aerosols, ozone |
| **DoE Nepal AQI** | Manual scrape | National authority |

#### H. Topography

| Dataset | Access | Use |
|---|---|---|
| **FABDEM** (existing) | Open data | Bare-earth DEM |
| **GLO-30** (existing) | Copernicus | 30m DEM, baseline |
| **NASADEM** | NASA | Improved SRTM |
| **ALOS World 3D (AW3D30)** | JAXA | Cross-validation 30m DEM |
| **ASTER GDEM v3** | NASA | Gap-filling |

#### I. Vegetation / land cover

| Dataset | Access | Use |
|---|---|---|
| **MODIS NDVI/EVI** (already in C) | NASA | Treeline, vegetation season |
| **ESA WorldCover** | Open | 10m global land cover (2020/2021) |
| **ESA CCI Land Cover** | Open | 300m, 1992–present |
| **Hansen Global Forest Change** | Direct | Annual forest loss / gain |

#### J. Disasters / hazards

| Dataset | Access | Use |
|---|---|---|
| **USGS Earthquake Catalog** | API | Comprehensive earthquakes |
| **EMSC** | API | Cross-validation |
| **GDACS** | RSS/API | Global disaster alerts |
| **EM-DAT** | Free with registration | Disaster losses 1900–present |

#### K. Photo archives (Vanishing Photo Archive — specialized scrapers + human curation)

| Source | What | Access strategy |
|---|---|---|
| **NASA Worldview / GIBS** | Daily satellite from 2000+ | API |
| **USGS EarthExplorer** | Landsat 1972+ | Free with login + scraper |
| **ESA Heritage** | Early satellite | Free with login + scraper |
| **Royal Geographical Society** | 1920s+ expedition photos | Manual curation, paid licensing for hero photos |
| **Mountain Heritage Trust (UK)** | Climbing history | Direct request, free with attribution |
| **Alpine Club London / Zurich** | Major archives | Direct request |
| **University theses repositories** | Glacier photos | Open access |
| **Citizen submissions (later)** | Crowdsourced | Custom intake + validation |

#### L. Population / exposure

| Dataset | Access | Use |
|---|---|---|
| **WorldPop** | Portal | 100m gridded population |
| **GHS-POP** | EC JRC | Global Human Settlement |
| **HOTOSM** | HOT export | Building footprints |
| **OpenStreetMap (Overpass)** | API | Trails, lodges, roads |
| **Nepal CBS Census** | CBS Nepal | Demographics |

#### M. Tibet / China-side data (geography-first principle)

| Dataset | Access | Use |
|---|---|---|
| **TPDC (Third Pole Environment Database)** | Beijing portal | Tibetan plateau climate, glaciers |
| **HMA family (NASA)** | NASA | Region-wide products |
| **JAXA AMSR-2** | JAXA | Microwave SWE |
| **CMA reanalysis** (where available) | CMA portal | Chinese regional reanalysis |

---

## 7. Technical spine

### 7.1 Stack overview

| Layer | Choice | Why |
|---|---|---|
| **Frontend framework** | Next.js 15 App Router + TypeScript strict (existing) | No reason to change |
| **Map engine** | MapLibre GL (existing) | Open, performant, good for raster + vector |
| **3D / extras** | React Three Fiber + drei (existing) | Tilt mode + future glacier 3D |
| **Charting** | Observable Plot (preferred) or Recharts (existing) | Plot is small + designed for data viz |
| **Styling** | Tailwind v4 (existing) | Stay |
| **Database** | **Postgres + PostGIS + TimescaleDB** | Spatial + time-series + relational in one |
| **Hosting (DB)** | Neon free tier or Supabase free tier (start), Vercel Postgres later | Free, scales |
| **Hosting (app)** | Vercel (existing) | Stay |
| **Tile / blob storage** | Vercel Blob (existing) | Already integrated for Himawari |
| **Object storage (raw archives)** | Cloudflare R2 (free egress) or Vercel Blob | Cold storage for NetCDF / GRIB |
| **Cron / ingestion runtime** | GitHub Actions (existing) | Free for public repos, already in pattern |
| **Heavy compute (occasional)** | GitHub Actions + Modal.com or Fly.io workers | When CMIP6 / ERA5 jobs exceed Actions limits |

### 7.2 Database — design principles

**One database per environment** (dev, staging, prod). Single Postgres instance, multiple schemas:

```
public.places          -- canonical place registry (id, name, slug, class, geometry, metadata)
public.datasets        -- registered data sources (id, name, version, license, citation, source_url)

obs.weather_hourly     -- TimescaleDB hypertable: time, place_id, variable, value, source_id
obs.weather_daily      -- daily aggregates
obs.climatology        -- pre-computed 30-year normals: place_id, variable, month/day, mean/p5/p95
obs.anomalies          -- pre-computed anomalies: place_id, variable, time, anomaly, confidence

cryo.glacier_outlines  -- PostGIS multipolygon, time-versioned (year, source)
cryo.glacier_mass_balance  -- TimescaleDB: glacier_id, time, value, method, source_id
cryo.glacial_lakes     -- PostGIS, time-versioned + risk attributes

proj.cmip6_summaries   -- place_id, scenario, variable, period, mean/p10/p90 (model spread)

events.historical      -- 2014 Annapurna blizzard, 2015 quake, etc. — id, time, places[], summary
events.active          -- live events from FIRMS, HydroSAR, GDACS

photos.archive         -- id, place_id, time, source, caption, license, image_url
```

**TimescaleDB hypertables** for `obs.*` because climate data is time-series-heavy and hypertables auto-partition.

**PostGIS** for geometry: every place has a `geom` column (point, polygon, or linestring). Glacier outlines, watersheds, river segments all stored as PostGIS geometries.

**Materialized views** for the heaviest reads (current `Now vs Normal` for top places, monthly climatology lookups). Refreshed by ingestion cron.

### 7.3 Storage tiers

| Tier | What lives here | Lifetime |
|---|---|---|
| **Postgres** | Place registry, derived observations, climatology, projections, citations | Permanent |
| **Vercel Blob** | Tile sets (Himawari, MODIS Snow, satellite cloud), processed images, place hero photos | Rolling — newest 30 days for tiles, permanent for processed |
| **Cloudflare R2 / Vercel Blob (cold)** | Raw archive copies of source data (ERA5 monthly NetCDF, CMIP6 daily, MODIS HDF) | Permanent (long-term durability) |
| **GitHub repo** | Code, ingestion scripts, small reference datasets, validation snapshots | Permanent |

### 7.4 Ingestion pipeline architecture

**Per-dataset, four-stage pattern.** Every dataset follows the same shape:

```
scripts/ingestion/<dataset_name>/
├── scrape.py        # 1. Pull from source (API, FTP, S3, web)
├── validate.py      # 2. Schema check, range check, freshness check, diff vs last
├── transform.py     # 3. Crop to HKH bbox, downsample, compute aggregates
├── load.py          # 4. INSERT/UPSERT into Postgres or upload to Blob
├── manifest.json    # Source URL, license, version, citation, columns mapped
└── README.md        # What this dataset is, why we have it, gotchas
```

Each dataset has a GitHub Actions workflow:

```
.github/workflows/
├── ingest-himawari.yml         (existing — reorg into pattern)
├── ingest-era5-monthly.yml     (cron: monthly)
├── ingest-chirps-daily.yml     (cron: daily)
├── ingest-modis-snow.yml       (cron: daily)
├── ingest-icimod-glacier-mass-balance.yml  (cron: monthly — slow-changing)
├── ingest-icimod-glacial-lakes.yml         (cron: weekly)
├── ingest-firms-fires.yml                   (cron: hourly during fire season)
├── ingest-tropomi-aod.yml                   (cron: daily)
├── ingest-grace.yml                          (cron: monthly)
├── ingest-photos-curate.yml                  (manual trigger + human review)
└── ...one per dataset
```

**Validation gate**: every ingestion run produces a `validation_report.json` artifact. If validation fails (schema mismatch, value out of expected range, source unreachable), the run **does not overwrite** the prior good copy. Notification fires. Human or Claude Code investigates.

**Validation augmented by Claude Code**: when adding a new dataset for the first time, a Claude Code session inspects the source, drafts the four scripts, runs once, validates output, and commits. New-dataset onboarding goes through human review (the "human inputs" the user specified).

**Idempotency**: every load is upsert by `(source_id, place_id, time, variable)`. Running an ingestion twice is a no-op.

**Provenance**: every row carries `source_dataset_id`, `source_version`, `ingested_at`. We can reconstruct any chart from raw archives.

### 7.5 Frontend rendering pipeline

```
User request
    ↓
Next.js Edge / Server Component
    ↓
Postgres query (Prisma or Drizzle ORM)
    ↓
Cached at edge (Vercel Edge Cache, ISR)
    ↓
React Server Component renders
    ↓
Client hydrates if interactive
    ↓
MapLibre / Plot / drei render
```

**Charts pre-rendered server-side** wherever possible (Observable Plot supports SSR-friendly rendering). Client-side interactivity layered on for hover/zoom/scrub.

**No live third-party fetches at request time** — only Postgres and Vercel Blob (both ours). Open-Meteo per-request is the one exception, capped and cached.

### 7.6 Performance budget

| Metric | Budget |
|---|---|
| Largest Contentful Paint | < 2.0s on simulated 3G |
| Time to Interactive | < 3.0s |
| Total page weight (engaged) | < 200KB |
| Chart render | < 200ms |
| Map first frame | < 1.0s |
| API route (Postgres-backed) | p95 < 300ms |

Lighthouse > 90 across all metrics. Mobile-first.

---

## 8. Trust mechanisms

These are not "nice to have" — they are the moat.

| Mechanism | What it is |
|---|---|
| **Source attribution UI** | Every chart, layer, and number has a clickable source pill that opens a modal: dataset name, version, license, citation, methodology link |
| **Uncertainty bands** | Visible confidence intervals on every projection; never a single line for CMIP6 |
| **Methodology pages per dataset** | "What is ERA5? Why we use it. What it cannot tell you." — one page per dataset, linked from every chart |
| **Open changelog** | Every methodology change announced + dated. Version-stamped charts. |
| **Permanent URLs** | Every chart, place, event has a stable URL we promise not to break |
| **Honest disclaimers** | "9km grid resolution — interpret with care at village level" — built into rendering at low spatial scales |
| **Wikipedia citation block** | Auto-generated `<ref>` snippets on every page for journalists / editors |
| **Per-page screenshot bundle** | One-click "download this for citation" — image + caption + sources + DOIs |

---

## 9. Build sequence — vibecoding (hours, not weeks)

Time budget: solo dev, lots of hours, Claude Code as pair. Sequence assumes **1 hour = 1 substantive PR**.

### Hour 0–4: Foundation

| Hour | Output |
|---|---|
| 0 | Provision Postgres (Neon free tier). Set up Prisma/Drizzle schema for `places`, `datasets`. Migrate existing place data in. |
| 1 | First ingestion pipeline scaffold: `scripts/ingestion/_template/` with the 4-stage pattern. README. |
| 2 | First real ingestion: ICIMOD Glacier Mass Balance (Rikha Samba + Yala). Small data, high-value. |
| 3 | Place page template (4-tab spine), wired for one trekking destination (EBC) using existing data + new `Now vs Normal` from ICIMOD AWS station |

### Hour 4–12: First viral artifact

| Hour | Output |
|---|---|
| 4–5 | ERA5 ingestion pipeline (climatology pre-compute for ~10 places × 5 variables × 30 years) |
| 6 | CHIRPS ingestion (precipitation backbone) |
| 7–8 | Climate Time Machine: for ABC, ABC's October climatology + current overlay + decade slider |
| 9 | "Now vs Normal" anomaly card on every existing destination card |
| 10–12 | **Trek Window Shift Index for EBC October** — single chart, polished, screenshot-shareable, embed-ready |

### Hour 12–24: First glacier page

| Hour | Output |
|---|---|
| 12–13 | Glacier place class added — schema, template, navigation |
| 14–15 | Khumbu glacier page: extent over time (ICIMOD + Hugonnet), mass balance (proxy via Hugonnet for Khumbu since direct ICIMOD is for Yala/Rikha Samba) |
| 16–18 | First Vanishing Photo Archive slider — Khumbu Icefall 1953 (Hillary expedition photo) vs current Sentinel-2 |
| 19–22 | Yala + Rikha Samba glacier pages with their full ICIMOD mass balance time series |
| 23–24 | Glacier Atlas overview page linking the 3 glaciers |

### Hour 24–40: In Your Lifetime + breadth

| Hour | Output |
|---|---|
| 24–28 | "In Your Lifetime" — birth year input, personalized Nepal climate change story |
| 29–32 | Monsoon Tracker — onset / withdrawal / cumulative this year vs normal |
| 33–36 | Air Quality module — TROPOMI + FIRMS + OpenAQ for Kathmandu and Pokhara |
| 37–40 | Historical Event Archive scaffolding + first 3 events (2014 Annapurna blizzard, 2015 Gorkha quake, 2021 Melamchi flood) |

### Hour 40–80: HKH expansion + Tier-2 places

| Hour | Output |
|---|---|
| 40–50 | River system pages — Indus, Ganges, Brahmaputra (Tier-2 places start) |
| 50–60 | Tibet / north-face content — Rongbuk, Kangshung; engage TPDC data |
| 60–70 | Karakoram glaciers — Baltoro, Hispar, Biafo, Siachen |
| 70–80 | Climbing window tab for Everest + K2 + Annapurna I |

### Hour 80+: Distribution + storytelling

| Hour | Output |
|---|---|
| 80–100 | Wikipedia source citations on 5 climate-of-Nepal pages; reach out to climate journalists |
| 100–120 | Embeddable widgets for Tier-A charts |
| 120+ | Climate Witness program scaffolding, more glaciers, more events, more rivers, growing the catalogue |

---

## 10. Workflow & quality gates

Per `CONTRIBUTING.md` (already shipped):

- All changes via PR, no direct push to `main`
- CI runs `lint` + `typecheck` + `build` on every PR
- Branch protection enforced
- Conventional Commits
- Atomic commits — one concern per commit
- Every PR updates docs whose code it touches
- Every new dataset onboarded through the 4-stage ingestion pattern with a manifest + README

---

## 11. Database schema sketch (first pass)

```sql
-- Place registry
CREATE TABLE places (
  id           SERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,        -- 'khumbu-glacier', 'ebc', 'kathmandu'
  name         TEXT NOT NULL,
  class        TEXT NOT NULL,               -- 'trek_destination', 'glacier', 'peak', 'lake', 'river_point', 'city'
  country      TEXT NOT NULL,
  region       TEXT,                        -- 'Khumbu', 'Annapurna', 'Langtang', 'Karakoram', 'Tibetan Plateau'
  geom         GEOMETRY(Geometry, 4326),    -- point/polygon/linestring depending on class
  altitude_m   INTEGER,
  metadata     JSONB,                       -- class-specific (peak height, glacier area, river basin, etc.)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX places_geom_idx ON places USING GIST (geom);
CREATE INDEX places_class_idx ON places (class);

-- Dataset registry
CREATE TABLE datasets (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,      -- 'era5-land', 'chirps-daily', 'icimod-rikha-samba-mb'
  name          TEXT NOT NULL,
  version       TEXT,
  license       TEXT NOT NULL,
  citation      TEXT NOT NULL,
  source_url    TEXT NOT NULL,
  description   TEXT,
  spatial_res   TEXT,
  temporal_res  TEXT,
  date_added    DATE DEFAULT CURRENT_DATE,
  is_active     BOOLEAN DEFAULT TRUE
);

-- Time-series observations (TimescaleDB hypertable)
CREATE TABLE obs_weather_daily (
  time         TIMESTAMPTZ NOT NULL,
  place_id     INTEGER REFERENCES places(id),
  variable     TEXT NOT NULL,              -- 'temp_max', 'temp_min', 'precip_mm', 'snow_cover_pct', etc.
  value        DOUBLE PRECISION,
  unit         TEXT,
  source_id    INTEGER REFERENCES datasets(id),
  source_version TEXT,
  ingested_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (time, place_id, variable, source_id)
);
SELECT create_hypertable('obs_weather_daily', 'time');

-- Pre-computed climatology (30-year normals)
CREATE TABLE obs_climatology (
  place_id     INTEGER REFERENCES places(id),
  variable     TEXT NOT NULL,
  doy          INTEGER NOT NULL,           -- day of year 1-366
  mean         DOUBLE PRECISION,
  p05          DOUBLE PRECISION,           -- 5th percentile
  p25          DOUBLE PRECISION,
  p50          DOUBLE PRECISION,           -- median
  p75          DOUBLE PRECISION,
  p95          DOUBLE PRECISION,
  baseline_period TEXT NOT NULL,           -- '1991-2020'
  source_id    INTEGER REFERENCES datasets(id),
  PRIMARY KEY (place_id, variable, doy, baseline_period, source_id)
);

-- Glacier-specific
CREATE TABLE cryo_glacier_outlines (
  id           SERIAL PRIMARY KEY,
  place_id     INTEGER REFERENCES places(id),
  outline_year INTEGER NOT NULL,
  geom         GEOMETRY(MultiPolygon, 4326),
  area_km2     DOUBLE PRECISION,
  source_id    INTEGER REFERENCES datasets(id),
  UNIQUE (place_id, outline_year, source_id)
);
CREATE INDEX cryo_outlines_geom_idx ON cryo_glacier_outlines USING GIST (geom);

CREATE TABLE cryo_glacier_mass_balance (
  time         TIMESTAMPTZ NOT NULL,
  place_id     INTEGER REFERENCES places(id),
  value        DOUBLE PRECISION,           -- mwe (meters water equivalent)
  method       TEXT NOT NULL,              -- 'glaciological', 'geodetic', 'modeled'
  source_id    INTEGER REFERENCES datasets(id),
  PRIMARY KEY (time, place_id, method, source_id)
);
SELECT create_hypertable('cryo_glacier_mass_balance', 'time');

-- CMIP6 projection summaries
CREATE TABLE proj_cmip6_summaries (
  place_id     INTEGER REFERENCES places(id),
  scenario     TEXT NOT NULL,              -- 'ssp126', 'ssp245', 'ssp585'
  variable     TEXT NOT NULL,
  period       TEXT NOT NULL,              -- 'near_term_2031_2050', 'mid_century_2041_2060', 'end_century_2081_2100'
  baseline     TEXT NOT NULL,              -- '1995_2014'
  delta_mean   DOUBLE PRECISION,
  delta_p10    DOUBLE PRECISION,
  delta_p90    DOUBLE PRECISION,
  n_models     INTEGER,
  source_id    INTEGER REFERENCES datasets(id),
  PRIMARY KEY (place_id, scenario, variable, period, baseline, source_id)
);

-- Historical events
CREATE TABLE events_historical (
  id           SERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,        -- 'gorkha-2015', 'melamchi-flood-2021'
  name         TEXT NOT NULL,
  event_class  TEXT NOT NULL,              -- 'earthquake', 'flood', 'glof', 'storm', 'avalanche'
  time_start   TIMESTAMPTZ NOT NULL,
  time_end     TIMESTAMPTZ,
  affected_geom GEOMETRY(Geometry, 4326),
  affected_places INTEGER[] REFERENCES places(id),
  summary      TEXT NOT NULL,
  evidence     JSONB,                      -- linked datasets, photos, citations
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Photo archive
CREATE TABLE photos_archive (
  id           SERIAL PRIMARY KEY,
  place_id     INTEGER REFERENCES places(id),
  capture_time TIMESTAMPTZ NOT NULL,
  source       TEXT NOT NULL,              -- 'rgs', 'mountain-heritage', 'sentinel-2', 'usgs'
  caption      TEXT,
  license      TEXT NOT NULL,
  url          TEXT NOT NULL,              -- canonical url to image
  blob_path    TEXT,                        -- our copy in Vercel Blob
  metadata     JSONB,                       -- camera, photographer, expedition, etc.
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX photos_place_time_idx ON photos_archive (place_id, capture_time);
```

Schema evolves; this is a starting point that captures the essential entities.

---

## 12. Naming, branding, identity

**Name:** Himalayan Atlas (locked).

The product previously ran as "Nepal Mountain Weather Decision Map" — that name no longer fits the pivot. Codebase, repo, and deployment URL can transition incrementally:

| Surface | Current | Target |
|---|---|---|
| Repo | `SushantChalise/Weather` | rename later, keep redirect |
| Deploy URL | `weather-ruby-iota-35.vercel.app` | `himalayan-atlas.com` (or `.org`) once domain is procured |
| Page title | "Nepal Mountain Weather Decision Map" | "Himalayan Atlas" |
| Header copy | "Nepal Weather" | "Himalayan Atlas" |

Repo rename + custom domain are not blockers for shipping content under the new name.

---

## 13. What this product deliberately does NOT do

These keep us honest:

- **Does not host raw climate data for download.** Data API is v2+ if at all.
- **Does not run its own glacier-melt or GLOF risk models.** We aggregate and visualize others' research; we do not claim independent risk modeling.
- **Does not provide AI-generated climate Q&A.** Trust risk too high; adds little.
- **Does not show single-line CMIP6 projections.** Always with model spread + uncertainty.
- **Does not show village-level CMIP6.** 25km downscaling cannot resolve to village; we say so.
- **Does not predict avalanches.** Domain partners required, not yet engaged.
- **Does not replace ICIMOD or Nepal DHM.** We are a frontend; they remain the authority.
- **Does not gate content.** No login required for any reading. Future Climate Witness submissions may require auth.

---

## 14. Open decisions

These need founder calls before deep build:

| # | Decision | Default if no decision |
|---|---|---|
| 1 | ~~Final product name~~ | ~~Resolved: Himalayan Atlas~~ ✓ |
| 2 | Database host (Neon vs Supabase) | Neon — free tier is generous, native Postgres |
| 3 | Charting library (Observable Plot vs Recharts) | Plot — smaller, designed for data viz, SSR-friendly |
| 4 | Cold object storage (R2 vs Vercel Blob) | Vercel Blob (simpler — already in stack) |
| 5 | Domain (current `weather-ruby-iota-35.vercel.app` is auto-generated) | Keep until name decided; then `himalayan-atlas.com` or similar |
| 6 | Photo licensing budget | $0 default — only sources we can use freely; commercial archives deferred |
| 7 | Compute budget for projections (CMIP6 processing is heavy) | Free GitHub Actions tier first; escalate if needed |
| 8 | Climate Witness submission auth | Defer until traction — currently no |

---

## 15. Success metrics — north star

The atlas wins when:

| Signal | Threshold |
|---|---|
| Cited as a source on 5 Wikipedia pages about Himalayan climate | 6 months |
| At least 1 climate journalist piece links to a chart | 6 months |
| ICIMOD acknowledges or links to the product | 12 months |
| At least 1 academic paper cites a chart or methodology | 18 months |
| At least 10,000 unique users per month | 12 months |
| At least 50 places fully documented | 12 months |
| At least 100 ingestion pipelines stable and running | 18 months |

These are not vanity metrics. Citation ≫ traffic. Authority ≫ engagement.

---

## 16. Living document

This spec changes as the product learns. Per `CONTRIBUTING.md`:

> When you change something a future contributor needs to know, update the docs in the same PR.

PRs that touch product direction update this file. PRs that touch the database schema update `§11`. PRs that touch a data source update `§6`. The locking sentence (`§0`) and product principles (`§3`) move only with explicit founder approval.

---

*End of spec.*
