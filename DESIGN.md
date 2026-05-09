# Design System — Himalayan Atlas

The visual language, interaction patterns, content rules, and component specifications for Himalayan Atlas.

This document is opinionated. Every decision has a reason, and the reason matters more than the decision. When the team hits a design question this doc doesn't answer, the right move is to derive the answer from the principles in §3 — not invent something new.

If this conflicts with PRODUCT.md, PRODUCT.md wins on intent; this file wins on visual specifics.

---

## 1. Why this document exists

There is a gap between what climate and weather data deserves and how it's presented to humans.

The data is some of the best science the world produces — multi-decade reanalyses, satellite constellations measuring centimetres of glacier change, climate models running on supercomputers, fieldwork at 5,000m. The interfaces that surface this data to non-specialists are, with rare exceptions, **bad**: ugly, slow, hostile to mobile, hostile to people who don't already know what to look for, hostile to citation, hostile to context.

This document specifies the visual and interaction language for a project that refuses to be in the same category as those interfaces.

---

## 2. The audit — what's wrong with everything else

Rather than start from a blank page, start from an honest assessment of the field. Every product below is something we've used. Every critique is specific. Each failure becomes a design constraint we adopt.

### 2.1 ICIMOD RDS Portal

The data is gold. The interface is from 2010 and looks it. Search is keyword-only with no faceted browsing. Each dataset page is a wall of metadata text with no preview. Citations are buried. Mobile is broken. Page weight is heavy on the connections most of South Asia actually has.

→ **Constraint we adopt:** every dataset must have a visual preview before a download link. Citation must be one click away from the chart it backs.

### 2.2 NASA Worldview

Beautiful satellite imagery. But *only* satellite imagery — no analysis, no context, no narrative. The layer system is overwhelming (hundreds of layers). The time slider works but offers no comparative analysis. Performance on mobile is brutal. Interpretation requires you to already know what bands and indices mean.

→ **Constraint we adopt:** every layer in our product carries an explanation of what it is, when it's useful, and what it cannot tell you. No layer ships without that.

### 2.3 Climate Reanalyzer (University of Maine)

A research tool that hasn't been redesigned since the early 2000s. Charts are illegible. Mobile-broken. Useful only if you already know what to query. The data underneath is excellent; the surface squanders it.

→ **Constraint we adopt:** if a piece of data isn't legible at 375px wide, we don't ship it.

### 2.4 OurWorldInData

Most of what's right with this product. Best-in-class chart UX. Calm aesthetic. Each chart is screenshot-ready. Embed-friendly. Their problem is editorial: they depend on staff writers, lack real-time data, and have no place-based browsing.

→ **Constraint we adopt:** every chart we ship should reach the OWID quality bar — typography, spacing, colour, source attribution — but data-driven and place-first, not article-first.

### 2.5 Mountain Forecast

The weather product trekkers actually use today. Ad-cluttered. Tables of numbers without visualization. No climate context. No history. No comparison. Mobile barely usable. The contrast on the type would fail any accessibility audit.

→ **Constraint we adopt:** zero ads. Zero tracking pixels. Type that meets WCAG AAA where it can.

### 2.6 Carbon Brief

Strong editorial chart design, embed-friendly, mobile-good. Weakness: article-driven (you have to find the article to find the chart), slow loads, complex layouts that demand reader focus.

→ **Constraint we adopt:** charts have permanent URLs of their own. They live independently of the article that frames them.

### 2.7 NOAA Climate Explorer

US-focused, ugly, slow, faceted-but-confusing. The information architecture treats every variable as equal-weight; the user has no way to know what to look at first.

→ **Constraint we adopt:** strong information hierarchy. The thing that matters most should be visually the thing that matters most.

### 2.8 ClimateData.ca

A government-funded Canadian climate atlas — one of the best examples of done-right. Beautiful, clean, fast. Single weakness: Canada-only.

→ **Constraint we adopt:** the bar to clear isn't private-sector competitors, it's government-funded national climate atlases — which means our product needs to *look* funded even though it isn't.

### 2.9 Windy.com

Beautiful map UX, smooth interactions, mobile-great. But: real-time only with no climate, ad-supported, complex for casual users, weather-only (no glaciers, no AQ, no history).

→ **Constraint we adopt:** the map is one surface among several, never the entire product. Maps that try to be everything end up being decorative.

### 2.10 AccuWeather, Apple Weather, Weather.com

Optimized for "should I bring an umbrella" not "should I trek next month." US-bias. Ad-supported clutter (most). No mountain-specific knowledge.

→ **Constraint we adopt:** assume our user has a real question — a trip in 8 weeks, a research deadline, an article going to print. Design for that user, not the someone-might-glance user.

### 2.11 What unifies the failures

| Pattern | Examples |
|---|---|
| **Beautiful but shallow** | Apple Weather, Windy |
| **Deep but ugly** | ICIMOD, Climate Reanalyzer, NOAA |
| **Narrative without data** | Carbon Brief (article-bound) |
| **Data without narrative** | NASA Worldview, ICIMOD |
| **Western-built for everywhere** | Most of the above |

Nobody has cracked: **deeply researched, beautifully presented, place-first, narrative-aware, source-honest, mobile-first, citable, regionally specific.** That gap is the design space we operate in.

---

## 3. The principles

These are the rules we hold ourselves to. They are extracted from the audit above. Every PR review checks against them.

> **3.1 Place-first, not data-first.** Users meet datasets through places (Khumbu, Kathmandu, Kanchenjunga), never through dataset names (ERA5, CMIP6, MOD10A1). The data infrastructure is plumbing; the place is the destination.

> **3.2 Source-attributed, no exceptions.** Every chart, every number, every map layer carries a clickable source pill. The pill opens a modal with dataset name, version, license, citation, and methodology link. If we can't attribute it, we don't ship it.

> **3.3 Honest about uncertainty.** Confidence bands on every projection. Plain-language disclaimers when grid resolution is finer than the data. Uncertainty is a first-class UI element, not a footnote. Never a single line for a CMIP6 projection — always model spread.

> **3.4 Narrative-bound.** Charts live inside place stories, not free-floating dashboards. The Himalaya makes sense as places that are changing, not as graphs.

> **3.5 Mobile-first, low-bandwidth-aware.** Trekkers carry phones, not laptops. Many of our users are on 2G–3G, intermittent. Every chart must work at 375px wide and load under 2s on simulated 3G. The product must degrade gracefully, not break.

> **3.6 Calm.** No flashing, no urgency-bait, no countdown timers, no pop-ups, no ads, no tracking pixels. The Himalaya doesn't shout; we don't shout.

> **3.7 Restraint over ornament.** When in doubt, remove. A chart with one less line is a better chart. A page with one less component is a better page.

> **3.8 Cartographic sensibility.** Maps and charts inherit from cartography (NACIS, Swiss style, ColorBrewer) — not from dashboard tools. Hillshade, contour, topology, elevation tints are first-class. We are an atlas.

