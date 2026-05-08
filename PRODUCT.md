# Nepal Mountain Weather Decision Map — Product Spec

**Status:** v1.3 product spec, locked
**Last updated:** 2026-05-08

**v1.3 changes from v1.2:**
- "Proof" terminology renamed to "Evidence" everywhere (snapshots, ledger, panel labels). The product shows source data, not unverified ground truth — see §22.
- Jomsom (Mustang) added as the 8th destination — rain-shadow comparison wedge for monsoon and shoulder seasons.
- §20 Decision-to-action: Compare / Share / Copy Guide Brief move into v1 as the closing surface for every answer. Save Alert remains v1.1.
- §12.1 Destination Insight Panel renamed "Proof from last 72h" → "Evidence from last 72h"; "Why" → "Why we think this".
- §21 Evidence Tier system added — splits source provenance from confidence freshness. Route-condition cards default to `no-field-report` in v1 to make data honesty visible.

---

## 0. Locking sentence

> Nepal Mountain Weather Decision Map is a clean, premium map of Nepal that helps travelers, guides, and operators **compare conditions, see clear windows, and choose better travel windows** — with visible evidence and confidence labels at every step. The map is the explanation; the answer comes first; **the user makes the decision**.

This is decision *support*, not instruction. The product never overclaims authority over Himalayan weather.

---

## 1. The Five Decision Primitives (the product spine)

Every screen, card, and toggle traces back to one of these.

| # | Primitive | Question it answers |
|---|---|---|
| 1 | **Where is good now / tomorrow morning?** | "Where should I go?" — bounded by the +24h forecast scope |
| 2 | **When is the next clear window?** | "When will I see the mountain?" |
| 3 | **What changed in the last 72 hours?** | "Is the pattern stable or shifting?" |
| 4 | **Which route segments are affected?** | "What's the trail condition?" |
| 5 | **How confident is this answer?** | "Should I trust this?" |

---

## 2. Why this isn't a generic weather map

Windy, Meteoblue, AccuWeather, and Google Weather already show weather layers over Nepal. The product moat is **Nepal-specific mountain interpretation**:

- Route-segment weather translation ("slippery", "fresh snow risk") instead of millimeter rainfall
- Route-aware snowline tied to actual trekking altitudes
- Clear Window primitive specifically for mountain views (not generic forecast)
- 72h evidence snapshots from real satellite data — visible source data, not unverified ground truth
- Destination comparison by **trip intent** (mountain views vs trekking routes vs lowland)
- Premium terrain-first cartography
- Plain-language explanations a guide can paste into a client briefing

If a feature doesn't extend one of these advantages, it doesn't ship.

---

## 3. Operational rules (locked across every surface)

| Rule | Why |
|---|---|
| **All times displayed are Nepal Standard Time (UTC+5:45).** Subtle "NPT" indicator next to every timestamp. | A user in London asking "Avoid after 1 PM" must not be confused. |
| **Low-bandwidth mode** auto-engages on slow connections (<200 kbps detected). Defaults to text Decision Strip + cards; map and animations paused; data shrinks to ~50KB JSON payload. Manual toggle also available. | Above 3,500m, Everest Link / Ncell 3G is slow, dropped, and metered. The decision must load in under 2s on 2G. |
| **Animations pause after 30s of no interaction** (cloud drift, replays). Replays only load on explicit user tap. | Cold weather drains phones fast; WebGL shaders drain them faster. |
| **"Now" downgrades to "Stale Data" when latest satellite is >45 min old or model is >6h old.** Visible warning, not silent. | Mountain weather changes faster than model runs. Pretending freshness is dishonest. |
| **Severity vocabulary:** Best · Good · Watch · Poor · **Avoid** (reserved for severe — storm, flood, extreme wind, official warning) | "Avoid Annapurna" must mean something. Default for normal cloud/rain is "Watch". |

---

## 4. Visual hierarchy (locked)

1. **Weather clarity** — can the user understand what the weather is doing?
2. **Decision output** — does the UI tell them what to do?
3. **Nepal geography** — can they orient?
4. **Route / destination relevance** — what matters for ABC, EBC, Pokhara?
5. **Terrain beauty** — premium cartographic quality
6. **3D cinematic effect** — last; only when it serves the above

---

## 5. The three surfaces

| Surface | Question |
|---|---|
| **Overview Map** (default) | "Where in Nepal should I go now or tomorrow morning?" |
| **Route Detail** | "What's happening on ABC / Everest?" |
| **Destination Insight** | "Tell me everything about this place" |

