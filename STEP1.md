# Step 1 Execution Contract — Static Clean Nepal Map Shell

**Deliverable:** Top-down map of Nepal with 10 markers (8 destinations + 2 trail entries), Decision Strip (mock), 3 cards (mock), layer toggles (visual only), time slider (visual only), Compare/Share/Copy-Brief stub buttons (visual only), mobile 3-zone layout, NPT formatter.

**Acceptance gate:** Non-technical user identifies Pokhara, Everest, ABC and reads the Decision Strip in under 5 seconds. All times show "NPT". Decision Strip is the most prominent element.

**Terrain approach:** Static pre-rendered shaded-relief PNG (see SETUP.md §11). No live DEM tiles.

**What Step 1 does NOT include:** Real weather data, real satellite textures, API routes, SWR data fetching, working layer toggles, working time scrubbing, replay, comparison drawer, camera tilt, R3F cloud shells. The decision-to-action buttons (Compare / Share / Copy Brief) render as visually disabled stubs (cursor-not-allowed, muted text) — wired in Step 5 (PRODUCT.md §20).

**Destination set (v1):** 8 destinations. Jomsom (Mustang) is included as the rain-shadow comparison wedge — it stays clear when the south-facing Annapurna corridors are clouded. PRODUCT.md wireframe examples use "Mustang" interchangeably with Jomsom; the canonical id is `jomsom`.

---

## File creation order (22 files)

Build in this exact order. Each file should be type-clean (`npx tsc --noEmit`) before moving to the next. The order follows dependency: types → data → state → lib → components → page.

### Phase A: Foundation (files 1–7)

| # | File | What it does |
|---|---|---|
| 1 | `src/types/weather.ts` | Core type definitions: `Destination`, `TrailEntry`, `Peak`, `Viewpoint`, `SnowlineRegion`, `RouteWaypoint`, `DecisionStrip`, `CorridorCard`, `ConfidenceLabel`, `ClearWindow`, `SeverityLevel`, `TripIntent`, `TimeMode`, `CameraMode`, `LayerId` |
| 2 | `src/data/nepal-bbox.ts` | `NEPAL_BBOX`, `NEPAL_CENTER` constants (copy from ARCHITECTURE.md) |
| 3 | `src/data/destinations.ts` | `DESTINATIONS` array + `TRAIL_ENTRIES` array (copy from ARCHITECTURE.md) |
| 4 | `src/data/viewpoints.ts` | `VIEWPOINTS` array (copy from ARCHITECTURE.md) |
| 5 | `src/data/peaks.ts` | `PEAKS` array (copy from ARCHITECTURE.md) |
| 6 | `src/data/corridors/abc.ts` | `ABC_WAYPOINTS` array (copy from ARCHITECTURE.md) |
| 7 | `src/data/corridors/ebc.ts` | `EBC_WAYPOINTS` array (copy from ARCHITECTURE.md) |

### Phase B: State + utilities (files 8–11)

| # | File | What it does |
|---|---|---|
| 8 | `src/state/worldStore.ts` | Zustand store: `cameraMode`, `timeMode`, `activeLayer`, `idle`, `lowBandwidthMode`, `performanceTier` |
| 9 | `src/state/selectionStore.ts` | Zustand store: `selectedDestinationId`, `selectedCorridor`, `insightPanelOpen`, `comparisonDrawerOpen` |
| 10 | `src/lib/npt/format-npt.ts` | `formatNPT(iso: string): string` — formats any ISO timestamp to Nepal Standard Time with "NPT" suffix |
| 11 | `src/lib/npt/use-npt-clock.ts` | `useNPTClock(): string` — React hook returning current time in NPT, updating every 60s |

### Phase C: Mock data (files 12–13)

| # | File | What it does |
|---|---|---|
| 12 | `src/data/mock/decision-strip.ts` | Mock `DecisionStrip` with hardcoded best/watch data |
| 13 | `src/data/mock/corridor-cards.ts` | Mock cards for ABC, EBC, Pokhara with conditions, trends, clear windows |

