# Data Sources, Caching, Preprocessing, and Provenance

Operational reality of the data layer. What we fetch, how we cache it, what breaks if we don't, and how every displayed value traces back to a source.

---

## Sources — complete inventory

| Purpose | Source | Resolution | Cadence | Access | License / cap |
|---|---|---|---|---|---|
| Cloud imagery (prototype) | RAMMB SLIDER → Himawari-9 | ~2km visible | 10 min | HTTP scrape | Free, attribution; URL scheme unstable |
| Cloud imagery (production) | NOAA/JMA AWS Open Data → Himawari-9 | Band-dependent (0.5–2km) | 10 min full-disk | S3 `--no-sign-request` | Free, no auth, archive to 2015 |
| Forecast (primary) | Open-Meteo (wraps ECMWF IFS + GFS + ICON) | ~11km (IFS), ~25km (GFS) | Hourly out to 7d | REST API | Free non-commercial; **10k req/day, 5k/hour, 600/min** |
| Forecast (fallback) | NOAA GFS direct (NOMADS) | 0.25° (~28km) | 6-hourly runs | HTTP/GRIB download | Free, no rate limit, no auth |
| Pressure-level cloud, geopotential | Open-Meteo (ECMWF pressure levels) | ~11km | Hourly | REST API | Same cap as above |
| Precipitation history (NRT) | NASA IMERG (GPM) | 0.1° (~11km) | Half-hourly NRT, 4h latency | NASA Earthdata (free account) | Free, attribution |
| Official weather warnings | DHM Nepal (dept. of hydrology/meteorology) | National / regional bulletins | As issued (poll every 15 min) | Public website scrape or RSS | Free, government data |
| Visual terrain DEM | Copernicus GLO-30 | 30m | Static | AWS Open Data | Free, attribution |
| Hydrology DEM (bare-earth) | FABDEM | 30m | Static | University of Bristol | **CC BY-NC-SA 4.0 — non-commercial only** |
| Historical reanalysis (seasonal baselines) | ERA5 (via CDS API) | 0.25° (~28km) | Monthly climatology | Copernicus CDS (free account) | Free, attribution, Copernicus license |
| Post-event snowline validation | Sentinel-2 L2A | 10m optical | 5-day revisit | Copernicus Browser / STAC | Free, attribution |
| Sun position (sunrise/golden hour) | `suncalc` (npm) | Computed per lat/lon | Instant | Local compute | MIT |

### Source selection rationale

**Why Open-Meteo, not raw ECMWF/GFS?** Open-Meteo wraps the best available global models (ECMWF IFS 0.25°, GFS 0.25°, ICON 0.125°, MétéoFrance ARPEGE) behind a single free REST API with automatic model selection. We get ECMWF-class accuracy without managing GRIB downloads, format conversion, or model-run scheduling. The tradeoff: Open-Meteo's rate cap (10k/day) makes caching non-optional.

