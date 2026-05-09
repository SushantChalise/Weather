# Design System — Himalayan Atlas

Implementable design tokens and component specs. If this conflicts with PRODUCT.md, PRODUCT.md wins on intent; this file wins on exact values.

**Status:** v2.0 — extended for Atlas-specific components (place pages, source attribution, uncertainty bands, Climate Time Machine).
The colour, typography, spacing, and existing component sections below are inherited from v1 and remain valid.

---

## Color palette

### Semantic colors (decision signals)

These are the only colors with meaning. Everything else is neutral.

| Token | Hex | Usage |
|---|---|---|
| `--color-best` | `#D4A843` | Gold — clear sky, "Best" pill, best-window highlight |
| `--color-good` | `#6B9E6B` | Sage green — "Good" recommendation, safe |
| `--color-watch` | `#8B8B8B` | Gray — "Watch" pill, cloudy, uncertain |
| `--color-poor` | `#5B7FA5` | Steel blue — "Poor" condition |
| `--color-avoid` | `#C45B4A` | Muted red — "Avoid" pill, warnings, hazard |
| `--color-rain` | `#4A8BC4` | Blue — rain layer, precipitation |
| `--color-snow` | `#7EC8E3` | Cyan — snow layer, snowline |
| `--color-cloud` | `#B8B8B8` | Light gray — cloud overlay |
| `--color-sunrise` | `#E8A84C` | Warm amber — sunrise marker, golden hour |

### Neutral palette

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#FAFAF8` | Page background (warm white) |
| `--color-surface` | `#FFFFFF` | Card / panel background |
| `--color-surface-alt` | `#F5F3EF` | Alternating rows, subtle sections |
| `--color-border` | `#E5E2DB` | Card borders, dividers |
| `--color-border-subtle` | `#EDEBE6` | Inner dividers |
| `--color-text-primary` | `#1A1A1A` | Body text, headings |
| `--color-text-secondary` | `#6B6B6B` | Secondary labels, captions |
| `--color-text-muted` | `#9B9B9B` | Timestamps, footnotes |
| `--color-text-inverse` | `#FFFFFF` | Text on dark backgrounds |

### Map terrain palette

| Token | Hex | Usage |
|---|---|---|
| `--terrain-lowland` | `#C4D4A0` | Terai / lowland tint (< 500m) |
| `--terrain-midhill` | `#A8C090` | Mid-hills (500–2000m) |
| `--terrain-highland` | `#8B9E7A` | Highland forest (2000–3500m) |
| `--terrain-alpine` | `#B0A890` | Alpine / above treeline (3500–5000m) |
| `--terrain-snow` | `#E8E4E0` | Permanent snow / ice (> 5000m) |
| `--terrain-shadow` | `#4A4A4A` | Hillshade shadow |
| `--terrain-highlight` | `#F0EDE8` | Hillshade highlight |

---

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | `"Inter", system-ui, -apple-system, sans-serif` | All UI text |
| `--font-mono` | `"JetBrains Mono", "Fira Code", monospace` | Timestamps, data values |
| `--text-xs` | `0.75rem` / 12px | NPT indicator, footnotes |
| `--text-sm` | `0.875rem` / 14px | Card secondary text, labels |
| `--text-base` | `1rem` / 16px | Body text, card primary |
| `--text-lg` | `1.125rem` / 18px | Card titles |
| `--text-xl` | `1.25rem` / 20px | Section headings |
| `--text-2xl` | `1.5rem` / 24px | Decision Strip pills |
| `--text-3xl` | `1.875rem` / 30px | Page title (desktop) |
| `--font-weight-normal` | `400` | Body text |
| `--font-weight-medium` | `500` | Labels, secondary headings |
| `--font-weight-semibold` | `600` | Card titles, pill text |
| `--font-weight-bold` | `700` | Page title, Decision Strip category |
| `--line-height-tight` | `1.25` | Headings |
| `--line-height-normal` | `1.5` | Body text |
| `--line-height-relaxed` | `1.625` | Cards |