### Phase D: UI components — bottom up (files 14–20)

| # | File | What it does |
|---|---|---|
| 14 | `src/components/ui/npt-badge.tsx` | Tiny `<span className="npt-badge">NPT</span>` component |
| 15 | `src/components/decision/decision-strip.tsx` | 3 pills (BEST NOW / BEST VIEW / WATCH), expandable on click, reads mock data |
| 16 | `src/components/decision/corridor-card.tsx` | Single card: title, condition icon, trend arrow, clear window summary, NPT timestamp |
| 17 | `src/components/controls/layer-toggles.tsx` | 5 toggle buttons (Clouds/Rain/Snow/Current/Temp), visual only, wired to `worldStore.activeLayer` |
| 18 | `src/components/controls/time-control.tsx` | Slider bar with "Now" and "+24h" endpoints, sunrise ☀ marker, visual only |
| 19 | `src/components/controls/bottom-sheet.tsx` | Mobile: collapsible sheet with handle bar, contains LayerToggles + TimeControl |
| 20 | `src/components/scene/nepal-map.tsx` | R3F Canvas: textured plane with shaded-relief PNG, HTML overlay for markers, peak labels |

### Phase E: Page assembly (files 21–22)

| # | File | What it does |
|---|---|---|
| 21 | `src/app/layout.tsx` | Root layout: Inter font, globals.css, metadata (title, description) |
| 22 | `src/app/page.tsx` | Assembles: DecisionStrip (top) + NepalMap (center) + CorridorCards (side/bottom) + BottomSheet (mobile) |

---

## Type definitions — `src/types/weather.ts`

```typescript
export type DestinationId =
  | "pokhara" | "abc" | "poon-hill" | "ebc"
  | "chitwan" | "kathmandu" | "langtang" | "jomsom";

export type TrailEntryId = "nayapul" | "lukla";

export type CorridorId = "abc" | "ebc";

export type TripIntent = "mountain_views" | "trekking" | "lowland";

export type CameraMode = "topdown" | "tilt";

export type TimeMode = "now" | "tomorrow_am" | "afternoon" | "last_24h";

export type LayerId = "clouds" | "rain" | "snow" | "current" | "temperature";

export type SeverityLevel = "best" | "good" | "watch" | "poor" | "avoid";

export type ConfidenceLevel = "observed" | "forecast" | "estimated" | "low" | "stale";

export type TrendDirection = "improving" | "stable" | "worsening";

export type Destination = {
  id: DestinationId;
  name: string;
  shortLabel: string;
  lat: number;
  lon: number;
  altitude: number;
  corridor: CorridorId | null;
  tripIntent: TripIntent;
  preDawnValue: boolean;
  defaultViewpointId: string | null;
};

export type TrailEntry = {
  id: TrailEntryId;
  name: string;
  shortLabel: string;
  lat: number;
  lon: number;
  altitude: number;
  corridor: CorridorId;
};

export type Peak = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
};

export type RouteWaypoint = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
};

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
  targetPeaks: string[];
  preDawnValue: boolean;
};

export type SnowlineRegion = {
  id: string;
  name: string;
  centroidLat: number;
  centroidLon: number;
  typicalSnowlineRange: [number, number];
  corridors: Array<"abc" | "ebc">;
};

// Decision intelligence types (used with mock data in Step 1)

export type DecisionStripPill = {
  category: "best_now" | "best_view" | "watch" | "avoid";
  label: string;
  items: Array<{
    destinationId: string;
    name: string;
    reason: string;
  }>;
};

export type DecisionStripData = {
  pills: DecisionStripPill[];
  computedAt: string;  // ISO with +05:45
};

export type CorridorCardData = {
  corridorId: CorridorId | "pokhara";
  title: string;
  conditionIcon: string;          // Unicode: ☀ ⛅ ☁ 🌧 ❄ ⚠
  conditionLabel: string;
  trend: TrendDirection;
  trendLabel: string;
  clearWindowSummary: string;
  confidence: ConfidenceLevel;
  timestamp: string;              // ISO with +05:45
};
```