> **3.9 Editorial weight without editorial dependence.** Match the typography and density of National Geographic, NYT graphics, OurWorldInData. Don't depend on having an editorial staff.

> **3.10 Speak two languages.** The product reads at two depths. A trekker glancing at a place page sees a single answer in 2 seconds. A researcher exploring the same page can drill 5 layers deep without leaving it. One surface, not two products.

> **3.11 Beauty is functional.** Beautiful design isn't decoration on top of useful — it earns trust, encourages exploration, and gets the work shared. Beauty is part of the value proposition.

---

## 4. Identity

### 4.1 Name

**Himalayan Atlas.** Decided. Used as the product name across all surfaces.

In running text:
- First mention on a page: "Himalayan Atlas"
- Subsequent mentions: "the Atlas" (capitalised when referring to the product)

Avoid: "HA", "Himalayan", "the climate atlas" (unbranded), "Himalayan Atlas Project" (no "Project").

### 4.2 Voice

The voice is **a calm specialist who respects the reader's intelligence**.

| Yes | No |
|---|---|
| "Khumbu Glacier has lost 30% of its 1985 area." | "Khumbu Glacier is *vanishing!*" |
| "Confidence: 5–95th percentile across 12 climate models." | "Climate models predict..." |
| "Baseline 1991–2020." | "Compared to historical norms..." |
| "Source: ERA5-Land, ECMWF." | "Powered by AI." |
| "Monsoon arrival in Pokhara was June 24 in 2026 — twelve days later than the 1991–2020 average of June 12." | "It's clear: the monsoon is broken." |

Specific over vague. Cited over asserted. Numbers with units. Quiet over alarmist.

### 4.3 Tone modulation

The voice is consistent; the tone shifts by surface:

| Surface | Tone |
|---|---|
| Place page hero | Documentary — observed fact |
| Story / featured article | Editorial — gentle narration |
| Methodology page | Technical — precise, complete |
| Error / empty state | Honest — what happened, what to do |
| Loading state | Patient — what's happening |

### 4.4 Logo (placeholder spec)

A wordmark, not a symbol. The word "Atlas" set in our display serif (see §6) with a single typographic flourish — the dot of the "i" in "Himalayan" replaced by a small triangular peak glyph.

The wordmark works at 32px (favicon adjacent) and at 320px+ (hero use). No icon-only mark in v1; if we need a square mark later, derive it from the peak glyph.

Design pending — to be commissioned or hand-set in hour 100+.

### 4.5 Logo behaviour

The wordmark sits top-left on every page. Click → home. No animation, no motion. A logo doesn't earn motion.

---

## 5. Colour

Colour is a meaning system, not decoration. Every colour token has a job. Tokens without a job get cut.

### 5.1 The four palettes

The Atlas uses four distinct palettes. They never mix arbitrarily.

| Palette | Job | Where it appears |
|---|---|---|
| **Neutral** | Surfaces, type, structure | Everywhere — page backgrounds, borders, body text |
| **Decision** (existing) | Trekker decision signals (Best / Good / Watch / Poor / Avoid) | Pillar 3 components: decision strip, corridor cards |
| **Anomaly** (new) | "Now vs Normal" deviations, climate anomalies | Now vs Normal tab, Anomaly Map, climate change indicators |
| **Variable** (new) | Per-climate-variable scientific palettes | Climate charts: temperature, precipitation, snow, AQ, wind |

Within a palette, colours have a relationship. Across palettes, there's no relationship.

### 5.2 Neutral palette

Warm-leaning neutrals, not cold grey. The Atlas is paper, parchment, slate — not aluminium.

| Token | Hex | Where |
|---|---|---|
| `--color-bg` | `#FAFAF8` | Page background — warm off-white |
| `--color-surface` | `#FFFFFF` | Card / panel background |
| `--color-surface-alt` | `#F5F3EF` | Alternating rows, subtle sections |
| `--color-surface-deep` | `#EFEBE3` | Source attribution background, methodology callouts |
| `--color-border` | `#E5E2DB` | Card borders, dividers |
| `--color-border-subtle` | `#EDEBE6` | Inner dividers |
| `--color-text-primary` | `#1A1A1A` | Body text, headings — near-black, never pure black |
| `--color-text-secondary` | `#5C5C5C` | Secondary labels, captions (improved contrast vs v1) |
| `--color-text-muted` | `#8B8B8B` | Timestamps, footnotes (improved contrast vs v1) |
| `--color-text-inverse` | `#FFFFFF` | Text on dark backgrounds |

**Why off-white not pure white:** pure white on a screen reads as cold and clinical. Off-white reads as paper, which is what an atlas should feel like.

**Contrast ratios** (against `--color-bg`):
- `--color-text-primary` → 17.4:1 (WCAG AAA)
- `--color-text-secondary` → 7.5:1 (WCAG AAA)
- `--color-text-muted` → 4.6:1 (WCAG AA)

### 5.3 Decision palette (Pillar 3)

These are inherited from v1 — they continue to drive the trekker decision strip and corridor cards. They are colour-coded only with redundant text and icon labels for accessibility.

| Token | Hex | Meaning |
|---|---|---|
| `--color-best` | `#D4A843` | Gold — clear sky, "Best" pill |
| `--color-good` | `#6B9E6B` | Sage green — "Good" recommendation |
| `--color-watch` | `#8B8B8B` | Grey — "Watch" pill, uncertain |
| `--color-poor` | `#5B7FA5` | Steel blue — "Poor" condition |
| `--color-avoid` | `#A93C2C` | Deep red — "Avoid" pill, hazard. Distinctly darker than the warm-strong-anomaly red below. |

**Resolving the Decision / Anomaly red collision:**

Earlier drafts had Avoid (`#C45B4A`) and warm-strong-anomaly (`#C45B4A`) at the same hex. On a map showing trekker decisions overlaid on temperature anomalies, this read as ambiguous: was a red pixel a hazard or a 2σ deviation? Both LLM critics flagged this as a blocker.

The resolution:
- **Avoid is now a deeper red** (`#A93C2C`) — visibly different and only used in the trekker pillar, never on climate anomaly maps
- **Warm-strong-anomaly stays at the lighter hex** (`#C45B4A`) — only used on anomaly visualisations
- **Iconography is mandatory wherever Avoid red appears** — a hazard glyph next to the colour, never colour alone
- **The two palettes never coexist on the same surface.** Trekker decision strip and climate anomaly map are different page archetypes; they render on different routes; they cannot share a canvas.

### 5.4 Anomaly palette (new)

Diverging scale for "Now vs Normal", anomaly maps, and climate change indicators. Neutral grey at zero, never red/blue alone.

| Token | Hex | Meaning |
|---|---|---|
| `--anomaly-cold-strong` | `#3B6FB6` | Below normal by > 2σ |
| `--anomaly-cold-mild` | `#9DBED5` | Below normal by 1–2σ |
| `--anomaly-neutral` | `#E5E2DB` | Within ±1σ of normal |
| `--anomaly-warm-mild` | `#E8C39A` | Above normal by 1–2σ |
| `--anomaly-warm-strong` | `#C45B4A` | Above normal by > 2σ |

