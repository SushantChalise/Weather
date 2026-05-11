# 08 — Acceptance Criteria

Every task must pass its acceptance tests before its PR can merge. CI runs the test suite on every PR.

## Test runner

- Unit tests: `npm test` (Vitest)
- E2E tests: `npx playwright test e2e/water-cycle.spec.ts`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Provenance validator: `npm run validate:water-cycle-provenance <chapter>`
- Asset size check: `node scripts/check/water-cycle-asset-budget.ts`

## Per-task acceptance

### Phase 1 — Foundations

| Task | Acceptance test |
|---|---|
| T1.1 DEM | File `data/water-cycle/dem/srtm-hkh-30m.tif` exists, ≥ 1 GB, opens via `rasterio.open()` without error, bbox in `[70,26,95,36]` ±0.1° |
| T1.2 Imja keyframes | File `data/water-cycle/glaciers/imja-keyframes.geojson` has ≥4 features, each has `year` property and valid Polygon geometry. Areas computed via `@turf/area` within ±10% of Somos-Valenzuela 2014 Table 1. Same for lakes. |
| T1.3 Farinotti | File `data/water-cycle/glaciers/farinotti-2019-hkh-thickness.csv` has ≥ 50,000 rows. Total volume sum (thickness × area) within 4,000-7,000 km³. |
| T1.4 Rounce | Files exist; SSP1-2.6 + SSP5-8.5 both present with year coverage 2025-2100; total HKH volume in 2100 SSP5-8.5 is 25-35% of 2020 baseline (Rounce paper Fig 1). |
| T1.5 Kaspari | File has BC reduction range, BC forcing range, dust forcing range. All within published values. |

### Phase 2 — Provenance contract

| Task | Acceptance |
|---|---|
| T2.1 Schema | TypeScript types compile; Zod schema validates the valid fixture; rejects the invalid fixture; Vitest test suite passes. |
| T2.2 Peel component | Snapshot test passes; manual click-test in dev: opens, displays sources, closes via Esc. |
| T2.3 Route scaffold | `/atlas/water-cycle` returns 200; renders 7 chapter sections; ScrollTrigger initializes without console error; Playwright test passes. |

### Phase 3 — Per-chapter renders

| Task | Acceptance (in addition to common rules below) |
|---|---|
| T3.0 Ch 0 | Mass counter ends at exactly "516 km³"; ice color sample matches `#7DD3FC`; hidden cut at t=17s renders as cut (not interpolation) |
| T3.1 Ch 1 | Per-glacier areas at 1990 and 2020 match ICIMOD inventory ±5% (cross-check via test) |
| T3.2 Ch 2 | "35×" annotation correct (0.04 → 1.4 km² is 35×, NOT "doubled"); "24 dead, 70+ missing" caption present (NOT "100+ killed") |
| T3.3 Ch 3 | All Sankey ribbons have explicit km³/yr labels in HTML overlay (not just intensity-encoded) |
| T3.4 Ch 4 | Clock UI is HTML/SVG, NOT 3D; both clock hands visible after reveal |
| T3.5 Ch 5 | Caption explicitly names BOTH black carbon AND dust (NOT BC-only "soot apocalypse"); HTML chart shows dust forcing > BC forcing per Kaspari 2014 |
| T3.6 Ch 6 | Captions name SSP1-2.6 and SSP5-8.5 (NOT RCP 4.5); closing line "The glacier was your reservoir. We are draining it." appears |

#### Common per-chapter render acceptance (every T3.x must pass)

| Test | Pass condition | How to verify |
|---|---|---|
| All 5 files exist | `cinematic.webm`, `cinematic.mp4`, `cinematic-scrub.webm`, `poster.jpg`, `provenance.json` | `ls public/water-cycle/ch{N}/` |
| File sizes < 24 MiB | Each file under cap | `stat -c %s file ` then divide |
| provenance.json validates | Conforms to schema | `npm run validate:water-cycle-provenance ch{N}` |
| Color grammar | All ice = `#7DD3FC`, lakes = `#0E7490`, etc. | Sample frames at known timestamps; pixel color check |
| Determinism | Re-render produces byte-identical output | `sha256sum` before/after |
| Frame rate = 30 fps, resolution = 1280×720 | Encoded correctly | `ffprobe -v quiet -show_streams cinematic.webm` |
| No motion blur on scrub master | scrub-master flag set | `ffprobe` extras + visual frame-by-frame test |
| Poster.jpg matches final frame | Visual diff against frame 899 (or final) | `ffmpeg -i cinematic.webm -vf "select=eq(n\,899)" frame.png` then compare to poster.jpg |

