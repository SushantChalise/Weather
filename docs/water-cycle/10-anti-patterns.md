# 10 — Anti-Patterns

What NOT to do, with the reason. Each entry was caught by review (Gemini, Codex, or Claude) or arose from project constraints (Cloudflare, mobile, accessibility).

## Numbers / facts

❌ **"2.5 trillion tonnes of ice gone"** — 5× overstatement. Use `~0.5 trillion tonnes` / `516 km³` / `9% of HKH ice` (ICIMOD 2026). Caught: Codex v5.

❌ **"Doubled in 17 years"** for Imja Tsho 0.04→0.61 km². Math error: that's 15×, not 2×. Caught: Codex v5.

❌ **"South Lhonak: 100+ killed"** — journalism that didn't hold up. Use `24 dead, 70+ missing` (Nature 2026 reconstruction). Caught: Codex v5.

❌ **"1.65 billion people downstream"** — basin population, NOT meltwater-dependent. Use `~250 million in water-scarce IGB zones` (Miles 2021). Caught: Claude v3.

❌ **"-12% area"** — superseded phrasing. Use `9% of HKH ice — 516 km³ of water` per ICIMOD 2026.

❌ **"-7,346 km²"** — scope-mismatched. Use ICIMOD 2026 9%/516 km³ phrasing.

❌ **"RCP 4.5 worst case"** — RCPs deprecated in IPCC AR6; calling 4.5 "worst case" is wrong. Use `SSP1-2.6 vs SSP5-8.5`. Caught: Codex v5.

❌ **"12,400 people in the path"** of an Imja GLOF — fake precision. WorldPop within 200m of OSM nodes ≠ flood-zone exposure. Use coarser claim: `communities in the Imja Khola valley downstream`.

❌ **Spliced outlines from Somos-Valenzuela 2014 + ICIMOD 2024** without co-registration — methodology drift creates fake motion. Caught: Codex v5. Mitigation: use one source per timestep OR explicitly note + audit cross-source overlays.

## Storytelling / framing

❌ **"Not the Ocean. The Tap."** — Western framing of a non-Western water system. Use `The glacier was your reservoir.` (past tense, universal). Caught: Claude v3.

❌ **"The Sun-Eater"** for black carbon — single-agent soot apocalypse framing overclaims. Caught: Codex v5. Use `light-absorbing impurities (black carbon + dust)`. Kaspari 2014 shows dust dominates in Solu-Khumbu.

❌ **"Pulse of the Indus"** night-lights frame — overclaims. Night lights are settlement/electrification proxy, not glacier dependence. Drop the thesis line if keeping the frame, OR drop the frame.

