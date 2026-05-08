# Architecture

How the Nepal Mountain Weather Decision Map is built underneath. If this conflicts with PRODUCT.md, PRODUCT.md wins.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript strict |
| 3D engine | Three.js + React Three Fiber |
| 3D helpers | `@react-three/drei`, `@react-three/postprocessing` (deferred to Step 6) |
| State | Zustand (multi-store, see §State management) |
| Data fetching | SWR + Next.js route caching |
| Styling | Tailwind CSS v4 |
| Lint/format | Biome |
| Hosting | Vercel (frontend) + GitHub Actions (cron preprocessing) |

---

## 3D engine choice — why Three.js + R3F

The locking constraint is that on **tilt**, peaks must visibly puncture cloud decks at correct altitude. Map renderers (MapLibre, Cesium, OpenLayers) drape imagery onto terrain as a surface texture. Only 3D geometry at altitude with depth-testing against the terrain mesh can produce the visual.

The 3D engine is a tool serving the product. The product is **not** a 3D simulator.

---

## State management

**Three focused Zustand stores, not one monolith.** SWR handles the data cache.

```typescript
// 1. World state — camera, time, layers, performance
type WorldStore = {
  cameraMode: "topdown" | "tilt";
  timeMode: "now" | "tomorrow_am" | "afternoon" | "last_24h";
  replayPosition: number | null;       // null = live
  activeLayer: "clouds" | "rain" | "snow" | "current" | "temperature";
  windOverlay: boolean;
  performanceTier: "low" | "medium" | "high";
  lowBandwidthMode: boolean;
  idle: boolean;                        // animations paused if true
  set: (...) => void;
};

// 2. Selection state — what the user clicked
type SelectionStore = {
  selectedDestinationId: string | null;
  selectedCorridor: "abc" | "ebc" | null;
  selectedSegmentId: string | null;
  selectedViewpointId: string | null;
  insightPanelOpen: boolean;
  comparisonDrawerOpen: boolean;
  set: (...) => void;
};

// 3. (No third store — SWR handles data caching with built-in invalidation)
```

**Click flow when a marker is tapped:**
1. `DestinationMarker.onClick` → `selectionStore.set({ selectedDestinationId, insightPanelOpen: true })`
2. Side panel subscribes to the `selectedDestinationId` slice → re-renders with the new destination
3. Time scrubber subscribes to the `replayPosition` slice → operates independently
4. R3F scene subscribes to `cameraMode` + `selectedDestinationId` → camera flies to marker
5. Insight Panel uses SWR to fetch `/api/destination/[id]` — cached per-id

**Why not Context:** Context re-renders every consumer on any change. Zustand selector subscriptions only re-render components whose specific slice changed.

**Idle detection:** `worldStore.idle` flips to `true` after 30s of no pointer/touch/keyboard input. R3F components subscribe and pause animation frames; replay scrubber pauses. User interaction flips it back.

---

## Decision Intelligence Layer

Each primitive is a server-computed signal cached and refreshed on its own cadence. None compute client-side.

### 1. Where is good now / tomorrow morning? — `DecisionStrip`

**Server API response shape** (returned by `/api/decision-strip`):

```typescript
type DecisionStripResponse = {
  bestNow: Array<{ destinationId: string; reason: string }>;
  bestTomorrowAM: Array<{ destinationId: string; reason: string }>;
  watch: Array<{ description: string; affectedRoutes: string[]; clickTarget: string }>;
  avoid?: Array<{ description: string; severity: "storm" | "flood" | "wind" | "warning"; affectedRoutes: string[] }>;
  computedAt: string;  // ISO with NPT offset
  sources: { satellite: string; model: string };
};
```

**UI component shape** (used by `DecisionStrip.tsx`, defined in `src/types/weather.ts`):

```typescript
type DecisionStripPill = {
  category: "best_now" | "best_view" | "watch" | "avoid";
  label: string;
  items: Array<{ destinationId: string; name: string; reason: string }>;
};

type DecisionStripData = {
  pills: DecisionStripPill[];
  computedAt: string;
};
```

The server response is transformed into the UI shape in `src/lib/decision/decision-strip.ts`. Step 1 uses `DecisionStripData` directly with mock data; the transform is wired in Step 4.