For colourblind safety on the Anomaly Map: pair with hatching (diagonal lines for cold, dots for warm). On screen-readers: every colour-coded element has an `aria-label` that states the value in plain language.

### 5.5 Variable palettes (new)

Per-variable scientific palettes following ColorBrewer / scientifically-validated schemes. These are used on charts that show a single climate variable.

| Variable | Palette | Notes |
|---|---|---|
| **Temperature** | Diverging blue → red, neutral white at the climatology mean | ColorBrewer RdBu, 9-step |
| **Precipitation** | Sequential white → deep blue | ColorBrewer Blues, 7-step |
| **Snow / SWE** | Sequential white → cyan-blue | ColorBrewer YlGnBu, 7-step |
| **Cloud cover** | Sequential white → soft grey | Custom, low-saturation |
| **Wind speed** | Sequential viridis | Universally colourblind-safe |
| **Air quality (PM2.5)** | EPA AQI scale: green → yellow → orange → red → purple → maroon | EPA standard, instantly recognisable |
| **Glacier change** | Diverging green (gain) → grey (no change) → brown (loss) | Custom — earth-tones, evokes melt |
| **Elevation / hillshade** | Topographic — green lowland to brown alpine to white snow | Inherited from v1 terrain palette |

Per-palette swatches and CSS tokens live in `src/styles/palettes.ts` (to be implemented).

### 5.6 Map terrain palette (inherited from v1)

The terrain palette covers 0 to 8000m+. It works for the entire HKH unchanged.

| Token | Hex | Altitude |
|---|---|---|
| `--terrain-lowland` | `#C4D4A0` | Terai / lowland (< 500m) |
| `--terrain-midhill` | `#A8C090` | Mid-hills (500–2000m) |
| `--terrain-highland` | `#8B9E7A` | Highland forest (2000–3500m) |
| `--terrain-alpine` | `#B0A890` | Alpine / above treeline (3500–5000m) — also covers Tibetan plateau |
| `--terrain-snow` | `#E8E4E0` | Permanent snow / ice (> 5000m) |
| `--terrain-shadow` | `#4A4A4A` | Hillshade shadow |
| `--terrain-highlight` | `#F0EDE8` | Hillshade highlight |

### 5.7 Dark mode

Dark mode is **not** v1. We ship light mode only first, design dark mode in v1.1 with the same opinionated rigour.

When designed: dark mode is not a colour inversion. It's a separate palette that follows the same principles — warm neutrals, semantic colour, calm.

### 5.8 The colours we don't use

| Banned | Why |
|---|---|
| Pure black `#000000` | Too cold for a paper-and-parchment atlas |
| Pure white `#FFFFFF` for backgrounds | Same — too clinical |
| Saturated red except in Avoid / extreme anomaly | Reserved for genuine warning |
| Neon / fluorescent anything | Wrong tone |
| Brand-colour gradients | Cheap; we use solid colour |
| Rainbow palette for ordinal data | Misleading; use ColorBrewer instead |
| Drop shadows that simulate elevation depth | Skeuomorphic; we use subtle shadows for depth only when functional |

---

## 6. Typography

Typography is the single highest-leverage design choice. The v1 doc used Inter sans only; this is a refinement: serif for editorial weight, sans for UI clarity.

### 6.1 Type families

| Family | Use | License |
|---|---|---|
| **Source Serif 4** | Display headlines (h1, h2, hero numbers, place names in heroes) | OFL — free |
| **Inter** | All body, UI, labels, captions, navigation | OFL — free |
| **JetBrains Mono** | Numbers in tables, code, timestamps, citation keys | OFL — free |

Loaded via `next/font/google` for self-hosted, layout-shift-free rendering.

**Why a serif at all:** the Atlas is editorial. Serif headlines signal "this is considered, not auto-generated." Pairing with Inter for UI keeps interaction crisp.

**Why specifically Source Serif 4:** the v4 release is genuinely beautiful, has full coverage of Latin and Devanagari, and is free. Devanagari coverage matters because some place names will be set in Nepali script in Pillar 5 (Storytelling).

### 6.2 Type scale

8-step scale, one font-size per step. No off-scale sizes. Modular ratio of 1.2 (minor third) up to display sizes, custom for hero displays.

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 12px / 0.75rem | NPT timestamps, footnotes, source pill text, table micro-labels |
| `--text-sm` | 14px / 0.875rem | Card secondary text, axis labels, breadcrumbs |
| `--text-base` | 16px / 1rem | Body text, card primary, paragraph copy |
| `--text-lg` | 18px / 1.125rem | Card titles, h4 |
| `--text-xl` | 22px / 1.375rem | Section headings, h3 |
| `--text-2xl` | 28px / 1.75rem | Page subsection headings, h2, decision strip pills |
| `--text-3xl` | 36px / 2.25rem | Page titles (mobile), h1 (mobile) |
| `--text-display` | 56px / 3.5rem | Hero headlines (desktop), big numbers in editorial mode |

Hero display sizes are clamped: `clamp(2.25rem, 6vw, 3.5rem)`. They scale with viewport.

### 6.3 Weights

| Token | Weight | Use |
|---|---|---|
| `--font-weight-normal` | 400 | Body text — Inter Regular, Source Serif Regular |
| `--font-weight-medium` | 500 | Labels, secondary headings, navigation active state |
| `--font-weight-semibold` | 600 | Card titles, pill text, callouts |
| `--font-weight-bold` | 700 | Page titles in body context |
| `--font-weight-display-light` | 300 | Source Serif Light — display headlines at 56px+ ONLY |
| `--font-weight-display-regular` | 400 | Source Serif Regular — display headlines default |

**Display headlines default to Regular weight (400).** Light weight at sub-display sizes (32px and below) renders anaemic on low-end Android devices common in South Asia — Gemini's critique was specific: "it will look like a rendering bug."

Light weight is permitted only at 56px+ on confirmed high-DPI rendering (we detect via `devicePixelRatio` and screen width gates). Below that threshold, display headlines stay at Regular.

The "magazine" feel comes from the typeface choice (Source Serif 4) and generous line-height / tracking — not from the weight. Don't trade legibility for aesthetic.

### 6.4 Line height

| Token | Value | Use |
|---|---|---|
| `--line-height-tight` | 1.15 | Display headlines, hero numbers |
| `--line-height-snug` | 1.3 | Section headings, card titles |
| `--line-height-normal` | 1.5 | Body text, card content |
| `--line-height-relaxed` | 1.65 | Long-form editorial paragraphs |

### 6.5 Letter spacing (tracking)

Default tracking from each font. Adjustments only for:

| Adjustment | Where |
|---|---|
| `tracking-wider` (0.025em) | Uppercase labels (BEST NOW, etc.) |
| `tracking-tight` (-0.01em) | Display headlines >36px (improves optical balance) |

### 6.6 Numbers

Numbers in data contexts use **JetBrains Mono with tabular figures** (`font-feature-settings: 'tnum'`). This includes:

- Timestamps
- Numeric table values
- Anomaly values (+1.4°C)
- Year sliders
- Coordinate displays

Reason: tabular numbers align in columns. Proportional figures don't, which is jarring in tables.

In running editorial prose, numbers use the body font (Inter or Source Serif), with **proportional figures**.

### 6.7 Headlines vs labels

Two distinct typographic systems on the same page:

| System | Font | Case | Weight | Use |
|---|---|---|---|---|
| **Headlines** | Source Serif Light/Regular | Title case | 300/400 | Page titles, place names, story titles |
| **Labels** | Inter SemiBold | UPPERCASE with letter spacing | 600 | "BEST NOW", "NOW VS NORMAL" tabs, "SOURCE", etc. |
| **Body** | Inter Regular | Sentence case | 400 | Everything else |

Don't mix these. A label set in title-case feels like a heading; a heading set in uppercase feels like a label.

### 6.8 Devanagari

For Nepali-language place names appearing in Pillar 5 (Storytelling) and Climate Witness submissions, fall back to **Noto Sans Devanagari** for UI and **Source Serif 4 Devanagari** where the design supports serif. Both are free, both render at parity with Latin.

When a place has both Latin and Devanagari names, present them as:
> Sagarmatha · सगरमाथा (interpunct separator)

Not parenthesised. Both names are legitimate; neither is a translation of the other.

**Mixed-script line-height fix (mandatory):** Devanagari glyphs have taller ascenders than Latin. Without correction, mixed-script lines visibly jump 2–4px when a Nepali word appears mid-paragraph. Set `line-gap-override`, `ascent-override`, and `descent-override` in the `@font-face` declaration for Noto Sans Devanagari to normalise its metrics to Inter:

```css
@font-face {
  font-family: 'Noto Sans Devanagari';
  src: url('/fonts/NotoSansDevanagari.woff2') format('woff2');
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

Same treatment for Source Serif 4 Devanagari relative to Source Serif 4 Latin. Without this, every page with mixed-script content will have visible vertical-rhythm breakage. Test cases for mixed-script lines are part of the Storybook visual-regression suite (see §21).

### 6.9 Tibetan (future)

For Tibetan-script place names (north-face glaciers, Tibetan-side place pages), use **Noto Serif Tibetan** with the same metric-override treatment. Tibetan introduces additional concerns (vertical text in some contexts; we use horizontal only). Coverage planned for v1.1.

---

## 7. Spacing & rhythm

8px base grid. Every spacing value is a multiple of 4px, preferably of 8px.

### 7.1 Spacing scale

| Token | Value | Use |
|---|---|---|
| `--space-0` | 0 | Reset |
| `--space-1` | 4px | Tight spacing inside small components |
| `--space-2` | 8px | Default tight (icon ↔ label) |
| `--space-3` | 12px | Inside-card padding (small) |
| `--space-4` | 16px | Inside-card padding (default) |
| `--space-5` | 20px | Between cards (mobile) |
| `--space-6` | 24px | Between cards (desktop), section spacing |
| `--space-8` | 32px | Page-level spacing |
| `--space-12` | 48px | Major section breaks |
| `--space-16` | 64px | Page-top spacing (desktop) |
| `--space-24` | 96px | Editorial breathing room (story pages) |

### 7.2 Vertical rhythm

Body text uses 1.5 line-height; headings use 1.15–1.3. Maintain a consistent baseline grid where possible — don't break vertical rhythm just to fit content.

### 7.3 Density modes

The Atlas has two density modes for the same content:

| Mode | When | Spacing scale |
|---|---|---|
| **Default** | Most surfaces | As specified above |
| **Compact** | Data-dense tables, comparison views | All spacing tokens × 0.75 |

Compact mode is opt-in per page, never global.

---

## 8. Layout & breakpoints

### 8.1 Breakpoints

Mobile-first. Breakpoints align with Tailwind defaults (familiar to engineers); CSS custom properties expose them for component logic.

| Token | Px | Typical device |
|---|---|---|
| `--bp-sm` | 640px | Small tablet, large phone landscape |
| `--bp-md` | 768px | Tablet portrait |
| `--bp-lg` | 1024px | Tablet landscape, small laptop |
| `--bp-xl` | 1280px | Desktop |
| `--bp-2xl` | 1536px | Large desktop |

The Atlas works on a 320px-wide screen (smallest realistic mobile). The 4-tab spine collapses to a horizontally-scrollable tab bar at < 640px.

### 8.2 Layout grid

| Surface | Grid |
|---|---|
| Mobile (< 640px) | Single column, 16px gutters |
| Tablet (640–1024px) | 8-column flexible grid, 16px gutters |
| Desktop (> 1024px) | 12-column grid, 24px gutters, max content width 1280px |

Maps and full-bleed imagery break out of the content max-width to the viewport edge. Charts and text stay within max-width.

### 8.3 Z-index layers

| Layer | Z-index | Use |
|---|---|---|
| Base | 0 | Page content |
| Map UI | 10 | Map overlays (legends, controls) |
| Sticky headers | 20 | Tab bar when stuck |
| Tooltip | 30 | Hover tooltips, source attribution modal trigger |
| Modal | 40 | Source attribution modal, methodology modal |
| Toast | 50 | Save confirmation, error toast |
| Critical alert | 100 | Reserved for never-yet-needed |

No more z-index values. If you need one not on this list, you're doing something wrong.

### 8.4 Page archetypes

The Atlas has six page archetypes. Every page uses one.

| Archetype | Purpose |
|---|---|
| **Home** | Featured story, current conditions snapshot, navigation to places |
| **Place page** | One place, four-tab spine + class-specific tabs |
| **Visualization** | One cross-cutting chart (Climate Time Machine, Trek Window Shift, In Your Lifetime) |
| **Story** | Editorial article with embedded charts and maps |
| **Methodology** | Per-dataset documentation page |
| **Catalogue** | Browse all places, all datasets, all events |

Each has a layout template documented in §9 (components).

---

## 9. Components

Specifications for the components that recur across the Atlas. Source code lives at `src/components/atlas/<area>/<Component>.tsx`. Each component has a Storybook entry (planned) and an accessibility checklist (built-in to PR review).

### 9.1 Source attribution — container-level with progressive disclosure

The signature trust component. **One pill per chart, table, or map — not per number.** A 20-row table does not get 20 pills; that is a DOM nightmare and visual noise. The pill attaches to the *container* whose data shares provenance.

**Why container-level:** if every value gets a pill, attribution becomes wallpaper and stops being read. Container-level attribution makes provenance discoverable without making it omnipresent. For the 1% of users (researchers, journalists) who need per-element provenance, progressive disclosure inside the container expands to per-row sources.

**Granularity rules:**

| Surface | Attribution placement |
|---|---|
| Chart | One pill below the chart, naming primary source. If multiple sources, the pill says "ERA5 + 2 more" — click expands. |
| Table | One pill per column header if columns differ in source; one pill below the table if all share a source. |
| Map layer | One pill in the legend per active layer. |
| Map tile basemap | One pill in the map's bottom-right corner. |
| Inline number in body copy | No pill on the number itself. The paragraph or surrounding card carries the attribution. |
| Dashboard / multi-chart page | Pills per chart, plus a "Sources used on this page" footer that lists everything. |

**Pill anatomy:**

```
┌───────────────────────────────┐
│ ⓘ ERA5-Land · ECMWF, 2024     │ ← clickable
└───────────────────────────────┘
```

**Pill specs:**
- Background: `--color-surface-deep`
- Text: `--color-text-secondary`
- Padding: `--space-2 --space-3`
- Border radius: `--radius-sm` (4px)
- Type: `--text-xs`, `--font-weight-medium`
- Icon: `ⓘ` info glyph, `--color-text-muted`
- Hover: text becomes `--color-text-primary`, cursor pointer
- Tap target: 44px minimum height (mobile)

**When multiple sources:**

The pill displays the primary source name plus a count: `ⓘ ERA5-Land + 2 more`. Click → modal lists all sources, each with full provenance. Avoid stacking pills horizontally — it's noise.

**Derived / transformed values:**

When a chart shows a derived value (e.g., "anomaly = current − climatology"), the modal must explicitly state the derivation method, not just cite the underlying datasets. This is `<DerivationStatement>` content inside the modal — see §9.2.

**Provenance schema (code-level, not just prose):**

Every chart component receives a `provenance` prop typed as:

```typescript
type Provenance = {
  primary: { datasetSlug: string; version: string };
  additional?: Array<{ datasetSlug: string; version: string }>;
  derivation?: { method: string; formula?: string; baseline?: string };
};
```

The pill component reads from this prop; it cannot be omitted. Charts without a `provenance` prop fail TypeScript build. This is enforced in §21 (Enforcement).

**What this replaces:** the original "pill on every number" pattern from earlier drafts. That pattern would have meant 20 pills on a 20-row table — unbuildable, unreadable, unmaintainable. The container-level pattern ships the same trust signal at 1/20th the cost.

### 9.2 Source attribution modal

Opens when a source pill is clicked. Contains the full provenance.

**Anatomy:**
```
┌──────────────────────────────────────┐
│ ERA5-Land                       [×]  │
│ ECMWF / Copernicus Climate Change    │
│                                      │
│ Hourly land variables, 9 km          │
│ resolution, 1950 to present.         │
│                                      │
│ License: Copernicus license          │
│ Citation: Hersbach et al. 2023…      │
│ DOI: 10.24381/cds.f17050d7           │
│                                      │
│ ▶ Read the methodology page          │
│ ▶ Copy citation as Wikipedia ref     │
│ ▶ Copy citation as BibTeX            │
└──────────────────────────────────────┘
```

**Specs:**
- Max-width: `min(480px, calc(100vw - 32px))`
- Backdrop: `rgba(0,0,0,0.4)` with `backdrop-filter: blur(4px)`
- Padding: `--space-6`
- Border radius: `--radius-md` (8px)
- Keyboard: ESC to close, focus trapped, focus returns to source pill
- Animation: 150ms ease-out fade + scale from 0.97

### 9.3 Uncertainty bands

Confidence intervals visualised on charts.

| Pattern | Use |
|---|---|
| **Shaded ribbon** | 5–95th percentile envelope on time series |
| **Whiskers** | Annual averages with min/max or std dev |
| **Spaghetti** | Multi-model output (CMIP6) — one line per model, semi-transparent |

**Colour:** `--color-text-muted` at 25% opacity. Never a colour with semantic meaning — uncertainty bands should not read as "good" or "bad."

**Tooltip:** hover anywhere → "5th–95th percentile across N models. Baseline 1991–2020."

### 9.4 Resolution disclaimer

Auto-shown when displaying gridded data at scales finer than the data resolution.

**Anatomy:**
```
┌──────────────────────────────────────────┐
│ ⚠ This projection uses 25 km grid        │
│ resolution. Village-scale interpretation │
│ requires station data.                   │
└──────────────────────────────────────────┘
```

**Specs:**
- Background: `--color-surface-alt`
- Border-left: 2px solid `--color-watch`
- Padding: `--space-3`
- Type: `--text-xs`, `--color-text-secondary`
- Position: directly below the chart

**Trigger logic:** when the page's spatial context (zoom level, place class) implies a resolution finer than the data layer's native resolution, the disclaimer shows.

### 9.5 Place page layout

The 4-tab spine, universal across every place.

```
┌────────────────────────────────────────────┐
│  [Wordmark]              [Search] [Menu]   │  56px header, sticky
├────────────────────────────────────────────┤
│                                            │
│  Place name                                │  Source Serif Light, --text-display
│  Class · Region · Country                  │  Inter Medium, --text-sm, muted
│                                            │
│  Hero strip — current state                │  Class-specific content
│                                            │
├────────────────────────────────────────────┤
│  Now │ Normal │ Trend │ Future │ +ext      │  48px tab bar, sticky on scroll
├────────────────────────────────────────────┤
│                                            │
│  Tab content                               │
│  - Charts (Plot SSR)                       │
│  - Source pill on each                     │
│  - Uncertainty bands where applicable      │
│                                            │
├────────────────────────────────────────────┤
│  Sources used on this page                 │  Footer summary
│  ▶ Cite this page (Wikipedia / BibTeX)     │
└────────────────────────────────────────────┘
```

**Hero strip content per class:**

| Class | Hero shows |
|---|---|
| Trekking destination | Condition icon · plain-language status · last-updated NPT |
| Glacier | Extent change since 1980 · mass balance trend arrow · last in-situ measurement date |
| Peak | Jet stream status · freezing level today · climbing-window status |
| Lake | Surface area trend · level vs normal |
| River point | Flow vs normal · snowmelt fraction |
| City | PM2.5 + AQI badge · primary smoke source if applicable |

### 9.6 Climate Time Machine

The signature analytical chart pattern.

```
ABC Corridor — October temperature
Month average · 1991–2020 baseline

[Year slider: 1991 ─────────●─────── 2026]

  ┌──────────────────────────────────────────┐
  │                                          │
  │     ╱╲                                   │
  │    ╱  ╲       ╱╲    ←  shaded            │
  │   ╱    ╲     ╱  ╲      climatology       │
  │  ╱      ╲   ╱    ╲                       │
  │ ╱        ╲_╱      ╲   ←  bold line       │
  │                       selected year      │
  │                                          │
  └──────────────────────────────────────────┘
   1   5   10   15   20   25   30 (October day)

This October was 1.8°C warmer than the
1991–2020 baseline. Cooler than the 2010s
average by 0.4°C.