❌ **"We are surviving today by drinking our children's 2050 harvest"** — too rhetorical, dilutes evidence. Caught: Claude v3 (rejected Gemini's proposal).

❌ **Single-agent villains in general** — climate stories with one cause and one victim are usually wrong. Be honest about multi-agent / mixed-agent realities (BC + dust + algae for impurities; warming + impurity for melt; basin pop vs water-scarce-zone pop for downstream).

❌ **National Geographic Clip Show pacing** — 7 disconnected videos. Caught: Gemini v5. Use hidden-cut continuity to feel like one descent.

## Animation / interaction

❌ **Autoplay cinematic on landing** — users miss the start (Gemini v5). Use scroll-scrub from the first viewport.

❌ **`scrub: 1` (1-second smoothing) on data-heavy chapters** — feels "underwater" on mid-range Android. Caught: Codex v5. Use `scrub: true` (immediate).

❌ **`setData()` per scroll tick on a 65k-feature MapLibre source** — main-thread thrash. Caught: Gemini v5. Use preloaded decade-source layers with opacity cross-fades.

❌ **Filmstrip giant vertical sprite for 180s** — decode memory blows up. Caught: Codex v5. Use real `<video>` with low-bitrate scrub master + `requestVideoFrameCallback()` where available.

❌ **MapLibre `flyTo` on mobile** — GPU death. Caught: Gemini v5. Use static map snapshots; only animate SVG overlays.

❌ **Three side-by-side charts on mobile** (375px width) — labels collide, peak shift becomes 2px difference. Caught: Gemini v5. Pick Indus as primary, others as toggle.

❌ **Scroll-velocity-driven audio** — gimmicky, browsers block, feels broken. Caught: Codex v5. Audio is opt-in, ambient only.

❌ **Scroll-jacking** (intercepting scroll velocity to "finish" animations) — users hate it; #1 complaint on scrollytelling. Caught: Claude v3. Always 1:1 progress binding via ScrollTrigger.

❌ **Compound parallax** (multiple things moving at once per pin). Caught: spec §7. One animation per pin.

❌ **Spring / bounce eases on data motion** — feels like a kids' app. Caught: spec §7. Two eases only: Material standard + gentle-out.

❌ **Animation as the only signal for data** — must always have static text/number. Caught: Claude v3. Every animated value has a DOM fallback.

## Visual grammar

❌ **River line in rose `#F87171`** in Ch 0 — rose means loss/risk. A normal river is active water = living-blue `#38BDF8`. Caught: Codex v5. Color violations are bugs.

❌ **Ice in non-`#7DD3FC` colors** without semantic reason. Each color token has a meaning; deviating without reason confuses the reader.

❌ **Diegetic data (3D type) for exact precision values** — looks impressive but unreadable. Caught: Codex v5. Use HTML overlay for exact values; 3D type only for headlines/ordinals.

❌ **Sankey particles claiming dimensional honesty** — intensity/speed/brightness are not encoding km³/yr. Caught: Codex v5. Display exact values via labels at every node.

❌ **Hydrological Clock as 3D monolith** — timing precision needs HTML axes/labels. Caught: Codex v5. Keep clock as 2D HTML/SVG.

## Implementation / pipeline

❌ **Fetching data from inside `bpy` script at render time** — non-deterministic. Pre-stage all data in `data/water-cycle/` first.

❌ **Opening `.blend` files in production** — manual UI iteration only. Production renders are 100% scripted via `bpy`.

❌ **Inline material creation in chapter scripts** — color grammar drift. Use `shared/materials.py`.

❌ **`random.random()` without `seed.lock_seeds()` first** — non-deterministic renders, can't validate regressions.

❌ **Render at higher than 1280×720** — file-size cap exceeded. Production is locked at 720p.

❌ **Cycles 64 spp on volumetric atmospherics** — visible noise, denoiser flicker. Caught: Codex v5. Use 128-256 spp for production atmospherics.

❌ **Motion blur on scrub masters** — smears on scrub. Always disabled on scrub-master encodes.

❌ **Provenance.json missing required fields** — Provenance Peel breaks. Validator must catch this in CI.

❌ **Schema changes without updating all chapter scripts in the same PR** — breaks downstream chapters silently.

## Frontend

❌ **Three.js / R3F runtime 3D** — wrong tool. Pre-rendered video is mobile-cheaper.

❌ **Lottie** — adds runtime, requires animator. Skip.

❌ **Framer Motion for data viz** — wrong tool. Use GSAP for scroll, CSS for transitions, D3 for charts.

❌ **Auto-resume video on Provenance Peel close** — user opted out. Let them scroll to resume.

❌ **Hardcode chapter titles in components** — drift from provenance.json. Read from provenance.

❌ **`<video>` without `playsinline` and `muted`** — Safari autoplay breaks. Both required.

❌ **Audible autoplay** — browsers block, breaks the page. Audio is opt-in only.

❌ **Fetch provenance.json at runtime** — adds latency, breaks static export. Bundle at build time.

## Cloudflare Workers / hosting

❌ **Any video file > 24 MiB** — exceeds Workers 25 MiB asset cap. Will fail deploy. Asset budget script must catch this in CI.

❌ **Total `public/water-cycle/` > 250 MiB** — page is too heavy. Asset budget script must catch this.

❌ **Range request 404s on AV1** — hard to catch. Verify cache headers + range support after deploy. Cloudflare DOES support range requests, but check `Cache-Control` headers don't strip them.

❌ **Setting `cache-control: max-age=0` on fingerprinted assets** — defeats CDN caching. Cloudflare default; must override for video files.

❌ **Storing rendered video in `data/`** — wrong location. Renders go in `public/water-cycle/`.

## Process

❌ **Workers expanding scope** — task drift, scope creep. If a worker hits something out of scope, BLOCKED + explain. Don't extend the task silently.

❌ **Workers skipping `npm run lint && npx tsc --noEmit && npm test`** — quality gates exist for a reason.

❌ **Mother merging without manual review for render tasks** — visual quality calls require eyes. PRs without `MOTHER_REVIEW: ✓ pass` in AGENT_STATE.md don't merge.

❌ **Unconditional `gh api DELETE` after merge** — orphans branches if merge fails. Use `&&` chain.

❌ **Editing locked-decision rows in WATER_CYCLE_SPEC.md decision log** — append, never edit.

❌ **Council critique loops indefinitely** — at some point, build. After v7 + 2 council passes (Gemini+Codex on v5 reframe), we lock and execute. New ideas go in a v8 backlog for a future iteration.

## When in doubt

If a worker is unsure whether something is an anti-pattern, the heuristic is:

1. Does it violate a locked decision in `WATER_CYCLE_SPEC.md` §11? → don't do it.
2. Does it violate the color grammar in §7? → don't do it.
3. Does it violate the hard constraints in §7 (size cap, mobile-first, reduced-motion)? → don't do it.
4. Is it "more impressive" / "cooler" than the current spec but doesn't earn its weight? → flag in QUESTION protocol.
5. Does it contradict a chapter storyboard in `03-storyboards.md`? → don't do it without Mother approval.

When in real doubt: BLOCKED + explain, don't ship.