**Severity threshold for `avoid`:** precipitation > 25mm/h sustained, sustained wind > 60 km/h, official DHM warning, flash flood risk score > threshold. Anything below = `watch`, not `avoid`.

### 2. When is the next clear window? — `ClearWindow`

```typescript
type ClearWindow = {
  destinationId: string;
  viewpointId?: string;
  next: { from: string; to: string; quality: "good" | "best" } | null;
  hourlyTimeline: Array<{
    hour: string;        // ISO with NPT
    quality: "best" | "good" | "watch" | "cloudy" | "poor";
    isDaylight: boolean;
    isSunrise: boolean;
    isGoldenHour: boolean;
  }>;
  pattern: string;
  bestOfLast7Days: { day: string; window: string } | null;
  confidence: "low" | "medium" | "high";
};
```

**Sunrise weighting:** the algorithm pre-filters non-daylight hours unless the destination has explicit pre-dawn value (Sarangkot, Poon Hill, Kala Patthar). Sunrise time computed via `suncalc` per destination lat/lon, in NPT. Sunrise marker on the timeline UI.

### 3. What changed in the last 72 hours? — `ReplaySummary`

```typescript
type ReplaySummary = {
  scopeId: string;
  windowStart: string;  // NPT
  windowEnd: string;
  cloudBuildupPattern: string;
  bestVisibilityWindow: string;
  rainEvents: Array<{ segment?: string; intensity: "light" | "moderate" | "heavy"; count: number }>;
  trendForecast: "improving" | "stable" | "worsening";
  trendReasoning: string;
  evidenceSnapshots: Array<{ timestamp: string; thumbUrl: string; label: string; quality: "best" | "worst" | "current" }>;
};
```

**Snapshot selection (deterministic):**
1. Iterate 72h archive, computing cloud-mask coverage % per frame for the scope's bbox
2. **Best:** frame with minimum coverage → label "Clear"
3. **Worst:** frame with maximum coverage → label "Clouded"
4. **Current:** most recent frame → label "Partial / Clear / Clouded" based on its coverage value
5. Crop, resize to 320×240, JPEG, label with relative time + plain quality

### 4. Which route segments are affected? — `RouteRibbon`

```typescript
type RouteRibbon = {
  corridorId: "abc" | "ebc";
  timeMode: "now" | "tomorrow_am" | "afternoon" | "last_24h";
  segments: Array<{
    segmentId: string;
    fromWaypoint: string;
    toWaypoint: string;
    condition: "dry" | "damp" | "wet" | "slippery" | "snow" | "cloud_ceiling" | "warning";
    plainLanguage: string;
    rainLast24h: number;
    rainNext12h: number;
    cloudCeiling: number | null;
    snowAboveAltitude: number | null;
    crossesSnowline: boolean;
  }>;
  snowlineForCorridor: number;     // meters, route-specific
  snowlineCrossingWaypoint: string | null;
};
```

The user toggles `timeMode` and the ribbon re-fetches with the new mode.

### 5. How confident is this answer? — `ConfidenceLabel` + `EvidenceTier`

The product splits two questions that previous drafts conflated:

- **Evidence tier:** *where did this come from?* (a source-type label)
- **Confidence:** *how certain are we?* (a freshness/agreement label)

#### Evidence tier (source provenance)

```typescript
type EvidenceTier =
  | "observed-satellite"     // Satellite cloud mask / IMERG precipitation
  | "official-warning"       // DHM bulletin
  | "forecast-model"         // Open-Meteo / GFS forecast
  | "estimated-derived"      // Combined signals (LoS × cloud, snowline × terrain)
  | "field-reported"         // v2 — verified guide/lodge/operator (NOT in v1)
  | "no-field-report";       // v1 default — no human ground-truth available
```

In v1, every route-condition card defaults to `no-field-report` for the human-truth slot. This makes the data honesty visible:

```
Bamboo → Deurali
Slippery likely · Forecast + recent rain
Field report: not available
```

The `field-reported` tier is reserved infrastructure — its value comes from being earned in v2, not assumed in v1.

#### Confidence label (freshness + agreement)