---

## Mock data — `src/data/mock/decision-strip.ts`

```typescript
import type { DecisionStripData } from "@/types/weather";

export const MOCK_DECISION_STRIP: DecisionStripData = {
  pills: [
    {
      category: "best_now",
      label: "BEST NOW",
      items: [
        { destinationId: "jomsom", name: "Jomsom", reason: "Rain-shadow clear · Annapurna views from north" },
        { destinationId: "chitwan", name: "Chitwan", reason: "Clear skies, 28°C" },
      ],
    },
    {
      category: "best_view",
      label: "BEST VIEW",
      items: [
        { destinationId: "ebc", name: "EBC AM", reason: "Clear sunrise window 5:30–8 AM" },
        { destinationId: "poon-hill", name: "Poon Hill AM", reason: "Best visibility before 9 AM" },
      ],
    },
    {
      category: "watch",
      label: "WATCH",
      items: [
        { destinationId: "abc", name: "ABC lower trail PM", reason: "Rain expected after noon" },
        { destinationId: "langtang", name: "Snow above 4,200m", reason: "Snowfall overnight" },
      ],
    },
  ],
  computedAt: new Date().toISOString().replace("Z", "+05:45"),
};
```

---

## Mock data — `src/data/mock/corridor-cards.ts`

```typescript
import type { CorridorCardData } from "@/types/weather";

export const MOCK_CORRIDOR_CARDS: CorridorCardData[] = [
  {
    corridorId: "abc",
    title: "ABC Corridor",
    conditionIcon: "☁",
    conditionLabel: "Cloudy with rain in lower trail",
    trend: "improving",
    trendLabel: "Trend ↗ improving",
    clearWindowSummary: "Best clear window: tomorrow 6–9 AM",
    confidence: "forecast",
    timestamp: new Date().toISOString().replace("Z", "+05:45"),
  },
  {
    corridorId: "ebc",
    title: "Everest Corridor",
    conditionIcon: "⛅",
    conditionLabel: "Partial morning visibility",
    trend: "stable",
    trendLabel: "Trend → stable",
    clearWindowSummary: "Best clear window: tomorrow 6:10–8 AM",
    confidence: "observed",
    timestamp: new Date().toISOString().replace("Z", "+05:45"),
  },
  {
    corridorId: "pokhara",
    title: "Pokhara",
    conditionIcon: "🌧",
    conditionLabel: "Heavy cloud — Annapurna obscured",
    trend: "worsening",
    trendLabel: "Trend ↘ worsening",
    clearWindowSummary: "Next clear window: 2 days",
    confidence: "observed",
    timestamp: new Date().toISOString().replace("Z", "+05:45"),
  },
];
```

---

## Component interfaces

### DecisionStrip

```
Props: { data: DecisionStripData }
State: expandedPill: string | null (which pill is expanded, null = all collapsed)
Behavior:
  - Renders 3 pills horizontally (desktop) / stacked (mobile)
  - Each pill shows: category label (bold, uppercase, small) + destination names
  - Click pill → expand to show per-destination reasons
  - Click again → collapse
  - BEST NOW pill has --color-best left border
  - BEST VIEW pill has --color-sunrise left border
  - WATCH pill has --color-watch left border
  - AVOID pill (if present) has --color-avoid left border
Layout:
  - Desktop: horizontal bar below header, pills inline
  - Mobile: stacked pills, full width
  - z-index: --z-strip (20)
```

### CorridorCard

```
Props: { data: CorridorCardData }
Behavior:
  - Static card showing conditions
  - Click → future: opens Destination Insight (not in Step 1, just cursor:pointer)
Layout:
  - Title row: name (left) + condition icon + trend arrow + confidence label + NPT timestamp (right)
  - Body: condition label + clear window summary
  - Bottom: confidence label as subtle badge
  - Shadow: --shadow-sm, hover: --shadow-md + translateY(-2px)
```