**Why GFS direct as fallback?** If Open-Meteo's cap is exhausted, NOAA's GFS NOMADS server has no rate limit. Resolution is coarser (0.25° vs Open-Meteo's best-of-breed blending) but sufficient for Watch/Avoid decisions. We never hit GFS in normal operation — it's the backstop.

**Why DHM?** Nepal's Department of Hydrology and Meteorology is the only authority that issues official weather warnings, flood bulletins, and road-closure notices for Nepal. The Decision Strip's "Avoid" pill requires an official-warning trigger — DHM is that trigger. No foreign model can substitute for local government alerts.

**Why ERA5?** Seasonal baselines ("is this October cloudier than average for ABC?") need multi-year climatology. Open-Meteo's historical endpoint covers recent years; ERA5 covers 1940–present at consistent quality. We pre-compute monthly normals per destination once, not per request.

**Why IMERG, not just Open-Meteo precipitation?** IMERG is satellite-observed, half-hourly, globally consistent. Open-Meteo precipitation is model-forecast. For the "What changed in 72h?" primitive, observed precipitation is more trustworthy than hindcast. For forward-looking precipitation (route ribbons), Open-Meteo is better.

**Why Sentinel-2 is not critical path:** Snowline is computed from Open-Meteo geopotential (model). Sentinel-2 provides post-event optical validation ("was the snowline actually where we said it was?"). Valuable for calibration, not for real-time display.

---

## What Open-Meteo actually gives us (model transparency)

Open-Meteo's `forecast` endpoint automatically selects the best-resolution model available:

| Model | Provider | Resolution | Runs | Notes |
|---|---|---|---|---|
| ECMWF IFS | ECMWF (European) | 0.25° / ~28km, 0.1° HRES | 00Z, 12Z | Gold standard for global NWP |
| GFS | NOAA (US) | 0.25° / ~28km | 00Z, 06Z, 12Z, 18Z | Fastest update cycle |
| ICON | DWD (German) | 0.125° / ~13km | 00Z, 06Z, 12Z, 18Z | Best raw resolution we get for free |
| ARPEGE | MétéoFrance | 0.1° / ~11km (Europe focus) | 00Z, 06Z, 12Z, 18Z | Less relevant for Nepal |

**Nepal-specific accuracy caveat:** All global models struggle with Himalayan terrain. A 28km grid cell averages across enormous altitude differences. The Pokhara valley floor (800m) and Annapurna I summit (8,091m) can fall in adjacent cells. This is why:
- We use **pressure-level** data (not surface-level) for altitude-stratified cloud rendering
- We calibrate snowline against the FABDEM bare-earth DEM, not model terrain
- Confidence labels exist for a reason — "Forecast" is honest about model limitations

**Parameters we fetch from Open-Meteo:**

| Parameter | Used for |
|---|---|
| `cloud_cover`, `cloud_cover_low/mid/high` | Cloud shell alpha, Clear Window |
| `precipitation`, `precipitation_probability` | Rain layer, route ribbons, Decision Strip |
| `snowfall`, `snow_depth` | Snow layer |
| `temperature_2m` | Temperature layer |
| `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m` | Wind overlay, severity threshold |
| `cape` | Thunderstorm signal for severity |
| `geopotential_height_500hPa/700hPa/850hPa` | Altitude-stratified cloud rendering, freezing level |
| `freezing_level_height` | Route-aware snowline |
| `weather_code` | Fallback condition icon |

---

## DHM integration — official Nepal weather authority

**Source:** Department of Hydrology and Meteorology, Government of Nepal (https://www.dhm.gov.np)

**What DHM provides (free, public):**
- Daily weather forecast bulletins (national + regional)
- Severe weather warnings (heavy rainfall, thunderstorm, flood)
- River flood bulletins (Narayani, Koshi basins)
- Seasonal forecasts

**Integration approach:**
```
src\lib\dhm\
├── scrape-bulletin.ts     Poll DHM bulletin page every 15 min
├── parse-warning.ts       Extract severity, region, validity period
├── warning-types.ts       Typed warning structure
└── dhm-region-map.ts      Map DHM regions → our destination/corridor IDs
```

**Warning structure:**
```typescript
type DHMWarning = {
  id: string;
  type: "heavy_rain" | "thunderstorm" | "flood" | "landslide" | "snowfall";
  severity: "advisory" | "watch" | "warning";
  regions: string[];
  issuedAt: string;         // NPT
  validUntil: string;       // NPT
  text: string;             // original Nepali/English
  affectedCorridors: Array<"abc" | "ebc">;
  affectedDestinations: string[];
};
```

**Why every 15 min, not every 5?** DHM bulletins update 2–4 times/day, with ad-hoc severe weather alerts. Polling every 15 min catches alerts within 15 min of issuance — fast enough for the "Avoid" pill, which is not life-safety infrastructure. Polling every 5 min wastes cycles and risks getting IP-blocked.

**Graceful failure:** If DHM scrape fails, the Decision Strip still works — it just can't trigger the official-warning condition for "Avoid." The severity note changes to "Warning source unavailable."

---

## Seasonal baselines (ERA5 pre-computed)

Nepal's weather is dominated by the Asian monsoon. The product should contextualize current conditions against seasonal norms.

**Pre-computed once (offline), stored as static JSON:**
```
public\data\seasonal\
├── abc-monthly-normals.json
├── ebc-monthly-normals.json
├── pokhara-monthly-normals.json
└── ...per destination
```

**Structure per destination:**
```typescript
type MonthlyNormal = {
  month: number;              // 1–12
  avgCloudCoverPercent: number;
  avgPrecipitationMmDay: number;
  avgTemperature2mC: number;
  avgFreezingLevelM: number;
  typicalClearWindowHours: number;
  monsoonIntensity: "none" | "pre" | "active" | "post";
};
```

**Source:** ERA5 monthly averages (1991–2020 climatology) for each destination's grid cell, fetched once via the Copernicus CDS API. This is a one-time data preparation task, not a runtime fetch.

**How this surfaces in the product:**
- Replay summary can say "cloudier than average for October" instead of just "cloudy"
- Comparison Drawer can note "Mustang is typically drier than ABC in June" (monsoon shadow)
- Guide Brief can include seasonal context: "ABC in early May: pre-monsoon, expect afternoon buildup"

---

## Caching is a hard requirement

Open-Meteo's 10k req/day cap is reached fast without caching. The whole Decision Intelligence Layer computes server-side, and results are edge-cached. The client hits our API, never the upstream sources directly.

| Layer | Caching strategy | TTL | Why this TTL |
|---|---|---|---|
| Satellite frames | GitHub Actions cron → CDN; client never hits Himawari | — | Pipeline output |
| Open-Meteo forecast | Next.js route handler cache | 1h | Model runs every 6h; 1h cache is fresh enough |
| Open-Meteo historical | Next.js route handler cache | 24h | Historical data doesn't change |
| GFS fallback | Next.js route handler cache | 6h | Only fetched if Open-Meteo cap exhausted |
| NASA IMERG | Pre-fetched per corridor | 30 min | NRT has 4h latency; 30 min cache is fine |
| DHM warnings | Server-side poll cache | 15 min | Bulletins update 2–4×/day |
| Decision Strip | Edge-cached, server-computed | 10 min | Must feel responsive to weather changes |
| Clear Window | Edge-cached per destination/viewpoint | 10 min | Same reasoning |
| Comparison ranking | Edge-cached per trip-intent category | 10 min | Same |
| Route Ribbon | Edge-cached per corridor + time mode | 10 min | Same |
| Replay summary + evidence snapshots | Edge-cached | 30 min | 72h window shifts slowly |
| Mountain Visibility Index | Edge-cached | 10 min | Cloud mask changes fast |
| Regional snowline | Edge-cached | 30 min | Freezing level shifts slowly |
| Guide Brief JSON | Edge-cached (`/api/brief/[corridor]`) | 10 min | Must be fresh at 6 AM guide check |
| GLO-30 / FABDEM tiles | Static in CDN | Forever | Terrain doesn't change |
| ERA5 seasonal normals | Static in CDN | Forever | Pre-computed climatology |

**Request budget (worst-case daily):**

| Source | Requests/day | Notes |
|---|---|---|
| Open-Meteo forecast | ~600 | 7 destinations × 2 corridors × ~40 hourly refreshes + headroom |
| Open-Meteo pressure levels | ~200 | 4 shells × ~50 refreshes |
| Open-Meteo historical | ~50 | 72h queries, long TTL |
| DHM | ~96 | 1 req / 15 min |
| NASA IMERG | ~48 | Pre-fetched, 30 min TTL |
| GFS fallback | 0 (unless cap hit) | Emergency only |
| **Total** | **~994** | **Well under 10k/day cap** |

---

## Decision Intelligence cadences

| Primitive | Cadence | Source signals |
|---|---|---|
| Decision Strip | 10 min | Latest satellite + Open-Meteo forecast + DHM warnings + severity rules |
| Clear Window | 10 min | Forward 12h forecast + LoS + recent satellite + sunrise (suncalc) |
| Comparison Drawer (per intent) | 10 min | Composite of all destination signals within intent category |
| Route Ribbon (per time mode) | 10 min | Per-segment Open-Meteo + IMERG + regional snowline |
| Replay summary | 30 min | 72h archive (regenerated when oldest frame ages out) |
| Mountain Visibility | 10 min | Cloud mask along LoS + humidity + precip |
| Confidence labels | Inline per response | Source freshness flags |
| Regional snowline | 30 min | Open-Meteo geopotential per region |

All decision intelligence primitives compute server-side. **Never client-side** — too expensive and burns API quota.

---

## Severity thresholds for "Avoid"

The Decision Strip uses "Avoid" only when at least one applies:

| Trigger | Threshold | Source |
|---|---|---|
| Sustained precipitation | > 25 mm/h for ≥ 2 forecast hours | Open-Meteo |
| Sustained wind | > 60 km/h (≈ Beaufort 8+) | Open-Meteo |
| Official warning | DHM active bulletin (severity = "warning") | DHM scrape |
| Flash flood risk | Computed score above threshold (Phase 2; always false in v1) | Placeholder |
| Severe thunderstorm | CAPE > 2000 J/kg + cloud cover > 90% | Open-Meteo |

Anything below = "Watch", not "Avoid". The severity vocabulary matters — "Avoid Annapurna" must mean something.

---

## Sunrise weighting in Clear Window

`suncalc` computes sunrise / sunset / golden-hour times per destination lat/lon, returned in NPT.

**Algorithm:**
1. Compute hourly weather quality for next 12h
2. For each hour, mark `isDaylight`, `isSunrise`, `isGoldenHour`
3. Pre-dawn hours (`!isDaylight`) are dropped from window selection **unless** the destination has explicit pre-dawn value (Sarangkot, Poon Hill, Kala Patthar — for catching sunrise from a high vantage)
4. The longest contiguous run of `good` or `best` daylight hours = `next` window
5. UI renders the timeline with a sun icon at the sunrise hour

A clear window at 2 AM is suppressed unless the destination's product specifically values it.

---

## Confidence labels — the trust layer

### Source freshness thresholds

| Source | Fresh | Caution | Stale |
|---|---|---|---|
| Himawari satellite | < 30 min | 30–45 min | **> 45 min → "Stale"** |
| Open-Meteo forecast | within ±3h of model run | 3–6h | **> 6h → "Stale"** |
| DHM warning | within validity period | — | **past validity → discarded** |
| IMERG NRT | < 4h | 4–8h | > 8h |
| FABDEM (static) | n/a | n/a | n/a |
| Derived (LoS × cloud, snow type combos) | n/a | n/a | Always "Estimated" |

**Card rule:** the displayed label is the **worst** among contributing signals. A card combining a fresh satellite frame with a stale model run shows "Low confidence" or "Stale", not "Observed".

**Why so strict on satellite > 45 min:** mountain weather can shift faster than the next satellite frame arrives. A "Now" reading older than 45 minutes can mislead a user about a developing storm. Better to show "Stale" honestly than imply currency.

### Confidence scoring (per-response)

Each API response includes a confidence object:

```typescript
type ConfidenceBreakdown = {
  overall: "observed" | "forecast" | "estimated" | "low" | "stale";
  satellite: { age: number; status: "fresh" | "caution" | "stale" };
  model: { age: number; status: "fresh" | "caution" | "stale" };
  warning: { active: boolean; source: "dhm" | "none" };
  derivedSignals: string[];
  explanation: string;
};
```

The explanation field is a one-line plain-language summary: *"Satellite 12 min ago · Model 2h old · No active warnings"*.

---

## Satellite preprocessing pipeline

GitHub Actions cron, every 10 minutes. Output is static texture files served from CDN.

```
src\lib\satellite-preprocess\
├── fetch-himawari.ts         RAMMB (prototype) → AWS bucket (production)
├── crop-nepal-bbox.ts        Crop full-disk to Nepal bbox + 100km buffer
├── cloud-mask.ts             Band-difference cloud detection
├── altitude-bin.ts           Combine with Open-Meteo pressure levels → 4 shells
├── compress-ktx2.ts          GPU-friendly compressed textures
├── evidence-snapshot.ts      Generate cropped thumbnails for replay summaries
└── manifest.ts               Timestamps, bands, validity, freshness, provenance
```

**Output per cron run:**
- 4 KTX2 textures (one per altitude shell)
- 1 manifest JSON with NPT timestamp, source, validity, freshness, input sources hash
- Atomic swap: write to `/satellite/staging/`, then move to `/satellite/current/`

**Himawari band selection for Nepal:**

| Band | Wavelength | Use |
|---|---|---|
| B03 (visible) | 0.64 µm | Cloud texture (daytime only) |
| B08 (WV) | 6.2 µm | Upper-level moisture, high cloud detection |
| B13 (IR) | 10.4 µm | Cloud-top temperature → altitude estimation (24h) |
| B14 (IR) | 11.2 µm | Cloud detection (24h), difference with B13 for thin cirrus |
| B16 (IR) | 13.3 µm | CO₂ absorption, complements cloud-top altitude |

Daytime (B03 available): visible + IR composite. Nighttime: IR-only (B13/B14 difference + B08).

---

## Replay archive (72h rolling)

```
\public\satellite\
├── current\          (latest frame, 4 shells, manifest)
├── archive\
│   ├── 2026-05-08T04-50\
│   ├── 2026-05-08T05-00\
│   └── ...           (rolling 72h, 432 entries max)
├── snapshots\
│   ├── abc\
│   │   ├── best.jpg          (lowest cloud-mask coverage in window)
│   │   ├── worst.jpg         (highest cloud-mask coverage in window)
│   │   ├── current.jpg       (most recent significant frame)
│   │   └── labels.json       (timestamps + labels for the 3 above)
│   ├── ebc\
│   ├── pokhara\
│   └── ...
└── index.json
```

---

## Evidence snapshot generation (deterministic)

> **Naming note (2026-05-08):** "Evidence" replaces the earlier "Proof" terminology across all docs and types. Satellite snapshots, model output, and rain history are *evidence* — they support a recommendation but do not constitute ground truth. Ground truth requires field observation (webcam, guide report, lodge photo, official observation). The Evidence Ledger tags every claim with its source tier.

Algorithm — runs every 30 min per scope:

1. Iterate 72h archive, computing cloud-mask coverage % per frame for the scope's bbox
2. **Best:** frame with **minimum** coverage
3. **Worst:** frame with **maximum** coverage
4. **Current:** most recent frame, label its quality based on its coverage value
5. Crop preprocessed Himawari to scope bbox, resize to 320×240, JPEG quality 75
6. Generate plain-language label: relative time + quality (`"Yesterday 6:30 AM · Clear"`)

**Why deterministic matters:** the same input archive + scope must always produce the same 3 snapshots. Otherwise the evidence layer feels arbitrary, not systematic.

---

## Evidence Ledger — data provenance chain

Every API response carries a provenance manifest. This is the accountability mechanism.

```typescript
type EvidenceManifest = {
  responseId: string;
  computedAt: string;                   // NPT
  sources: Array<{
    id: string;                         // "himawari-b13", "openmeteo-forecast", "dhm-warning", etc.
    fetchedAt: string;                  // NPT when we fetched it
    sourceTimestamp: string;            // timestamp of the data itself
    age: number;                        // seconds between sourceTimestamp and computedAt
    status: "fresh" | "caution" | "stale";
    url?: string;                       // original source URL (for debugging, not displayed)
  }>;
  decisions: Array<{
    field: string;                      // "decisionStrip.bestNow", "clearWindow.next", etc.
    derivedFrom: string[];              // source IDs that contributed
    confidence: string;                 // the label applied
  }>;
};
```

**Where this lives:**
- Every `/api/*` JSON response includes a `_evidence` field with the manifest
- The satellite manifest.json includes input hashes so a snapshot can be traced to its source frame
- The Guide Brief plaintext footer includes: `Updated: 06:10 NPT · Himawari 06:00 · ECMWF 03:00 · Confidence: medium`

**Why this is lightweight, not a database:** The evidence manifest is generated per-response and served inline. No SQL tables, no append-only logs, no storage tiers. The CDN edge cache is the only "storage" — manifests expire with their parent responses. If we need historical auditing later, we add it then.

**What this enables:**
- A user can see exactly which sources informed their Decision Strip
- A guide sharing a Brief can show the data was fresh at the time
- We can detect and display when a stale source dragged down confidence
- Debugging source failures is trivial — check the manifest

---

## Plain-language replay summary

```
src\lib\replay\summarize.ts
```

**Inputs:**
- 72h cloud archive (per scope bbox)
- 72h IMERG precipitation aggregated per route segment
- Open-Meteo historical winds, temperature, freezing level
- Sunrise / sunset times from `suncalc` (NPT)
- ERA5 seasonal normals for the current month (optional — enriches context)

**Output:**
```typescript
type ReplaySummary = {
  scopeId: string;
  windowStart: string;     // NPT
  windowEnd: string;
  cloudBuildupPattern: string;
  bestVisibilityWindow: string;
  rainEvents: Array<{ segment?: string; intensity: "light" | "moderate" | "heavy"; count: number }>;
  trendForecast: "improving" | "stable" | "worsening";
  trendReasoning: string;
  seasonalContext?: string;     // "Cloudier than average for early May"
  evidenceSnapshots: Array<{ timestamp: string; thumbUrl: string; label: string; quality: "best" | "worst" | "current" }>;
};
```

---

## Snow layer data assembly (route-aware)

Per-region freezing level computation:

| Signal | Source | Refresh |
|---|---|---|
| Precipitation type (rain vs snow) | Open-Meteo | Hourly |
| Freezing level / 0°C isotherm altitude | Open-Meteo geopotential, queried per region | Hourly |
| Terrain elevation | FABDEM (static) | Never |
| Route segment altitudes | `src\data\corridors\*.ts` (static) | Never |
| Seasonal baseline freezing level | ERA5 monthly normals (static) | Never |

Regions defined in `src\data\regions.ts` (e.g. `annapurna_south`, `everest_khumbu`, `langtang`, `manaslu`, `dolpo_mustang`).

The Snowline contour is rendered per-region: a polyline tracing the terrain altitude that equals each region's freezing-level altitude.

The route's elevation profile is intersected by the corridor's regional snowline → label *"You cross the snowline at MBC"*.

**Validation approach:** When Sentinel-2 passes over a corridor after a snowfall event, compare the observed snow-cover edge against our computed snowline from that day's Open-Meteo geopotential. This is a periodic calibration check, not a real-time input. Log discrepancies for model-bias correction.

---

## NPT timezone enforcement

All API responses emit ISO 8601 with `+05:45` offset. Server formats display strings using:

```typescript
const formatNPT = (iso: string): string =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short",
  });
```

Client UI components always pass timestamps through this formatter. A small "NPT" indicator appears next to every visible time.

The browser's local timezone is **never** used for display.

---

## Low-bandwidth mode

**Detection:**
- `navigator.connection.effectiveType` returns `slow-2g` / `2g` / `3g` → engage
- Initial document fetch > 3 seconds → engage
- Manual toggle in settings → user override

**Behavior:**
- WebGL canvas paused; static rendered Nepal map served as a single PNG (~80KB, generated server-side from GLO-30)
- Satellite textures not loaded
- Replay 72h replaced by the text summary only — no scrubber, no thumbnails
- Decision Strip + cards + Clear Window remain (text-only)
- All animations paused
- Total payload target: **< 130KB** (decision JSON + base map PNG)

The decision must load in **under 2s on 2G**. The product is still useful even when the map can't render.

---

## Idle animation pause

`src\lib\performance\idle-monitor.ts`:

- Tracks pointer / touch / keyboard / scroll events
- After 30s of no input → `worldStore.idle = true`
- R3F components subscribe to `idle` and pause animation frames (cloud drift, replay autoplay, wind particles)
- User input flips `idle` back to `false`

Justification: smartphones drain rapidly in cold; trekkers need the device for emergency communication and photos. WebGL animation is the largest GPU draw in this product.

---

## Attribution requirements (visible to user)

App footer:
- Himawari-9 imagery: JMA / NOAA
- Weather forecast: Open-Meteo (ECMWF, GFS, ICON)
- Official warnings: Department of Hydrology and Meteorology, Nepal
- Copernicus DEM: ESA / EU
- FABDEM: University of Bristol (CC BY-NC-SA)
- Precipitation: NASA GPM / IMERG
- Climatology: ERA5 / Copernicus Climate Change Service
- Sun calculations: `suncalc`

---

## License path if commercialized

FABDEM is **CC BY-NC-SA 4.0**. If the product ever monetizes:
- Replace FABDEM with a bare-earth-corrected GLO-30 derivative we generate ourselves
- The `TerrainSource` abstraction makes this a config swap, not a rewrite
- Estimated effort: 1–2 days

Until then, v1 is non-commercial.

---

## Cost — this is a free product

| Item | Cost | Notes |
|---|---|---|
| Vercel hosting | Free tier (hobby) | Sufficient for MVP traffic |
| GitHub Actions (satellite cron) | Free tier (2,000 min/month) | 10-min cron × 6 runs/hour × 24h × 30d = 4,320 min → need optimization or paid tier |
| Open-Meteo | Free | 10k/day cap, non-commercial |
| NOAA GFS | Free | No limits |
| NASA IMERG | Free | Earthdata account required |
| DHM | Free | Public government data |
| ERA5 (CDS) | Free | One-time bulk download for normals |
| Copernicus GLO-30 | Free | One-time download |
| FABDEM | Free non-commercial | One-time download |
| Sentinel-2 | Free | Periodic validation only |
| Himawari AWS bucket | Free | `--no-sign-request` S3 |

**Total operational cost: $0/month** at MVP scale (Vercel free tier + free data sources). GitHub Actions minutes are the only potential constraint — optimize satellite pipeline to run in under 2 min per invocation, or batch to every 20 min instead of every 10 min during low-traffic hours.

**Scaling note:** If traffic exceeds Vercel's free tier (100GB bandwidth/month), move to Vercel Pro ($20/month) or self-host on a €5/month Hetzner VPS. The architecture doesn't assume cloud infrastructure — it's a Next.js app with static satellite assets and edge-cached API routes.

---

## Failure modes and fallbacks

| Failure | Detection | Fallback | User-visible |
|---|---|---|---|
| RAMMB tile timeout (prototype) | HTTP 5xx / timeout | Last-cached frame | "Stale" badge |
| AWS Himawari bucket error | S3 error / empty response | Last-cached frame | "Stale" badge |
| Open-Meteo cap exhausted | HTTP 429 | GFS direct fallback (coarser) + warning | "Forecast source: GFS (lower resolution)" footer |
| Open-Meteo 5xx | HTTP 5xx | 1h-cached response + GFS fallback | "Forecast may be delayed" footer |
| DHM scrape fails | Timeout / parse error | Omit official-warning trigger from Decision Strip | "Warning source unavailable" note |
| GitHub Actions cron skipped | Missing manifest timestamp | Last-good manifest, extend staleness | Older NPT timestamp |
| Single Himawari band missing | Missing file in fetch | Other bands work; affected layer disabled | Toggle disabled with reason |
| FABDEM tile corrupt | Checksum mismatch | GLO-30 fallback (lower fidelity, canopy included) | None |
| IMERG NRT delayed | Data age > 8h | Open-Meteo precipitation fills gap | Replay summary notes source swap |
| Decision Strip computation fails | Exception in compute | Last-good Decision Strip from cache | Older NPT timestamp on strip |
| Clear Window pattern detection fails | No pattern found in data | Falls back to "next 12h timeline" without pattern claim | Confidence drops to "Low" |
| Evidence snapshot generation fails | Exception or empty archive | Replay shows summary text only, no thumbs | None — graceful degradation |
| Stale satellite > 45 min | Manifest timestamp check | Continues showing last frame, downgrades label | **Visible warning, not silent** |
| Slow connection detected | Network API + timing heuristic | Auto-engage Low-bandwidth mode | Banner: "Low-bandwidth mode active" |
| User idle > 30s | Input event timeout | Animations pause | None (resumes on interaction) |
| ERA5 data unavailable | Missing static file | Omit seasonal context from summaries | None — context is additive |

Every failure mode keeps the product functional with degraded confidence. We never show a blank map. We never silently lie about freshness.

---

## Data freshness display

Three timestamps always visible (collapsed on mobile, expanded on desktop) — **all NPT**:

```
Himawari frame: 04:50 NPT (8 min ago)
Forecast model: 03:00 NPT (ECMWF IFS · 1h 58m ago)
Local time:     04:58 NPT
```

**Desktop expanded view adds:**
```
DHM bulletin:   04:00 NPT (58 min ago)
Precipitation:  04:30 NPT (IMERG · 28 min ago)
```

Trekkers and guides making decisions need to know freshness. Hiding it behind a tooltip is wrong.

---

## Guide Brief data structure (v1 backend, v1.1 UI)

API endpoint shipping in v1 even though export UI is v1.1:

```
GET /api/brief/[corridor]?date=YYYY-MM-DD&format=json|text
```

```typescript
type GuideBrief = {
  corridorId: "abc" | "ebc";
  date: string;                                 // NPT date
  decisionStrip: DecisionStripResponse;         // server API shape (see ARCHITECTURE.md)
  corridorCard: CorridorCardData;               // see src/types/weather.ts
  segments: RouteRibbon["segments"];            // see ARCHITECTURE.md §RouteRibbon
  clearWindows: ClearWindow[];                  // hero viewpoints in this corridor
  evidenceSnapshots: ReplaySummary["evidenceSnapshots"]; // see ARCHITECTURE.md §ReplaySummary
  // Field-report layer is v2; v1 returns evidenceTier: "no-field-report" by default
  plainTextBrief: string;                       // WhatsApp-pasteable
  _evidence: EvidenceManifest;                        // data provenance
  generatedAt: string;                          // NPT
};
```

A guide can `curl` this endpoint at 6 AM and paste the `plainTextBrief` into a client message. v1.1 wraps it in an export UI (image / WhatsApp link / PDF).

Example `plainTextBrief`:
```
ABC Weather Brief — Tomorrow (NPT)
Best movement window: 6–10 AM
Lower trail: wet around Chhomrong–Bamboo (18mm last 24h)
Snow concern: above MBC after afternoon
Mountain view: best before 8:30 AM
Pattern: clouds build from south after late morning (3 days in a row)
Season: typical for early May pre-monsoon
Updated: 06:10 NPT · Himawari 06:00 · ECMWF 03:00 · Confidence: medium
```

---

## What this document deliberately does NOT include

**No multi-tier storage architecture.** We're on Vercel, not AWS. Edge cache + CDN static files + Next.js route caching is the entire storage story. If usage scales past Vercel's limits, we add a caching layer then.

**No SQL schema for data management.** Satellite frames are files. API responses are computed and cached. There is no database in v1. The product is stateless except for the CDN.

**No WMO validation framework.** We validate with acceptance tests (see ARCHITECTURE.md) and Sentinel-2 spot-checks. Formal meteorological validation is for institutions with ground-truth stations.

**No cost tiers above $0/month.** Every source is free. Every service is free-tier or free-with-account. If we outgrow free tiers, the fix is a $20/month Vercel upgrade, not a $800/month cloud bill.

**No optical flow nowcasting, monsoon front tracking, or AI oracle.** Those are v2. See PRODUCT.md §18.4.