| Label | Meaning | Trigger |
|---|---|---|
| **Observed** | Backed by satellite or sensor within last 30 min | Most recent satellite frame < 30 min |
| **Forecast** | Open-Meteo within ±3h of model run | Model age < 3h |
| **Estimated** | Derived (LoS × cloud mask, snow type combinations) | Always for derived signals |
| **Low confidence** | Sparse data region, contradictory signals, or model > 3h old | Model 3–6h, or satellite 30–45 min |
| **Stale** | Source older than threshold | **Satellite > 45 min OR model > 6h** |

**Card label rule:** the card displays the **worst** label among contributing signals. Mountain weather changes faster than model runs; we never pretend freshness.

---

## Cloud rendering — implementation behind the "Clouds" toggle

| Shell | Altitude | Pressure band |
|---|---|---|
| Low | 0.8–2.5 km | 950–800 hPa |
| Mid-low | 2.5–5.5 km | 800–500 hPa |
| Mid-high | 5.5–8.0 km | 500–350 hPa |
| High | 8.0–12 km | 350–200 hPa |

**Top-down view:** four shells composite into one visible cloud field.
**Tilt view:** shells separate; peaks puncture the deck.

**Alpha logic:** satellite drives cloud existence; Open-Meteo pressure-level cloud cover drives altitude weighting (which shell is opaque).

**Internal framing:** "satellite-observed cloud rendering with model-estimated altitude stratification." Never overclaim *correct altitude*.

---

## Snow rendering — route-aware

Per-region freezing-level computation:

```typescript
type RegionalSnowline = {
  regionId: string;        // "annapurna_south", "everest", "langtang", ...
  altitudeMeters: number;
  validFrom: string;       // NPT
  validTo: string;
  source: "openmeteo_geopotential" | "estimated";
};
```

National Overview uses a min/max range across regions: *"Snowline ~4,200–4,600m by region"*.
Route Detail uses the corridor's specific region snowline + identifies which segment crosses it.

The snowline contour is drawn at each region's freezing-level altitude (a polyline that follows terrain elevation = snowline value).

---

## Mountain Visibility Index — the supporting card

Surfaced as one card in the Destination Insight Panel for hero viewpoints. **Supports** Clear Window; doesn't replace it.

**Hero viewpoints:**

| Corridor | Viewpoint | Target peaks |
|---|---|---|
| ABC | Pokhara (Sarangkot) | Annapurna II, Machhapuchhre, Annapurna South |
| ABC | Poon Hill | Dhaulagiri, Annapurna South, Machhapuchhre |
| ABC | Chhomrong | Machhapuchhre, Annapurna South, Hiunchuli |
| ABC | ABC | Annapurna I, South, Machhapuchhre, Hiunchuli |
| EBC | Namche | Thamserku, Kongde Ri, Everest (partial) |
| EBC | Tengboche | Everest, Lhotse, Ama Dablam, Nuptse |
| EBC | Lobuche | Pumori, Nuptse |
| EBC | Kala Patthar | Everest, Lhotse, Nuptse, Pumori |

```typescript
type MountainVisibilityIndex = {
  viewpointId: string;
  targetPeaks: string[];
  timeWindow: { from: string; to: string };
  visibleScore: number;            // 0–100
  cloudObstruction: number;
  precipitationRisk: number;
  hazeHumidityPenalty: number;
  confidence: "low" | "medium" | "high";
  explanation: string;
  bestWindow: { from: string; to: string } | null;
};
```

---

## Customer Lens (data structure shipped v1, UI v1.1+)

```typescript
type LensConfig = {
  id: "traveler" | "guide" | "photographer" | "flight" | "hotel";
  pinnedCard: string;
  cardEmphasis: string[];
  summaryToneTemplate: string;
};
```

**v1 ships only `traveler`.** The data layer is structured so adding `guide` in v1.1 is configuration. No UI lens selector in v1.

---

## Guide Brief data structure (v1 backend, v1.1 UI)

Even though the Guide Brief UI ships in v1.1, the v1 API exposes a single endpoint:

```
GET /api/brief/[corridor]?date=YYYY-MM-DD&format=json|text
```

Response:
```typescript
type GuideBrief = {
  corridorId: "abc" | "ebc";
  date: string;
  decisionStrip: DecisionStrip;
  corridorCard: CorridorCard;
  segments: RouteRibbon["segments"];
  clearWindows: ClearWindow[];      // for hero viewpoints in this corridor
  evidenceSnapshots: ReplaySummary["evidenceSnapshots"];
  plainTextBrief: string;            // the WhatsApp-pasteable version
  generatedAt: string;
};
```