### NepalMap (R3F Canvas)

```
Props: none (reads from stores)
Behavior:
  - R3F Canvas with a textured plane (shaded-relief PNG)
  - Camera: fixed top-down orthographic, framing Nepal bbox
  - No zoom, pan, or tilt in Step 1
  - HTML overlay (via drei <Html>) for each destination marker + trail entry
  - Each marker: colored halo circle + icon + short label below
  - Peak labels: small text at peak positions (desktop only, hidden on mobile)
  - Marker halo color is hardcoded in Step 1 (mock severity)
Technical:
  - Use <Canvas orthographic> with camera bounds matching Nepal bbox aspect ratio
  - Map plane: PlaneGeometry(1, 1) with texture, scaled to Nepal aspect ratio
  - lat/lon → position mapping: linear interpolation within NEPAL_BBOX to [-0.5, 0.5] on the plane
  - <Html> components from @react-three/drei for markers
```

### LayerToggles

```
Props: none (reads/writes worldStore.activeLayer)
Behavior:
  - 5 buttons in a row: ☁ Clouds | 🌧 Rain | ❄ Snow | 📍 Current | 🌡 Temp
  - Active button: filled background, bold text
  - Other buttons: outline, muted text
  - Click → sets worldStore.activeLayer (visual feedback only in Step 1, no layer rendering)
Layout:
  - Desktop: inline in bottom bar
  - Mobile: inside BottomSheet
```

### TimeControl

```
Props: none
Behavior:
  - Horizontal track with thumb
  - Left label: "Now"
  - Right label: "+24h"
  - Sunrise marker (☀) at a fixed position (~30% from left, representing ~6 AM)
  - Visual only — no data binding in Step 1
  - Show current NPT time below the track
Layout:
  - Desktop: inline in bottom bar, to the right of LayerToggles
  - Mobile: inside BottomSheet, below LayerToggles
```

### BottomSheet

```
Props: { children: React.ReactNode }
State: sheetState: "collapsed" | "half" | "full"
Behavior:
  - Only renders on mobile (<640px)
  - Collapsed: 48px handle bar visible at bottom of screen
  - Tap handle: toggles to half-open (40vh)
  - Drag up: full (85vh)
  - Drag down: collapse
  - Contains LayerToggles + TimeControl as children
  - Desktop: renders children inline (no sheet UI)
Layout:
  - z-index: --z-bottom-sheet (50)
  - Background: --color-surface
  - Shadow: --shadow-lg
  - Handle: 40px × 4px centered gray bar
```

---

## Page layout — `src/app/page.tsx`

### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────┐
│ Nepal Mountain Weather Decision Map                     [⚙]  │  ← Header (48px)
├──────────────────────────────────────────────────────────────┤
│ BEST NOW  Chitwan · Kathmandu                                │  ← DecisionStrip
│ BEST VIEW EBC AM · Poon Hill AM                              │
│ WATCH     ABC PM · Snow above 4,200m                         │
├──────────────────────────────────────┬───────────────────────┤
│                                      │  ABC Corridor    ☁ ↗  │  ← Right panel (320px)
│                                      │  Best 6–9 AM         │
│     [Nepal Map — R3F Canvas]         ├───────────────────────┤
│     markers + peak labels            │  Everest Corridor ⛅ → │
│                                      │  Best 6:10–8 AM      │
│                                      ├───────────────────────┤
│                                      │  Pokhara         🌧 ↘ │
│                                      │  Next: 2 days        │
│                                      ├───────────────────────┤
│                                      │ [Compare ▸] [Share]   │  ← Action stubs (Step 5)
│                                      │ [Copy Brief]  disabled│
├──────────────────────────────────────┴───────────────────────┤
│ [☁ Clouds] [🌧 Rain] [❄ Snow] [📍] [🌡]  Now ━━━☀━━━━ +24h │  ← Bottom bar (56px)
│                                              NPT 14:30       │
└──────────────────────────────────────────────────────────────┘
```

### Mobile (<640px)

```
┌─────────────────────────────────┐
│ Nepal Weather             [⚙]   │  ← Header (44px)
├─────────────────────────────────┤
│ BEST NOW  Chitwan               │  ← DecisionStrip (stacked pills)
│ BEST VIEW EBC AM                │
│ WATCH     ABC PM                │
├─────────────────────────────────┤
│                                 │
│     [Nepal Map — R3F Canvas]    │  ← Map (~55% screen)
│     markers (no peak labels)    │
│                                 │
├─────────────────────────────────┤
│ ABC Corridor         ☁ ↗ NPT   │  ← Cards (scrollable)
│ Best 6–9 AM · Forecast med     │
├─────────────────────────────────┤
│ Everest Corridor     ⛅ →       │
│ Best 6:10–8 AM                  │
├─────────────────────────────────┤
│ Pokhara              🌧 ↘       │
│ Next: 2 days                    │
├─────────────────────────────────┤
│ [Compare ▸] [Share] [Copy]      │  ← Action stubs (Step 5), disabled
├─────────────────────────────────┤
│ ══════ [handle] ══════          │  ← BottomSheet (collapsed)
└─────────────────────────────────┘
```

---

## Shaded-relief map source

For the static terrain PNG, use one of:

1. **Natural Earth** — download the "Natural Earth II with Shaded Relief" raster at https://www.naturalearthdata.com/downloads/10m-raster-data/ — free, public domain. Crop to Nepal bbox.
2. **Stamen Terrain** tiles — assemble a composite from terrain tiles at zoom 7–8 covering Nepal.
3. **Generate from GLO-30** — use GDAL: `gdaldem hillshade dem.tif hillshade.tif -az 315 -alt 45` → colorize → export PNG.

Option 1 (Natural Earth) is fastest for Step 1. The image will be replaced in Step 3 with real DEM tiles.

Save as `public/terrain/nepal-relief.png` (~2048×1024, <500KB).

---

## Acceptance tests (manual, Step 1)

| # | Test | Pass condition |
|---|---|---|
| 1 | Open `localhost:3000` on desktop Chrome | Page loads in < 3s, no console errors |
| 2 | Identify destinations | Pokhara, ABC, EBC markers visible with labels within 5s |
| 3 | Decision Strip visible | 3 pills visible above the map, BEST NOW is gold-accented |
| 4 | Pill interaction | Click BEST NOW → expands to show Chitwan/Kathmandu with reasons. Click again → collapses |
| 5 | Cards visible | 3 corridor cards on the right panel (desktop) or below map (mobile) |
| 6 | NPT timestamp | Every visible timestamp has "NPT" indicator |
| 7 | Mobile layout | At 375px width: Decision Strip stacked, map ~55%, cards below, bottom sheet handle visible |
| 8 | Bottom sheet | Tap handle → sheet opens with layer toggles + time slider |
| 9 | Layer toggles | Click "Rain" toggle → button shows active state, "Clouds" deactivates |
| 10 | Time slider | Sunrise ☀ marker visible on the timeline |
| 11 | TypeScript | `npx tsc --noEmit` passes with zero errors |
| 12 | Biome | `npx biome check src/` passes |

---

## What comes next (Step 2 preview)

Step 2 adds mock weather overlays and mock decision intelligence. It will:
- Replace the static relief image with mock cloud/rain/snow textures overlaid on the map
- Wire the layer toggles to show/hide these mock textures
- Wire the time slider to cycle through mock time states
- Add mock 72h replay with summary + 3 placeholder evidence snapshots
- Add mock Clear Window timeline for each destination
- Add mock Comparison Drawer (split by trip intent)
- Add mock confidence labels on every card

Step 2 does NOT add real data — that's Step 3. The boundary is: Step 1 = layout, Step 2 = interaction with mock data, Step 3 = real data.