---

## Spacing

8px base grid. All spacing values are multiples of 4px.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Tight inline gap |
| `--space-2` | `8px` | Icon–label gap, pill padding |
| `--space-3` | `12px` | Card inner padding (compact) |
| `--space-4` | `16px` | Card padding, section gap |
| `--space-5` | `20px` | Card gap, between cards |
| `--space-6` | `24px` | Section separation |
| `--space-8` | `32px` | Major section gap |
| `--space-10` | `40px` | Page-level vertical padding |
| `--space-12` | `48px` | Page header height |

---

## Border radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Small badges, toggles |
| `--radius-md` | `8px` | Cards, panels |
| `--radius-lg` | `12px` | Bottom sheet, modals |
| `--radius-pill` | `9999px` | Decision Strip pills, status halos |

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Cards at rest |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.10)` | Cards on hover, floating controls |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,0.12)` | Bottom sheet, panels |
| `--shadow-xl` | `0 8px 32px rgba(0,0,0,0.16)` | Modal overlays |

---

## Breakpoints

| Token | Value | Description |
|---|---|---|
| `--bp-mobile` | `0–639px` | Single column, bottom sheet for controls |
| `--bp-tablet` | `640–1023px` | Map + collapsible side panel |
| `--bp-desktop` | `1024px+` | Map + persistent side panel |