This means a guide can `curl` the endpoint at 6 AM and get a usable text blob. v1.1 wraps it in an export UI (image / WhatsApp link / PDF).

---

## Forecast Accuracy Ledger (v1.1 — sketch only)

The 72h satellite archive built in Step 3B already has everything needed to score yesterday's predictions. v1.1 surfaces this:

```typescript
type ForecastAccuracyEntry = {
  destinationId: string;
  predictionMadeAt: string;        // NPT
  predictedFor: string;             // the target window
  predictedWindow: { from: string; to: string; quality: "good" | "best" };
  observedFromArchive: {
    cloudCoverageOverWindow: number;     // 0–1
    coveragePeakAtMinute: number;        // when cloud was worst within window
    matchPercent: number;                // % of window that observed cloud-mask < threshold
  };
  verdict: "supported" | "partial" | "missed";
  evidenceFrameUrl: string;          // link to the archived satellite frame
};
```

The Insight Panel surfaces a compact "Yesterday's call" card:

```
Yesterday's prediction
Poon Hill clear 5:50–8:20 AM

Observed (satellite):
Low cloud obstruction 6:10–8:00 AM

Verdict: 82% match · supported
```

**Why it's not in v1:** the daily cron + storage of yesterday's predictions is non-trivial. v1 has the archive and the model output but doesn't yet snapshot predictions into a ledger. v1.1 adds the snapshot job + the surface.

**Why this is the trust moat:** generic weather apps never expose their hit rate at this granularity. A Nepal-specific accuracy ledger turns "trust us" into "watch our hit rate over time."

---

## Performance tiers

Auto-detected at session start. Forced low if `lowBandwidthMode` is on.

| Tier | Target | Cloud shells | Particles | Postprocessing | Camera |
|---|---|---|---|---|---|
| Low | Snapdragon 6/7 / slow connection | 1 (composite) | None | Off | Static angles |
| Medium | Snapdragon 8 / mid laptop | 2 | Light wind | Light bloom | Free orbit |
| High | Desktop dGPU / M-series | 4 | Full wind | Atmosphere + bloom | Cinematic |

```
src\lib\performance\
├── detect-tier.ts
├── bandwidth-detect.ts       Network Information API + payload-time fallback
├── texture-budget.ts
├── lod-policy.ts
├── idle-monitor.ts           30s no-interaction → pause animations
└── mobile-fallback.ts
```

---

## Low-bandwidth mode

**Detection:**
- `navigator.connection.effectiveType` if available (`slow-2g`, `2g`, `3g` → engage)
- Initial payload time > 3s → engage
- Manual toggle in settings

**When engaged:**
- WebGL canvas paused; static rendered Nepal map served as a single PNG (~80KB)
- Satellite layers off; Decision Strip + cards remain
- Animation paused
- Replay 72h replaced with text summary only (no scrubber, no thumbnails)
- Total payload target: < 50KB JSON + 80KB image = < 130KB

The decision must load in under 2s on 2G. The product is still useful even if the map isn't.

---

## NPT timezone enforcement

All server-rendered timestamps emit ISO 8601 with `+05:45` offset. All client UI formats display NPT regardless of `Intl.DateTimeFormat` default. A small `NPT` indicator appears next to every visible time.

```typescript
const formatNPT = (iso: string): string =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short",
  });
```

---

## Validation tests (gate every release)

| Test | Pass condition |
|---|---|
| Terrain accuracy | Major peak labels align within ±20m |
| Cloud georegistration | Cloud-free frame shows landmarks at correct lat/lon |
| Time sync | Three timestamps visible in NPT (Himawari, Open-Meteo, browser) |
| Occlusion | Peaks above active shell visibly puncture deck on tilt |
| Mobile FPS | 25–30 FPS on Snapdragon 7-class baseline |
| Data fallback | RAMMB timeout → last-cached frame + visible "stale" badge |
| Attribution | All sources visible |
| Visibility Index sanity | Cloudy frame over Annapurna → ABC viewpoint score < 30 |
| Replay summary | Plain-language summary + 3 deterministic snapshots |
| Layer dominance | Toggling dims others within 200ms |
| Decision Strip freshness | Updates within 10 min of source change |
| Clear Window pattern detection | Detects "clouds build after X AM" across 7 days of test data |
| Confidence label correctness | Aged data downgrades to "Stale" within 30/45 min satellite, 6h model |
| **NPT enforcement** | UI shows NPT for all timestamps regardless of browser locale |
| **Idle pause** | Animations pause within 30s of no interaction |
| **Low-bandwidth** | Decision Strip + cards render in < 2s on simulated 2G |
| **Stale "Now" downgrade** | Satellite > 45 min triggers visible warning, not silent display |

