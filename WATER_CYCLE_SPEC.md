# Water-Cycle Atlas — Build Spec (v7, locked)

**Status**: locked after 5 review rounds (Codex + Gemini + Claude × 3 plans).
**Owner workflow**: Mother (Opus 4.7) coordinates; Sonnet 4.6 sub-agents execute parallel tasks via `isolation: worktree`.
**Live target**: `https://himalayan-atlas.devil-soul30.workers.dev/atlas/water-cycle`
**Repo**: `SushantChalise/Weather`, deploys via `npm run cf:deploy`.

This file is the **single source of truth**. All docs in `docs/water-cycle/*.md` expand sections of this spec. If a sub-doc disagrees with this spec, the spec wins; update the sub-doc.

---

## 1. Mandate

> *"I want more visual story telling — why did the glaciers vanish? How much water did we lose? What's happening to the lakes? Where did the water go? Only text will not work. We need good datasets and good animation here to tell the whole story."*

Build the canonical educational page about Hindu Kush Himalaya glacier loss. Not a marketing page. Not an explainer video. A **scrollable cinematic with auditable data sources** — every visual moment has a clickable layer reveal that decomposes the rendered geometry back into its source DEM, glacier polygons, lake outlines, thickness model, uncertainty halo, and citations.

The reframe that makes this canonical: **"make the cinema falsifiable."** — Codex, v5 review.

---

## 2. Thesis (locked)

**"The glacier was your reservoir."**

Past tense. Universal metaphor (works for a Brooklyn reader and a Nepali farmer equally). Past-tense + reservoir framing turns each chapter into confirmation of what the viewer already intuited, not revelation of a clever metaphor — structurally stronger.

Closing line on the final chapter: *"The glacier was your reservoir. We are draining it."*

Anti-line: ~~"Not the Ocean. The Tap."~~ (rejected — assumes Western framing of a non-Western water system).
Anti-line: ~~"We are surviving today by drinking our children's 2050 harvest."~~ (rejected — too rhetorical, dilutes evidence).

---

## 3. Headline numbers (locked, all sourced)