A **Comparison Drawer** is accessible from any surface (cross-cutting answer to primitive #1).

---

## 6. Default landing — Nepal Overview Map

### 6.1 Camera

| Mode | Default? |
|---|---|
| **Top-down** (decision clarity) | **Yes** |
| **Tilt** (peak-cloud occlusion, explanation) | One click |
| **Cinematic flythrough** | Marketing only — never default |

### 6.2 Always visible

- Shaded-relief Nepal terrain (light 3D, not heavy postprocessing)
- Subtle landcover tint, faint rivers
- 7 destination markers + 2 trail entries — each with **status halo + condition icon + short label** (see §6.4)
- Decision Strip (top, see §7)
- Layer toggles + time control (bottom, collapsible bottom sheet on mobile)

### 6.3 Hidden by default

ABC and EBC route polylines (only emphasized in Route Detail). Wind particles. Sub-trails beyond ABC/EBC. Watershed boundaries.

National view = **destination-first**. Route view = **corridor-first**.

### 6.4 Status halos — color + icon + label

Color alone is insufficient (accessibility + complex states). Each marker shows:

| Halo color | Icon | Label example |
|---|---|---|
| Gold | ☀ | "Clear" |
| Light green | 🌤 | "Mostly clear" |
| Blue | 🌧 | "Rain" |
| Cyan | ❄ | "Snow 4,200m+" |
| Gray | ☁ | "Cloud" |
| Red | ⚠ | "Warning" |

For complex destinations (e.g. ABC: cloudy lower + snow upper), the halo shows the dominant condition; the card explains the nuance.

---

## 7. The Decision Strip (top of screen)

**Three ranked pills**, scannable on desktop and mobile:

```
BEST NOW    Jomsom · Chitwan
BEST VIEW   EBC AM · Poon Hill AM
WATCH       ABC lower trail PM · Snow above MBC
```

Each pill expands on tap to show reasoning. Each named destination/segment is clickable → opens that surface. Updates server-side every 10 min.

The optional fourth pill **AVOID** appears only when severity threshold is met (storm, flood, extreme wind, official warning).

---

## 8. Layer toggles

| Layer | Visual when active |
|---|---|
| ☁ **Clouds** (default) | Soft white/gray semi-transparent overlay |
| 🌧 **Rain** | Blue intensity heatmap |
| ❄ **Snow** | Cyan/pale-blue with **route-aware snowline contour** (see §8.1) |
| 📍 **Current** | Per-destination condition cards prominent |
| 🌡 **Temperature** | Warm-cool gradient at surface |

Optional: 💨 Wind — particles, off by default.

**Each layer has its own mini-legend** (cheap, high readability).

**Dominance rule:** never more than two layers visually dominant. Cloud + Rain together is the only allowed pairing.

### 8.1 Snow is route-aware (not a single national line)

Snowline varies by region, aspect, precipitation intensity, and local temperature.

**Overview:**
```
Snowline ~4,200–4,600m by region
```

**Route Detail (per corridor):**
```
ABC:  snowline ~4,200m → you cross it between Deurali and MBC
EBC:  snowline ~5,000m → you cross it above Lobuche
```

The route's elevation profile is visually intersected by the snowline so the user sees the crossing point.

---

## 9. Time control + Clear Window

```
[ Now ●━━━━━━━━━━━☀━━━━━ +24h ]
                          [ ▶ Replay 72h ]
```

The ☀ marker on the timeline indicates **sunrise** at the current location's lat/lon (NPT).

### 9.1 Clear Window — first-class primitive

For every destination + viewpoint, a horizontal timeline of the next 12 daylight hours. Pre-dawn windows are de-emphasized unless before-sunrise viewing matters (rare).

```
6 AM   7 AM   8 AM   9 AM   10 AM   11 AM   12 PM
☀Best  Good   Good   Watch  Cloudy  Cloudy  Poor
```

Plus a card:
```
Poon Hill — Clear Window
Next clear window: Tomorrow 5:50–8:20 AM NPT
Confidence: Medium · Forecast
Pattern: Clouds build after 10:30 AM (3 days in a row)
Best of last 7 days: Yesterday morning (8:10 AM)
```

Sunrise weighting: a "clear window" at 2:00 AM is useless and suppressed unless the destination's product (Poon Hill, Kala Patthar) specifically values pre-dawn movement.

### 9.2 Replay 72h — summary + evidence snapshots

Animation is the evidence; summary + 3 snapshots are the product.

```
Last 72h — ABC
Clouds built after 11 AM on all 3 days.
Best visibility was yesterday 6:20–8:10 AM NPT.
Heavy rain affected Chhomrong–Bamboo twice.
Trend: improving tomorrow morning.

[Best yesterday 6:30 AM]   [Worst yesterday 1:20 PM]   [Now today 8:10 AM]
       Clear                       Clouded                   Partial
```

**Snapshot selection rules** (deterministic, not arbitrary):
1. **Best:** clearest moment in the last 72h (lowest cloud-mask coverage in scope bbox)
2. **Worst:** worst cloud/rain moment in the last 72h
3. **Now:** most recent significant frame

User never has to scrub to understand. They scrub if they want to *see* it.

---

## 10. Customer cards (always-visible side panel)

Three cards. Each carries the Clear Window summary and a confidence label.

### 10.1 ABC Corridor
```
ABC Corridor                        Trend ↗ improving · Forecast medium · NPT 14:30
☁ Cloudy with rain in lower trail
Rain Chhomrong–Deurali · Snow above MBC (you cross snowline at MBC)
Best clear window: tomorrow 6–9 AM
```

### 10.2 Everest Corridor
```
Everest Corridor                    Trend → stable · Observed · NPT 14:30
⛅ Partial morning visibility
Afternoon cloud buildup · Snow above Lobuche
Best clear window: tomorrow 6:10–8 AM
Lukla flight risk: moderate
```

### 10.3 Pokhara / Mountain View
```
Pokhara                             Trend ↘ worsening · Observed · NPT 14:30
🌧 Heavy cloud — Annapurna obscured
Rain likely afternoon
Next clear window: 2 days
```

Click any card → Destination Insight panel.

---

## 11. Surface 2 — Route Detail

### 11.1 Route as a weather object — ribbons with time mode

Route polyline becomes a **weather ribbon** encoded by segment condition.

| Condition | Ribbon style |
|---|---|
| Dry | Thin clean line |
| Damp / light rain | Faint blue glow |
| Heavy rain | Solid blue glow |
| Snow / above snowline | Cyan glow |
| Cloud ceiling | Gray veil overlay |
| Risky / warning | Red edge |

**Time mode toggle** (above the route):
```
[ Now ] [ Tomorrow AM ] [ Afternoon ] [ Last 24h ]
```

Trail condition depends on both recent rainfall and expected weather. The user can scan all four.

### 11.2 Per-segment cards (ABC example, "Now" mode)
```
Pokhara → Ghandruk        ☀ Clear, dry trail
Ghandruk → Chhomrong      ⛅ Cloudy, dry
Chhomrong → Bamboo        🌧 Damp (8mm last 24h)
Bamboo → Deurali          🌧 Slippery (heavy rain expected)
Deurali → MBC             ☁ Cloud ceiling 3,800m
MBC → ABC                 ❄ Fresh snow above 4,200m (snowline crossing)
```

Plain-language translation, not raw rainfall numbers.

### 11.3 Hero viewpoint Clear Window cards

For 8 hero viewpoints (4 per corridor). Same primitive as §9.1.

---

## 12. Surface 3 — Destination Insight Panel

### 12.1 Sections (priority order)

1. **Right now** — current condition + plain summary + status halo + confidence label + NPT timestamp
2. **Next clear window** — the headline for mountain destinations
3. **Why** — short causal explanation
4. **Evidence from last 72h** — 3 snapshots + plain-language summary ("Why we think this")
5. **Route / trail impact** (if applicable) — segment cards inline
6. **Trend** — improving / stable / worsening with reasoning
7. **Plain-language conditions** — view, trail, rain, snow, each as a one-line label (no composite score)
8. **Sources & confidence** — three timestamps (Himawari frame, Open-Meteo run, NPT clock)

Mountain Visibility Index lives here as one supporting card for hero viewpoints. Supports the Clear Window primitive; doesn't replace it.

### 12.2 Why no composite Experience Score

A score like "Experience: 61" without transparent reasoning is opaque and arbitrary across destinations. Plain-language labels are more honest:

```
View:   Good tomorrow AM
Trail:  Wet lower route
Rain:   Medium concern
Snow:   Above MBC only
```

Composite scoring may return in v1.2 once the formula is validated against real user feedback.

---

## 13. Comparison Drawer — split by trip intent

Triggered by a button labeled **"Compare"** on every surface. Mobile = swipeable cards; desktop = compact table.

Three categories — never mixed:

```
MOUNTAIN VIEWS
Destination       Now      Tomorrow AM   View    Recommendation
Poon Hill         Clear    Best          High    Best
EBC viewpoints    Partial  Good AM       Medium  Good
Pokhara/Sarangkot Cloudy   Improving     Medium  Watch
ABC               Cloudy   Better AM     Medium  Watch

TREKKING ROUTES
Destination   Now      Trail     Snow concern   Recommendation
ABC           Cloudy   Wet lower Above MBC      Watch
EBC           Partial  Dry       Above Lobuche  Good
Langtang      Cloudy   Damp      None           Watch

LOWLAND / NON-MOUNTAIN
Destination   Now    Recommendation
Chitwan       Clear  Best
Kathmandu     Cloudy Watch
```

Within each category, ranking is meaningful. Across categories, ranking would be apples-to-oranges.

---

## 14. v1 mobile layout — three zones

Density was the failure mode in earlier drafts. Mobile is now strictly:

```
┌─────────────────────────────┐
│ Nepal Mountain Weather  ⚙   │
├─────────────────────────────┤
│ BEST NOW   Jomsom           │  ← Decision answer
│ BEST VIEW  EBC AM           │     (scannable 3 pills)
│ WATCH      ABC PM           │
├─────────────────────────────┤
│                             │
│      [Nepal Map]            │  ← Map zone
│      destinations + halos   │     ~55% of screen
│      tap halo to focus      │
│                             │
├─────────────────────────────┤
│ ABC Corridor       ☁ ↗ NPT  │  ← Cards zone
│ Best 6–9 AM · Forecast med  │     scrollable
├─────────────────────────────┤
│ Everest Corridor   ⛅ →      │
│ Best 6:10–8 AM · Observed   │
├─────────────────────────────┤
│ Pokhara            🌧 ↘      │
│ Avoid · Observed            │
├─────────────────────────────┤
│ [Compare ▸]  [Replay 72h ▶] │
└─────────────────────────────┘
                      [Layers] ← bottom sheet button
```

Layers + time control live in a bottom sheet that the user opens explicitly. The default screen is decision answer + map + cards.

---

## 15. Customer Lens (v1: Traveler implicit only)

v1 ships as Traveler-default. **No visible lens selector.** The product opens for travelers without making them choose a mode.

In v1.1, a "Guide mode" toggle appears, plus the Guide Brief feature (export the cards + decision strip as text/image/WhatsApp). Photographer / Flight / Hotel lenses arrive in v1.2 once Traveler+Guide prove the pattern.

The backend already structures data so lens-based prioritization is a config swap, not a rewrite (see ARCHITECTURE.md `LensConfig`).

---

## 16. Map vs panel separation

| On the map (spatial) | In side panel / cards (analytical) |
|---|---|
| Cloud / rain / snow overlays | 72h history summary + evidence snapshots |
| Snowline contour | Mountain visibility |
| Route ribbons (in Route Detail) | Plain-language labels |
| Destination markers + halos + icons | Confidence labels |
| Live legend strip | Best/worst time windows |
| Sunrise marker on timeline | Trend reasoning |

If it answers *where*, map. If *what / when / why / how confident*, panel.

---

## 17. v1 desktop layout

```
┌─────────────────────────────────────────────────────────────┐
│ Nepal Mountain Weather Decision Map     [Now ▾]  [⚙]        │
├─────────────────────────────────────────────────────────────┤
│ BEST NOW   Jomsom · Chitwan                                 │
│ BEST VIEW  EBC AM · Poon Hill AM                            │
│ WATCH      ABC lower trail PM · Snow above MBC   [Compare ▸]│
├──────────────────────────────────────────┬──────────────────┤
│                                          │  ABC Corridor    │
│                                          │  ☁ ↗ Forecast    │
│                                          │  Best 6–9 AM     │
│   [Top-down Nepal Map]                   ├──────────────────┤
│   destinations + halos + icons + labels  │  Everest Corridor│
│   route lines hidden                     │  ⛅ → Observed    │
│   tilt one click away                    │  Best 6:10–8 AM  │
│                                          ├──────────────────┤
│                                          │  Pokhara         │
│                                          │  🌧 ↘ Observed   │
│                                          ├──────────────────┤
│                                          │  ▶ Replay 72h   │
├──────────────────────────────────────────┴──────────────────┤
│ [☁ Clouds] [🌧 Rain] [❄ Snow] [📍 Current] [🌡 Temp]  [Tilt]│
│ Now ●━━━━━━━━━☀━━━━━ +24h     NPT 14:30  Sources: Himawari  │
└─────────────────────────────────────────────────────────────┘
```

---

## 18. Release plan

### 18.1 v1 — public demo (must ship)

**Map**
- Top-down shaded-relief Nepal terrain
- 8 destination markers + 2 trail entries with halo + icon + label (Pokhara, ABC, Poon Hill, EBC, Chitwan, Kathmandu, Langtang, Jomsom)
- Snowline contour (route-aware)
- 5 layer toggles + per-layer mini-legend
- Now / +24h / Replay 72h time control with sunrise marker

**Decision intelligence**
- Decision Strip: 3 ranked pills (Best Now / Best View / Watch [/ Avoid])
- Comparison Drawer: split by trip intent (Mountain Views / Trekking / Lowland), Jomsom included as monsoon rain-shadow alternative
- Clear Window primitive: per destination + 8 hero viewpoints
- 72h replay with plain-language summary + 3 deterministic evidence snapshots
- Confidence labels + Evidence tier on every card (route conditions show `no-field-report` honestly until v2's field-report layer ships)

**Decision-to-action surface (§20)**
- Compare button (split-by-intent drawer)
- Share button (native share / copy URL)
- Copy Guide Brief button (plaintext to clipboard)

**Route Detail (ABC + EBC)**
- Route ribbons with time mode (Now / Tomorrow AM / Afternoon / Last 24h)
- Plain-language segment cards (no millimeter rainfall)
- Snowline crossing point shown on elevation profile

**Destination Insight Panel**
- For 8 destinations + 8 hero viewpoints
- Right now · Clear Window · Why we think this · Evidence (72h) · Route impact · Trend · Plain-language conditions · Sources & confidence
- Action surface (Compare / Share / Copy Guide Brief)

**Operational**
- All times NPT with indicator
- Low-bandwidth mode (auto + manual)
- Idle animation pause (30s)
- Stale-data downgrade (>45 min satellite, >6h model)
- Mobile 3-zone layout, layers in bottom sheet
- Three performance tiers
- Source attribution visible

### 18.2 v1.1 — trust + ops layer

- Guide mode toggle + **Guide Brief** richer export (image / WhatsApp deep link / PDF — plaintext Copy already in v1)
- **Forecast Accuracy Ledger** — yesterday's clear-window predictions scored against today's archived satellite frames ("Yesterday: predicted clear 5:50–8:20; observed clear 6:10–8:00 → 82% match")
- **Lukla Flight Window card** — dedicated morning-flight visibility + wind card on EBC corridor
- **Seasonal Pattern Card** — ERA5-derived "ABC in May" planning context
- **Save Alert** — browser push when saved window confidence improves
- **Offline last-synced brief (PWA)** — service worker caches Guide Brief for field use
- Expanded Destination Insight (more historical depth)
- Better route segment history
- Wind layer toggle activated

### 18.3 v1.2 — segmentation

- Photographer / Flight / Hotel lenses
- 8+ viewpoints per corridor
- Optional composite Experience Score (only after formula validated)
- Multi-language (English / Nepali)

### 18.4 v2 — community + advanced

- **Structured Field Reports** — verified guide / lodge / operator confirmation layer. Activates the `field-reported` Evidence tier reserved in v1. Trail-condition cards finally upgrade from "no field report" to "Verified by lodge at 7:20 AM".
- More corridors (Manaslu / Mardi / extended Mustang routes)
- AI oracle · Flash flood model · Monsoon front tracker · Optical flow nowcasting

---

## 20. Decision-to-action surface (the sixth, closing primitive)

The five decision primitives answer *where / when / what changed / which segments / how confident*. After the answer, the product offers a **closing surface** so the user can act on their own decision. The surface is passive — it never tells the user what to do; it makes their next move easier.

The surface lives on every Destination Insight Panel and on each Clear Window card.

### 20.1 v1 — three actions, all client-side, zero accounts

| Action | Behavior | Why now |
|---|---|---|
| **[Compare ▸]** | Opens Comparison Drawer (already in spec, §13) | Already shipped surface — link is the point |
| **[Share]** | `navigator.share` on mobile, copy-link fallback on desktop. URL encodes `?destination=...&date=...&mode=...` so the receiver lands on the same view | Trekkers and guides discuss windows on WhatsApp. The product needs a frictionless paste path |
| **[Copy Guide Brief]** | Calls `/api/brief/[corridor]?format=text`, copies plaintext to clipboard, shows confirm toast | Guides paste into WhatsApp every morning. This is the wedge feature. See §20.3 |

All three are static — no auth, no notification infrastructure, no backend writes. Each action takes <1 day of implementation.

### 20.2 v1.1 — Save Alert

| Action | Behavior |
|---|---|
| **[Save clear-window alert]** | Browser push notification (Notifications API, no third-party service) when the saved window's confidence improves above threshold or window opens within 12h. Stored in `localStorage`, no server state |

Email alerts and Trip Room (group sharing) are explicitly out of scope. They require account infrastructure inappropriate for a non-commercial v1.

### 20.3 Guide Brief minimal export — v1, not v1.1

The Guide Brief API was already a v1 backend endpoint with v1.1 export UI deferred. **The plaintext copy button moves into v1.** Image / WhatsApp deep link / PDF export remain v1.1.

Why this matters: tourists may use this once. Guides use it every morning in season. The plaintext brief is the highest-leverage feature in the product, and the implementation is one fetch + `navigator.clipboard.writeText`.

```
[Copy Guide Brief]    ← v1
[Share to WhatsApp]   ← v1.1 (wa.me deep link)
[Download as image]   ← v1.1 (canvas snapshot)
[Download as PDF]     ← v1.1
```

### 20.4 What this is NOT

- Not a booking surface. The product never lists operators, never takes payment, never recommends a specific guide.
- Not a marketplace. No vendor products, no commissions.
- Not instructive. Buttons say "Compare" / "Share" / "Copy Brief" — never "Book" / "Go now" / "Avoid this trail".

The user makes the decision. The product makes the next move easier.

---

## 21. Evidence vocabulary (corrects v1.2 "Proof" overclaim)

The product previously called its 72h satellite snapshots "Proof". This was an overclaim. We do not have ground truth — we have evidence.

| What we have | What we don't have |
|---|---|
| Satellite cloud-mask history | What a person actually saw from a specific ridge |
| IMERG precipitation observations | Whether a specific trail section was slippery |
| DHM warnings | The exact lived condition at every point on the trail |
| Open-Meteo model output | A guide or lodge confirming current trail state |
| ERA5 seasonal baselines | A photo from the destination right now |

### 21.1 Renames (locked)

| v1.2 term | v1.3 term |
|---|---|
| Proof snapshots | Evidence snapshots |
| Proof Ledger | Evidence Ledger |
| `ProofManifest` type | `EvidenceManifest` type |
| `proofSnapshots` field | `evidenceSnapshots` field |
| `_proof` API field | `_evidence` API field |
| "Proof from last 72h" panel | "Evidence from last 72h" |
| "Why" section | "Why we think this" |

### 21.2 Evidence tier on every claim

Every condition label carries an explicit source tier (see ARCHITECTURE.md §`EvidenceTier`):

```
Observed (satellite)
Official warning
Forecast (model)
Estimated (derived)
Field reported (v2 only)
No field report available (v1 default)
```

Example route-condition card (v1):

```
Bamboo → Deurali
Slippery likely
Evidence: forecast + IMERG rain (last 24h)
Field report: not available
Confidence: Medium
```

The "field report: not available" line is intentional — making the gap visible builds trust. v2's structured field-report layer fills that gap; v1 honestly says it isn't there.

### 21.3 What changed in cards

UI labels in §10 cards are unchanged — they were already plain-language. The `confidence` row gains a sibling `evidence` row when the panel expands.

---

## 19. Visual style

Premium terrain atlas meets modern weather product meets travel decision map.

- Muted earth tones, soft cloud whites, generous whitespace
- Sans-serif type at comfortable sizes
- **Color reserved for decision signals:** gold = clear/best · blue = rain · cyan = snow · gray = cloud · red = warning · soft green tint = "Best" recommendation
- **Time-of-day light:** map shading subtly shifts with NPT (cooler tones AM, brighter mid-day, warmer evening) — mountain weather is time-of-day driven
- Animation rule: clouds drift, time slider slides, cards fade. Never strobe, never autoplay aggressive transitions. **Always pauses after 30s idle.**

The map should feel like a beautifully printed atlas you can ask questions of — and which answers back honestly.
