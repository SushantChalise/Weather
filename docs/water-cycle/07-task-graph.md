# 07 — Task Graph

This is the **executable plan**. Each task below is a complete brief that Mother (Opus 4.7) can paste into a Sonnet 4.6 sub-agent prompt.

## Task naming convention

`T<phase>.<num>-<short-name>` — e.g., `T1.2-build-imja-keyframes`.

## Status legend

- 🆕 `queued` — ready to be picked up
- 🏃 `in-progress` — Sonnet worker assigned, branch open
- ⏸ `blocked` — needs human input or upstream task
- ✅ `done` — merged to main
- ❌ `cancelled` — superseded or no longer needed

When Mother spawns a worker, update status to 🏃 + worker ID + branch name in `AGENT_STATE.md`. When PR merges, update to ✅.

## Mandatory protocol for FRONTEND tasks

Every task in this graph that touches frontend (Phase 2 components, Phase 2.3 route scaffold, Phase 3 per-chapter `*.tsx` wiring, Phase 4 polish, any T*.c follow-up that adjusts `src/` UI) must follow **WATER_CYCLE_SPEC.md §15 — Frontend testing protocol** before opening its PR. Snapshot + unit + build are insufficient. The worker MUST:

1. Start `mcp__Claude_Preview__preview_start` (config in `.claude/launch.json`).
2. Navigate the affected route, exercise every new/touched interaction, inspect computed styles for §7 color grammar compliance, check console for errors, test mobile (375×812) + tablet (768×1024) + desktop (1440×900), test dark mode.
3. Include before/after screenshots in the PR body when changing existing visuals.

Mother re-runs the same protocol as MOTHER_REVIEW before merging. A frontend PR opened without this protocol is rejected and sent back.

This applies retroactively to all in-flight frontend work as of 2026-05-11.

## Phase 1 — Foundations (parallel, no inter-deps)

### T1.1 — Stage HKH SRTM 30m DEM 🆕

**Status**: queued
**Estimated time**: 30-60 min Sonnet session
**Depends on**: nothing
**Branch**: `feat/water-cycle-T1.1-dem`
**Acceptance**: file `data/water-cycle/dem/srtm-hkh-30m.tif` exists, ≥ 1 GB, valid GeoTIFF, bbox ≈ [70°E, 26°N, 95°E, 36°N].

**Worker prompt**:

> You are a Sonnet 4.6 worker building a foundation task for the Himalayan Atlas water-cycle page.
>
> **Goal**: download SRTM 30m DEM for HKH bbox and stage at `data/water-cycle/dem/srtm-hkh-30m.tif`.
>
> **Specifically**:
> 1. Read `WATER_CYCLE_SPEC.md` and `docs/water-cycle/02-data-sources.md` for context (do NOT modify either).
> 2. Sign up for an [OpenTopography API key](https://opentopography.org/) if needed; the user has account access. If the API requires manual UI signup, ask via QUESTION protocol.
> 3. Write a script `scripts/transform/water-cycle/download-dem.ts` that:
>    - Calls OpenTopography Global DEM API (SRTMGL1_E dataset) with bbox `[70, 26, 95, 36]`
>    - Writes output to `data/water-cycle/dem/srtm-hkh-30m.tif`
>    - Logs file size + verifies GeoTIFF magic bytes
>    - Idempotent: if file exists and is non-empty, skip download
>    - Uses fetch + streaming write (large file)
> 4. Add an npm script `transform:water-cycle-dem` in `package.json`.
> 5. Run the script. Verify output. Commit script + output file (ensure `data/` is gitignored EXCEPT for any small README, but the .tif file should NOT be committed — it's gitignored under `/data`).
> 6. Wait — the DEM file is ~1-2 GB and is gitignored. Just confirm the file exists locally and is valid. The render scripts will read it from local disk.
> 7. Open a PR with title `feat(water-cycle): stage HKH SRTM 30m DEM` describing the task.
>
> **Self-verify before commit**:
> - `npm run lint && npx tsc --noEmit && npm test` passes
> - Output file size > 1 GB
> - GeoTIFF can be opened in QGIS or via Python `rasterio.open()` test (write a 5-line test that just opens it)
>
> **If blocked**: report via QUESTION/BLOCKED protocol. Common blockers: API key, fetch timeout, disk space. State the exact blocker and stop.
>
> **Out of scope**: do not start any rendering, do not modify Blender scripts, do not edit components. This task is data-staging only.

---

### T1.2 — Digitize Imja keyframes 1962/1975/1992/2010/2020 🆕

**Status**: queued
**Estimated time**: 60-90 min
**Depends on**: nothing
**Branch**: `feat/water-cycle-T1.2-imja-keyframes`
**Acceptance**: `data/water-cycle/glaciers/imja-keyframes.geojson` and `data/water-cycle/lakes/imja-keyframes.geojson` exist with 4-5 features each, areas within 10% of Somos-Valenzuela 2014 Table 1.

**Worker prompt**:

> You are a Sonnet 4.6 worker. Goal: produce digitized GeoJSON keyframes of Imja Glacier and Imja Tsho lake from 1962-2020.
>
> **Background**: Somos-Valenzuela et al. 2014 *The Cryosphere* (DOI 10.5194/tc-8-1661-2014) publishes outline figures for Imja Glacier and Lake at 5 historical timestamps. We need machine-readable GeoJSON of these.
>
> **Steps**:
> 1. Read `docs/water-cycle/02-data-sources.md` "Imja Glacier historical outlines" + "Imja Tsho historical outlines" sections.
> 2. Download the paper PDF from Copernicus Publications (CC-BY 3.0). Cache to `data/water-cycle/papers/somos-valenzuela-2014.pdf` (gitignored).
> 3. Extract Fig 2 (glacier) and Fig 4 (lake) as PNG using `pdftoppm` or equivalent. Save to `data/water-cycle/glaciers/imja-fig2-source.png` and `data/water-cycle/lakes/imja-fig4-source.png`.
> 4. **Manual digitization**: write a script `scripts/transform/water-cycle/digitize-imja.ts` that produces the GeoJSON. Use one of these approaches:
>    - **Approach A** (preferred): use a tool like [QGIS](https://www.qgis.org/) to manually trace polygons georeferenced to known peak coordinates, export GeoJSON. Document the process in script comments.
>    - **Approach B** (if tool A unavailable): hard-code coordinate arrays in the script based on the published figures, using cross-reference to known landmarks (Lhotse 27.962°N, 86.933°E; Imja Khola flow direction).
> 5. **Cross-validation**: compute the area of each polygon using turf.js (`@turf/area`). Compare to the values in Somos-Valenzuela 2014 Table 1 (Glacier areas, lake areas). Areas must be within 10%. Log results.
> 6. **Critical co-registration check** (Codex caveat): the 2020 keyframes from Somos-Valenzuela must be cross-checked against ICIMOD 2024 inventory (already in `public/glacial-lakes/current.geojson`). If areas differ > 5%, prefer ICIMOD 2024 for the 2020 keyframe AND note the discrepancy in a comment + the resulting GeoJSON property `provenance: { source: "...", note: "..." }`.
> 7. Write outputs:
>    - `data/water-cycle/glaciers/imja-keyframes.geojson` — FeatureCollection with 4 features (year property: 1962, 1992, 2010, 2020)
>    - `data/water-cycle/lakes/imja-keyframes.geojson` — FeatureCollection with 5 features (1962, 1975, 1992, 2010, 2020)
> 8. Add npm script `transform:water-cycle-imja` in `package.json`.
> 9. Self-verify: `npm run lint && npx tsc --noEmit && npm test` passes; areas validate against table.
> 10. Open PR with title `feat(water-cycle): digitize Imja keyframes 1962-2020`.
>
> **If blocked**: typical blockers are: paper download requires login (ask), QGIS unavailable (use Approach B), figure unreadable (ask).
>
> **Out of scope**: do not download other datasets, do not modify render scripts, do not edit components.

---

### T1.3 — Stage Farinotti 2019 thickness data 🆕

**Status**: queued
**Estimated time**: 30-45 min
**Depends on**: nothing
**Branch**: `feat/water-cycle-T1.3-farinotti-thickness`
**Acceptance**: `data/water-cycle/glaciers/farinotti-2019-hkh-thickness.csv` exists with per-glacier mean thickness values for HKH region.

**Worker prompt**:

> You are a Sonnet 4.6 worker. Goal: stage Farinotti et al. 2019 ice-thickness consensus estimate data for HKH glaciers.
>
> **Background**: Farinotti et al. 2019 *Nature Geoscience* (DOI 10.1038/s41561-019-0300-3) provides per-glacier ice-thickness estimates globally. Data is at ETH Research Collection DOI 10.3929/ethz-b-000315707, CC-BY 4.0.
>
> **Steps**:
> 1. Read `docs/water-cycle/02-data-sources.md` "Farinotti et al. 2019 ice-thickness consensus" section.
> 2. Visit the ETH research collection link, identify the file containing per-glacier mean thickness (probably one CSV per RGI region). HKH is RGI region 13 (Central Asia) and possibly parts of 14 (South Asia West) and 15 (South Asia East).
> 3. Write `scripts/transform/water-cycle/download-farinotti.ts` that downloads + filters to HKH bbox + outputs `data/water-cycle/glaciers/farinotti-2019-hkh-thickness.csv` with columns `RGI_id, GLIMS_id, lon, lat, mean_thickness_m, area_km2`.
> 4. Cross-check: total HKH ice volume from this data should be in 4,000-7,000 km³ range (ICIMOD 2026 says 5,735.79 km³). Log the computed total.
> 5. Add npm script `transform:water-cycle-farinotti`.
> 6. Self-verify; PR titled `feat(water-cycle): stage Farinotti 2019 HKH thickness data`.

---

### T1.4 — Stage Rounce 2023 SSP projections 🆕

**Status**: queued
**Estimated time**: 60-90 min
**Depends on**: nothing
**Branch**: `feat/water-cycle-T1.4-rounce-projections`
**Acceptance**: `data/water-cycle/scenarios/rounce-2023-imja.json` and `rounce-2023-hkh-aggregate.json` exist with SSP1-2.6 and SSP5-8.5 timeseries to 2100.

**Worker prompt**:

> You are a Sonnet 4.6 worker. Goal: ingest Rounce et al. 2023 *Science* glacier projections for HKH.
>
> **Background**: Rounce et al. 2023 (DOI 10.1126/science.abo1324) provides per-glacier mass projections through 2100 under multiple SSPs. Open-access PDF at cryospheric.org. We need SSP1-2.6 (best case) and SSP5-8.5 (worst case) for two views: HKH-aggregate and Imja-region only.
>
> **Important (Codex caveat)**: do NOT use RCP framing. Use SSP1-2.6 / SSP5-8.5.
>
> **Steps**:
> 1. Read `docs/water-cycle/02-data-sources.md` Rounce 2023 section.
> 2. Locate the supplementary data via the paper's data availability statement (PyGEM model output published at NSIDC DOI 10.5067/H118TCMSUH3Q).
> 3. Write `scripts/transform/water-cycle/build-rounce-projections.ts` that:
>    - Downloads the relevant supplementary dataset
>    - Filters to HKH glaciers (RGI region 13, 14, 15 within HKH bbox)
>    - Aggregates per SSP per year (decade resolution: 2025, 2050, 2075, 2100 minimum)
>    - Outputs HKH-aggregate JSON with structure `{ "ssp1-2.6": [{ year, total_volume_km3, n_glaciers }, ...], "ssp5-8.5": [...] }`
>    - Outputs Imja-region JSON with same structure but filtered to glaciers near 86.93°E, 27.95°N (radius ~5 km)
> 4. Cross-check: 2100 total HKH volume under SSP5-8.5 should be ~25-35% of 2020 volume (Rounce paper Fig 1 caption). Log result.
> 5. Add npm script `transform:water-cycle-rounce`.
> 6. PR titled `feat(water-cycle): stage Rounce 2023 SSP projections`.

---

## Phase 2 — Provenance contract (sequential, blocks Phase 3)

### T2.1 — Provenance schema + validator 🆕

**Status**: queued
**Estimated time**: 45-60 min
**Depends on**: nothing
**Branch**: `feat/water-cycle-T2.1-provenance-schema`
**Acceptance**: schema TypeScript file exists; validator function tests against fixture; npm script `validate:water-cycle-provenance` works.

**Worker prompt**:

> You are a Sonnet 4.6 worker. Goal: define the provenance.json schema and a validator.
>
> **Steps**:
> 1. Read `docs/water-cycle/01-architecture.md` "provenance.json schema" section. The full TypeScript type is documented there.
> 2. Create `src/lib/water-cycle/types.ts` with the exported `Provenance`, `SceneLayer`, `HeadlineNumber` types.
> 3. Create `scripts/render/water-cycle/shared/provenance-schema.ts` that exports a Zod schema (or hand-written validator if Zod isn't installed) matching the type.
> 4. Create `scripts/transform/water-cycle/validate-provenance.ts` that takes a chapter ID as arg, loads `public/water-cycle/{chapter}/provenance.json`, validates against schema, exits 0/1.
> 5. Create a fixture `tests/fixtures/water-cycle/provenance-ch0-valid.json` with a complete valid provenance for Ch 0.
> 6. Create a fixture `tests/fixtures/water-cycle/provenance-ch0-invalid.json` (missing required field) for negative test.
> 7. Add a Vitest test `src/lib/water-cycle/provenance.test.ts` that loads both fixtures and asserts validate result.
> 8. Add npm script `validate:water-cycle-provenance`.
> 9. Self-verify; PR titled `feat(water-cycle): provenance schema + validator`.

---

### T2.2 — Provenance Peel component 🆕

**Status**: queued
**Estimated time**: 90-120 min
**Depends on**: T2.1
**Branch**: `feat/water-cycle-T2.2-provenance-peel`
**Acceptance**: ProvenancePeel renders, opens/closes correctly, displays sources from a fixture provenance, keyboard accessible, Vitest snapshot stable.

**Worker prompt**:

> You are a Sonnet 4.6 worker. Goal: build the Provenance Peel React component.
>
> **Read first**: `docs/water-cycle/06-provenance-peel.md` (the full feature spec).
>
> **Steps**:
> 1. Create `src/components/water-cycle/provenance-peel.tsx` matching the spec component signature.
> 2. Create sub-components: `provenance-citations.tsx` (the side panel content), `source-outlines.tsx` (Layer 1 SVG), `dem-grid.tsx` (Layer 2), `station-pins.tsx` (Layer 3). Layer 1 is the most important; Layer 2 and 3 can be minimal stubs in this PR (real screen-space coords come in T3.x render tasks).
> 3. Wire keyboard navigation (Esc to close, Tab focus management).
> 4. Add Vitest snapshot tests using the `provenance-ch0-valid.json` fixture from T2.1.
> 5. Manually verify in `npm run dev` (use the preview tool to render a stub `/atlas/water-cycle` page that loads the fixture provenance).
> 6. PR titled `feat(water-cycle): Provenance Peel component`.
>
> **Out of scope**: real screen-space SVG projection (deferred to render tasks). Use placeholder shapes for now.

---

### T2.3 — Frontend route scaffold 🆕

**Status**: queued
**Estimated time**: 60-90 min
**Depends on**: T2.1, T2.2
**Branch**: `feat/water-cycle-T2.3-route-scaffold`
**Acceptance**: `/atlas/water-cycle` returns 200, server-renders 7 chapter sections with placeholder posters, GSAP ScrollTrigger initializes without errors.

**Worker prompt**:

> You are a Sonnet 4.6 worker. Goal: scaffold the Next.js route + chapter section components.
>
> **Read first**: `docs/water-cycle/05-frontend-spec.md`.
>
> **Steps**:
> 1. Install GSAP + ScrollTrigger: `npm install gsap` (already free; ScrollTrigger included).
> 2. Install D3 selective imports: `npm install d3-scale d3-axis d3-shape d3-line` (only these 4).
> 3. Create `src/app/atlas/water-cycle/page.tsx`, `loading.tsx`, `error.tsx` matching the spec.
> 4. Create `src/components/water-cycle/`:
>    - `water-cycle-client.tsx` (main orchestrator)
>    - `chapter-section.tsx`
>    - `cinematic-video.tsx` (with the scroll-scrub mechanism)
>    - `chapter-overlay.tsx` (loads per-chapter overlay)
>    - `chapter-index.tsx` (floating navigation)
>    - `mobile-card-stack.tsx`
>    - `citation-chip.tsx`
>    - `closing-thesis.tsx`
>    - `citations-bibliography.tsx`
>    - `per-chapter/ch{0..6}-*.tsx` (one stub per chapter, just headlines + posters)
> 5. Create `src/lib/water-cycle/provenance.ts` with `loadAllProvenance()` (reads from public/water-cycle/{ch}/provenance.json at build time).
> 6. Create `src/lib/water-cycle/types.ts` (or import from T2.1 if already created there).
> 7. Create stub `public/water-cycle/ch{0..6}/poster.jpg` (a single shared placeholder image is fine — final posters come from render tasks). Use a placeholder generator or commit a single 1920x1080 PNG/JPG marked "placeholder" with the chapter number.
> 8. Create stub `public/water-cycle/ch{0..6}/provenance.json` with minimal valid data (use the T2.1 schema).
> 9. Run `npm run dev`, verify in browser: page loads, 7 sections visible, ScrollTrigger doesn't error in console, mobile card-stack at < 768px.
> 10. Add a basic Playwright e2e test in `e2e/water-cycle.spec.ts` that verifies the route returns 200 and contains "The reservoir" headline.
> 11. PR titled `feat(water-cycle): route scaffold + chapter components`.
>
> **Out of scope**: real video files (cinematic.webm), real Blender renders, real provenance data. Just the structural scaffold.
>
> **Verify before commit**:
> - `npm run lint && npx tsc --noEmit && npm test && npx playwright test e2e/water-cycle.spec.ts` all pass
> - Page renders in `npm run dev`
> - Mobile card-stack triggers at < 768px

---

## Phase 3 — Render + integrate per chapter (parallel after Phase 2)

### T3.0 — Render Ch 0 (the reservoir) 🆕

**Status**: queued
**Estimated time**: 4-6 hour Sonnet session (most of which is render time)
**Depends on**: T1.1, T1.2, T1.3, T2.1
**Branch**: `feat/water-cycle-T3.0-ch0-render`
**Acceptance**: `public/water-cycle/ch0/cinematic.{webm,mp4}`, `cinematic-scrub.webm`, `poster.jpg`, `provenance.json` all exist and pass acceptance tests in `08-acceptance-criteria.md`.

**Worker prompt**:

> You are a Sonnet 4.6 worker. Goal: render Chapter 0 (the reservoir) Blender cinematic.
>
> **Read first**:
> - `WATER_CYCLE_SPEC.md` § 4 (chapter structure)
> - `docs/water-cycle/03-storyboards.md` "Chapter 0 — The reservoir"
> - `docs/water-cycle/04-blender-pipeline.md` (full pipeline + template)
> - `docs/water-cycle/06-provenance-peel.md` (provenance.json contract)
>
> **Prerequisites**:
> - T1.1 done: `data/water-cycle/dem/srtm-hkh-30m.tif` exists
> - T1.2 done: Imja keyframes exist (used for the final ring)
> - T1.3 done: Farinotti thickness CSV exists
> - T2.1 done: provenance schema + validator exist
> - Blender 5.1 at `C:/Program Files/Blender Foundation/Blender 5.1/blender.exe`
>
> **Steps**:
> 1. Create the shared modules first (if not already done in earlier T3.x tasks): `scripts/render/water-cycle/shared/{__init__.py, dem.py, glaciers.py, lakes.py, cameras.py, materials.py, render_settings.py, seed.py, encode.py, provenance.py}`. Match the templates in `04-blender-pipeline.md`.
> 2. Create `scripts/render/water-cycle/ch0_reservoir.py` per the storyboard in `03-storyboards.md`. Camera path is documented there with exact keyframes.
> 3. Iteration plan:
>    - Run with `--preset preview` first (Eevee, 16 spp, 360p). Should take 5-10 min. Verify composition.
>    - Run with `--preset scrub` (Cycles 64 spp, 480p). Should take 30-60 min. Verify color, motion.
>    - Run with `--preset production` (Cycles 128 spp, 720p). Will take 2-4 hours. Final render.
> 4. After production render, run `shared/encode.py` to generate AV1 + H.264 + scrub master + poster.
> 5. Validate provenance.json: `npm run validate:water-cycle-provenance ch0`.
> 6. Validate file sizes: `ls -lh public/water-cycle/ch0/`. ALL files < 24 MiB.
> 7. Visual inspection: open `public/water-cycle/ch0/cinematic.webm` in a player. Watch end-to-end. Verify:
>    - Year ticker advances 1990→2020
>    - Mass counter ends at "516 km³"
>    - Color grammar: ice is sky `#7DD3FC`
>    - Hidden cut at t=17s feels smooth (not jarring)
>    - Imja ring appears in final 5 seconds
> 8. Wire into frontend: edit `src/components/water-cycle/per-chapter/ch0-reservoir.tsx` to include the real video sources + headlines from the rendered provenance.json.
> 9. Run `npm run dev`, scroll through ch0 section, verify scroll scrubs the video.
> 10. PR titled `feat(water-cycle): render Ch 0 — the reservoir`.
>
> **Self-verify**: `npm run lint && npx tsc --noEmit && npm test` passes. Lighthouse for the page ≥ 70 (full polish comes later).
>
> **If blocked**: render time exceeded budget (24+ hours), GPU compute device not available, OOM during render — report and ask. Don't try to ship a degraded render quietly.
>
> **Important**: this task is the proof-of-concept that unlocks all other render tasks. If the pipeline works for Ch 0, the others are mostly mechanical.

---

### T3.1-T3.6 — Render chapters 1-6

Each chapter render task follows the same pattern as T3.0. Storyboards in `03-storyboards.md`, dependencies in 02-data-sources.md.

| Task | Chapter | Depends on | Special notes |
|---|---|---|---|
| T3.1 | Ch 1 — The retreat | T1.3 (Farinotti), existing /atlas/30-years data | 4-up grid; can reuse glacier point data from existing `/glaciers/hkh/` |
| T3.2 | Ch 2 — The lake bloom | T1.1, T1.2 (Imja keyframes) | flubber-style polygon morph in Blender via shape keys |
| T3.3 | Ch 3 — Where it went | T1.4 (Rounce projections) | Sankey diagram in 3D + HTML labels overlay |
| T3.4 | Ch 4 — When it comes | T1.4 (Rounce timeseries) | Mostly 2D HTML/SVG clock, cinematic background only |
| T3.5 | Ch 5 — Light-absorbing impurities | T1.5 (Kaspari values) | NOT BC-only; mixed BC + dust per Codex |
| T3.6 | Ch 6 — The choice | T1.4 (Rounce SSP1-2.6 + SSP5-8.5) | Split-screen + ghost glacier wireframe overlay |

**Each gets its own task spec drafted by Mother when scheduling.** Worker prompts follow the T3.0 template, swapping in the chapter-specific storyboard and data dependencies.

### Optional T1.5 — Kaspari 2014 values 🆕 (small, can run in Phase 1 in parallel)

**Branch**: `feat/water-cycle-T1.5-kaspari-values`
**Estimated time**: 20-30 min
**Acceptance**: `data/water-cycle/impurities/kaspari-2014-figure-data.json` with BC + dust albedo and forcing values from the paper.

**Worker prompt**: extract values from Kaspari et al. 2014 (DOI 10.5194/acp-14-8089-2014) Tables/Figures. Specifically: BC albedo reduction (6-10%), BC forcing (75-120 W/m²), dust forcing (488-525 W/m²). Output as JSON. PR titled `feat(water-cycle): stage Kaspari 2014 impurity values`.

---

## Phase 4 — Polish (parallel)

### T4.1 — Reduced-motion fallback path 🆕

**Status**: queued
**Estimated time**: 45-60 min
**Depends on**: T2.3, T3.0 (at least one chapter rendered)
**Branch**: `feat/water-cycle-T4.1-reduced-motion`
**Acceptance**: when `prefers-reduced-motion: reduce` is set, page shows static posters + open Provenance Peel + transcripts; no animation runs.

**Worker prompt**:

> You are a Sonnet 4.6 worker. Goal: ensure the water-cycle page works perfectly with prefers-reduced-motion: reduce.
>
> **Steps**:
> 1. Add a global CSS rule in `src/app/atlas/water-cycle/page.module.css` (or use Tailwind variants) that hides cinematic and shows fallback elements when reduced-motion is set.
> 2. Update `<CinematicVideo>` to detect `prefers-reduced-motion` on mount and skip ScrollTrigger registration.
> 3. Update `<ProvenancePeel>` to be open by default when reduced-motion is set.
> 4. Add a `<ChapterTranscript>` component per chapter that renders all captions from provenance.json as a static `<article>` below the (hidden) cinematic.
> 5. Manually verify by forcing `prefers-reduced-motion: reduce` in DevTools.
> 6. Add a Playwright test using `page.emulateMedia({ reducedMotion: 'reduce' })`.
> 7. PR titled `feat(water-cycle): reduced-motion fallback path`.

---

### T4.2 — Mobile card-stack polish 🆕

**Status**: queued
**Estimated time**: 60-90 min
**Depends on**: T2.3, T3.0
**Branch**: `feat/water-cycle-T4.2-mobile-cards`
**Acceptance**: at 375px width, page is a swipeable card stack with progress indicator + per-card content matching desktop.

**Worker prompt**: build out the `<MobileCardStack>` component to full polish. Include swipe gesture handling (Hammer.js or hand-rolled), progress bar, smooth transitions between cards. Per-card content includes poster + headlines + citation chip. Verify on real mobile device or DevTools mobile emulation.

---

### T4.3 — OG image generation 🆕

**Status**: queued
**Estimated time**: 30 min
**Depends on**: T3.2 (ch2 lake bloom — its 1962 photo + 2020 satellite is the OG poster per Claude's review)
**Branch**: `feat/water-cycle-T4.3-og-image`
**Acceptance**: `/water-cycle/og.jpg` exists at 1200×630, is the side-by-side composition, < 200 KB.

---

### T4.4 — Citations bibliography page 🆕

**Status**: queued
**Estimated time**: 45-60 min
**Depends on**: at least one render task done with full provenance.json
**Branch**: `feat/water-cycle-T4.4-citations`
**Acceptance**: `public/water-cycle/citations.json` aggregates all chapters; `<CitationsBibliography>` component renders sortable + searchable list.

**Worker prompt**: write `scripts/transform/water-cycle/build-citations.ts` that reads all 7 `public/water-cycle/ch{N}/provenance.json` files, deduplicates by DOI, outputs `public/water-cycle/citations.json` matching the schema in `02-data-sources.md`. Build the React component to render the list. PR titled `feat(water-cycle): citations bibliography`.

---

### T4.5 — Acceptance test suite 🆕

**Status**: queued
**Estimated time**: 90-120 min
**Depends on**: T2.3 (route exists), at least one chapter rendered
**Branch**: `feat/water-cycle-T4.5-acceptance-tests`
**Acceptance**: full Playwright suite covering 08-acceptance-criteria.md runs in CI.

**Worker prompt**: implement the acceptance test suite per `docs/water-cycle/08-acceptance-criteria.md`. Each test maps to a criterion. Tests must run in CI (npm run test:e2e). PR titled `feat(water-cycle): acceptance tests`.

---

## Phase 5 — Ship

### T5.1 — Deploy to Cloudflare Workers ⏸ (manual, mother-only)

**Worker prompt** (mother-only):

> You are Mother (Opus 4.7). All Phase 1-4 tasks are merged. Goal: deploy to Cloudflare Workers and smoke test live URL.
>
> 1. Run `npm run cf:deploy`.
> 2. Wait for deploy to complete; capture the deployed Worker URL.
> 3. Smoke test live URL: GET /atlas/water-cycle returns 200, all video chunks load, Provenance Peel works, mobile card-stack at < 768px.
> 4. Run a Lighthouse audit; verify Performance ≥ 75 (mobile), Accessibility ≥ 95.
> 5. Update `WATER_CYCLE_SPEC.md` with the live URL in §1.
> 6. Add a link from `/atlas/30-years` page (top-left under heading) → `/atlas/water-cycle` with text "See the cycle →".
> 7. Final commit + PR.

---

## Total task count

| Phase | Tasks | Parallelizable |
|---|---|---|
| 1 (foundations) | 5 (T1.1, T1.2, T1.3, T1.4, T1.5) | All in parallel |
| 2 (provenance contract) | 3 (T2.1, T2.2, T2.3) | T2.2 depends on T2.1; T2.3 depends on T2.1+T2.2 |
| 3 (renders) | 7 (T3.0 - T3.6) | All in parallel after Phase 2 |
| 4 (polish) | 5 (T4.1 - T4.5) | All in parallel after at least one Ch render |
| 5 (ship) | 1 (T5.1) | Mother-only, after all Phase 1-4 done |
| **Total** | **21 tasks** | ~12 hours of Sonnet work + ~10-15 hours of render time |

## Mother's responsibilities

1. **At session start**: read `WATER_CYCLE_SPEC.md`, `AGENT_STATE.md`, this task graph.
2. **Pick next available task**: tasks with all dependencies in ✅ status and currently 🆕 status.
3. **Spawn Sonnet worker** via Agent tool with `isolation: worktree`, paste the worker prompt verbatim, branch name from the task spec.
4. **Wait for worker** — workers self-verify and open PR.
5. **Review PR** via `gh pr diff <num>` and `gh pr view <num> --json state,mergeStateStatus,checks`.
6. **Merge** when CI green and merge state CLEAN: `gh api -X PUT repos/SushantChalise/Weather/pulls/<num>/merge -f merge_method=squash && gh api -X DELETE repos/SushantChalise/Weather/git/refs/heads/<branch>`.
7. **Update AGENT_STATE.md**: mark task ✅, log completion timestamp, identify next task.
8. **Loop**.

## Worker self-verification protocol

Every worker MUST run before opening PR:

```bash
npm run lint && \
npx tsc --noEmit && \
npm test && \
git status   # ensure no uncommitted changes accidentally left behind
```

If any of these fails, the worker fixes it (without expanding scope) or reports BLOCKED.

## QUESTION/PR_NUMBER/BLOCKED state report format

Workers report state in their final assistant message via these tags:

```
QUESTION: <only for blockers requiring human input>
PR_NUMBER: <number, after PR opened>
BLOCKED: <only if cannot proceed; explain>
```

Mother parses these to update AGENT_STATE.md.

## Worktree convention

Every Sonnet worker uses `isolation: worktree` so their work is isolated from main. The branch name is `feat/water-cycle-T{phase}.{num}-{slug}`. Worktrees auto-clean on no-change exit; otherwise the agent returns the worktree path + branch.