Tailwind v4 config:
```css
@theme {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

Mobile-first: default styles target phone. `sm:` is tablet-start. `lg:` is desktop-start.

---

## Z-index layers

| Token | Value | Content |
|---|---|---|
| `--z-map` | `0` | R3F canvas, terrain |
| `--z-map-labels` | `10` | Peak labels, destination markers (HTML overlay) |
| `--z-strip` | `20` | Decision Strip (top bar) |
| `--z-cards` | `30` | Side panel cards |
| `--z-controls` | `40` | Layer toggles, time slider |
| `--z-bottom-sheet` | `50` | Mobile bottom sheet |
| `--z-drawer` | `60` | Comparison Drawer |
| `--z-panel` | `70` | Destination Insight Panel |
| `--z-modal` | `80` | Alerts, confirmations |
| `--z-toast` | `90` | Stale-data warning toast |

---

## Component sizing

### Decision Strip pills

```
Height:        40px (mobile), 44px (desktop)
Padding:       8px 16px
Gap between:   8px
Font:          --text-base / --font-weight-semibold
Corner:        --radius-pill
Category label: --text-xs / --font-weight-bold / uppercase / tracking-wider
```

### Destination markers (map overlay)

```
Halo diameter: 48px (mobile), 56px (desktop)
Halo border:   3px solid, color = semantic (gold/green/blue/cyan/gray/red)
Halo fill:     white at 90% opacity
Icon size:     20px (centered in halo)
Label:         --text-sm / --font-weight-medium, below halo, 4px gap
Tap target:    minimum 48×48px (WCAG)
```

### Corridor cards

```
Width:         100% of side panel
Padding:       16px
Border:        1px solid --color-border
Radius:        --radius-md
Shadow:        --shadow-sm (rest), --shadow-md (hover)
Title:         --text-lg / --font-weight-semibold
Body:          --text-sm / --font-weight-normal
Timestamp:     --text-xs / --font-mono / --color-text-muted
NPT badge:     --text-xs / --font-mono / background: --color-surface-alt / --radius-sm / padding: 2px 6px
```

### Bottom sheet (mobile)

```
Initial:       collapsed to 48px handle bar
Half-open:     40% viewport height
Full-open:     85% viewport height
Handle:        40px wide × 4px × --radius-pill × --color-border
Background:    --color-surface
Shadow:        --shadow-lg
Drag gesture:  vertical swipe on handle
Animation:     300ms ease-out
```

### Time slider

```
Track height:  4px
Track color:   --color-border
Fill color:    --color-text-secondary
Thumb:         16px circle, --color-text-primary
Sunrise marker: --color-sunrise, 2px line crossing track + ☀ icon 16px above
Width:         100% of container minus padding
```

---

## Icon approach

**No icon library in v1.** Use Unicode symbols for status icons (they render cross-platform, no bundle cost):

| Symbol | Meaning |
|---|---|
| `☀` | Clear / sunny |
| `⛅` | Partly cloudy |
| `☁` | Cloudy |
| `🌧` | Rain |
| `❄` | Snow |
| `⚠` | Warning / avoid |
| `↗` `→` `↘` | Trend improving / stable / worsening |

If Unicode rendering proves inconsistent on Android WebView, swap to inline SVGs. Do not add a font icon library.

---

## Animation

| Animation | Duration | Easing | Notes |
|---|---|---|---|
| Card hover lift | 200ms | ease-out | translateY(-2px) + shadow-md |
| Pill expand | 250ms | ease-out | max-height + opacity |
| Bottom sheet drag | 300ms | ease-out | translateY |
| Camera fly-to | 800ms | ease-in-out | R3F camera transition |
| Layer toggle | 200ms | ease-out | Opacity crossfade |
| Time slider scrub | 0ms | linear | No animation — immediate response |
| NPT timestamp update | 150ms | ease-out | Opacity flash on change |

**Idle rule:** all looping animations pause after 30s of no input. Non-looping transitions (card hover, pill expand) continue.

---

## Accessibility

| Rule | Implementation |
|---|---|
| **Contrast** | All text meets WCAG 2.1 AA 4.5:1 ratio |
| **Focus** | Visible 2px `--color-best` outline on keyboard focus |
| **Tap targets** | Minimum 48×48px on mobile |
| **Color meaning** | Every color-coded element also has icon + text label |
| **Reduced motion** | `prefers-reduced-motion: reduce` → disable all animations, use instant transitions |
| **Screen reader** | Decision Strip pills have `aria-label` with full text ("Best Now: Mustang, Chitwan") |
| **Keyboard nav** | Tab through: Decision Strip → Cards → Map markers → Controls |

---

## Atlas-specific components (v2.0)

Everything above this line is inherited from v1 and still applies. Below are Atlas-specific patterns that emerged from the v2.0 pivot.

### Charting library

**Observable Plot** is the primary library. Recharts continues for legacy components but is not extended.

| Choice | Plot | Recharts |
|---|---|---|
| SSR-friendly | ✓ (renders to SVG server-side) | partial |
| Bundle size | small (~30 KB) | larger (~90 KB) |
| Designed for | Data exploration + analytical viz | Application-style charts (dashboards) |
| Composition model | Marks + scales (declarative) | Components |

**Why this matters for the Atlas:** every place page should ship its initial chart paint as plain SVG before JS hydration. Plot is built for this. The first impression of any chart is the chart itself, not a loading spinner.

### Place page layout

Universal 4-tab layout for every place. Class-specific tabs (Health for glaciers, Climbing for peaks, Flow for rivers, AQ for cities) appear conditionally.

```
┌──────────────────────────────────────────────┐
│  Header — place name, class, region          │  56px tall
│  ────────────────────────────────────────────│
│  Hero strip — current state at a glance      │  120px (mobile) / 200px (desktop)
│  Status pill • coordinates • elevation       │
│  ────────────────────────────────────────────│
│  Tab bar: Now │ Normal │ Trend │ Future │ +  │  48px tall, sticky on scroll
│  ────────────────────────────────────────────│
│                                              │
│  Tab content                                 │
│  - Charts: Plot SSR-rendered                 │
│  - Source attribution pill on each           │
│  - Uncertainty bands where applicable        │
│                                              │
│  ────────────────────────────────────────────│
│  Sources & methodology                       │  bottom of every tab
│  - Per-dataset citation cards                │
│  - "Cite this page" copy-to-clipboard        │
└──────────────────────────────────────────────┘
```

**Hero strip content** (per place class):
- Trekking destination: condition icon + plain-language status + last-updated NPT
- Glacier: extent change since 1980, mass balance trend arrow, last in-situ measurement date
- Peak: jet stream status, freezing level today, climbing-window status
- Lake: surface area trend, level vs normal
- River point: flow vs normal, snowmelt fraction
- City: PM2.5 + AQI badge, primary smoke source if applicable

### Source attribution component

Every chart, every number, every map layer carries a clickable source pill. This is the trust mechanism.

```
┌─────────────────────────────────┐
│  📊  Mean October temp          │
│  -3.2 °C  ▼ 0.8 °C since 1990s │
│  ─────────────────────────────  │
│  ⓘ Source: ERA5-Land, ECMWF     │  ← clickable pill (font-size xs, muted)
└─────────────────────────────────┘
```

Click → modal:

```
┌──────────────────────────────────────────┐
│  ERA5-Land                          ✕    │
│  ──────────────────────────────────────  │
│  ECMWF / Copernicus Climate Change       │
│  Service                                 │
│                                          │
│  Hourly land variables, 9km resolution,  │
│  1950 to present.                        │
│                                          │
│  License: Copernicus license             │
│  Citation: Hersbach et al. 2023, ERA5    │
│  monthly averaged data on single levels  │
│  from 1940 to present, Copernicus        │
│  Climate Change Service (C3S) Climate    │
│  Data Store (CDS), DOI: 10.24381/...     │
│                                          │
│  ▶ Read methodology page                 │
│  ▶ Copy citation as Wikipedia ref        │
│  ▶ Copy citation as BibTeX               │
└──────────────────────────────────────────┘
```

**Visual specs:**
- Pill: `text-xs`, `text-text-muted`, `bg-surface-alt`, `rounded-md`, `px-2 py-0.5`
- Hover: `text-text-secondary`, cursor pointer
- Modal: standard modal pattern, `max-w-md`, focus-trap, dismissible by ESC

### Uncertainty band component

Confidence intervals are rendered visually on every projection or anomaly chart.

| Visual | Where used |
|---|---|
| **Shaded ribbon** (5–95th percentile) | CMIP6 projections, ERA5 climatology |
| **Whiskers on bars** | Annual averages, decadal comparisons |
| **Spaghetti** (multi-model) | When showing all individual CMIP6 model outputs |

Colour: `--color-text-muted` at 25% opacity. Never a colour with semantic meaning (we don't want users to read "good/bad" into uncertainty).

Hover anywhere on band → tooltip: "5th–95th percentile across N models, baseline 1991–2020."

### Resolution disclaimer

Auto-shown when displaying gridded data at scales finer than the data resolution.

```
┌──────────────────────────────────────────────┐
│  ⚠ Note: this projection uses 25 km grid     │
│  resolution. Interpret with care at village  │
│  scale; village-level statements require     │
│  station data.                                │
└──────────────────────────────────────────────┘
```

Renders below the chart when zoom or context implies sub-resolution interpretation.

**Visual specs:** `text-xs`, `text-text-secondary`, `bg-surface-alt`, `border-l-2 border-watch`, `pl-3 py-2`.

### Climate Time Machine viz pattern

The signature chart pattern. Shared layout across the Atlas:

```
Title:           ABC Corridor — October temperature
Subtitle:        Month average, 1991–2020 baseline