### Phase 4 — Polish

| Task | Acceptance |
|---|---|
| T4.1 Reduced motion | Playwright test with `reducedMotion: 'reduce'` passes: no animation, posters visible, peel open by default, transcripts rendered |
| T4.2 Mobile cards | At 375px viewport: card-stack visible (NOT scroll-scrub video); back/next buttons work; per-card poster + headline + citation chip render; swipe gestures work |
| T4.3 OG image | `public/water-cycle/og.jpg` exists at 1200×630; opens cleanly; size < 200 KB |
| T4.4 Citations | `public/water-cycle/citations.json` aggregates all 7 chapters' provenance; deduplicated; `<CitationsBibliography>` renders sortable list |
| T4.5 Acceptance tests | Full Playwright suite passes in CI; all criteria in this doc covered |

### Phase 5 — Ship

| Task | Acceptance |
|---|---|
| T5.1 Deploy | Live URL responds 200; smoke test: page loads, all 7 chapters present, video chunks load, Provenance Peel works on each chapter; Lighthouse mobile Performance ≥ 75, Accessibility ≥ 95 |

---

## Cross-cutting acceptance (every PR)

These run on every PR via CI:

### Lint + typecheck + test

```bash
npm run lint
npx tsc --noEmit
npm test
```

### Asset budget script

`scripts/check/water-cycle-asset-budget.ts` checks:
- Every file in `public/water-cycle/ch{N}/cinematic*` is < 24 MiB
- Every file in `public/water-cycle/ch{N}/poster.jpg` is < 500 KB
- Total `public/water-cycle/` size is < 250 MiB

Outline of script:
```ts
// scripts/check/water-cycle-asset-budget.ts
// reads each public/water-cycle/ch{N}/ directory, sums sizes, throws if any exceed cap
const PER_FILE_CAP_MIB = 24;
const POSTER_CAP_KIB = 500;
const TOTAL_CAP_MIB = 250;
// implementation iterates dirs and statSync each file
```

### Accessibility check

Playwright + `@axe-core/playwright`:

```ts
// e2e/water-cycle-a11y.spec.ts (outline)
test("water-cycle page meets WCAG AA", async ({ page }) => {
  await page.goto("/atlas/water-cycle");
  // Inject axe-core into the page, run analysis with WCAG 2 AA tags only,
  // assert zero violations.
});
```

### Lighthouse check

```bash
npx lighthouse http://localhost:3000/atlas/water-cycle \
  --only-categories=performance,accessibility \
  --form-factor=mobile \
  --output=json \
  --output-path=./lighthouse-water-cycle.json

# Then parse and assert performance ≥ 75 + accessibility ≥ 95
node scripts/check/lighthouse-budget.ts ./lighthouse-water-cycle.json
```

### Number-fact accuracy guard

A custom test that scans the rendered page text for forbidden numerical claims:

```ts
// e2e/water-cycle-fact-guard.spec.ts (outline)
const FORBIDDEN_PHRASES = [
  /2\.5\s*trillion\s*tonnes/i,        // OLD WRONG NUMBER (was 5x overstatement)
  /-12%\s*area/i,                     // SUPERSEDED phrasing
  /1\.65\s*billion/i,                 // basin pop, not dependent
  /100\+\s*killed/i,                  // South Lhonak inflated
  /doubled\s*in\s*17\s*years/i,       // Imja math error (it's 15x, not 2x)
  /RCP\s*4\.5.*worst\s*case/i,        // deprecated framing
];
// Test reads page body text and asserts no forbidden phrase matches.
```

### Provenance coverage

