# Build Plan — Himalayan Atlas

**Status:** v2.0 — vibecoding plan, hour-paced
**Replaces:** v1 trekker-tool 8-step plan (mostly shipped; preserved in git history)

This plan is the operational sequence behind PRODUCT.md §9. One row = one substantive PR, roughly one hour of pair-programming with Claude Code.

**Principle:** ship the smallest thing that is real and undeniable, then expand. No feature lands without source attribution and uncertainty bands. No PR merges without CI green.

---

## Hour 0 — Foundation

| # | Output | Acceptance gate |
|---|---|---|
| 0a | Provision Postgres on Neon (free tier). Add `DATABASE_URL` to local `.env.local` and Vercel env. | `psql $DATABASE_URL -c "SELECT version();"` returns Postgres version |
| 0b | Install Prisma or Drizzle. Drop schema from PRODUCT.md §11 (`places`, `datasets`, `obs_weather_daily`, `obs_climatology`, `cryo_glacier_outlines`, `cryo_glacier_mass_balance`, `proj_cmip6_summaries`, `events_historical`, `photos_archive`). Enable PostGIS + TimescaleDB extensions. | `\dt` shows tables; `SELECT PostGIS_Full_Version();` works; `SELECT extversion FROM pg_extension WHERE extname='timescaledb';` returns version |
| 0c | Migrate the 8 existing trekking destinations + 2 cities into the `places` table with PostGIS point geometries. | `SELECT slug, ST_AsText(geom) FROM places;` returns 10 rows |
| 0d | Establish `scripts/ingestion/_template/` with the 4-stage pattern (`scrape.py`, `validate.py`, `transform.py`, `load.py`, `manifest.json`, `README.md`) and shared utilities under `_shared/`. | Template directory exists; one-line README explains usage |
| 0e | Update `.github/workflows/himawari.yml` to fit the new pattern (`scripts/ingestion/himawari/`). Existing pipeline keeps running. | Workflow runs end-to-end on push, manifest still updated in Vercel Blob |

**Acceptance gate for hour 0:** Postgres alive, schema in place, places migrated, ingestion template in place, existing Himawari pipeline still healthy.

---

## Hour 1–4 — First real ingestion + first place page

| # | Output | Acceptance gate |
|---|---|---|
| 1 | First real ingestion: ICIMOD Glacier Mass Balance for **Rikha Samba**. Single-file CSV from RDS portal. Validate, transform, load into `cryo_glacier_mass_balance`. | `SELECT * FROM cryo_glacier_mass_balance WHERE place_id = (SELECT id FROM places WHERE slug='rikha-samba');` returns rows; manifest committed |
| 2 | Add **Yala** glacier mass balance ingestion (same pattern). Add Yala glacier place. | Yala rows exist; same script reused with different config |
| 3 | First place page template: 4-tab spine (Now / Now vs Normal / Last 30 years / Future) wired for one trekking destination (EBC) using existing data + `Now vs Normal` from a nearby ICIMOD AWS station (e.g. Okhaldhunga HYCOS) | EBC page loads at `/places/ebc`; tabs render; data shown with source citations |
| 4 | Source attribution UI component (clickable pill: dataset name → modal with version, license, citation, methodology link). Used on every chart and number on the EBC page. | Click any number / chart → modal appears with full provenance |

---

## Hour 5–8 — ERA5 backbone + Climate Time Machine

| # | Output | Acceptance gate |
|---|---|---|
| 5 | ERA5 ingestion pipeline (Copernicus CDS API). Cron monthly. Crops to HKH bbox, daily aggregates, loads into `obs_weather_daily`. | `SELECT COUNT(*) FROM obs_weather_daily WHERE source_id = (SELECT id FROM datasets WHERE slug='era5-land');` returns >100,000 rows for 5 places × 5 variables × 30 years |
| 6 | Pre-compute 30-year climatology (1991–2020 baseline) for ~10 places × 5 variables. Materialised view `obs_climatology`. | `SELECT * FROM obs_climatology WHERE place_id = (SELECT id FROM places WHERE slug='abc') LIMIT 10;` returns rows |
| 7 | CHIRPS ingestion (precipitation backbone — gauge-blended, corrects ERA5 orographic bias). | CHIRPS source registered, daily precip loaded for 10 places, 1981–present |
| 8 | **Climate Time Machine** for one place / one variable end-to-end: ABC, October temperature. 30-year climatology + current overlay + decade slider, with confidence bands. | `/visualizations/climate-time-machine?place=abc&variable=temp&month=10` renders an interactive chart, mobile-responsive, screenshot-shareable |