[Year slider: 1991 ─────────●─────── 2026]

  ┌──────────────────────────────────────────────────┐
  │     ╱╲                                            │
  │    ╱  ╲       ╱╲          [shaded climatology]    │
  │   ╱    ╲     ╱  ╲                                 │
  │  ╱      ╲   ╱    ╲       [bold line: selected   ] │
  │ ╱        ╲_╱      ╲      [year]                   │
  │                                                   │
  └──────────────────────────────────────────────────┘
   1   5   10   15   20   25   30 (day of October)

This October was 1.8 °C warmer than the 1991–2020 baseline.
↘ Cooler than the 2010s average by 0.4 °C.

ⓘ ERA5-Land · Climatology baseline 1991–2020 · 9 km grid
```

Components:
- 5–95th percentile ribbon for the climatology
- Bold line for the selected year
- Sub-text comparison sentence (auto-generated from data)
- Source attribution pill at the bottom
- Year slider above (URL-synced)

### "In Your Lifetime" pattern

Personalised hero block. Birth year input → renders user-specific change story.

```
You were born in [1985 ▼] — Nepal has changed since then.

  ─────────────────────────────────────────
  Average annual temperature, Nepal:
       ╱╲      ╱─
       ──╲___╱
       1985 ←──── +1.4 °C ────→ 2026

  Khumbu Glacier extent:
       ████████████   1985: 38.4 km²
       ████████       2026: 26.7 km² (−30%)

  Monsoon arrival in Pokhara:
       1985: typically June 12
       2026: typically June 24 (12 days later)
  ─────────────────────────────────────────