ⓘ ERA5-Land · 9 km grid · 1991–2020 baseline
```

**Components:**
- 5–95th percentile ribbon for the climatology (`--color-text-muted` at 25%)
- Bold line for the selected year (`--color-text-primary`)
- Comparison sentence below the chart (auto-generated from data)
- Year slider above (URL-synced; sharable state)
- Source pill at the bottom

**Interaction:**
- Drag year slider → chart updates
- Hover on line → tooltip with date and value
- Tap "compare" → adds a second year line in `--color-text-secondary`

### 9.7 In Your Lifetime

Personalised hero block. Birth year input → renders user-specific change story.

```
You were born in [1985 ▼]. Nepal has changed since then.

  ─────────────────────────────────────────
  Average annual temperature, Nepal:
       1985 ───────────  2026
       6.2°C        7.6°C
       +1.4°C in your lifetime

  Khumbu Glacier extent:
       1985: 38.4 km²
       2026: 26.7 km²
       −30% in your lifetime

  Monsoon arrival in Pokhara:
       1985: typically June 12
       2026: typically June 24
       12 days later in your lifetime
  ─────────────────────────────────────────
```

**Specs:**
- Each row is a small chart with source pill
- Numbers in JetBrains Mono with tabular figures
- Designed for screenshot: full block fits 1080×1080 on Instagram
- One CTA: "Share this story" → permanent URL with birth year encoded

### 9.8 Vanishing Photo Archive slider

Image comparison slider.

**Specs:**
- Library: `react-compare-slider` (touch-friendly, small)
- Captions on both sides include source + capture date
- Aspect ratio: locked 16:9 to keep alignment consistent
- Mobile: drag handle in centre, vertical pinch to zoom both panels
- Source attribution: separate pills for left and right panels

### 9.9 Map components

The map is one surface; every map element follows these rules.

**Tile palette:** muted, low-saturation. Maps are background, not foreground. The data layer on top is the focus.

**Map controls:** bottom-right cluster (zoom, layer selector, current-location). Single-pixel border, `--color-border`.

**Layer legend:** bottom-left, collapsible. Always visible by default. Lists every active layer with its source pill.

**Place markers:**
- Default: 8px circle, `--color-text-primary`, white border
- Selected: 16px circle, `--color-best`, white border
- Class-coded icon for clusters: glacier (snowflake), peak (triangle), lake (drop), city (square)

**Hover state on marker:** label appears above, `--color-text-inverse` on `rgba(0,0,0,0.85)` background, 4px corner radius.

### 9.10 Cards

Cards are the workhorse component. Standardised across all archetypes.

| Variant | Padding | Border radius | Use |
|---|---|---|---|
| **Default** | `--space-4` | `--radius-md` (8px) | Most cards |
| **Compact** | `--space-3` | `--radius-sm` (4px) | Dense data tables |
| **Hero** | `--space-6` | `--radius-lg` (12px) | Featured story, top of place page |

All cards have `1px solid --color-border` and `--shadow-sm`. Hover → elevation increases to `--shadow-md`. No colour change on hover.

### 9.11 Buttons

Three variants only. No gradients, no glow, no fancy hover.

| Variant | Use | Style |
|---|---|---|
| **Primary** | The main action on a screen | `bg --color-text-primary`, `text --color-text-inverse` |
| **Secondary** | Supporting actions | `border --color-border`, `text --color-text-primary` |
| **Ghost** | Inline links, low-attention | `text --color-text-primary`, underline on hover |

States:
- Hover: subtle 5% darker on solid, underline appears on text
- Focus: 2px outline `--color-best` at 2px offset
- Disabled: 40% opacity, cursor `not-allowed`

### 9.12 Time controls

Universal time-controls across the Atlas.

| Control | Use |
|---|---|
| **Year slider** | Climate Time Machine, In Your Lifetime |
| **Decade slider** | Trek Window Shift Index |
| **Date picker (calendar)** | Historical Event Archive search, methodology page filters |
| **Time-of-day toggle** | Trekker decision strip (existing) |

All time controls sync to URL. Current value is the source of truth; component state derives from URL.

### 9.13 Navigation

**Top nav** (sticky):
- Wordmark (left)
- Sections: Places · Glaciers · Stories · Atlas · About
- Search (right) — opens command palette
- Menu (mobile)

**Section nav** (sticky on scroll):
- Within a place page: the 4-tab spine
- Within a story: a TOC sidebar (desktop only)
- Within the catalogue: faceted filters

**Search / command palette:**
- Cmd/Ctrl + K opens
- Searches across places, datasets, events, methodology pages
- Shows place type icons inline
- Recent search history shown when empty

### 9.14 Footer

Minimal. Three lines.

```
Himalayan Atlas · open data, sourced and credited
About · Methodology · Sources · Contact
© 2026 · Built in Nepal · Source code: github.com/SushantChalise/Weather
```

No newsletter signup. No social icons. No "follow us" begging.

---

## 10. Interaction & motion

The Atlas is calm. Animations have a job; if they don't, they're cut.

### 10.1 Motion principles

> Motion exists to **explain causality** (this happened because of that), to **maintain context** (you didn't teleport), and to **acknowledge input** (the system received your action). Motion never exists to entertain.

### 10.2 Animation timing

| Action | Duration | Easing |
|---|---|---|
| Card hover (elevation increase) | 150ms | ease-out |
| Modal open / close | 150ms | ease-out (scale + fade) |
| Tab change | 200ms | ease-out (content cross-fade) |
| Year slider scrub | 0ms | linear (immediate response) |
| Map fly-to | 800ms | ease-in-out |
| Layer toggle | 200ms | ease-out (opacity) |
| Page transition (route change) | 0ms | (none — same as static page load) |

### 10.3 Idle behaviour

After 30s of no interaction, all looping animations pause. Static transitions (hover, modal) continue.

### 10.4 Reduced motion

`prefers-reduced-motion: reduce` → all transitions use 0ms duration. Component still renders correctly; just appears instantly.

### 10.5 Touch / keyboard / mouse

The Atlas is **input-agnostic**. Every interaction works on all three input types:

| Input | Tested |
|---|---|
| Mouse + keyboard | Default development |
| Touch | iPhone 12 (portrait + landscape), iPad, Android (Pixel 6) |
| Keyboard-only | Tab through all interactive elements; visible focus on every focusable element |
| Screen reader | VoiceOver (iOS, Mac) + NVDA (Windows) tested on every component before merge |

---

## 11. State design

How the product looks when something hasn't happened, has gone wrong, or is in motion.

### 11.1 Loading

We pre-render charts on the server, so most loads aren't loads. For the cases that genuinely load (cross-cutting visualisations, search results):

```
┌──────────────────────────────────────────┐
│                                          │
│  ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒ ▒        │
│                                          │
│  Loading ERA5 climatology…               │
│                                          │
└──────────────────────────────────────────┘
```

- Skeleton matching the eventual layout
- Specific text: what's loading, not "Loading..."
- Visible after 200ms — instant loads don't get a skeleton

### 11.2 Empty

When a query returns no data:

```
No glaciers in this region with mass balance
data before 2000.

Try expanding the time range, or browse all
glaciers in the Atlas.
```

- Honest: what's missing and why
- Constructive: what to do next
- Never a sad emoji or apology

### 11.3 Error

When something goes wrong:

```
We couldn't load the climatology for ABC.