---

## Hour 9–12 — First viral artifact

| # | Output | Acceptance gate |
|---|---|---|
| 9 | "Now vs Normal" anomaly card on every existing destination card (homepage). | Every corridor card shows "today is X above/below 30-year October average" with source attribution |
| 10–11 | **Trek Window Shift Index** for EBC October: % clear days by decade (1990s, 2000s, 2010s, 2020s). Single chart, polished. Uses ERA5 cloud cover. | Chart renders; uncertainty bands honest; ready to screenshot |
| 12 | Permanent URL for the Trek Window Shift Index chart. SVG + PNG export. Embed code generator (HTML iframe + image fallback). | Chart has stable URL `/charts/trek-window-shift/ebc-october`; embed button copies a snippet |

---

## Hour 13–24 — First glacier page

| # | Output | Acceptance gate |
|---|---|---|
| 13 | Glacier place class added: schema enrichments, page template, navigation. | `places.class = 'glacier'` is a valid value; sidebar shows Glaciers section |
| 14 | Hugonnet et al. 2021 ingestion — global glacier elevation change 2000–2019 (per-glacier numbers). | `cryo_glacier_mass_balance` has Hugonnet-derived rows for HKH glaciers |
| 15 | Randolph Glacier Inventory v7 ingestion — canonical outlines into `cryo_glacier_outlines`. | RGI outlines for top 50 HKH glaciers in PostGIS |
| 16 | Khumbu glacier place page: extent over time, mass balance (Hugonnet), ice thickness placeholder | `/places/khumbu-glacier` loads with all 4+1 tabs (Now / Normal / Trend / Future / Health) |
| 17–18 | First Vanishing Photo Archive slider — Khumbu Icefall: 1953 (Hillary expedition photo, public domain) vs current Sentinel-2 view. Image hosting in Vercel Blob, source manifest. | Slider renders on Khumbu page; old/new comparison works on mobile |
| 19–20 | Yala + Rikha Samba glacier pages with full ICIMOD mass balance time series visualised. | Both pages load; mass balance chart shows 10+ years of data |
| 21–22 | ICIMOD "Decadal glacier changes 1990–2020 in HKH" ingestion — outline snapshots per decade for top HKH glaciers. | `cryo_glacier_outlines` has 1990, 2000, 2010, 2020 snapshots for ≥10 glaciers |
| 23–24 | Glacier Atlas overview page linking the documented glaciers, with HKH-wide map of glacier locations + per-glacier health summary card. | `/atlas/glaciers` lists ≥10 documented glaciers with summary cards |

---

## Hour 25–40 — In Your Lifetime + breadth

