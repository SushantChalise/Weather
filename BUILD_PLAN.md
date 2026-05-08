# Build Plan

**Principle:** customer-visible UI first; real data second; decision intelligence third; advanced 3D last. The product must be testable with real users from step 2 onward.

The risk this plan avoids: spending weeks on terrain mesh and 4-shell cloud physics before the product answers the customer's question. If the v1 demo never reaches step 6, the product still ships and is useful.

---

## Sequence

| Step | Deliverable | Acceptance gate |
|---|---|---|
| **1** | **Static clean Nepal map shell** — top-down GLO-30 shaded relief, 7 destination markers + 2 trail entries with placeholder halo + icon + label, Decision Strip UI (3 pills, mock data), three customer cards (mock), layer toggle UI (visual only), time slider UI with sunrise marker (visual only), Compare button, mobile 3-zone layout with bottom-sheet for layers, NPT timestamp formatter wired | Non-technical user identifies Pokhara, Everest, ABC and reads the layout in under 5 seconds. The Decision Strip is the most visible element. All times show NPT indicator. |
| **2** | **Mock weather + mock decisions** — fake cloud / rain / snow textures from deterministic mock data; Current Conditions per destination from JSON; mock 72h replay with mock summary + mock evidence snapshots; mock Decision Strip with all severity levels (Best / Watch / Avoid); mock Clear Window timeline with sunrise; mock Comparison Drawer split by trip intent (mountain views / trekking / lowland); mock confidence labels on every card | User-test: a customer interprets the map's weather story AND can name a destination they should go to in under 5 seconds. Decision Strip pills expand on tap. Comparison Drawer is swipeable on mobile. |
| **3A** | **Real forecast + cards (no satellite yet)** — Open-Meteo forecast (cloud / rain / temperature / pressure-level cloud cover); per-destination Current Conditions from real API; FABDEM-driven **route-aware snowline** for Snow layer; Confidence labels wired to model-data freshness (Forecast / Estimated / Low / Stale on >6h model); auto-refresh every 10 min; NPT formatter end-to-end; **Evidence tier system** — every card shows source tier alongside confidence | Cards show real forecast within 1 min of API response. Snowline per region resolved correctly. `field-reported` tier never appears in v1; `no-field-report` is the visible default for trail conditions. Aged model triggers "Stale" warning. |
| **3B** | **Himawari satellite pipeline** — preprocessed Himawari cloud overlay; cloud-mask aggregation per scope; 72h archive with deterministic best/worst/current evidence snapshots; manifest.json with input hashes; **stale "Now" downgrade when satellite > 45 min**; Evidence Ledger inline `_evidence` field on every API response | Live Himawari overlay aligns with terrain landmarks. Same archive + scope produces identical 3 snapshots. Aged satellite data triggers visible warning. `_evidence` manifest visible in API responses for debugging. |
| **4** | **Decision Intelligence Layer** — real Decision Strip computation (Best / Best View / Watch [/ Avoid only on severe]); real Clear Window primitive with **sunrise weighting and daylight filter**; real Comparison Drawer with **per-intent ranking** (mountain views / trekking / lowland, no apples-to-oranges); plain-language route translation (no millimeter rainfall) | Decision Strip updates within 10 min of source change. Clear Window detects "clouds build after X AM" pattern across 7 days of test data. Pre-dawn windows filtered unless destination has explicit pre-dawn value. Comparison Drawer never mixes Chitwan with EBC. |
| **5** | **Route intelligence + decision-to-action** — ABC + EBC Route Detail mode; **route ribbons with time-mode toggle** (Now / Tomorrow AM / Afternoon / Last 24h); per-segment cards with plain-language ("damp", "slippery", "fresh snow risk") tagged with Evidence tier (`forecast` / `observed-satellite` / `no-field-report`); snowline crossing point shown on elevation profile; 72h history with auto-generated summary + 3 **deterministic** evidence snapshots (best / worst / current); Destination Insight Panel for all 8 destinations; **Guide Brief JSON endpoint** + **plaintext Copy button** (image / WhatsApp / PDF deferred to v1.1); **[Compare] [Share] [Copy Brief]** action buttons on every panel | Click ABC card → Route Detail with weather-ribbon route line. Time-mode toggle re-renders ribbon within 500ms. Click Pokhara → Insight Panel shows real history + summary + 3 evidence snapshots, with snowline crossing point visible if applicable. `curl /api/brief/abc` returns valid GuideBrief JSON. Copy Brief button copies plaintext to clipboard with toast confirmation. Share button opens native share sheet (mobile) or copies frozen-state URL (desktop). |
| **6** | **Advanced 3D / tilt mode** — 4-shell altitude cloud rendering; peak occlusion verified; cinematic tilt camera with smooth transition; performance tier auto-detection; **idle animation pause** (30s no interaction) | On tilt, Annapurna and Everest peaks visibly puncture the cloud deck. Mid-tier device sustains 25 FPS in tilt mode. Tier-Low fallback renders one composite shell. Animations pause within 30s of no interaction. |
| **7** | **Mountain Visibility cards + low-bandwidth mode** — line-of-sight pre-computed for 8 hero viewpoints; cloud obstruction sampling along LoS; Mountain Visibility card in Insight Panels; **low-bandwidth mode** (auto + manual): static map fallback, paused animations, text-only Decision Strip + cards; payload < 130KB on engaged | Manual sanity test: cloudy frame → score < 30; clear frame → score > 70. Low-bandwidth mode renders Decision Strip + cards in < 2s on simulated 2G. |
| **8** | **Hardening** — full validation suite passing; mobile layout polish across all surfaces; source attribution visible; data fallback paths exercised; staleness badges working | All acceptance tests in ARCHITECTURE.md pass. Snapdragon 7-class device sustains 25–30 FPS through Overview, Route Detail, and Insight Panel. |