```

Each row is a small chart with source attribution pill. Strong shareability — designed for screenshot.

### Vanishing Photo Archive slider

Image comparison slider, mobile-first.

```
┌──────────────────────────────────────────┐
│  Khumbu Icefall                          │
│  1953 (Hillary expedition) ↔ 2026         │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ [Old photo]    │  [New photo]    │    │
│  │                │                 │    │
│  │     drag handle ●                │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ⓘ Sources:                              │
│  Left: Royal Geographical Society, 1953 │
│  Right: Sentinel-2, 2026-04-15           │
└──────────────────────────────────────────┘
```

Slider library: `react-compare-slider` (small, touch-friendly).

### Map terrain palette extension (HKH-wide)

The v1 palette covers Nepal terrain altitudes. For HKH-wide expansion, the palette stays unchanged — altitudes 0–8000m+ are the same. No new tokens.

For the Tibetan plateau (a vast 4000–5000m landscape), the existing `--terrain-alpine` (`#B0A890`) covers it correctly.

### Anomaly map palette

Net new for v2.0 — used by the Anomaly Map and "Now vs Normal" overlays.

| Token | Hex | Usage |
|---|---|---|
| `--anomaly-cold-strong` | `#3B6FB6` | Below normal by > 2σ |
| `--anomaly-cold-mild` | `#9DBED5` | Below normal by 1–2σ |
| `--anomaly-neutral` | `#E5E2DB` | Within ±1σ of normal |
| `--anomaly-warm-mild` | `#E8C39A` | Above normal by 1–2σ |
| `--anomaly-warm-strong` | `#C45B4A` | Above normal by > 2σ |

Diverging scale with neutral grey at zero. Avoid red/blue alone (colourblind safety) — pair with hatching for screen-reader accessibility on Anomaly Map.

### Component naming convention

Atlas-specific components live under `src/components/atlas/`:

```
src/components/atlas/
├── trust/
│   ├── SourceAttributionPill.tsx
│   ├── UncertaintyBand.tsx
│   ├── ResolutionDisclaimer.tsx
│   └── CitationBlock.tsx
├── place/
│   ├── PlacePageLayout.tsx
│   ├── PlaceHeroStrip.tsx
│   ├── TabBar.tsx
│   └── tabs/
│       ├── NowTab.tsx
│       ├── NormalTab.tsx
│       ├── TrendTab.tsx
│       └── FutureTab.tsx
└── viz/
    ├── ClimateTimeMachine.tsx
    ├── TrekWindowShiftIndex.tsx
    ├── InYourLifetime.tsx
    ├── VanishingPhotoSlider.tsx
    └── AnomalyMap.tsx
```

Trekker-specific components stay under `src/components/decision/`, `src/components/scene/`, etc. Pillar 3 of the Atlas (Real-time + anomaly layer) reuses them.
