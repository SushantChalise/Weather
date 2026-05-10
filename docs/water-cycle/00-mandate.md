# 00 — Mandate

## Goal

Build the canonical educational page about Hindu Kush Himalaya glacier loss at `/atlas/water-cycle`. It must answer four questions visually:

1. **Why** did the glaciers vanish? (warming + light-absorbing impurities)
2. **How much** water did we lose? (~0.5 trillion tonnes / 516 km³ since 1990)
3. **What's happening to the lakes?** (Imja Tsho 35× growth + GLOF risk)
4. **Where did the water go?** (mostly redistributed within HKH; small ocean contribution)

## Audience

Three audiences, ranked:

1. **Layperson** (Brooklyn reader, Mumbai college student, Nepali high schooler) — must come away viscerally understanding the mass and location of loss, even if they read no captions.
2. **Journalist** — must be able to cite specific numbers and verify their sources without leaving the page.
3. **Researcher** — must be able to download or trace every dataset used, and use the page as a teaching companion.

## Scope (in)

- 7 chapters of pre-rendered Blender cinematics, scroll-scrubbed via GSAP ScrollTrigger
- Provenance Peel: clickable layer reveal of source data per chapter
- Mobile card-stack variant for screens < 768px
- Reduced-motion fallback path with static end-frames + transcripts
- Citations bibliography page
- OG image (1200×630) for social sharing
- Cross-link from /atlas/30-years to /atlas/water-cycle

## Scope (out — explicitly)

- **Real-time interactive 3D** (R3F / Three.js scenes). Pre-rendered video is mobile-cheaper.
- **Live data feeds**. All visuals built on snapshot data; updates via re-render, not live API.
- **User-uploaded annotations / comments / sharing**. Read-only page.
- **More chapters than 7**. Codex's review explicitly capped this; more chapters dilute weight.
- **Real-time global glacier coverage** (e.g., Greenland, Andes). HKH only.
- **GLOF risk modeling tool**. Reference Imja's monitored status; don't simulate.
- **Per-glacier search**. /atlas/30-years already serves this purpose.
- **Native app / VR / AR**. Web-first only.

## Non-goals (we will be told to do these — say no)

- "Make it interactive 3D so people can rotate the camera." → No, we lose the directorial control that makes it land.
- "Add a chatbot that explains each chapter." → No, the cinematic + Provenance Peel are the explanation.
- "Localize to 10 languages." → No (yet); ship English first, plan localization for v2.
- "Make it work as a video without scroll." → No; the scrub is the storytelling primitive.

## Success criteria (post-ship, measurable)

| Metric | Target |
|---|---|
| Lighthouse Performance (mobile) | ≥ 75 |
| Lighthouse Accessibility | ≥ 95 |
| Time to first cinematic frame on mid-range Android | ≤ 3.5s |
| Provenance Peel response time (toggle) | ≤ 200ms |
| Page weight on mobile | ≤ 50 MB (with lazy-load past Ch 0) |
| Page weight on desktop | ≤ 100 MB |
| WCAG 2.1 AA conformance | 100% (no errors) |
| Citation coverage | 100% — every numerical claim visible has a source DOI / URL in provenance.json |
| Render reproducibility | Re-running any `bpy` script produces byte-identical output (deterministic seeds) |

## Failure modes we are explicitly avoiding

These are real risks the council reviews flagged. Each is handled in the spec:

1. **"National Geographic Clip Show"** (Gemini) — series of beautiful but disconnected videos. Mitigated by hidden-cut continuity + chapter-to-chapter color/motion grammar.
2. **Dimensional theater** (Codex) — visualizing things that look like data but aren't honest (intensity / speed / brightness as "more"). Mitigated by HTML overlays for exact precision; 3D type only for headlines/ordinals.
3. **Western framing of South Asian water security** (Claude) — "tap" metaphor for people without taps. Mitigated by "reservoir" past-tense thesis.
4. **Fake precision** (Codex) — claiming 12,400 people in path when method is OSM nodes + WorldPop within 200m. Mitigated by stating the method or using coarser claims.
5. **Stale data** (Codex) — "2.5T tonnes" was 5× overstatement; "100+ killed at South Lhonak" was journalism that didn't hold up. Mitigated by citing only current peer-reviewed numbers.
6. **Filmstrip / scroll-velocity audio gimmicks** (Codex) — solve the wrong bottleneck. Mitigated by dropping these.