---

## Static data reference — coordinates and identifiers

All coordinates are WGS84 decimal degrees. Altitudes are meters ASL. These are the **canonical values** for map placement, weather API queries, and suncalc calculations.

### Nepal bounding box

```typescript
// src/data/nepal-bbox.ts
export const NEPAL_BBOX = {
  west: 80.06,
  south: 26.35,
  east: 88.20,
  north: 30.45,
} as const;

// Default map center (geographic center of Nepal, roughly)
export const NEPAL_CENTER = { lat: 28.3949, lon: 84.1240 } as const;
```

### 8 destinations + 2 trail entries

**Jomsom is included for the rain-shadow comparison wedge.** During monsoon and shoulder season, Mustang/Jomsom often stays clear when Pokhara/ABC are clouded out — a strategically meaningful alternative the Comparison Drawer surfaces. The destination is otherwise treated like Chitwan/Kathmandu/Langtang: standalone, no corridor route in v1.

```typescript
// src/data/destinations.ts
export type DestinationId =
  | "pokhara" | "abc" | "poon-hill" | "ebc"
  | "chitwan" | "kathmandu" | "langtang" | "jomsom";

export type TrailEntryId = "nayapul" | "lukla";

export type TripIntent = "mountain_views" | "trekking" | "lowland";

export type Destination = {
  id: DestinationId;
  name: string;
  shortLabel: string;          // for map marker (≤12 chars)
  lat: number;
  lon: number;
  altitude: number;            // meters ASL
  corridor: "abc" | "ebc" | null;
  tripIntent: TripIntent;
  preDawnValue: boolean;       // true if Clear Window should include pre-dawn hours
  defaultViewpointId: string | null;
};

export const DESTINATIONS: Destination[] = [
  { id: "pokhara",   name: "Pokhara",              shortLabel: "Pokhara",    lat: 28.2095, lon: 83.9595, altitude: 827,  corridor: null,  tripIntent: "mountain_views", preDawnValue: false, defaultViewpointId: "sarangkot" },
  { id: "abc",       name: "Annapurna Base Camp",   shortLabel: "ABC",        lat: 28.5319, lon: 83.8786, altitude: 4130, corridor: "abc", tripIntent: "trekking",       preDawnValue: false, defaultViewpointId: "abc-viewpoint" },
  { id: "poon-hill", name: "Poon Hill",             shortLabel: "Poon Hill",  lat: 28.3994, lon: 83.6908, altitude: 3210, corridor: "abc", tripIntent: "mountain_views", preDawnValue: true,  defaultViewpointId: "poon-hill" },
  { id: "ebc",       name: "Everest Base Camp",     shortLabel: "EBC",        lat: 28.0072, lon: 86.8594, altitude: 5364, corridor: "ebc", tripIntent: "trekking",       preDawnValue: false, defaultViewpointId: "kala-patthar" },
  { id: "chitwan",   name: "Chitwan National Park", shortLabel: "Chitwan",    lat: 27.5372, lon: 84.4479, altitude: 150,  corridor: null,  tripIntent: "lowland",        preDawnValue: false, defaultViewpointId: null },
  { id: "kathmandu", name: "Kathmandu",             shortLabel: "Kathmandu",  lat: 27.7124, lon: 85.3113, altitude: 1400, corridor: null,  tripIntent: "lowland",        preDawnValue: false, defaultViewpointId: null },
  { id: "langtang",  name: "Langtang Village",      shortLabel: "Langtang",   lat: 28.2128, lon: 85.5150, altitude: 3430, corridor: null,  tripIntent: "trekking",       preDawnValue: false, defaultViewpointId: null },
  { id: "jomsom",    name: "Jomsom (Mustang)",      shortLabel: "Jomsom",     lat: 28.7833, lon: 83.7333, altitude: 2720, corridor: null,  tripIntent: "mountain_views", preDawnValue: false, defaultViewpointId: null },
];

export const TRAIL_ENTRIES: Array<{ id: TrailEntryId; name: string; shortLabel: string; lat: number; lon: number; altitude: number; corridor: "abc" | "ebc" }> = [
  { id: "nayapul", name: "Nayapul",                     shortLabel: "Nayapul",  lat: 28.2997, lon: 83.7706, altitude: 1070, corridor: "abc" },
  { id: "lukla",   name: "Lukla (Tenzing-Hillary Airport)", shortLabel: "Lukla", lat: 27.6868, lon: 86.7294, altitude: 2860, corridor: "ebc" },
];
```