This usually means our cache is being refreshed.
Try again in a few seconds.

If the problem persists, check status.
```

- What happened (in plain language)
- What it usually means
- What to do
- Where to check for ongoing issues

### 11.4 Stale

When data is older than expected (e.g., Himawari overlay > 45 minutes old):

```
[Banner above the map]
Satellite cloud overlay is 67 minutes old —
older than usual. Updates resume automatically.
```

- Show how stale (not "data may be stale")
- Tell what's happening
- No call to action — the user can't fix it

### 11.5 Offline

When the browser is offline (Service Worker, future):

```
You're offline. Showing cached version of this page.

Last updated: 4 hours ago.
```

- Clear "cached"
- Show the timestamp
- Disable interactions that require fresh data

---

## 12. Content design

How we write. Microcopy that respects the reader.

### 12.1 Numbers

| Value | Format |
|---|---|
| Temperatures | `−3.2 °C` (figure dash, non-breaking space, °C) |
| Anomalies | `+1.8 °C above 1991–2020 average` (en-dash for ranges) |
| Percentages | `−30%` (no space before %) |
| Areas | `26.7 km²` (km², not "sq km") |
| Distances | `5.2 km` |
| Elevations | `5,364 m` (comma thousands, lowercase m) |
| Years | `2026` (never apostrophe-26) |
| Decades | `1990s` (never "1990's") |
| Date ranges | `1991–2020` (en-dash, no spaces) |
| Time of day | `06:24 NPT` (24-hour, with timezone) |

### 12.2 Dates

Full date: `9 May 2026` (day-month-year — international style, no commas, no superscript ordinal).
Date range: `9–12 May 2026`.
Cross-month: `28 April – 3 May 2026` (en-dash with spaces).
Year only: `2026`.

Always show timezone for clock times. NPT (UTC+05:45) for Nepal-side, IST (UTC+05:30) for India-side, BTT (UTC+06:00) for Bhutan, CST (UTC+08:00) for Tibet/China where relevant.

### 12.3 Place names

Use the Romanisation locally accepted, with native script as secondary identifier:

| Latin | Native | Notes |
|---|---|---|
| Sagarmatha · Mount Everest | सगरमाथा · ཇོ་མོ་གླང་མ | Three names, all legitimate |
| Pokhara | पोखरा | |
| Kathmandu | काठमाडौँ | |
| Lhasa | ལྷ་ས། | Tibet |

In running text, use the most-likely-known name first ("Mount Everest"), with the local name in italics on second mention or in a tooltip.

For glaciers, use the WGMS / RGI canonical name.

For peaks, use the official Nepal / Pakistan / India / Tibet survey name as primary.

### 12.4 Microcopy patterns

| Pattern | Example |
|---|---|
| Status timestamp | `Updated 12 minutes ago · 06:24 NPT` |
| Source attribution | `Source: ERA5-Land, ECMWF` |
| Comparison sentence | `+1.8°C above 1991–2020 average` |
| Trend statement | `Khumbu Glacier has lost 30% of its 1985 area.` |
| Uncertainty | `5–95th percentile across 12 models.` |
| Caveat | `9 km grid resolution — village-scale interpretation requires station data.` |

### 12.5 Things we don't write

| Avoid | Why |
|---|---|
| "Click here" | Link should describe the destination |
| "Learn more" | Same — describe what they'll learn |
| "Sign up to get notified" | We don't have a newsletter |
| "🔥 Trending" or any "trending" framing | Climate isn't a trend |
| "AI-powered" | We don't use AI in the product runtime |
| "World-class", "cutting-edge", "revolutionary" | Marketing puffery |
| Exclamation points in body copy | Calm voice |
| "Unfortunately", "We apologise" in error states | Honest, not abject |
| "Please" prefacing instructions | Respectful, not deferential |

---

## 13. Accessibility

WCAG 2.2 Level AA is the floor, AAA where reasonable. Accessibility is built in, not bolted on.

### 13.1 Contrast

All text meets WCAG AA 4.5:1. Display text and labels meet AAA 7:1 where the design supports it. Anomaly map colours are paired with hatching for colourblind-safety.

### 13.2 Focus

Every focusable element has a visible focus state: 2px solid `--color-best` outline at 2px offset. Never `outline: none`.

Focus order matches reading order. Tab moves through Header → Tab bar → Main content → Sources → Footer.

### 13.3 Touch targets

Minimum 44×44 px on mobile. Minimum 32×32 px on desktop. The source attribution pill — small visually — has padding to meet 44px touch target on mobile.

### 13.4 Screen readers

Tested on VoiceOver (iOS, Mac) and NVDA (Windows). Specific patterns:

- Charts: `<title>` and `<desc>` SVG elements describe what the chart shows
- Maps: each layer has `aria-label`; hidden text describes the visual state for SR users
- Source pills: `aria-label="Source: ERA5-Land. Click to view full citation."`
- Tab bar: ARIA tabs pattern (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`)
- Modals: focus-trapped, ESC-closeable, restored focus on close

### 13.5 Keyboard

Every interaction is keyboard-accessible:

| Key | Action |
|---|---|
| Tab / Shift+Tab | Move focus |
| Enter / Space | Activate (button-like behaviour) |
| Arrow keys | Navigate within composite widgets (tab bars, sliders, maps) |
| Esc | Close modal, dismiss menu |
| Cmd/Ctrl + K | Open command palette |
| `?` | Open keyboard shortcuts help |

### 13.6 Motion sensitivity

`prefers-reduced-motion: reduce` → all animations 0ms.

### 13.7 Colour-only meaning is banned

Every colour-coded element has a redundant icon, text label, or hatch pattern. The Anomaly Map uses pattern + colour. The Decision Strip pills have colour + icon + text.

---

## 14. Performance as design

Performance is a design problem. A beautiful page that takes 8s to load is an ugly experience.

### 14.1 Performance budget

| Metric | Budget |
|---|---|
| Largest Contentful Paint (LCP) | < 2.0 s on simulated 3G |
| Time to Interactive (TTI) | < 3.0 s |
| First Input Delay (FID) | < 100 ms |
| Cumulative Layout Shift (CLS) | < 0.05 |
| Total page weight (engaged) | < 200 KB |
| Lighthouse score | > 90 across all metrics |

### 14.2 Network awareness

The product detects (or assumes when uncertain) low-bandwidth users:

- Triggered by Save-Data header, slow-2g/2g/3g effective connection type, manual toggle
- Static map fallback instead of MapLibre tiles
- Animations paused
- Photo archives served at lower resolution
- Heavy charts replaced with text-only summaries
- Total payload < 100 KB

### 14.3 Image strategy

- All images via Next.js `<Image>` for automatic format selection (AVIF, WebP)
- LCP image preloaded
- Below-the-fold images lazy-loaded
- Photo archive sliders preload only the visible pair; surrounding pairs lazy
- Satellite tiles (Himawari, MODIS) cached for 24h browser-side