| # | Output | Acceptance gate |
|---|---|---|
| 25–28 | "In Your Lifetime" feature: birth year input, personalised Nepal climate change story (temperature change, precipitation shift, glacier retreat in Khumbu, monsoon timing change since user's birth year). Uses ERA5 + glacier data. | Feature works for birth years 1950–2010; mobile-friendly; shareable |
| 29–32 | Monsoon Tracker: onset / withdrawal / cumulative this year vs 30-year normal. Uses ERA5 / CHIRPS. | Live page updates daily; shows current monsoon progress vs typical |
| 33–34 | Sentinel-5P TROPOMI ingestion (NO₂, aerosol). | Daily NO₂ tiles in Vercel Blob; AQ table populated |
| 35–36 | NASA FIRMS ingestion (active fires, hourly during fire season). | Fire detections in `events.active`; map layer toggleable |
| 37 | OpenAQ ingestion for Kathmandu + Pokhara stations (hourly PM2.5). | AQ stations registered as places; PM2.5 time series queryable |
| 38–40 | Air Quality module: place pages for Kathmandu + Pokhara get the AQ tab (PM2.5 trend, NO₂ heat map, smoke source attribution) | Both city pages load with full AQ context |

---

## Hour 41–60 — Historical Event Archive + storytelling

| # | Output | Acceptance gate |
|---|---|---|
| 41–43 | Historical Event Archive scaffolding: schema (PRODUCT.md §11 already), event listing page, event detail template. | `/events` lists events; `/events/{slug}` renders detail page |
| 44–46 | First 3 events: 2014 Annapurna blizzard, 2015 Gorkha quake aftermath weather, 2021 Melamchi flood. Each tied to weather data on those days, plus photos and ICIMOD landslide data where applicable. | Three event pages render with data, narrative, and source citations |
| 47–48 | Snow Line Tracker: real-time snow line elevation vs climatology. Uses HMA Snow Reanalysis (NASA) + MODIS Snow Cover. | Snow line chart on relevant glacier / corridor pages |
| 49–52 | More Vanishing Photo Archive sliders: 4 additional pairs (Annapurna South Face, Imja Tsho 2000 vs today, Lhotse face, etc.) | 5 paired sliders live; archive index page |
| 53–55 | River system: Koshi at Chatara place page. Includes flow seasonality, snowmelt contribution, climate-projected change. | Page loads; uses Nepal DHM flow data + GRACE total water mass |
| 56–58 | NEX-GDDP-CMIP6 ingestion (climate projections, daily downscaled, ~25km). Pre-compute period summaries for 25 places. | Projections in `proj_cmip6_summaries` for 3 SSP scenarios × 3 periods × 5 variables × 25 places |
| 59–60 | Future tab populated for top 5 trek destinations and top 3 glacier pages. Always with model spread + uncertainty. | Future tab renders; never single-line projections |

---

## Hour 61–80 — HKH expansion (Tier-2 places)

| # | Output | Acceptance gate |
|---|---|---|
| 61–65 | Karakoram glaciers: Baltoro, Hispar, Biafo, Siachen, Batura. Each gets a glacier page populated from RGI + Hugonnet + GLIMS. | 5 Karakoram glacier pages live |
| 66–70 | Indian Himalayan glaciers: Gangotri, Pindari, Bara Shigri, Zemu, Milam. | 5 Indian glacier pages live |
| 71–73 | Tibet / north-face: Rongbuk, Kangshung, Kharta. Engage TPDC where data accessible; otherwise use RGI + Hugonnet. | 3 Tibet glacier pages live |
| 74–76 | Major rivers: Indus, Ganges, Brahmaputra full reach (multiple sample points each). | River system pages with multi-point flow + headwater context |
| 77–80 | Iconic peaks: Everest, K2, Annapurna I, Kanchenjunga, Manaslu, Dhaulagiri. Climbing window tab (jet stream, freezing level, summit-day climatology). | Peak pages live; climbing-window tab populated for 6 peaks |

---

## Hour 81+ — Distribution + ongoing

| # | Output | Acceptance gate |
|---|---|---|
| 81–85 | Wikipedia citation push: become a cited source on 5 climate-of-Nepal Wikipedia pages. Pre-prepare embeddable charts with permanent URLs. | 5 Wikipedia citations live; analytics show referrer traffic |
| 86–90 | Embeddable widgets for Tier-A charts (Climate Time Machine, Trek Window Shift, In Your Lifetime). HTML iframe + JSON-LD for SEO. | Embed code generator works; first external embed live (climate journalist or blogger) |
| 91–95 | Outreach: identify and contact 10 climate / mountain journalists, geography departments, and trekking operator publications. Free use of charts with attribution. | First external citation lands |
| 96–100 | Climate Witness program scaffolding: simple Markdown front-matter + photo upload via Git PR for verified guides + lodge owners. | Schema + intake flow exists; first Climate Witness entry committed |
| 100+ | Continuous: more places, more datasets, more events, more archives, more charts. | Growing the catalogue. |

---

## Quality gates that apply to every PR

Per [CONTRIBUTING.md](CONTRIBUTING.md):

- All changes via PR, no direct push to `main`
- CI green: `lint` + `typecheck` + `build`
- Branch protection enforced
- Conventional Commits (`feat`, `fix`, `chore`, `docs`, `style`, `ci`, `refactor`, `test`)
- One commit = one concern
- Every chart shipped: source attribution UI present, uncertainty bands rendered, methodology link wired
- Every new dataset: 4-stage ingestion pattern, manifest.json, README.md, validation that refuses overwrite on bad data

---

## Stop conditions

The plan stops being "vibecoding" and converts to "feature freeze + polish" when one of these happens:

1. **Citation milestone hit** — 5 Wikipedia / journalist citations. Pause new features for two weeks of polish + bug fixes + outreach.
2. **Performance regression** — Any chart > 2s on simulated 3G triggers an immediate "performance week" before more features.
3. **Trust regression** — A user reports a chart they consider misleading or false-precision. Stop, audit, fix, audit pattern across product.
4. **Database hygiene** — Postgres > 70% of free-tier limit. Stop, prune cold partitions to object storage.

---

*Original v1 BUILD_PLAN.md (the 8-step trekker plan) is preserved in git history. The trekker product is fully shipped and now becomes Pillar 3 (Real-time + anomaly layer) of the Atlas.*

---

## Round 16 — HKH Cryosphere Atlas (real ICIMOD data, post-download)

**Context:** Hour 21–22 ("ICIMOD decadal glacier changes 1990–2020") was originally scoped as a single ingestion. With the authenticated downloader (#65 / #67 / #68) we now have 665 MB of real ICIMOD data on local disk including:

- HKH Glacier outlines for **1990, 2000, 2010, 2020** (~520 MB combined)
- GLOF database of HMA, glacial-lake polygons (Koshi/Gandaki/Karnali), potentially dangerous glacial lakes
- HKH master glacier inventory
- Yala 1 micromet station ground-truth time series
- Gorkha 2015 hazard mapping suite (landslide-dam, geological data, internal relief)

**Outcome target:** A single landing page that lets a visitor swipe through 30 years of HKH glacier shrinkage, with overlaid GLOF-risk lakes, in under 2s on 3G. This is the emotional anchor of the product.

### Sequence

| # | Output | Acceptance gate |
|---|---|---|
| 16.1 | Data pipeline script `scripts/transform/icimod-glacier-decades/run.ts`: read the four HKH Glacier ZIPs, extract shapefiles, simplify with `mapshaper` (npm) at ~5% tolerance, emit GeoJSON FeatureCollections per decade with stable RGI-style IDs, upload to Vercel Blob under `glaciers/hkh/{year}.geojson.gz`. | 4 GeoJSON files in Blob, each < 30 MB compressed, polygon counts within 10% of source |
| 16.2 | Per-glacier area / centroid / bbox computed for each decade, written to a new Postgres table `cryo_glacier_outlines_summary` keyed on (rgi_id, year). | Table populated; `SELECT rgi_id, year, area_km2 FROM cryo_glacier_outlines_summary WHERE rgi_id LIKE 'RGI%-15%' ORDER BY rgi_id, year` shows monotonic-ish shrinkage per glacier |
| 16.3 | Same pipeline for `glacial-lakes-koshi-gandaki-karnali.zip` and `potentially-dangerous-glacial-lakes.zip`. Output as `glacial-lakes/{current,risky}.geojson.gz` in Blob. Risk-tier preserved as a feature property. | Two more GeoJSON files in Blob, ≤ 5 MB each |
| 16.4 | New page `/atlas/30-years` — single MapLibre canvas, **segmented 4-stop year control** (1990/2000/2010/2020) with Prev/Play/Next, **not a slider**. Layer panel grouped: `Ice & Water` (Glaciers, Glacial lakes — both on by default), `Risk & Events` (Earthquakes, Active fires — both off), `Stations` (Yala 1 — off). **GLOF risk is a filter inside the Glacial-lakes layer, not a peer toggle.** Layers lazy-fetched from Blob. URL state encodes year + visible layers + GLOF filter. | Page LCP ≤ 2.5s on simulated 3G at 360px; year control has 44px+ tap targets; segmented years work without dragging; tested at 360px and 1440px |
| 16.4a | First-paint **poster state**: muted/desaturated basemap + HKH extent mask + headline + (disabled-for-1s) year control all render instantly. **2020 glacier extent ships as a static image overlay** for the first paint, swapped to live GeoJSON when fetched. Staged loading copy: "Loading glacier extent…" → "Adding lakes…". No bare spinner. | Lighthouse "fast 3G" first contentful paint < 1.5s; the page already looks like the story before any fetch lands |
| 16.5 | Click handler: **bottom sheet on mobile (peek/half/full states), right drawer on desktop**. First-tap shows compact card (name, one stat, one action: "see full chart"). Swipe-up reveals attribution + history + cross-links. **For overlapping features (lake + glacier + place at same point), the sheet first shows a chooser list** — never force the user to retap the map. | Manual test on 360px: tapping 5 glaciers and 5 lakes opens correct compact card; overlapping-features test: chooser appears, never retap-roulette |
| 16.6 | `/atlas/glaciers` (current placeholder with point markers) becomes a 308 redirect to `/atlas/30-years`. Update internal links + sitemap. | Redirect honored; old URL no longer indexed; nav updated |
| 16.7 | `scripts/ingestion/icimod-yala-micromet/run.ts`: parse the Yala 1 ZIP, locate the time-series CSV, ingest into `obs_weather_daily` with a new `icimod-yala-micromet-1` dataset slug. Match to `places.slug='yala'`. | `SELECT COUNT(*) FROM obs_weather_daily WHERE source_id = (SELECT id FROM datasets WHERE slug='icimod-yala-micromet-1')` returns rows; Yala-specific charts now have ground-truth data |
| 16.8 | "Ground truth" comparison badge on `/places/yala`: shows last full month's measured value vs the same month from Open-Meteo, with delta. Surfaced beside the existing variables, not as a separate tab. | Badge renders only when both sources have data for the period; honest about the comparison window |
| 16.9 | `/charts/glacier-loss/[place]` enhancement: when the glacier has decadal-outline data, append a tiny inline map showing the 1990 vs 2020 outline silhouettes side-by-side. Uses the same Blob-served GeoJSON. | Inline map renders for the 4 tracked glaciers; fallback to text-only when polygon data is absent |
| 16.10 | New `/events/gorkha-2015` page using the Gorkha hazard mapping ZIPs (Anti Dip Slope / Possible Damming / Internal Relief / Geological / Dip Slope / Dip Normal Slope / Geological Structural). Combined narrative: April 25 quake → cascading landslide-dam hazards → which valleys were affected. Toggleable layers + place-anchored events from the `earthquakes` table for the M ≥ 6 aftershocks. | Page renders; layer toggles work; cross-links to `/places/langtang`, `/places/sindhupalchok` (new place if missing) |

### Data budget / performance gates

- All glacier + lake GeoJSON served gzipped from Vercel Blob with `Cache-Control: public, max-age=86400, immutable`.
- Page total transfer (initial visit) ≤ 8 MB on `/atlas/30-years` after gzip.
- LCP ≤ 2.5s on simulated 3G (Lighthouse desktop emulation, "fast 3G" preset).
- No layer fetch occurs until the user toggles it on (lazy-loading), except the default Glaciers-1990 layer.
- Subsequent year toggles use HTTP cache hits.

### Cross-cutting design rules

- **Map is the spine, not the side dish.** Don't fragment this data across N small pages. The combined view is the unique value.
- **The first 5 seconds must scream "HKH ice has retreated across four decades."** If the page reads as a generic GIS layer switcher, it has failed. Hero copy + visible 1990↔2020 contrast must land before the user has to interact with anything.
- **Don't waste tap targets.** Mobile primary controls (year stops, layer groups, sheet handle) are 44×44 minimum. No tiny slider thumbs. No fake-button text links.
- **Always link out from the map.** Every clickable feature has a "see this glacier's full chart" or "see this place's history" out-link, so the map drives traffic into the rest of the product.
- **Honest about what the polygons are.** ICIMOD's HKH Glacier 1990 outlines are themselves derived from Landsat/AST etc. — surface the per-decade source method in the citation pill on the drawer, don't hide it.
- **Don't redo the back-end on the front-end.** The aggregation (area, % change) is computed once in step 16.2 and stored in Postgres. The frontend reads pre-computed numbers. No client-side polygon math.

### Layer palette (against a desaturated, dimmed satellite basemap)

Older glacier extents are *ghosted*; newest is sharp. The four years are **not** four equally-loud blues — that flattens the story.

| Layer | Fill | Outline | Notes |
|---|---|---|---|
| Glaciers 1990 | `#B9F3FF` @ 35% | dark halo, 0.5px | ghosted, oldest |
| Glaciers 2000 | `#7FDBFF` @ 50% | dark halo, 0.5px | |
| Glaciers 2010 | `#39B5E8` @ 70% | dark halo, 0.75px | |
| Glaciers 2020 | `#DDF7FF` @ 85% | dark halo, 1px | sharpest, current |
| Glacial lakes (current) | `#12B5CB` @ 50% | none | |
| Dangerous lake — low | none | `#F2C94C` 2px | outline only, urgent |
| Dangerous lake — medium | none | `#F2994A` 2px | outline only, urgent |
| Dangerous lake — high | none | `#EB5757` 3px | outline only, urgent |
| Earthquake (M ≥ 4.5) | `#FF5A5F` | size scaled by magnitude | |
| Active fire | clustered | `#FF6B00` (cluster) / `#FFD166` (single) | never raw dense dots |
| Weather station (Yala 1) | acid yellow `#E6FF57` | dark stroke | |

**Basemap treatment:** desaturate to ~60%, brightness ~70%. Use a satellite tile source but actively dim it so the data layers carry the contrast.

### What this round explicitly does NOT do

- **No tippecanoe / MVT yet.** Simplified GeoJSON is enough until we have evidence we're losing users to load time. Revisit in a perf-focused round.
- **No animation between years.** A 4-tick slider is plenty. Smooth-morph between decadal outlines isn't worth the implementation cost or perceptual confusion (these are measurements, not interpolated data).
- **No 3D.** Tempting with the glacier polygons + DEM, but it's a different product surface. Park.
- **No reanalysis of Hugonnet rates against ICIMOD outlines.** That's a research paper, not a webpage.