### 8 hero viewpoints

```typescript
// src/data/viewpoints.ts
export type ViewpointId =
  | "sarangkot" | "poon-hill" | "chhomrong" | "abc-viewpoint"
  | "namche" | "tengboche" | "lobuche" | "kala-patthar";

export type Viewpoint = {
  id: ViewpointId;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
  corridor: "abc" | "ebc";
  targetPeaks: string[];       // peak IDs visible from this viewpoint
  preDawnValue: boolean;
};

export const VIEWPOINTS: Viewpoint[] = [
  { id: "sarangkot",     name: "Sarangkot",           lat: 28.2445, lon: 83.9477, altitude: 1592, corridor: "abc", targetPeaks: ["annapurna-ii", "machhapuchhre", "annapurna-south"], preDawnValue: true },
  { id: "poon-hill",     name: "Poon Hill",           lat: 28.3994, lon: 83.6908, altitude: 3210, corridor: "abc", targetPeaks: ["dhaulagiri", "annapurna-south", "machhapuchhre"],  preDawnValue: true },
  { id: "chhomrong",     name: "Chhomrong",           lat: 28.4098, lon: 83.8208, altitude: 2170, corridor: "abc", targetPeaks: ["machhapuchhre", "annapurna-south", "hiunchuli"],   preDawnValue: false },
  { id: "abc-viewpoint", name: "Annapurna Base Camp", lat: 28.5319, lon: 83.8786, altitude: 4130, corridor: "abc", targetPeaks: ["annapurna-i", "annapurna-south", "machhapuchhre", "hiunchuli"], preDawnValue: false },
  { id: "namche",        name: "Namche Bazaar",       lat: 27.8069, lon: 86.7140, altitude: 3440, corridor: "ebc", targetPeaks: ["thamserku", "kongde-ri", "everest"],               preDawnValue: false },
  { id: "tengboche",     name: "Tengboche",           lat: 27.8336, lon: 86.6999, altitude: 3867, corridor: "ebc", targetPeaks: ["everest", "lhotse", "ama-dablam", "nuptse"],       preDawnValue: false },
  { id: "lobuche",       name: "Lobuche",             lat: 27.9557, lon: 86.7873, altitude: 4940, corridor: "ebc", targetPeaks: ["pumori", "nuptse"],                                preDawnValue: false },
  { id: "kala-patthar",  name: "Kala Patthar",        lat: 27.9881, lon: 86.8287, altitude: 5644, corridor: "ebc", targetPeaks: ["everest", "lhotse", "nuptse", "pumori"],           preDawnValue: true },
];
```

### Corridor route segments