| Claim | Number | Source |
|---|---|---|
| HKH glacier ice 1990 → 2020 area loss | **~9% of HKH ice / 516 km³ water-equivalent / ~0.5 trillion tonnes** | ICIMOD HKH Cryosphere Assessment 2026, [icimod.org](https://www.icimod.org/world-glacier-water-meteorology-days/) |
| HKH peak warming rate | **0.3-0.5°C per decade, 2× global average** | ICIMOD HIMAP 2019, summary stat |
| Imja Tsho area growth 1962 → 2020 | **0.04 km² → 1.4 km² = 35×** (NOT "doubled") | Somos-Valenzuela et al. 2014 *The Cryosphere* + ICIMOD 2024 inventory |
| South Lhonak Lake (Sikkim) 2023 outburst | **24 dead, 70+ missing** | Nature 2026 reconstruction (NOT "100+ killed") |
| HKH downstream water-scarce-zone dependent population | **~250 million** in IGB basins | Miles et al. 2021 *Nature Communications*, [doi.org/10.1038/s41467-021-23073-4](https://doi.org/10.1038/s41467-021-23073-4) |
| Imja Glacier 1962 → 2020 retreat | **TBD (digitize from Somos-Valenzuela 2014 Fig 2)** | Somos-Valenzuela 2014 |
| Future scenarios | **SSP1-2.6 vs SSP5-8.5** (NOT RCP 4.5) | IPCC AR6 + Rounce et al. 2023 *Science*, [doi.org/10.1126/science.abo1324](https://doi.org/10.1126/science.abo1324) |

**Anti-numbers** (caught by review, do not use):
- ~~"-12% area loss"~~ (use "~9% of all HKH ice" — ICIMOD's 2026 phrasing).
- ~~"-7,346 km²"~~ (was scope-mismatched).
- ~~"2.5 trillion tonnes"~~ (5× overstatement; use ~0.5 trillion).
- ~~"1.65 billion downstream"~~ (basin pop, not meltwater-dependent — use 250M).
- ~~"100+ killed at South Lhonak"~~ (journalism not yet held up — use 24+70).

---

## 4. Chapter structure (locked, 7 chapters)

| # | Title | Hero shot | Diegetic data | HTML overlay |
|---|---|---|---|---|
| 0 | **The reservoir** | 30s HKH-arc oblique flyover with hidden cuts; ice volume dissolves 1990→2020; final frame rings Imja | 3D headline: "9% of all HKH ice — 516 km³ of water" | Mass counter ticking down, citation chip |
| 1 | **The retreat** | 25s 4-up grid: Khumbu, Yala, Annapurna I, Imja shrinking simultaneously; synchronized year ticker | Year as 3D type | Per-glacier % loss + km² lost; embed of /atlas/30-years map below for explore mode |
| 2 | **The lake bloom** | 25s top-down 3D Imja basin → glacier retreats → lake fills → camera follows outflow downstream | Lake area as 3D number scaling with the polygon | Imja growth curve 1962 → 2020 (D3) + "1.4 km², 60m deep" + 1962 photo + 2020 satellite as static OG poster |
| 3 | **Where it went** (Sankey) | 15s HKH landscape mid-foreground; 3D Sankey of moisture flux floating in foreground space (precipitation→ice→melt→lakes→rivers→ocean), all in km³/yr | km³/yr labels as 3D type at each node | HTML legend; "show data" `<table>` |
| 4 | **When it comes** (Hydrological Clock) | 3D Imja basin transitioning seasons in background; **2D circular Year-Clock UI in foreground** (HTML/SVG, NOT 3D — Codex caveat: timing precision needs axes/labels) | None — 2D primary | Two clock hands: 1990 vs 2070 peak meltwater date. Annotation: "Glacier water hits the field weeks earlier — when farmers don't need it." |
| 5 | **The feedback loop** (light-absorbing impurities) | 20s mountain transect; particles drift up from Indo-Gangetic plain; snow visibly darkens; melt accelerates. **Reframed**: NOT BC-only "soot storm". Mixed BC + dust + algae per Kaspari 2014 (BC: 6-10% albedo reduction; dust: dominant in Solu-Khumbu) | None | Dual-axis chart: BC concentration + dust optical depth; caption naming both. |
| 6 | **The choice** (SSP1-2.6 vs SSP5-8.5) | 30s split-cinematic: same HKH arc flyover from Ch 0 but 2100 endstate; left = SSP1-2.6 best case, right = SSP5-8.5 worst case (NOT RCP 4.5). Ghost-glacier overlay: SSP1-2.6 ice as glowing wireframe inside SSP5-8.5 mass — "this is the volume of our indecision." | 2100 mass as 3D type | Closing line: **"The glacier was your reservoir. We are draining it."** |

**No discrete videos**: chapters use **hidden cuts and matched camera entries/exits** to feel like one continuous descent (Codex's recommendation rejecting Gemini's literal one-take master shot).

**Per-scene Blender scenes**: separate scene per scale band (orbital / regional / valley / macro). Rebase origins aggressively. Cycles 128 spp + denoise minimum for production volumetrics.

---

## 5. The Provenance Peel (the central new feature)

**This is what makes the page canonical.** Without this it's another beautiful explainer. With this it's a primary reference.

**Interaction**: each chapter has a "Show data" toggle (button, top-right of the cinematic, always visible, also keyboard-accessible).

When toggled:
1. Cinematic camera **freezes in place** (current frame held)
2. Rendered geometry **decomposes** in 3 stacked layers, each animated in over 400ms:
   - Layer 1: outline polygons (glacier, lake) as flat 2D strokes color-coded by source dataset
   - Layer 2: DEM elevation contours / data grid points (where applicable)
   - Layer 3: measurement station pins (Yala, Pyramid, etc.) where present in scene
3. Side panel slides in from right with **full citation list for everything visible**:
   - Dataset name + DOI + version + date
   - Specific filter applied (e.g., "ICIMOD HKH 2020 inventory, area > 0.5 km²")
   - Uncertainty / confidence interval where applicable
   - Direct link to download source

Toggle off → reverse animation → cinematic resumes from where it paused.

**Implementation contract**: every Blender scene `bpy` script must emit a `provenance.json` alongside the rendered video:
```json
{
  "chapter_id": "ch0",
  "shot_id": "hkh-flyover",
  "duration_s": 30,
  "frames": 900,
  "camera_path": "...",
  "scene_layers": [
    {
      "id": "glacier-1990",
      "type": "polygon-extrusion",
      "source": {
        "dataset": "ICIMOD HKH Glacier Inventory 2020",
        "url": "https://rds.icimod.org/...",
        "doi": "10.26066/rds.1972729",
        "year_keyframe": 1990,
        "filter": "all polygons",
        "n_features": 65188,
        "preprocessing": ["mapshaper -simplify 5%"]
      },
      "render_geometry_id": "blender-collection://glacier-1990",
      "thickness_model": {
        "method": "Farinotti 2019 consensus estimate",
        "doi": "10.5194/tc-13-665-2019",
        "uncertainty_pct": 25
      }
    },
    {
      "id": "lake-current",
      "type": "polygon",
      "source": "..."
    }
  ],
  "headline_numbers": [
    {
      "value": "516 km³",
      "label": "water-equivalent ice lost",
      "citation": "ICIMOD HKH Cryosphere Assessment 2026"
    }
  ]
}
```

Front-end loads `provenance.json` per chapter and renders the peel UI from it.

Detailed spec: [docs/water-cycle/06-provenance-peel.md](docs/water-cycle/06-provenance-peel.md)

---

## 6. Tooling lock

**No discussion**:
- **Blender 5.1.1** at `C:\Program Files\Blender Foundation\Blender 5.1\blender.exe` — drives via `--background --python script.py`. **Verified working** with bpy module and Python 3.13.
- **Next.js 15 + React 19** + Tailwind v4 (existing project)
- **GSAP + ScrollTrigger** (~30 KB) for scroll orchestration
- **MapLibre** (already installed) for /atlas/30-years embed in Ch 1
- **D3 selective imports** (`d3-scale`, `d3-axis`, `d3-shape`, `d3-line`) for HTML chart overlays — ~25 KB
- **HTML5 `<video>` + `requestVideoFrameCallback()`** for scrub. Low-bitrate scrub master + dense keyframes; swap to high-quality on play.
- **ffmpeg** for H.264/AV1 encode (assume installed; if not, install via winget/scoop)

**Explicitly rejected** (do not introduce):
- ~~Filmstrip + giant vertical sprite~~ (Codex: bad decode memory; use real video)
- ~~Three.js / R3F runtime 3D~~ (wrong tool — pre-rendered video is mobile-cheaper)
- ~~Lottie~~ (adds runtime, requires animator)
- ~~Framer Motion for data viz~~ (UI micro-interactions only if already installed)
- ~~Scroll-velocity-driven audio~~ (Codex: gimmicky, browser-blocked)
- ~~Sankey particles claiming dimensional honesty~~ (Codex: theater unless explicit encoding)
- ~~Hydrological Clock as 3D monolith~~ (Codex: timing precision needs HTML axes — keep as 2D)

---

## 7. Hard constraints (every task must respect)

1. **Cloudflare Workers static asset cap: 25 MiB per file.** Every encoded video must be < 25 MiB. Chunk if needed.
2. **Mobile-first**: 65% Android traffic. Pre-rendered video plays cheaper than runtime 3D. Every chapter has a mobile card-stack variant for screens < 768px.
3. **`prefers-reduced-motion: reduce`** → static end-frame poster + transcript + provenance peel is open by default. No autoplay.
4. **Audio is opt-in only**. No autoplay (browsers block). Ambient field-recording soundscape behind a toggle. **No HKH audio** can be sourced from Arctic/Alaska tidewater calving — geographically false. Either use the legitimate HKH-specific recordings we can find (NSIDC GRIPS field campaigns, ICIMOD station audio if released) or label clearly as "ambient soundscape — not field recording from HKH".
5. **Server-rendered initial HTML must show end-state** (final frame poster, headlines, citations). Animation enhances; doesn't replace data.
6. **Color = meaning**: sky `#7DD3FC` = ice; teal `#0E7490` = lakes; living-blue `#38BDF8` = active water; rose `#F87171` = loss/risk; amber `#FBBF24` = heat; gold `#FCD34D` = people; slate `#475569` = neutral terrain. **Color violations are bugs**.
7. **Two eases only**: Material standard `cubic-bezier(0.4, 0, 0.2, 1)` for scene transitions; gentle-out `cubic-bezier(0.16, 1, 0.3, 1)` for data motion. **No spring, no bounce.**
8. **Bundle budget**: ≤ 250 KB compressed JS new for the route. Each chapter's video chunk ≤ 24 MiB to fit Workers + safety margin.
9. **WCAG 2.1 AA**: keyboard navigation, 4.5:1 contrast, screen-reader-friendly transcripts.
10. **No fake precision**: don't claim "12,400 people downstream" if our method is OSM nodes + WorldPop within 200m. State the method or use a coarser claim ("~10,000 people in basin, exact GLOF flood-zone modeling pending").

---

## 8. Repo layout

```
src/app/atlas/water-cycle/
  page.tsx                          # server component, metadata, Suspense
  loading.tsx                       # skeleton
  error.tsx                         # error boundary

src/components/water-cycle/
  water-cycle-client.tsx            # main client orchestrator
  chapter-section.tsx               # sticky-pinned chapter wrapper
  cinematic-video.tsx               # scroll-scrubbed <video> with low-bitrate scrub master
  provenance-peel.tsx               # the central new feature
  provenance-citations.tsx          # citation panel
  reduced-motion-fallback.tsx       # static-frame variant
  mobile-card-stack.tsx             # < 768px variant
  per-chapter/
    ch0-reservoir.tsx               # chapter-specific overlays/captions
    ch1-retreat.tsx
    ch2-lake-bloom.tsx
    ch3-sankey.tsx
    ch4-hydro-clock.tsx
    ch5-impurities.tsx
    ch6-choice.tsx

scripts/render/water-cycle/
  shared/
    dem.py                          # DEM ingestion (SRTM 30m via OpenTopography)
    glaciers.py                     # ICIMOD glacier outline → Blender mesh
    lakes.py                        # ICIMOD lake outline → Blender mesh
    cameras.py                      # camera presets (orbital, regional, valley, macro)
    provenance.py                   # emit provenance.json contract
    encode.py                       # ffmpeg H.264 + AV1 wrapper
  ch0_reservoir.py                  # bpy script for Ch 0
  ch1_retreat.py
  ch2_lake_bloom.py
  ch3_sankey.py
  ch5_impurities.py
  ch6_choice.py
  README.md                         # how to run

scripts/transform/water-cycle/
  download-dem.ts                   # OpenTopography API call, cache to data/
  build-imja-keyframes.ts           # digitize Somos-Valenzuela 2014 → GeoJSON
  build-provenance-manifest.ts      # aggregate per-chapter provenance.json files

public/water-cycle/
  ch0/
    cinematic.webm                  # AV1 primary
    cinematic.mp4                   # H.264 fallback
    cinematic-scrub.webm            # low-bitrate scrub master
    poster.jpg                      # static fallback frame (reduced-motion + OG)
    provenance.json                 # data source contract
  ch1/...
  ch2/...
  ch3/...
  ch4/...
  ch5/...
  ch6/...
  citations.json                    # consolidated bibliography

data/water-cycle/                   # NOT shipped, gitignored
  dem/srtm-hkh.tif                  # SRTM 30m HKH bbox
  dem/srtm-imja.tif                 # higher-res Imja basin
  imja/keyframes-1962-2020.geojson  # digitized historical outlines
  audio/                            # ambient soundscape (if licensed)

docs/water-cycle/
  00-mandate.md
  01-architecture.md
  02-data-sources.md
  03-storyboards.md
  04-blender-pipeline.md
  05-frontend-spec.md
  06-provenance-peel.md
  07-task-graph.md                  # parallelizable task list with worker prompts
  08-acceptance-criteria.md
  09-citations.md
  10-anti-patterns.md
```

---

## 9. Parallel execution model

**Mother (Opus 4.7)**:
- Reads this spec + `AGENT_STATE.md`
- Picks tasks from `docs/water-cycle/07-task-graph.md` queue
- Spawns Sonnet workers via Agent tool with `isolation: worktree`
- Each worker prompt = task description + acceptance criteria + worker-specific scope
- Workers self-verify via lint/tsc/tests
- Mother reviews PR diff via `gh pr diff <num>`, merges when CI green and merge state CLEAN
- Updates `AGENT_STATE.md` with task completion / blockers

**Sonnet workers**:
- Run scope-bounded tasks
- `npm run lint && npx tsc --noEmit && npm test` before commit (no exceptions)
- QUESTION/PR_NUMBER/BLOCKED protocol for state reporting
- Don't expand scope; if blocked, report and stop

**Task atoms** (~30-90 min Sonnet sessions each):
- Mostly isolatable (no shared mutable state)
- Each has a single PR
- Each has acceptance tests in `docs/water-cycle/08-acceptance-criteria.md`
- Render tasks may depend on data tasks (sequential dependencies declared in 07)

Detailed task list: [docs/water-cycle/07-task-graph.md](docs/water-cycle/07-task-graph.md)

---

## 10. Build sequence

**Phase 1 — Foundations (4 tasks, parallelizable)**:
1. Asset pipeline: download SRTM HKH DEM, cache locally
2. Glacier outline preprocessing: ICIMOD → Blender-importable mesh inputs (existing data + transform)
3. Lake outline preprocessing: ICIMOD + Imja keyframes (digitize Somos-Valenzuela 2014)
4. Frontend route scaffold: `/atlas/water-cycle` page, layout, GSAP setup, video player skeleton

**Phase 2 — Provenance Peel (1 task, blocks Phase 3 visuals)**:
5. Provenance Peel component + citations panel + JSON contract

**Phase 3 — Render + integrate per chapter (7 tasks, parallelizable after Phase 2)**:
6. Ch 0 cold open (reservoir): bpy script, render, encode, integrate
7. Ch 1 retreat: ditto
8. Ch 2 lake bloom: ditto
9. Ch 3 Sankey: ditto
10. Ch 4 hydrological clock (mostly 2D, hybrid): ditto
11. Ch 5 light-absorbing impurities: ditto
12. Ch 6 choice (SSP1-2.6 vs SSP5-8.5): ditto

**Phase 4 — Polish (5 tasks, parallelizable)**:
13. Reduced-motion fallback path
14. Mobile card-stack variant
15. OG image generation
16. Citations page
17. Acceptance test suite

**Phase 5 — Ship**:
18. Deploy to Cloudflare Workers
19. Smoke test live URL
20. Add link from /atlas/30-years to /atlas/water-cycle

Each phase's tasks are detailed in [docs/water-cycle/07-task-graph.md](docs/water-cycle/07-task-graph.md) with full Sonnet worker prompts.

---

## 11. Decision log (every override goes here)

| Date | Decision | Rationale | Source |
|---|---|---|---|
| 2026-05-10 | Locked thesis to "The glacier was your reservoir" | Past-tense, universal. Better than "Not the Ocean. The Tap." (Western framing) | Claude v3 review |
| 2026-05-10 | Mass headline: 9% / 516 km³ / ~0.5T tonnes | "2.5T" was 5× overstatement | Codex v5 review, ICIMOD 2026 |
| 2026-05-10 | 7 chapters with hidden-cut continuity, NOT one literal master shot | One-take 180s shot has scale-clipping issues + 18-45 hr render time | Codex v5 review |
| 2026-05-10 | Provenance Peel as central feature | "Make the cinema falsifiable" | Codex v5 review |
| 2026-05-10 | Light-absorbing impurities, NOT BC-only soot | Kaspari 2014: dust dominates in Solu-Khumbu | Codex v5 review |
| 2026-05-10 | SSP1-2.6 vs SSP5-8.5, NOT RCP 4.5 | IPCC AR6 framework | Codex v5 review |
| 2026-05-10 | Cut filmstrip technique | Decode memory bad; real video + scrub master is correct | Codex v5 review |
| 2026-05-10 | Cut scroll-velocity audio | Browsers block, gimmicky | Codex v5 review |
| 2026-05-10 | Cap each video < 25 MiB (Workers asset cap) | Cloudflare hard limit | Codex v5 review |
| 2026-05-10 | Hydrological Clock stays 2D HTML/SVG, NOT 3D monolith | Timing precision needs axes/labels | Codex v5 review |

When Mother (or any future plan revision) overrides one of these: append a new row, don't edit existing rows.

---

## 12. Sub-document index

| File | Purpose |
|---|---|
| `docs/water-cycle/00-mandate.md` | Goal + scope + non-goals + audience |
| `docs/water-cycle/01-architecture.md` | Repo layout, data flow, contracts between layers |
| `docs/water-cycle/02-data-sources.md` | Every dataset with URL, DOI, license, verification status, where stored |
| `docs/water-cycle/03-storyboards.md` | All 7 chapters frame-by-frame with timing, data binding, captions |
| `docs/water-cycle/04-blender-pipeline.md` | bpy script template, render presets, encoding commands |
| `docs/water-cycle/05-frontend-spec.md` | Route, components, scroll system, video player |
| `docs/water-cycle/06-provenance-peel.md` | The central new feature — interaction, animation, JSON contract |
| `docs/water-cycle/07-task-graph.md` | **Parallelizable task list with full Sonnet worker prompts** |
| `docs/water-cycle/08-acceptance-criteria.md` | How to verify each task done |
| `docs/water-cycle/09-citations.md` | Bibliography with DOIs, growing during execution |
| `docs/water-cycle/10-anti-patterns.md` | What NOT to do, with reasons |

---

## 13. State files

| File | Purpose | Owner |
|---|---|---|
| `WATER_CYCLE_SPEC.md` | This file. Single source of truth. | Mother (only edit on locked-decision changes) |
| `AGENT_STATE.md` | Live state of in-flight tasks, blockers, completion log | Mother (writes), workers (read for context) |
| `docs/water-cycle/07-task-graph.md` | Task queue. Tasks marked `STATUS: queued | in-progress | done | blocked | cancelled`. | Mother updates after each task completion |

Mother writes to `AGENT_STATE.md` when:
- Spawning a new worker (record worker ID + branch + task)
- A worker reports completion / blocker
- Merging a PR
- Updating decisions in `WATER_CYCLE_SPEC.md` decision log

---

## 14. The point of all this

If we ship correctly:
- A Brooklyn reader scrolls and feels the loss.
- A Nepali farmer sees their reservoir named.
- A journalist can verify any claim in-page.
- A researcher can cite the page itself or follow it back to primary sources.
- A skeptic can't dismiss it because every visual moment has receipts.

That's what makes it canonical. Not the Blender renders. The Blender renders + the Provenance Peel + the locked numbers.

Make the cinema falsifiable.
