# Design System

Implementable design tokens for the Nepal Mountain Weather Decision Map. If this conflicts with PRODUCT.md visual style (§19), PRODUCT.md wins on intent; this file wins on exact values.

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