```typescript
// src/data/corridors/abc.ts
export type RouteWaypoint = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
};

export type RouteSegment = {
  id: string;
  from: RouteWaypoint;
  to: RouteWaypoint;
};

export const ABC_WAYPOINTS: RouteWaypoint[] = [
  { id: "pokhara",  name: "Pokhara",  lat: 28.2095, lon: 83.9595, altitude: 827 },
  { id: "nayapul",  name: "Nayapul",  lat: 28.2997, lon: 83.7706, altitude: 1070 },
  { id: "ghandruk", name: "Ghandruk", lat: 28.3803, lon: 83.8119, altitude: 1940 },
  { id: "chhomrong",name: "Chhomrong",lat: 28.4098, lon: 83.8208, altitude: 2170 },
  { id: "bamboo",   name: "Bamboo",   lat: 28.4417, lon: 83.8469, altitude: 2310 },
  { id: "deurali",  name: "Deurali",  lat: 28.4833, lon: 83.8708, altitude: 3230 },
  { id: "mbc",      name: "MBC",      lat: 28.5086, lon: 83.8794, altitude: 3700 },
  { id: "abc",      name: "ABC",      lat: 28.5319, lon: 83.8786, altitude: 4130 },
];

// Segments are consecutive pairs: pokhara→nayapul, nayapul→ghandruk, etc.
// Generated at runtime from waypoint array.

// src/data/corridors/ebc.ts
export const EBC_WAYPOINTS: RouteWaypoint[] = [
  { id: "lukla",     name: "Lukla",     lat: 27.6868, lon: 86.7294, altitude: 2860 },
  { id: "phakding",  name: "Phakding",  lat: 27.7400, lon: 86.7126, altitude: 2610 },
  { id: "namche",    name: "Namche",    lat: 27.8069, lon: 86.7140, altitude: 3440 },
  { id: "tengboche", name: "Tengboche", lat: 27.8336, lon: 86.6999, altitude: 3867 },
  { id: "dingboche", name: "Dingboche", lat: 27.8923, lon: 86.8314, altitude: 4410 },
  { id: "lobuche",   name: "Lobuche",   lat: 27.9557, lon: 86.7873, altitude: 4940 },
  { id: "gorakshep", name: "Gorak Shep",lat: 27.9811, lon: 86.8286, altitude: 5164 },
  { id: "ebc",       name: "EBC",       lat: 28.0072, lon: 86.8594, altitude: 5364 },
];
```

### Peaks

```typescript
// src/data/peaks.ts
export type Peak = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
};

export const PEAKS: Peak[] = [
  { id: "annapurna-i",     name: "Annapurna I",     lat: 28.5961, lon: 83.8203, altitude: 8091 },
  { id: "machhapuchhre",   name: "Machhapuchhre",   lat: 28.4947, lon: 83.9462, altitude: 6993 },
  { id: "annapurna-south", name: "Annapurna South", lat: 28.5183, lon: 83.8064, altitude: 7219 },
  { id: "hiunchuli",       name: "Hiunchuli",       lat: 28.5167, lon: 83.8833, altitude: 6441 },
  { id: "dhaulagiri",      name: "Dhaulagiri",      lat: 28.6977, lon: 83.4861, altitude: 8167 },
  { id: "everest",         name: "Sagarmatha",      lat: 27.9881, lon: 86.9250, altitude: 8849 },
  { id: "lhotse",          name: "Lhotse",          lat: 27.9617, lon: 86.9333, altitude: 8516 },
  { id: "nuptse",          name: "Nuptse",          lat: 27.9664, lon: 86.8900, altitude: 7861 },
  { id: "ama-dablam",      name: "Ama Dablam",      lat: 27.8611, lon: 86.8611, altitude: 6812 },
  { id: "pumori",          name: "Pumori",          lat: 28.0153, lon: 86.8277, altitude: 7161 },
  { id: "thamserku",       name: "Thamserku",       lat: 27.7892, lon: 86.7850, altitude: 6623 },
  { id: "kongde-ri",       name: "Kongde Ri",       lat: 27.7930, lon: 86.6428, altitude: 6187 },
  { id: "annapurna-ii",    name: "Annapurna II",    lat: 28.5358, lon: 84.1214, altitude: 7937 },
];
```

### Snowline regions

```typescript
// src/data/regions.ts
export type SnowlineRegion = {
  id: string;
  name: string;
  centroidLat: number;
  centroidLon: number;
  typicalSnowlineRange: [number, number]; // [min, max] meters ASL, seasonal
  corridors: Array<"abc" | "ebc">;
};

export const REGIONS: SnowlineRegion[] = [
  { id: "annapurna_south",  name: "Annapurna South",  centroidLat: 28.5300, centroidLon: 83.8400, typicalSnowlineRange: [4200, 5500], corridors: ["abc"] },
  { id: "everest_khumbu",   name: "Everest / Khumbu", centroidLat: 27.9900, centroidLon: 86.8600, typicalSnowlineRange: [5000, 5600], corridors: ["ebc"] },
  { id: "langtang",         name: "Langtang",         centroidLat: 28.2500, centroidLon: 85.5500, typicalSnowlineRange: [4800, 5400], corridors: [] },
  { id: "manaslu",          name: "Manaslu",          centroidLat: 28.5494, centroidLon: 84.5619, typicalSnowlineRange: [5000, 5500], corridors: [] },
  { id: "dolpo_mustang",    name: "Dolpo / Mustang",  centroidLat: 28.9500, centroidLon: 83.5000, typicalSnowlineRange: [5200, 5800], corridors: [] },
];
```