### 14.4 Font loading

`next/font/google` for self-hosted Inter, Source Serif 4, JetBrains Mono. `font-display: swap`. Preload only Inter and Source Serif 4 critical weights.

---

## 15. Iconography

### 15.1 Icon philosophy

Icons clarify; they don't decorate. Every icon has a label (visible or `aria-label`). No icon-only buttons unless the icon is universal (close, search, menu).

### 15.2 Icon library

**Lucide** (open-source, 1px stroke, consistent) for UI icons. Size: 20×20 default, 16×16 inline-with-text, 24×24 standalone.

For climate-specific icons (cloud-cover variants, snow type, weather codes), we use a small custom set extending Lucide's style. They live in `src/components/atlas/icons/`.

### 15.3 Icon set

Standard UI icons:

| Icon | Use |
|---|---|
| `info` | Source attribution pill |
| `external-link` | Off-site links (citations, source pages) |
| `download` | Export, citation copy |
| `share` | Share button |
| `search` | Search trigger |
| `menu` | Mobile menu |
| `close` | Modal dismiss |
| `chevron-down` / `chevron-right` | Disclosure |
| `arrow-up` / `arrow-down` | Trend indicators (with text label) |

Climate-specific:

| Icon | Use |
|---|---|
| `cloud` (filled / partial) | Cloud cover indicator |
| `cloud-rain` | Precipitation |
| `cloud-snow` | Snowfall |
| `mountain-peak` | Peak place class |
| `glacier` (custom — flowing tongue shape) | Glacier place class |
| `lake` | Lake place class |
| `river` (custom — winding line) | River place class |
| `wind` (custom) | Wind / jet stream |
| `aqi` (custom — concentric circles) | Air quality |

### 15.4 Forbidden icons

| Avoid | Why |
|---|---|
| Skeuomorphic icons (3D thermometer, 3D cloud) | Period-incorrect |
| Filled icons mixed with stroke icons | Inconsistent |
| Emoji used as icons in UI chrome | Inconsistent across platforms |
| Animated icons | Distracting |

---

## 16. Imagery & cartography

### 16.1 Photographic treatment

Photos in the Atlas (Vanishing Photo Archive, story page heroes, place page imagery) are presented:

- With **caption** including photographer, year, location, license
- **Untouched** — no Instagram filters, no exposure pumping
- **Aspect ratio 16:9** for hero images, **4:5** for cards, **1:1** for thumbnails
- **Loading**: low-resolution placeholder (32px wide, blurred) → full image as it loads

### 16.2 Cartographic treatment

Maps follow Swiss / NACIS cartographic conventions:

- **Hillshade always on**, low-saturation
- **Contour lines** at 100m, 500m, 1000m intervals (zoom-dependent)
- **Place labels** in Inter SemiBold, no shadow, full opacity
- **River labels** in Source Serif Italic, blue-grey
- **Peak labels** in Inter SemiBold UPPERCASE, slight letter spacing
- **Country borders** thin, dashed, low contrast — politically present, visually quiet
- **Layer overlays** semi-transparent, never blocking topographic detail beneath

### 16.3 Satellite imagery

Himawari, MODIS, Sentinel imagery is presented with:

- Source attribution overlay (corner)
- Acquisition timestamp (corner)
- Band identifier where multi-band (e.g., "B13 thermal IR")
- Colour scheme appropriate to the band (true colour for visible, scientific palette for thermal)

---

## 17. The "don't" list

Patterns we explicitly reject. These are review-blockers.

| Don't | Reason |
|---|---|
| Use red on a chart axis (gridlines, labels) | Red is reserved for warning / extreme |
| Animate a number "counting up" | Cheap dashboard trope |
| Use a pie chart for time-series data | Wrong tool |
| Use a 3D chart of any kind | 3D charts are unreadable |
| Use cursive / brush / ornamental fonts | Wrong tone |
| Use stock photos | Always real, attributed images |
| Show "loading" with no context | "Loading X" or skeleton |
| Use a CAPTCHA | We have nothing to protect from bots |
| Sell or expose user data | No analytics beyond aggregate Vercel metrics |
| Display a cookie banner under EU rules without actually using cookies | Banner-free site is the ideal |
| Open links in new tabs by default | The user decides |
| Auto-play video or audio | Always opt-in |
| Display an exit-intent popup | Disrespectful |
| Use brand colour as a background gradient | Cheap |
| Use box shadows to simulate elevation depth deeper than 4 levels | Skeuomorphic |
| Use uppercase for body copy | Hard to read |
| Use justified text in body | Awkward word spacing |
| Use a drop cap | Editorial-magazine cliché |
| Use a "subscribe" CTA on every page | We have no newsletter |

---

## 18. Reference inventory

What we looked at while writing this document:

| Product | Lesson |
|---|---|
| **OurWorldInData** | Chart system, source attribution, embed-friendly |
| **ClimateData.ca** | Government-funded national climate atlas done right |
| **NYT Graphics / Bloomberg Graphics** | Editorial chart typography, narrative pacing |
| **National Geographic Atlas** | Cartographic restraint, type, colour |
| **Stripe Docs** | Documentation aesthetic, code samples, table design |
| **Linear** | Typography, navigation density, motion restraint |
| **Mapbox** | Cartographic UI, zoom-aware label rendering |
| **Apple HIG** | Motion principles, accessibility framing |
| **IBM Carbon** | Token system, accessibility-first |
| **Carbon Brief** | Embed-friendly editorial charts |
| **Climatic Atlas of Nepal (academic, 2017)** | Negative example — important data, broken interface |
| **ICIMOD RDS Portal** | Negative example — gold data, government-tier UX |
| **Climate Reanalyzer** | Negative example — researcher tool aging |

---

## 19. Living document

This design system evolves. Per CONTRIBUTING.md, any PR that introduces a new component or pattern must document it here. The colour system, type scale, and core principles change only with explicit founder approval — they are foundational, and changing them ripples through every component.

Specific to design changes:

| Change | Process |
|---|---|
| New token (colour, spacing, etc.) | Add to this doc + Tailwind config + token export. PR review checks usage. |
| New component | Add §9 entry + Storybook entry + accessibility checklist. PR. |
| New pattern (e.g., new chart type) | Add §9 entry. Reference existing patterns it relates to. |
| Change to a principle (§3) | Founder approval + explicit changelog entry |

---

## 20. What this document deliberately does NOT do

- Specify per-component code — that's `src/components/atlas/<component>/<Component>.tsx`
- Define data sources or schemas — that's DATA.md and ARCHITECTURE.md
- Define product features — that's PRODUCT.md
- Define the build sequence — that's BUILD_PLAN.md
- Define commit / branch / CI conventions — that's CONTRIBUTING.md
- Lock in design before user testing — every component is provisional until validated against real users (informal: friends, climbers, journalists; formal: usability sessions starting hour 100+)

---

*The Himalaya doesn't shout; we don't shout. Every choice in this document is a decision to build calm, beautiful, honest software for a region that deserves it.*