Every visible numerical claim on the page must trace back to a `provenance.json` entry. Implementation: every numerical value in the DOM tagged with `data-citable` attribute must also have `data-citation` set.

```ts
// e2e/water-cycle-provenance-coverage.spec.ts (outline)
// Selects all [data-citable] elements; asserts each has data-citation set.
```

### Color grammar guard

Test that colors used in HTML overlays match the locked grammar. Elements use `data-color-token="ice|lake|river|loss|heat|people|terrain"`. The test reads computed color and asserts it matches the token's hex.

```ts
// e2e/water-cycle-color-guard.spec.ts (outline)
// For each element with data-color-token, read computed style color and
// match against the locked grammar table from WATER_CYCLE_SPEC.md §7.
```

---

## What blocks merge (CI fail conditions)

A PR cannot merge if:

1. ❌ Any unit test fails
2. ❌ Lint fails
3. ❌ Typecheck fails
4. ❌ Any cinematic file > 24 MiB
5. ❌ Total `public/water-cycle/` > 250 MiB
6. ❌ provenance.json doesn't validate
7. ❌ Lighthouse Performance (mobile) < 75
8. ❌ Lighthouse Accessibility < 95
9. ❌ Any forbidden number-phrase appears in rendered text
10. ❌ Any visible numerical claim has no citation
11. ❌ Color grammar violation

What blocks render-task merge (additional, beyond the above):

12. ❌ Any cinematic shows colors outside the locked grammar
13. ❌ Provenance Peel doesn't open on the new chapter
14. ❌ Re-render doesn't produce identical output (deterministic seed broken)

What blocks frontend-task merge (additional, beyond the global blockers):

15. ❌ Worker did not load the page in Chrome via `mcp__Claude_Preview__preview_*` and did not include screenshots / inspect output in the PR (per WATER_CYCLE_SPEC.md §15).
16. ❌ Mother did not run the Chrome testing protocol against the PR branch in MOTHER_REVIEW.
17. ❌ Mobile breakpoint (375×812) is broken — card-stack doesn't trigger, content overflows, controls overlap.
18. ❌ Dark mode (`prefers-color-scheme: dark`) renders with broken contrast, blown-out backgrounds, or grammar-violating colors.
19. ❌ Console contains errors when navigating the affected route or exercising the changed interactions.
20. ❌ `preview_inspect` on representative elements shows computed colors / fonts / sizes that diverge from spec (§7 color grammar tokens, locked eases).

## Manual review (Mother only, before merge)

For **render tasks**, Mother performs a final manual review:

1. Watch the new cinematic end-to-end at full quality
2. Open Provenance Peel mid-chapter, verify layers align with paused frame
3. Check the chapter integrates visually with adjacent chapters (color, motion grammar)
4. Verify shareable still (poster.jpg) is the correct moment

For **frontend tasks** (Phase 2 components, Phase 2.3 route scaffold, Phase 3 per-chapter `*.tsx` wiring, Phase 4 polish, any T*.c follow-up touching `src/`), Mother MUST run the full Chrome testing protocol from WATER_CYCLE_SPEC.md §15 against the PR branch:

1. Check out the PR branch in an existing worktree (or fresh disposable worktree).
2. Start a dev server via `mcp__Claude_Preview__preview_start`.
3. Navigate to the affected route, screenshot at default viewport.
4. Exercise every new/touched interaction (click, scroll, keyboard).
5. `preview_inspect` representative elements for color grammar / sizing.
6. `preview_console_logs --level error` — assert zero.
7. `preview_resize` mobile / tablet / desktop, screenshot each.
8. `preview_resize` with `colorScheme: 'dark'` — verify dark mode.

Documented in `AGENT_STATE.md` as `MOTHER_REVIEW: <PR#> ✓ pass | ✗ <reason>`. **A frontend PR without Mother's Chrome verification is NOT mergeable** — same gate as render PRs.

This rule was added 2026-05-11 after T2.2 (Provenance Peel) shipped all-green and was merged, but the live page rendered Layer 1 as oversized overlapping text labels — a problem only visible by loading and clicking. See `WATER_CYCLE_SPEC.md` §15 for the full rationale.