---

## File structure

```
C:\Users\ACER\Projects\Weather\
├── PRODUCT.md                      ← what + why (locked v1.2)
├── ARCHITECTURE.md                 ← how (this file)
├── BUILD_PLAN.md                   ← sequence + acceptance gates
├── DATA.md                         ← sources, caching, provenance
├── DESIGN.md                       ← design tokens, colors, type, spacing
├── SETUP.md                        ← scaffolding, deps, configs
├── STEP1.md                        ← Step 1 execution contract
├── src\
│   ├── app\
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api\
│   │       ├── decision-strip\
│   │       ├── clear-window\[id]\
│   │       ├── route-ribbon\[corridor]\
│   │       ├── replay\[scope]\
│   │       ├── visibility\[viewpoint]\
│   │       ├── compare\
│   │       ├── brief\[corridor]\          ← Guide Brief endpoint (v1)
│   │       ├── weather\
│   │       └── satellite\manifest\
│   ├── components\
│   │   ├── scene\
│   │   │   ├── Scene.tsx
│   │   │   ├── CameraRig.tsx
│   │   │   ├── Terrain.tsx
│   │   │   ├── Sky.tsx
│   │   │   ├── CloudShell.tsx
│   │   │   ├── WindParticles.tsx
│   │   │   ├── RouteRibbon.tsx
│   │   │   ├── DestinationMarkers.tsx
│   │   │   ├── SnowlineContour.tsx
│   │   │   └── PeakLabels.tsx
│   │   ├── decision\
│   │   │   ├── DecisionStrip.tsx           ← 3 ranked pills
│   │   │   ├── ComparisonDrawer.tsx        ← split by trip intent
│   │   │   ├── ClearWindowTimeline.tsx     ← with sunrise marker
│   │   │   ├── ClearWindowCard.tsx
│   │   │   ├── CorridorCard.tsx
│   │   │   ├── ReplayTimeline.tsx
│   │   │   ├── ReplaySummary.tsx
│   │   │   ├── EvidenceSnapshots.tsx
│   │   │   ├── ConfidenceLabel.tsx
│   │   │   ├── DestinationInsight.tsx
│   │   │   └── VisibilityCard.tsx
│   │   ├── controls\
│   │   │   ├── LayerToggles.tsx
│   │   │   ├── TimeControl.tsx             ← with sunrise marker, NPT
│   │   │   ├── CameraToggle.tsx
│   │   │   ├── ModeToggle.tsx
│   │   │   ├── BottomSheet.tsx             ← mobile layers/time
│   │   │   └── BandwidthBanner.tsx
│   │   └── ui\
│   ├── lib\
│   │   ├── decision\
│   │   │   ├── decision-strip.ts
│   │   │   ├── clear-window.ts             ← daylight + sunrise weighting
│   │   │   ├── comparison-rank.ts          ← per-intent ranking
│   │   │   ├── confidence-labeler.ts       ← staleness rules
│   │   │   └── lens-config.ts
│   │   ├── terrain\
│   │   ├── satellite-preprocess\
│   │   ├── visibility\
│   │   ├── replay\
│   │   ├── snow\                           ← regional snowline
│   │   ├── route\
│   │   ├── npt\                            ← timezone formatting
│   │   ├── open-meteo.ts
│   │   ├── nasa-imerg.ts
│   │   ├── performance\
│   │   ├── coordinates.ts
│   │   └── utils.ts
│   ├── data\
│   │   ├── nepal-bbox.ts
│   │   ├── destinations.ts
│   │   ├── corridors\
│   │   ├── viewpoints.ts
│   │   ├── peaks.ts
│   │   ├── regions.ts                      ← snowline regions
│   │   └── lens-profiles.ts
│   ├── shaders\
│   ├── state\
│   │   ├── worldStore.ts
│   │   └── selectionStore.ts
│   └── types\
└── tests\
    └── acceptance\
```