---

## Why this order

Steps 1–2 prove the UX is readable with mock data. Step 3 plugs real data in (with the staleness rule and route-aware snowline added). **Step 4 is the Decision Intelligence Layer** — where the product earns its framing. Step 5 layers route-specific intelligence on top, with the Guide Brief data structure ready (UI in v1.1). Steps 6–7 add technical depth and operational rigor (3D occlusion, low-bandwidth, idle pause). Step 8 hardens.

If the team gets stuck at step 6 (3D tilt is the hardest part), the product still demos at step 5 with: clean top-down view of real data, real Decision Strip, real Clear Window with sunrise, real Comparison Drawer split by intent (with Jomsom rain-shadow alternative), plain-language route ribbons with time mode, 72h replay with deterministic evidence snapshots, Guide Brief API + Copy/Share/Compare action buttons. **That's a shippable v1 by itself.**

The 3A/3B split (forecast first, satellite second) means a real-data demo lands earlier — Step 3A is shippable on its own without the Himawari pipeline. The Evidence tier system from 3A is what makes the cards honest even before satellite imagery is wired in 3B.

---

## Acceptance gate philosophy

Every step has a customer-readable acceptance test, not just a technical one. *"Can a non-technical user identify a destination they should go to in under 5 seconds"* is the gate. *"Does the cloud shell render correctly"* is necessary but not sufficient.

If a step's deliverable passes its technical test but fails its customer test, the step is not done.

---

## Estimated effort (rough)

| Step | Estimated days |
|---|---|
| 1 — Static shell | 3–4 |
| 2 — Mock overlays + mock decisions | 3–4 |
| 3A — Real forecast + cards + Evidence tier | 3–4 |
| 3B — Himawari satellite pipeline + 72h archive | 4–5 |
| 4 — Decision Intelligence Layer (sunrise, per-intent ranking) | 5–7 |
| 5 — Route intelligence + Guide Brief + Compare/Share/Copy | 6–8 |
| 6 — 3D / tilt + idle pause | 6–8 |
| 7 — Visibility cards + low-bandwidth mode | 5–6 |
| 8 — Hardening | 4–5 |
| **Total v1** | **39–51 days** |

One-developer estimates. Treat as orientation, not commitment.

---

## v1.1 — Trust + Ops Layer (after v1 ships)

| Item | Estimated days | Why |
|---|---|---|
| Guide mode toggle (lens) | 1–2 | Activates the LensConfig already shipped in v1 |
| Guide Brief export — image / WhatsApp deep link / PDF | 3–4 | Plaintext copy already in v1 (§20.3); these are richer formats |
| **Forecast Accuracy Ledger** | 3–4 | Yesterday's predictions scored against today's archive — turns "trust us" into "watch our hit rate". Plumbing exists from 3B's 72h archive |
| **Lukla Flight Window card** | 2–3 | Dedicated EBC corridor card: low cloud + wind window for morning flights. Decision support, not airline operations |
| **Seasonal Pattern Card** | 2–3 | ERA5-based "ABC in May: clear mornings, cloud after late morning" — pre-trip planning surface |
| **Save Alert** (browser push, localStorage) | 2 | §20.2 — closes Save in the action loop |
| **Offline last-synced brief (PWA)** | 3–4 | Service worker caches last Guide Brief; field-usable when offline |
| Expanded Destination Insight (more historical depth) | 3 | |
| Wind layer toggle activation | 2 | |

## v1.2 — Segmentation

| Item | Estimated days |
|---|---|
| Photographer / Flight / Hotel lenses | 3–5 |
| 8+ viewpoints per corridor | 2–3 |
| Composite Experience Score (only if formula validated by user feedback) | 3 |
| Multi-language (English / Nepali) | 4–6 |

## v2 — Community + Advanced

- **Structured Field Reports** — verified guide / lodge / operator confirmation layer (auth, moderation, photo upload, rate limiting). Activates the `field-reported` Evidence tier already reserved in v1. Unlocks "Verified by local report" on route-condition cards. UGC infrastructure is its own product surface; deliberately deferred from v1.1.
- More corridors (Manaslu / Mardi / extended Mustang)
- AI oracle · Flash flood model · Monsoon front tracker · Optical flow nowcasting

---

## What this plan deliberately does NOT do

- Start with terrain pipeline complexity before there's a customer-readable UI
- Mix engineering and product validation in the same step
- Front-load 4-shell cloud physics
- Build all corridors before validating one
- Build Decision Intelligence and 3D in parallel — Decision Intelligence is the product, 3D is the polish
- Add wind, optical flow, monsoon tracker, or flash flood — all v2
- Ship a Mountain Visibility Index without Clear Window supporting it
- Ship Comparison Drawer that mixes trip intents
- Ship a hero composite Experience Score before the formula is validated
- Ship the lens selector UI before two lenses earn their place
- Show local-browser timestamps anywhere — always NPT
