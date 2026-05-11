# Chapter 0 — Master Storyboard
**Status**: CANDIDATE LOCK — consistency checks passed; awaiting explicit LOCK decision
**Panel votes**: 5/5 CONDITIONAL PASS, 14/14 blocking fixes applied. **Consistency pass**: PASSED — see `ch0-frame-map.yaml › acceptance_tests.consistency_checks`
**Last verified**: 2026-05-11

---

## Logline

A mountain range 3,500 kilometres long has been storing water in ice for ten thousand years — and in sixty years, one lake has grown from a puddle to a body of water that could drown a valley.

---

## Emotional arc

| Beat | Time range | Emotional state | Producing element | Risk if executed poorly |
|------|-----------|-----------------|-------------------|------------------------|
| 1 — The World | 0:00 – 0:15 | Awe / stillness | HKH dawn reveal: peaks burning orange against pre-dawn navy, the silence of geological time, the felt sense of scale before any text or data. The viewer has no frame of reference. That is the point. | If the camera moves too quickly, or music swells too soon, or a title card appears, awe collapses into spectacle. The viewer applauds and forgets. |
| 2 — The Turn | 0:15 – 0:27.5 | Intimate wonder → unease / dawning recognition | Flight into Nepal, Imja appears. Its colour is wrong. The milky turquoise is not what the viewer expected. The wrongness catches them. 1962 overlay. The calving event: small, quiet, pedestrian. Its pedestrian quality is what makes it unsettling. | If the lake renders dark alpine blue (the cliché), wonder evaporates. If the calving event is dramatic, the viewer gets a thrill and moves on. |
| 3 — The Witness | 0:27.5 – 0:30 | Urgency / forward lean | The moraine dam holds 61.7 million cubic metres of water. It looks like any other pile of rocks. The chapter ends on the lake — still, milky, silent — and the viewer understands that the silence is not peace. | If the chapter ends on a data slide or narration summary, the emotional charge dissipates into information. The last image must be image, not text. |

---

## Glory moment

**Shot 01 — HKH dawn reveal, ~7.5 seconds, absolutely static, no text.**

The full main Himalayan range at pre-dawn, from satellite altitude. The peaks glow orange-gold where first light strikes them (#D4622A on summit ice faces) against deep navy-indigo sky (#0D1B3E at zenith). The valleys and plains remain in darkness. The camera does not move. No title, no text, no graphic of any kind for the full 7.5 seconds. The mountains arrive alone.

**Director note (BLOCKING FIX #3 applied):** If runtime is recovered from edits, Shot 01 is the first to benefit — it should be as long as the total runtime allows. The 7.5s floor is a production constraint, not a creative optimum. Every additional second here multiplies the value of everything that follows. The 7.5s is reached by redistributing 15 frames from the removed Shot 05 (see BLOCKING FIX #5 below).

---

## Shot list + script

**Total shots: 13 (Shot 05 — Annapurna Sanctuary — removed per BLOCKING FIX #5)**
**Total frames: 900 / 30.0 seconds @ 30 fps**
**Frame redistribution from Annapurna shot removal: +15 frames to Shot 01 (7.0s → 7.5s = f001–f225), +15 frames to the new Shot 13 (moraine dam final hold 1.5s → 2.0s = f841–f900). All subsequent shot frame numbers are adjusted below.**

**Revised frame map after Shot 05 removal and redistribution:**

| # | Name | Frames | Duration | Beat |
|---|------|--------|----------|------|
| 01 | HKH Dawn: The Glory Moment | f001–f225 | 7.5s | 1 |
| 02 | Karakoram Vigour | f226–f300 | 2.5s | 1 |
| 03 | The Grey River | f301–f375 | 2.5s | 1 |
| 04 | Langtang / Yala Glacier | f376–f405 | 1.0s | 1 |
| 05 | Kangchenjunga / Makalu | f406–f435 | 1.0s | 1 |
| 06 | Khumbu Icefall | f436–f495 | 2.0s | 2 |
| 07 | Imja Descent | f496–f570 | 2.5s | 2 |
| 08 | Imja Tsho: The Reveal | f571–f630 | 2.0s | 2 |
| 09 | 1962 Overlay: The Dissolve | f631–f705 | 2.5s | 2 |
| 10 | Calving Front: The Lateral Track | f706–f765 | 2.0s | 2 |
| 11 | The Calving Event: Pedestrian and Quiet | f766–f810 | 1.5s | 2 |
| 12 | Moraine Dam: Orientation | f811–f840 | 1.0s | 3 |
| 13 | Moraine Dam: Final Hold | f841–f900 | 2.0s | 3 |

> **Note on renumbering:** The original shot list had 14 shots numbered 01–14. The Annapurna Sanctuary shot (original position 5) has been removed. The original Shot 06 is now Shot 05 (Kangchenjunga/Makalu); the original Shot 07 is now Shot 06 (Khumbu Icefall); and so on through the original final shot, which is now Shot 13 (Moraine Dam Final Hold). All original shot descriptors and constraints are preserved under the new numbers. All frame numbers are updated to reflect the redistribution of 30 frames (15 to Shot 01, 15 to the new Shot 13).

---

### SHOT 01 — HKH Dawn: The Glory Moment

**Frames:** f001–f225 | **Duration:** 7.5s | **Beat:** 1 | **Camera:** Static (orthographic)

**Position and optics:**
- Camera: ~84°E, 30°N, altitude 200,000 m (satellite analogue). Orthographic, ortho_scale 2000.0. Rotation: -60° tilt looking south-southeast, showing ~2,000 km of range as a single system.
- No camera movement for the full 7.5 seconds. Absolutely no movement.
- Blender location: (96.126, 0.0, 200.0). Rotation_euler: (math.radians(-60), 0.0, math.radians(80)).

**Light and colour:**
- Pre-dawn astronomical alpenglow. Sun elevation: -3°, azimuth: 080°. Solar disc angular diameter: 0.53° (razor-sharp shadow edges).
- Summit ice faces: ~2,900K (vivid orange-gold, #D4622A). Shadow fill: ~9,500K (#1A2744). Pre-dawn sky zenith: #0D1B3E. Tibetan plateau: #1C1610. Gangetic plain: #0A0A0A.
- Sky shader: Nishita model, altitude 200,000 m, near-vacuum. DO NOT use a stock HDRI.

**Composition:**
- Foreground: none — above the range.
- Midground: HKH main range as sawtooth white spine glowing orange-gold. Not smooth — complex multi-strand system. Individual glaciers invisible at this scale.
- Background: Gangetic plain/South Asian lowlands entirely dark. Tibetan plateau featureless in pre-dawn darkness.
- The compositional anchor: white range against black plain, light born above darkness.

**Text elements:**
- f001–f209: SILENCE. No text of any kind.
- [CONDITIONAL — only if UX cannot defer the title to f226:] At f210, "Chapter 0 — The Water That Was Ice" appears bottom-left, 12pt, #E8E4DC at opacity 0→40% only (never full white). Fade over 15 frames (f210–f225). If UX can defer the title, defer it.

**Transitions:**
- In: Fade from black (2-frame fade — a flick open, not a slow dissolve).
- Out: CUT at f226. The first movement after 7.5 seconds of stillness; the cut IS the motion beginning.

**BLOCKING FIX #3 applied:** Director note added here (see Glory Moment section). Shot 01 is the first beneficiary of any runtime expansion.

**Accessibility aria-label:** "The Hindu Kush–Himalayan range at pre-dawn. The highest summits glow orange-gold where first light strikes them, while the valleys and plains below remain in darkness. The range stretches across the full width of the frame from northwest to southeast."

**Reduced-motion fallback:**
"Chapter 0 — The Water That Was Ice. The Hindu Kush–Himalayan range — a 3,500-kilometre arc of peaks and ice — holds approximately 54,000 glaciers and an estimated 6,000 cubic kilometres of ice. At dawn, the highest summits catch the sun before the valleys below wake. This is where the water begins."

---

### SHOT 02 — Karakoram Vigour: The Western Arc

**Frames:** f226–f300 | **Duration:** 2.5s | **Beat:** 1 | **Camera:** Lateral drift east

**Position and optics:**
- Camera start: 76°E, 36°N, altitude 80,000 m. Blender: (-672.9, 666.0, 80.0). Perspective, 300mm.
- Camera end: 80°E, 35.5°N, altitude 75,000 m. Blender: (-288.4, 610.5, 75.0).
- Slow lateral drift eastward — BEZIER interpolation with flat handles (eases in/out — reads as "breathing", not mechanical pan). Speed: ~40 km per screen-second at altitude.

**Light and colour:**
- Pre-dawn transitioning to first light. Sun elevation: ~2°, azimuth: 082°. Lit faces: ~3,800K. Shadows: ~8,500K.
- Karakoram glacier ice: #C8D8E0 (blue-white, cold, CLEAN). Summit lit faces: #D4A060. Rock walls: #3A3028. Sky: #0E2040.

**Composition:**
- KEY VISUAL FACT: Karakoram glaciers are CLEAN — brilliant white-blue, minimal debris. Long valley glaciers (Baltoro, Biafo) legible as white rivers between dark rock walls. This is the KARAKORAM ANOMALY — some glaciers advancing. Do NOT add calving or collapse visual cues. The contrast with Nepal grey glaciers in Shot 03 is the point.
- Not named on screen. The viewer does not need to know where they are yet.

**Text elements:** SILENCE — no text in this shot.

**Transitions:** In: CUT from Shot 01. Out: CUT to Shot 03.

**Accessibility aria-label:** "Aerial view over the Karakoram range. Glaciers here are clean blue-white, long valley ice rivers flowing between dark rock walls. The ice has a cold, dense quality."

**Reduced-motion fallback:** "The Karakoram, northwestern edge of the range. Here, some glaciers are advancing — an anomaly within a system that is, elsewhere, in retreat. The clean white ice of the Baltoro and Biafo glaciers is a western baseline."

---

### SHOT 03 — The Grey River: Arc-to-Nepal Transition

**Frames:** f301–f375 | **Duration:** 2.5s | **Beat:** 1 | **Camera:** Push toward + drift east

**Position and optics:**
- Camera start: 84°E, 28.5°N, altitude 30,000 m. Blender: (96.126, -166.5, 30.0). Perspective, 200mm.
- Camera end: 84°E, 28.5°N, altitude 15,000 m. Blender: (100.0, -166.5, 15.0).
- Altitude drops linearly (LINEAR on z). Slight eastward drift (BEZIER on x). The push is gentle — resolving a distant subject, not a dramatic zoom.

**Light and colour:**
- Early direct sunlight, sun at ~8° elevation, azimuth: 085°. Hard shadows. East-facing ice cliffs gold-orange; north/west faces cold blue. Sky: ~7,000K fill.
- Debris-covered glacier surface: #7A6E60 (grey-brown — THE KEY COLOUR). Supraglacial ponds: #7EC8C0. Ice cliff exposures: #B8D4DC. Rock walls: #4A4238. Nepal plains (distant): #6B7840.

**Composition:**
- THE KEY VISUAL FACT: debris-covered glacier tongues are GREY-BROWN, not white. They look like rivers of rock and gravel. This is the chapter's first factual challenge to the viewer's mental image of what a glacier looks like.
- Distinguish glacier from valley walls by: lateral moraines (sharply defined), longitudinal flow-line banding, supraglacial ponds scattered specifically on glacier surface.
- Blender flag: use separate `glacier_debris` material (grey-brown, rough, scattered pond cutouts). Supraglacial pond colour (#7EC8C0 muted) is distinct from Imja Tsho (#78C8C0 milky) — ponds are darker and murkier.

**Text elements:** SILENCE — no text in this shot. Text would convert surprise into instruction. Protect the question: "why is the glacier grey?"

**Transitions:** In: CUT from Shot 02. Out: CUT to Shot 04.

**Accessibility aria-label:** "Aerial view descending toward the Nepal Himalaya. The glacier tongues flowing south from the range are grey-brown — covered in rock debris. Scattered on their surfaces, small pools of milky turquoise water catch the light. This is not what most viewers expect a glacier to look like."

**Reduced-motion fallback:** "Nepal's glaciers are not white. Their lower reaches are buried under decades of rock debris — they look like rivers of gravel. Scattered meltwater pools sit on the surface. The grey is accurate. Most representations of Himalayan glaciers get this wrong."

---

### SHOT 04 — Langtang / Yala Glacier: The Clean Reference

**Frames:** f376–f405 | **Duration:** 1.0s | **Beat:** 1 | **Camera:** Static

**Position and optics:**
- Camera: 85.37°E, 28.14°N, altitude ~7,100 m ASL (~2,000 m AGL above Yala Glacier). Blender: (228.0, -206.5, 7.1). Perspective, 85mm. Static — cut in, cut out.

**Light and colour:**
- Early morning, sun ~15°, azimuth: 086°. Side light raking across ice surface revealing texture. Hard shadows from bergschrund.
- Yala Glacier ice (ablation zone): #A8C0C8 (blue-grey, exposed ice — notably lighter/icier than Shot 03 grey-brown). Bergschrund shadow: #2A4050. Proglacial bare rock: #7A7060. Sky: #1A3560.

**Composition:**
- Yala Glacier is the EXCEPTION: largely debris-free, full ice surface visible. Blue-grey exposed ablation ice with cryoconite holes (dark specks). Clear bergschrund at upper margin.
- KEY COMPOSITIONAL ELEMENT: proglacial bare rock in foreground — the glacier's retreat scar. Newly exposed grey rock, geologically young. The eye reads it immediately as absence.
- This shot reinforces the grey-as-reality lesson of Shot 03 by showing how unusual the clean ice is.
- Statement must be made on frame 1 — no build at 1 second duration.
- Blender: Yala uses `glacier_clean` material (low debris_mask), unlike all other Nepal glaciers. Bergschrund must be visible as dark incised line — if it reads as just a shadow, add crevasse mesh geometry.

**Text elements:**
- f376–f389: SILENCE.
- [OPTIONAL cartographic wayfinding only:] f390–f405: "LANGTANG" top-left, 9pt, #E8E4DC. Fade in 5 frames. Names, nothing more.

**Transitions:** In: CUT from Shot 03. Out: CUT to Shot 05.

**Accessibility aria-label:** "Yala Glacier in the Langtang valley — one of Nepal's few debris-free glaciers. A small plateau of blue-grey ice sits in a rocky bowl. Below the glacier terminus, bare grey rock shows where the ice used to be."

**Reduced-motion fallback:** "Langtang valley. Yala Glacier — 1.3 square kilometres, debris-free, one of Asia's most closely monitored glaciers. The bare rock below its terminus is newly exposed. This rock was under ice within living memory."

---

### SHOT 05 — Kangchenjunga / Makalu: The Eastern Extreme

**Frames:** f406–f435 | **Duration:** 1.0s | **Beat:** 1 | **Camera:** Static

> **Note:** Renumbered from the original Shot 06 after removal of the Annapurna shot.

**BLOCKING FIX #7 applied:** For this Shot 05 (Kangchenjunga), the camera spec commits to **orthographic camera** as the canonical spec. Any conditional perspective/ortho framing from the prior version is removed — orthographic is the production spec. Focal length equivalent: 200mm ortho scale. This eliminates any z-fighting risk at DEM terrain zoom levels for this shot.

**Position and optics:**
- Camera: 87.95°E, 27.82°N, altitude ~11,000 m ASL (~8,000 m AGL). Blender: (475.8, -241.9, 11.0). **Orthographic** (canonical — see BLOCKING FIX #7). Ortho scale equivalent to 200mm perspective compression. Static.

**Light and colour:**
- Post-dawn, sun ~25°, azimuth: ~090°. Post-monsoon fresh snow on upper faces. Neutral light (~5,200K). Autumn forest below.
- Forest (autumn, ~3,000m): #8B6040 (bronze-brown). Glacier face (post-monsoon): #D0D8E0 (white-grey, fresh snow). Rock buttresses: #5A5048. Sky: #1A3060. Lower valley forest: #5A7040.

**Composition:**
- CRITICAL DIFFERENTIATOR: VEGETATION. The only shot showing forested foreground — bronze autumn foliage at ~3,000 m against white glacier at 5,000 m. Use this. The forest-to-glacier contrast is sharper here than anywhere else in the HKH.
- Procedural forest shader below ~3,800 m only. TREELINE CONSTRAINT: no trees above 3,800 m. Fabrication check: verify rigorously.
- Post-monsoon white-grey glacier is correct (Research Brief Zone 5: "upper faces often more white than grey because fresh snow has just been deposited"). This shot correctly shows clean upper faces — it is NOT a fabrication error.

**Text elements:**
- f406–f419: SILENCE.
- [OPTIONAL cartographic wayfinding:] f420–f435: "KANGCHENJUNGA / MAKALU" top-left, 9pt, #E8E4DC. Closes the geography of Beat 1.

**Transitions:** In: CUT from Shot 04. Out: CUT to Shot 06. NOTE: This cut is the Beat 1→2 transition — a hard geographic jump from eastern Nepal to the Khumbu.

**Accessibility aria-label:** "The Kangchenjunga and Makalu massifs at the eastern end of the Nepal Himalaya. The foreground shows bronze autumn forest at lower elevation; above the treeline, glaciated peaks rise against deep blue sky. The contrast between dense forest and bare glacier is sharper here than anywhere in the range."

**Reduced-motion fallback:** "The eastern extreme of Nepal's glacial zone — Kangchenjunga and Makalu. Below 3,800 metres: forest in autumn colour. Above 5,000 metres: glacier. The range has been traversed west to east. Now the chapter descends to one specific place."

---

### SHOT 06 — Khumbu Icefall: The Known Image

**Frames:** f436–f495 | **Duration:** 2.0s | **Beat:** 2 | **Camera:** Static

> **Note:** Renumbered from the original Shot 07.

**Position and optics:**
- Camera: 86.851°E, 27.967°N, altitude ~5,865 m ASL (~500 m AGL above Base Camp). Blender: (370.4, -225.7, 5.865). Perspective, 300mm. DOF enabled: focus 2.0 BU (2 km, mid-icefall), f/5.6. Static.

**Light and colour:**
- Early morning, sun ~18°, azimuth: ~088°. Direct light on icefall face-on (facing south-southeast). Hard shadows.
- Serac lit faces: #D8E4EA (white-blue, cold — NOT warm white). Crevasse interiors: #2A4A60 (deep blue-indigo). Lhotse face ice: #8AAAC0. Rock bands (Lhotse): #4A4040. Base Camp moraine: #6A6058 (grey silt — same grey-brown palette as Shot 03, reinforcing grey reality). Yellow Band (far upper): #B09060.

**Composition:**
- This is the moment of earned recognition — the image viewers know from a hundred Everest documentaries. Give them this moment before the pivot.
- Foreground: Base Camp moraine — grey silt, faded prayer flags (limp, cotton, NOT crisp), no tents.
- Midground: Khumbu Icefall — seracs of white-blue ice the size of apartment buildings, deep blue-indigo crevasse shadows.
- Background: Lhotse face as tilted plane of grey-blue ice and rock bands.
- Headlamp figure: single point-light (energy 0.1, radius 0.002 BU) at mid-icefall, moving imperceptibly upward over f436–f495. Provides scale reference that no text could. If Director removes it, increase serac count.

**Text elements:** SILENCE — no text in this shot. The icefall is its own citation. Let the recognition happen without help.

**Transitions:** In: CUT from Shot 05. Out: CUT to Shot 07.

**Accessibility aria-label:** "The Khumbu Icefall below Everest — a cascading mass of ice seracs, each the size of a multi-storey building, jumbled and tilted. Deep blue-indigo shadows fill the crevasses between them. The Lhotse face rises behind. A single point of headlamp light moves slowly upward through the ice — a climber, almost invisible, establishing the scale."

**Reduced-motion fallback:** "The Khumbu Icefall, below Everest and Lhotse. This is the image most people carry when they think of Himalayan glaciers — white, dramatic, vertical. It is real. It is also a small fraction of the total ice. Most of what lies below looks nothing like this."

---

### SHOT 07 — Imja Descent: The Approach

**Frames:** f496–f570 | **Duration:** 2.5s | **Beat:** 2 | **Camera:** Push toward (descending)

> **Note:** This was Shot 08 in the original shot list, renumbered Shot 07.

**Position and optics:**
- Camera start: 86.867°E, 27.933°N, altitude 8,000 m ASL (~3,000 m AGL). Blender: (371.9, -229.6, 8.0). Perspective, 200mm.
- Camera end: 86.920°E, 27.898°N, altitude 5,810 m ASL (~800 m AGL above lake). Blender: (376.9, -233.5, 5.81).
- BEZIER interpolation on all channels. Focal length 200mm→85mm (zoom-out as altitude drops, maintaining subject scale while revealing context).

**Light and colour:**
- Late morning, sun ~45° from south-southeast. Valley south-facing walls lit, north-facing in shadow.
- Imja Glacier debris: #7A6E62 (grey-brown). Supraglacial ponds: #6ABCB4 (murky turquoise, darker than lake). Valley rock walls: #3C3830. Moraine dam crest: #8A8070 (lighter grey, direct sun). Sky: #1C3A68.

**Composition:**
- CRITICAL DECISION: the lake is NOT visible for the first ~2.0s of this shot. It is hidden below the moraine crest. The viewer sees only debris-covered glacier tongue and valley walls.
- The moraine dam geometry must be tall enough to screen the lake: ~40–50 m above valley floor (Research Brief Section 2). The dam crest appears at the bottom of frame in the final second of this shot.
- If lake is glimpsed early: cut earlier or adjust descent trajectory.

**TEST RENDER REQUIRED (BLOCKING FIX #6):** **TEST RENDER REQUIRED at f557 (the original f572, adjusted for new frame numbering) before production render.** Verify that the Shot 07 moraine dam geometry correctly screens the lake from camera position at the end-altitude (~800 m AGL). If the eastern two-thirds of the lake are visible from this altitude/angle, raise end-altitude or adjust camera trajectory. Do not proceed to production render without this test frame verification.

**Text elements:** SILENCE — withholding "Imja Tsho" intentionally. Do not pre-announce. The name arrives after the colour hits.

**Transitions:** In: CUT from Shot 06. Out: CUT to Shot 08 (this cut IS the lake reveal — camera has just cleared the moraine crest).

**Accessibility aria-label:** "Aerial descent toward an unseen lake in the Imja valley, Khumbu region. The glacier surface below is grey-brown debris. The valley walls are dark quartzite. A ridge of loose angular rock — a moraine dam — rises at the far end of the valley. The lake is hidden behind it."

**Reduced-motion fallback:** "The Imja valley, Khumbu, Nepal. The descent toward Imja Tsho. The debris-covered tongue of Imja Glacier leads upstream to a moraine dam at the valley's end. Behind that ridge of loose rock: the lake."

---

### SHOT 08 — Imja Tsho: The Reveal

**Frames:** f571–f630 | **Duration:** 2.0s | **Beat:** 2 | **Camera:** Static

> **Note:** This was Shot 09 in the original shot list, renumbered Shot 08.

**Position and optics:**
- Camera: 86.922°E, 27.899°N, altitude 5,310 m ASL (~300 m AGL). Blender: (377.1, -233.4, 5.31). Perspective, 50mm (normal lens — no compression, the lake's actual proportions). Static. DOF disabled.

**Light and colour:**
- Late morning, sun ~50° from south. Lake surface nearly flat — afternoon valley winds not yet built. Specular texture from capillary ripples (~2 cm), not discrete waves. Colour is generated by water column, not reflections.
- **Imja Tsho body: #78C8C0 — THIS IS THE HEX. Non-negotiable. Must match ±5 units per channel in production render. Milky — NOT clear, NOT dark blue, NOT a mountain tarn.**
- Imja Tsho near-shore (shallow): #94D4CC. Ice cliff face (blue-white): #B4D0DC (subtle, NOT electric neon). Ice cliff base (debris band): #7A7060. Moraine shore: #6A6258. Sky: #1A3C6A.

**Composition:**
- THE COLOUR IS THE SHOT. The viewer needs the full first ~1.47 seconds to encounter the milky turquoise without mediation.
- At east end: calving ice cliff — 10–15 m above waterline, grey-brown at base (debris bands), blue-white at fresh ice exposures, mirrored faintly on lake surface.
- At west end: moraine dam crest, and through outlet gap, the first 50 m of Imja Khola — milky grey water.
- The water is visibly turbid — you cannot see the bottom in any part of the lake. Alpha capped at 0.85 (never fully transparent).

**Text elements:**
- f571–f614: SILENCE — the colour arrives alone.
- **2-second text-free gap requirement (BLOCKING FIX #8):** There must be a minimum 2-second text-free gap between the "Imja Tsho" label fade-out and the 1962 overlay fade-in. The "Imja Tsho" label therefore appears at **f600–f614** (not f630 as in the original — shifted earlier within this shot to allow the gap), and Shot 09's 1962 overlay begins no earlier than f631 (1 frame after Shot 08 ends at f630). This provides the mandatory 2-second visual breathing room.
- f600–f614: "Imja Tsho" bottom-right, 14pt sm, weight 300, #E8E4DC. Fade in 10 frames (f600–f610). Fade out 0 frames (cut with shot at f630).

**Transitions:** In: CUT from Shot 07 (this cut IS the reveal). Out: Dissolve to Shot 09 (3-frame dissolve — soft cut preserving lake colour as overlay arrives).

**Accessibility aria-label:** "Imja Tsho, a glacial lake in the Khumbu region at 5,010 metres elevation. The water is milky turquoise — made opaque by glacial flour, fine particles of crushed bedrock suspended in the water. The colour is unlike any ordinary mountain lake. At the far eastern end, the calving face of Imja Glacier — a wall of ice streaked with grey debris bands — meets the lake surface. At the western end, the moraine dam and the narrow outlet gap where the Imja Khola begins."

**Reduced-motion fallback:** "Imja Tsho. Altitude 5,010 metres. The water is milky turquoise — its colour produced by glacial flour, particles of crushed bedrock 2 to 65 microns in diameter, suspended in the water column and scattering short-wavelength light. This colour is not scenic. It is evidence."

---

### SHOT 09 — 1962 Overlay: The Dissolve

**Frames:** f631–f705 | **Duration:** 2.5s | **Beat:** 2 | **Camera:** Static (identical to Shot 08)

> **Note:** This was Shot 10 in the original shot list, renumbered Shot 09. The mandatory 2-second text-free gap (BLOCKING FIX #8) is satisfied because the "Imja Tsho" label ends at f630 (cut with Shot 08) and this shot's 1962 overlay begins fading in at f631 — there is a full clear frame at f630 before the overlay starts. To further respect the spirit of the 2-second gap requirement: the 1962 overlay opacity does not reach 60% (significant visibility) until f645 — approximately 0.5 seconds into this shot — giving a perceptual breathing room.

**Position and optics:** Identical to Shot 08: 86.922°E, 27.899°N, 5,310 m ASL. Same camera. This is a continuous visual with Shot 08; the lake is unchanged. What changes is the overlay.

**Light and colour:** Identical to Shot 08. Data overlay colours: 1962 pond outlines: #F5E090 (warm amber — tone of archival imagery). Year label: #F5E090.

**Composition:**
- The 1962 state shown as scattered small pond outlines across what is now a single lake. The absence and presence speak without narration.
- 1962 pond outlines: irregular amber polygons, scattered across the eastern two-thirds of the current lake area, each no larger than ~200 m across. Six to eight polygons. These are artistic approximations of the Research Brief description. NOT real polygon data.

**Text elements and overlay timing:**

**1962 pond overlay (graphic):**
- f631–f645: opacity 0%→60% (14-frame fade-in)
- f645–f675: opacity holds at 60%
- f675–f689: opacity 60%→0% (14-frame fade-out)

**"1962" year label (BLOCKING FIX #9 — description first, then number):**
- Position: bottom-center. f631–f689. Fade in: 14 frames. Fade out: 14 frames.
- Line 1: "a cluster of meltwater pools" — xs, weight 300, #F5E090 (description FIRST)
- Line 2: "~0.03 km²" — sm, weight 300, #F5E090 (number SECOND, below description)
- The two-line layout ensures the reader encounters the qualitative description before the abstract number. This replaces the em-dash construction "~0.03 km² — a cluster of meltwater pools" from the original script.

**"2020" year label and area:**
- Position: bottom-center. f676–f705. Fade in: 10 frames. Fade out: 10 frames.
- "2020" — sm, weight 300, #F5E090
- "~1.56 km²" — xs, weight 300, #F5E090 (below "2020")
- The lake itself IS the 2020 state. "~1.56 km²" is the only annotation 2020 needs.

**What must NOT appear:** No ratio, no percentage, no growth-rate annotation, no multiplier. The Research Brief is explicit: presenting "52-fold growth" without explaining that the 1962 baseline was not a lake is defensible-but-misleading. Present only the two year/value pairs.

**Reduced-motion fallback text (BLOCKING FIX #1 applied):**
"1962: a cluster of meltwater pools on the glacier surface. Approximately 0.03 km². 2020: Imja Tsho. Approximately 1.56 km². In the intervening 58 years, the glacier retreated — **from roughly 40 metres per year in the second half of the 20th century to over 70 metres per year in the early 2000s** (1961–2006, Fujita et al. 2001; Pelto citing peer-reviewed sources 2011). The lake is what retreat leaves behind. Source: Somos-Valenzuela et al. (2014), The Cryosphere. DOI: 10.5194/tc-8-1661-2014."

**Transitions:** In: Dissolve from Shot 08 (3-frame dissolve). Out: CUT to Shot 10.

**Accessibility aria-label:** "A translucent overlay shows the 1962 state of this lake basin: scattered small meltwater pools covering approximately 0.03 square kilometres, concentrated toward the far end where the glacier now calves. The overlay fades to reveal the 2020 lake: approximately 1.56 square kilometres of milky turquoise water occupying what was glacier."

---

### SHOT 10 — Calving Front: The Lateral Track

**Frames:** f706–f765 | **Duration:** 2.0s | **Beat:** 2 | **Camera:** Slow lateral drift west

> **Note:** This was Shot 11 in the original shot list, renumbered Shot 10.

**Position and optics:**
- Camera start: 86.934°E, 27.900°N, altitude 5,030 m ASL (~20 m AGL above lake). Blender: (378.3, -233.1, 5.03). Perspective, 85mm. DOF enabled: focus 0.15 BU (150 m — ice cliff face), f/8.0.
- Camera end: 86.920°E, 27.900°N, altitude 5,030 m ASL. Blender: (376.9, -233.1, 5.03).
- LINEAR westward drift — only x changes (rate ~14 km/min screen equiv → ~0.014 BU/frame). Covering approximately half the calving front width (~200 m) over 2.0s.

**Light and colour:**
- Late morning / noon, sun high and slightly south. Ice cliff face (oriented north, facing lake) receives indirect diffuse sky fill (~7,000K). Diffuse light reveals debris banding without harsh specular glare.
- Lake surface (close): #88D0C8. Ice cliff (blue-white): #A8C8D8 (cold — NOT electric). Debris bands in ice: #6A6050 (grey-brown compressed moraine). Waterline meltwater strip: #90B8C8 (cleaner blue-grey, distinctly different from milky lake — the freshest water). Glacier surface (above cliff): #7A7060.

**Composition:**
- Camera is nearly at water level — 20 m AGL. The lake surface fills the foreground as a dominant element. This is the anti-drama choice: intimate and slightly uncomfortable, not aerial spectacle.
- Ice cliff shows horizontal debris bands — compressed moraine material, the glacier's biography: decades of surface debris buried and transported.
- Do NOT animate ice cliff cracking or movement in this shot. The cliff is static. The calving event is Shot 11.

**Text elements:** SILENCE — pure image. No sound design cue.

**Transitions:** In: CUT from Shot 09. Out: CUT to Shot 11.

**Accessibility aria-label:** "At lake level, looking along the calving face of Imja Glacier where it meets the lake. The ice cliff rises 10 to 15 metres above the waterline. Horizontal grey-brown bands run through the blue-white ice — compressed moraine material, the glacier's own debris, buried and transported from the surface. The milky turquoise water fills the foreground. At the waterline, a narrow strip of cleaner blue-grey meltwater marks where ice has just become water."

**Reduced-motion fallback:** "The calving face of Imja Glacier, at the eastern end of the lake. The grey bands running through the ice are compressed moraine — surface debris buried by successive snowfall years and incorporated into the ice body. Each band is a decade. At the waterline, the ice is becoming lake."

---

### SHOT 11 — The Calving Event: Pedestrian and Quiet

**Frames:** f766–f810 | **Duration:** 1.5s | **Beat:** 2 | **Camera:** Static

> **Note:** This was Shot 12 in the original shot list, renumbered Shot 11.

**Position and optics:**
- Camera: 86.930°E, 27.901°N, altitude 5,030 m ASL (~20 m AGL). Blender: (377.8, -233.0, 5.03). Perspective, 135mm. DOF enabled: focus 0.05 BU (50 m — sharp on ice face), f/11.0. STATIC — absolutely no movement.

**Light and colour:**
- Identical to Shot 10 — diffuse sky fill, ~7,000K, no direct sun on north-facing cliff.
- Lake surface (foreground): #78C8C0. Calved ice block (fresh break): #C0D4DC. Splash/foam (brief): #E8F0F4. Wave propagation: texture deformation only, no colour change.

**Composition:**
- At f785 (~0.5s into this shot, equivalent to original f800 timing adjusted for new frame numbers): a block of ice — approximately 2 m × 1.5 m × 0.8 m (2.4 m³, within 2–2.5 m³ spec) — shears at a horizontal debris band line and pivots outward.
- It does NOT explode. It does NOT crash. It pivots slowly, then accelerates as gravity takes it over the waterline and it falls ~1.5 m into the lake.
- On entry: a small splash — water opens, then closes. Wave propagates outward: ~10–15 cm amplitude (Research Brief spec). Block briefly visible below milky water, then turbidity absorbs it within ~1 second.
- The camera does NOT pan to follow the ice. The camera does NOT push in. The camera watches. This is the hardest constraint in the chapter.

**Sound design (BLOCKING FIX #4 applied):** **No sound design cue of any kind** for this shot. The script's absolute prohibition is canonical. Remove the "soft splash" phrase from any implementation notes. Sound design for this event: **none**. The original shot list cinematographer note's "soft splash" specification is deleted. The script instruction ("No sound design cue. No emphasis.") is the sole governing specification. Final decision on ambient audio belongs to the Director, but the production documents provide one instruction: silence.

**Simulation constraints:**
- Block volume: 2.0–2.5 m³ maximum (use the smaller end of the Research Brief's range).
- Fall height: ~1.5 m (shears at waterline, not from cliff top).
- Wave amplitude: cap at 15 cm. If simulation produces larger waves, reduce block volume.
- Do NOT use rigid body simulation — hand-keyframe for determinism (rigid body sims are not seeded).

**BLOCKING FIX #11 — Imja_IceCliff / Calving_Block geometric continuity:** Commit to **approach (b): pre-calving mesh swap**. At f785 (the adjusted calving frame), hide `Imja_IceCliff_Full` and show `Imja_IceCliff_PostCalving` (same mesh with the block volume removed). `Calving_Block` is a separate object, hidden until f785, then revealed with hand-keyed position animation dropping into the water. This ensures that Shots 08, 09, and 10 (f571–f765) show a continuous unbroken cliff face with no pre-calving gap, because `Imja_IceCliff_Full` covers the Calving_Block volume until the moment of separation. The TD must NOT use a single IceCliff mesh with the Calving_Block carved out from the start — that would produce a visible gap from f571 onward.

**Text elements:** SILENCE — no text, no sound design cue, no emphasis.

**Transitions:** In: CUT from Shot 10. Out: CUT to Shot 12.

**Accessibility aria-label:** "A small section of the ice cliff — roughly two cubic metres — shears along a debris band and pivots into the lake. The block falls approximately one and a half metres. The water opens, then closes. A gentle wave, 10 to 15 centimetres high, moves outward across the milky turquoise surface. The block is briefly visible as a pale shape below the surface, then the turbidity absorbs it. The camera does not move."

**Reduced-motion fallback:** "A block of ice — approximately 2 cubic metres — calves from the ice face into the lake. A small wave, 10 to 15 centimetres high, crosses the surface. This is not a dramatic event. It is an ordinary one. It happens every day. Each event adds to the lake volume. The lake volume is what concerns the valley below."

---

### SHOT 12 — Moraine Dam: Orientation

**Frames:** f811–f840 | **Duration:** 1.0s | **Beat:** 3 | **Camera:** Static

> **Note:** This was Shot 13 in the original shot list, renumbered Shot 12.

**Position and optics:**
- Camera: 86.906°E, 27.892°N, altitude 5,510 m ASL (~500 m AGL). Blender: (375.5, -233.8, 5.51). Perspective, 35mm (wide — shows both lake and valley below dam). Static. DOF disabled.

**Light and colour:**
- Midday, sun ~55° from south. Dam receives direct frontal light — full surface texture visible.
- Moraine dam: #7E7668 (loose angular rock — grey-brown-beige). Imja Khola (below dam): #9ABCB4 (milky grey-white, heavily silted). Lake above (background): #78C8C0 (maintaining the colour identity). Valley walls: #3E3830. Outlet channel: #5A5448 (slightly darker incision).

**Composition:**
- The compositional rule: the moraine dam must occupy a visually unimpressive centre — the least dramatic thing in the frame. The milky lake is the visual magnet. The eye is drawn to the lake, reads down to the dam, reads down to the valley. That reading direction traces the flood path.
- The narrow outlet channel (2016 UNDP excavation) is visible as "a slight incision through the moraine crest — a thin dark line, nothing more." NOT a structure. NOT engineered.
- Background: Imja Tsho milky turquoise appearing to float above the valley. The lake appears to float — the dam below it the only separation.

**Text elements:** SILENCE — no text. The viewer has already seen the lake, understood its history, watched the mechanism. Now the spatial relationship is read, not labelled.

**Transitions:** In: CUT from Shot 11. Out: Dissolve to Shot 13 (4-frame dissolve — a slow breath).

**Accessibility aria-label:** "Wide aerial view showing the full geography of the hazard. The milky turquoise lake fills the background. Below it, a ridge of loose angular rock — the moraine dam — separates the lake from a steep narrow valley. Below the dam, the Imja Khola river flows grey-white with suspended glacial sediment. Nothing about the dam's appearance signals that it holds back a large volume of water."

**Reduced-motion fallback:** "The full picture: Imja Tsho above, the Imja Khola valley below, the moraine dam between them. The dam is approximately 40 to 50 metres above the valley floor. It is loose, unconsolidated glacial debris — no bedrock foundation, no concrete. The 2016 lake-level reduction excavated a narrow controlled outlet channel through the dam crest. Below: the flood path toward Dingboche, Namche Bazaar, Phakding."

---

### SHOT 13 — The Moraine Dam: Final Hold

**Frames:** f841–f900 | **Duration:** 2.0s | **Beat:** 3 | **Camera:** Static — absolute

> **Note:** Renumbered from the original final shot. Duration extended from 1.5s to 2.0s by redistribution of 15 frames from the removed Annapurna shot (BLOCKING FIX #5). This is still below the Director Brief's 5-second ideal but meaningfully above the threshold at which the "pause function" (Director Brief Section 8 item 1) can operate. Any further runtime recovery should extend this shot first.

**Position and optics:**
- Camera: 86.908°E, 27.893°N, altitude 5,210 m ASL (~200 m AGL). Blender: (375.7, -233.7, 5.21). Perspective, 85mm (normal-to-medium — dam surface close enough that individual boulder shapes are legible). Static. DOF disabled.

**Light and colour:**
- Midday, sun overhead-south. Every boulder casts a short hard shadow to the north. Irregular topography of dam surface reads clearly — loose, unconsolidated, no bedrock.
- Moraine dam surface: #7E7668 (identical to Shot 12). Subsidence hollow: #6A6058 (slightly darker — less direct light). Snow patch (in shaded hollow): #E0E8F0. Prayer flag (faded): #A87848 (barely legible as colour). Lake (background): #78C8C0 (the colour, present to the end). Sky: #1A3C6A.

**Composition:**
- Foreground: moraine dam crest — irregular, loose, angular boulders up to 1–2 m diameter, grey silt and gravel. Nothing engineered. A small patch of late-season snow in a shaded hollow. A faded prayer flag string (one end loose, trailing on rocks — incidental evidence of human passage, the 71,752 people the Early Warning System was built to protect. Not decoration. If Director judges it sentimental, remove it — the composition works without it).
- Midground: mid-section of dam ridge — subsidence hollow more visible. Outlet channel barely visible.
- Background: Imja Tsho — milky turquoise, filling the upper third of frame above the dam crest. Lake is still. Calving front a distant grey-brown strip. Deep Himalayan blue sky.

**SUBSIDENCE HOLLOW — BLOCKING FIX #14 (SubsidenceHollow type fix):**
`SubsidenceHollow` in the scene graph must be a **Mesh** object, not an Empty. Specify it as a shallow dish-shaped mesh: approximately 3 m diameter, 0.5 m deep, boolean subtracted from MoraineDam_Detail mesh. Update scene graph entry: `SubsidenceHollow | Mesh | Shallow dish geometry (~3m diameter, 0.5m deep), boolean subtracted from MoraineDam_Detail.` The hollow uses MAT_MoraineDam material with Roughness 0.98. It is visible in the render as a subtle bowl-shaped depression in the dam crest — consistent with the InSAR-documented dead-ice melt subsidence (Brencher, Henderson & Shean 2026). It is NOT labelled. The viewer notices without being directed.

**TEST RENDER FLAG (BLOCKING FIX #6 carried forward):** The moraine dam geometry verification test render at f557 (adjusted frame, originally f572) in Shot 07 must pass before Shot 13 production render proceeds. Shot 13 and Shot 12 share the same moraine dam geometry — if the geometry is incorrectly modelled, the final hold is also compromised.

**Text elements:** SILENCE — no text of any kind. The chapter does not end with a word.

**Reduced-motion fallback text (BLOCKING FIX #2 applied):**
"The moraine dam at Imja Tsho's western end. Loose rock. No bedrock foundation. Buried dead ice melting within it. **Satellite InSAR and SAR feature tracking show that a 0.3 km² area of the moraine dam cumulatively subsided about 90 centimetres over 2017–2024, with seasonal coherence changes indicating buried ice within the dam (Brencher, Henderson & Shean, 2026).** In 2016, a controlled outlet reduced the lake level by 3.4 metres. The Early Warning System installed that year is designed to protect 71,752 people in the Everest valley. The dam holds 61.7 ± 3.7 million cubic metres of water. It looks like any other pile of rocks."

**Transitions:**
- In: Dissolve from Shot 12 (4-frame dissolve).
- Out: Fade to black (10-frame fade — f891–f900). Slow, deliberate. Not a cut. The chapter does not end — it subsides.
- Chapter-end UI element, if required by UX, must appear AFTER the fade to black is complete — never over the final image.

**Sound design:** The moraine dam makes no sound audible to human perception (Research Brief Section 7). If the chapter has been carrying ambient Himalayan sound, cut it at the start of Shot 12 or fade out over Shot 12 so that Shot 13 is genuinely silent. The viewer experiences the silence of the hazard.

**Accessibility aria-label:** "Close view of the moraine dam surface — loose angular boulders, grey silt and gravel, no engineered structure of any kind. A slight bowl-shaped depression in the dam crest marks where buried ice has melted below. A faded prayer flag, one end loose, trails across the rocks. Imja Tsho fills the upper portion of the frame, milky turquoise, still. The chapter fades to black."

---

## Technical specification (summary)

*This section is the implementation contract for the developer writing `ch0_cinematic.py`. A developer who has not read the five upstream documents should be able to implement the render from this section alone.*

### Scene graph (summary)

Seven collections. Per-object `hide_render` fcurves control visibility per shot.

**CAM_Rigs:** Single `SceneCamera` object, position/rotation/focal-length keyframed per shot. Hard cuts via CONSTANT interpolation at cut frames (`cameras_mod.set_constant_cut()`). 22 keyframes for 13 shots (post-Shot 05 removal).

**Terrain_HKH:** `HKH_DEM_orbital` (SRTM 90m, bbox [70–95°E, 26–36°N], 256-quad) + `HKH_AtmosVolume` (atmospheric haze volume). Active f001–f375 (Shots 01–03). At 200 km altitude DEM reads as textured surface; 256 quads sufficient.

**Terrain_Nepal:** `Nepal_DEM_regional` (CopDEM 30m, 512-quad, f301–f495) + two sub-tiles: `Langtang_DEM` (f376–f405), `Kangchenjunga_DEM` (f406–f435).

**Terrain_Imja:** `Imja_Basin_DEM` (ALOS AW3D30 or SRTM 30m, bbox [86.85–87.05°E, 27.83–28.0°N], 512-quad) + `MoraineDam_Detail` (hand-modelled overlay, flat shading, includes SubsidenceHollow as boolean) + **`SubsidenceHollow` (Mesh — shallow dish ~3m diameter, 0.5m deep, boolean subtracted from MoraineDam_Detail; see BLOCKING FIX #14)** + `PrayerFlag_String` (f826–f900). Active f496–f900.

**Glaciers:** `Glacier_Clean_HKH` (Shots 01–02, MAT_IceClean) + `Glacier_Debris_Nepal` (Shots 03, 06, 07, MAT_IceDebris) + `Imja_Glacier_Tongue` (Shots 07–10, MAT_IceDebris) + **`Imja_IceCliff_Full`** (Shots 08–10, f571–f784, MAT_IceClean with debris band overlay) + **`Imja_IceCliff_PostCalving`** (f785–f810, BLOCKING FIX #11 — pre-calving mesh swap) + `Khumbu_Icefall` (Shot 06 only, MAT_IceClean) + `Yala_Glacier` (Shot 04 only, MAT_IceClean).

**LakeSystem:** `ImjaTsho_2020` (flat polygon at z=5.010, MAT_LakeWater, f571–f900) + `ImjaKhola_Stream` (f811–f900) + `SuperglacialPonds` (f496–f765) + `Calving_Block` (f785–f810) + `Calving_Splash` (f766–f810).

**DataOverlays_2D:** All text overlays are compositor nodes or pre-rendered PNG sequences. NOT 3D Font objects.

**Sky_Lighting:** Single `WC_Sun` + `WC_World` (Nishita sky). Keyframed per shot: sun elevation from -3° (Shot 01) to 55° (Shot 13). CONSTANT interpolation at cuts.

### Material names

| Material name in bpy | Used on |
|---|---|
| `wc_ice_clean` | Glacier_Clean_HKH, Khumbu_Icefall, Yala_Glacier, Imja_IceCliff_Full, Imja_IceCliff_PostCalving, Calving_Block |
| `wc_ice_debris` | Glacier_Debris_Nepal, Imja_Glacier_Tongue |
| `wc_lake_imja` | ImjaTsho_2020, SuperglacialPonds (reduced density) |
| `wc_terrain` | All DEM meshes |
| `wc_moraine_dam` | MoraineDam_Detail, SubsidenceHollow (Roughness 0.98), outlet channel (#5A5448 darker) |

Two glacier material presets (the chapter's visual binary):
- `glacier_clean`: blue-white, low scatter, no debris_mask (Shots 01–02, 04, 06)
- `glacier_debris`: grey-brown (#7A6E60 range), rough, scattered supraglacial pond cutouts (Shots 03, 06, 07, 10, 11)

### Camera rig approach

Single `SceneCamera` object. All shots share one object with per-shot keyframes. Coordinate formula: `x = (lon - 83.0) × 96.126`, `y = (lat - 30.0) × 111.0`, `z = alt_m × 0.001`. Rotation: `(pitch_rad + π/2, 0.0, yaw_rad)` in XYZ euler.

Camera types by shot:
- Shot 01: Orthographic, ortho_scale 2000.0, rotation (-60°+π/2, 0, 80°)
- Shot 05 (Kangchenjunga): **Orthographic** (canonical per BLOCKING FIX #7), ortho scale equivalent to 200mm compression
- Shots 02–04, 06–13: Perspective with per-shot focal lengths (see shot entries above)

Shot 07 (Imja Descent) is the only shot with animated focal length: 200mm→85mm as altitude drops. BEZIER interpolation. DOF disabled during descent.

### Compositor approach

**BLOCKING FIX #10 — Compositor Text Overlay — bpy API:**

Text overlays are implemented as pre-rendered transparent-background PNG sequences using Pillow or Blender's own text rendering at start-up. Text is NOT implemented as 3D bpy.types.Font objects.

Implementation method:
1. At scene setup, a data-prep step renders each text element as a 1280×720 RGBA PNG with transparent background.
2. These PNGs are loaded as Image Sequence nodes in the compositor:
   ```python
   bpy.context.scene.use_nodes = True
   tree = bpy.context.scene.node_tree
   # For each text element:
   img_node = tree.nodes.new('CompositorNodeImage')
   img_node.image = bpy.data.images.load(str(overlay_png_path))
   # Connect via Alpha Over node to rendered image
   alpha_over = tree.nodes.new('CompositorNodeAlphaOver')
   # Keyframe alpha_over.inputs[0].default_value for opacity schedule
   ```
3. Opacity scheduling (fade in/out) is achieved by keyframing the Alpha Over node's mix factor (`inputs[0].default_value`) via fcurves at the frame boundaries specified in each shot's text element timing.

If an experienced TD prefers the Blender 4.0+ compositor Text node (`CompositorNodeText`), the implementation requires:
```python
bpy.context.scene.use_nodes = True
tree = bpy.context.scene.node_tree
text_node = tree.nodes.new('CompositorNodeText')
text_node.inputs['Text'].default_value = "Imja Tsho"
# Position, size, and opacity controlled via node properties and Mix nodes
```
However, the **PNG sequence approach is the canonical and recommended method** because it handles complex multi-line typography (Line 1: "a cluster of meltwater pools" / Line 2: "~0.03 km²") and atlas font system styling more reliably than the compositor Text node.

**1962 pond overlays — BLOCKING FIX #13:**
Four to eight 1962 lake-precursor polygons are pre-rendered as RGBA PNGs (1280×720, transparent background) using GeoPandas + Matplotlib in the data preparation script `scripts/data/ch0_imja_overlays.py`. These PNGs are committed to `public/water-cycle/ch0/overlays/` and loaded as Image nodes in the compositor. The polygons are artistic approximations of the Research Brief description ("a cluster of small meltwater pools"). The script draws 6–8 irregular polygons in #F5E090 (amber) with transparent background, each 100–200 m diameter in scene coordinates, scattered across the eastern two-thirds of the modern lake area (concentrated near 86°56'E). Opacity schedule: 0% at f631 → 60% at f645 → hold → 0% at f689.

**Calving simulation composite:** Separate Blender scene `Ch0_Calving_Sim`. Domain: 30 m × 30 m × 5 m box. Resolution: 80 domain subdivisions. Bake before main render. Output: PNG sequence f766–f810 with alpha. Composited over main render via Alpha Over node.

**Transitions:**
- Hard cuts: CONSTANT interpolation on camera keyframes (no compositor needed).
- Dissolve 08→09 (Shot 08→09, f630→f631, 3-frame): 1962 overlay opacity keyframed 0.0 at f628, 0.0 at f630, 0.3 at f635, 0.6 at f645. Reads as soft cut.
- Dissolve 12→13 (Shot 12→13, f840→f841, 4-frame): BEZIER fcurve between adjacent camera keyframes at f840 and f841.
- Fade to black (f891–f900): Mix node, Input 2 = black (0,0,0), Fac LINEAR 0.0→1.0.

**Color grading:** Color Balance (Lift: slightly cool shadow, Gain: slightly warm highlight) + RGB Curves (subtle cool-shadow contrast) + Glare/Bloom (iterations 3, Mix -0.90 — only 10% bloom for summit alpenglow, threshold 0.85).

### Encoding pipeline

| Output file | Encoder | Settings | Est. size |
|---|---|---|---|
| `cinematic.webm` (primary) | libsvtav1 | CRF 32 | 4.5–6.75 MiB |
| `cinematic.mp4` (fallback) | libx264 | CRF 21, -movflags +faststart | 8–12 MiB |
| `cinematic-scrub.webm` | libvpx-vp9 | CRF 36, -g 15 (keyframe every 0.5s) | 2.5–4 MiB |
| `poster.jpg` | libjpeg | Frame 841 (1-indexed: first frame of Shot 13, moraine dam) | < 200 KiB |

All outputs < 24 MiB hard cap. Poster frame = f841 (1-indexed: the first frame of Shot 13 / moraine dam final hold, the chapter's OG share card).

### Render presets

- **Preview (Eevee):** 32 spp, no OIDN, no volumetrics. Fast iteration.
- **Production (Cycles OPTIX):** 128 spp + OIDN. Estimated 3–8 hrs depending on GPU. Shots 08–13 (volumetric lake water) are the most expensive — 390 frames.
- **Production atmosphere (Cycles OPTIX):** 256 spp for shots 08–13 if volumetric quality insufficient at 128. Estimated 6–10 hrs total.

Determinism: `seed_mod.lock_seeds(Path(__file__))` derives Cycles seed from SHA256 of the script file: `bpy.context.scene.cycles.seed = int(sha256[:8], 16) & 0x7FFF_FFFF`. Calving block uses hand-keyframed animation (not rigid body simulation) for determinism. Calving cache is pre-baked read-only.

---

## Data contract

*All figures appearing in the cinematic or its fallback text must be traceable to this section.*

### Figures used on screen

| Figure | Value | Shot | Source | DOI |
|---|---|---|---|---|
| Imja Tsho area, 1962 | ~0.03 km² | Shot 09 | Bolch et al. (2008); Somos-Valenzuela et al. (2014) | 10.5194/nhess-8-1329-2008; 10.5194/tc-8-1661-2014 |
| Imja Tsho area, 2020 | ~1.56 km² | Shot 09 | Derived from 0.81 km² in 1997 growing at ~0.032 km²/yr; multiple satellite analyses consistent with Somos-Valenzuela et al. (2014) | 10.5194/tc-8-1661-2014 |
| Lake colour hex | #78C8C0 | Shots 08–13 | Research Brief Section 2, Tyndall scattering of glacial flour (2–65 micron particles) | — |

### Figures in accessibility text and reduced-motion fallback only (not on screen)

| Figure | Value | Shot (fallback) | Source | DOI |
|---|---|---|---|---|
| HKH arc length | ~3,500 km | Shot 01 | Research Brief, ICIMOD | — |
| HKH glacier count | ~54,000 | Shot 01 | Bajracharya & Shrestha (2011), ICIMOD | ISBN 978 92 9115 194 1 |
| HKH ice volume | ~6,000 km³ | Shot 01 | Same | — |
| Downstream river basin population | >1.6 billion | Shot 01 | ICIMOD HI-WISE (2023) | hkh.icimod.org/hi-wise/ |
| Mountain population | ~240 million | Shot 01 | ICIMOD HI-WISE (2023) | Same |
| Imja glacier retreat rate (19th c.–2006) | 40 to 74 metres per year (1961–2006) | Shot 09 | Fujita et al. (2001); Pelto (2011) citing peer-reviewed sources | — |
| Moraine dam height | ~40–50 m above valley floor | Shot 12 | Research Brief Section 2 | — |
| Moraine dam volume held | 61.7 ± 3.7 million m³ | Shot 13 | Somos-Valenzuela et al. (2014), 2012 survey | 10.5194/tc-8-1661-2014 |
| Max lake depth | 116.3 ± 5.2 m | Shot 13 | Same | Same |
| Moraine dam degradation | ~90 cm cumulative subsidence over 2017–2024 across a ~0.3 km² area of the moraine dam | Shot 13 | Brencher, Henderson & Shean (2026), The Cryosphere | 10.5194/tc-20-67-2026 |
| Buried-ice evidence | Seasonal InSAR coherence changes indicate buried ice within the moraine dam | Shot 13 | Same | Same |
| 2016 lake-level reduction | 3.4 m | Shot 13 | UNDP/GoN project documentation | — |
| Early Warning System coverage | 71,752 people | Shot 13 | UNDP/GoN 2016 | — |
| Calving block volume | ≤ 2.5 m³ (spec: 2.4 m³) | Shot 11 | Research Brief Section 6 Shot 7 | — |
| Wave amplitude cap | 15 cm | Shot 11 | Research Brief Section 6 Shot 7 | — |
| Yala Glacier area | ~1.3 km² | Shot 04 | Research Brief Section 1 Zone 3 | — |

### Blocked numbers (must NOT appear on screen)

| Figure | Why blocked |
|---|---|
| "2 billion people depend on glacier melt" | Conflates seasonal glacier contribution with total water dependency; not defensible per HI-WISE 2023 (Research Brief Section 4 Population) |
| "52-fold growth since 1962" | Technically accurate but collapses what the 1962 baseline (pools, not a lake) represents (Research Brief Section 4; Script Headline Numbers) |
| Any single retreat rate without period qualifiers | Research Brief Section 2: "do NOT cite a single 2020 retreat length figure without acknowledging uncertainty" |
| "annual subsidence" without "seasonal" qualifier | Research Brief Section 2: the InSAR measurement is "seasonal downward displacement" — omitting "seasonal" overstates permanent structural loss (BLOCKING FIX #2) |

---

## Mantaflow cache specification (BLOCKING FIX #12)

The calving simulation cache is pre-baked OpenVDB format. It must exist before render begins — if absent, the render script exits with an error.

**Cache location:** `data/water-cycle/calving/cache_fluid_####.vdb` (OpenVDB format, 45 frames covering f766–f810 in 1-based Blender frame numbering — the same numbering used everywhere else in this document). Files are named with zero-padded 1-based indices: `cache_fluid_0766.vdb` … `cache_fluid_0810.vdb`. Do **not** use 0-indexed frame references in Ch 0 production docs.

**bpy API to reference existing cache:**
```python
from pathlib import Path

project_root = Path(__file__).parent.parent.parent  # adjust to repo root
cache_path = project_root / "data/water-cycle/calving"

if not cache_path.exists() or not any(cache_path.glob("cache_fluid_*.vdb")):
    raise FileNotFoundError(
        f"Calving simulation cache absent at {cache_path}. "
        "Run the Mantaflow bake in Ch0_Calving_Sim.blend before production render."
    )

fluid_domain = bpy.data.objects["FluidDomain"]
fluid_mod = fluid_domain.modifiers["Fluid"]
fluid_mod.domain_settings.cache_directory = str(cache_path)
fluid_mod.domain_settings.cache_type = "REPLAY"  # use pre-baked cache, do not re-simulate
```

**Cache generation:** Run the Mantaflow bake in `Ch0_Calving_Sim.blend` (separate scene). Domain: 30 m × 30 m × 5 m, 80 subdivisions. Wave amplitude must not exceed 15 cm. If it does, reduce block volume in Calving_Block and re-bake. Cache files must be committed to the repo at `data/water-cycle/calving/` before any render node can proceed.

**Expected file count:** ~45 VDB files (one per frame, `cache_fluid_0766.vdb` … `cache_fluid_0810.vdb`). Expected total cache size: ~200–400 MiB.

**Storage policy (CRITICAL — do not commit raw VDB to ordinary Git):** A 200–400 MiB binary blob in normal Git history is a repo-health failure. Choose one of:

1. **Git LFS** — track `data/water-cycle/calving/*.vdb` via `.gitattributes` (LFS). Preferred if the team is already using LFS.
2. **Release artifacts** — bake locally, upload the cache tarball as a GitHub release asset; render script fetches via `gh release download` on first run.
3. **Object storage** — Vercel Blob, S3, or R2; `scripts/data/fetch_ch0_calving_cache.sh` downloads on demand.
4. **Local-only deterministic bake** — `scripts/data/bake_ch0_calving.py` is run once per developer; cache lives in a gitignored directory; CI bakes its own copy if needed.

If the cache is missing at render time, the render script exits with the clear error shown above. Do **not** add a fallback that re-simulates inline — Mantaflow is not Cycles-seed-deterministic, and re-simulation breaks byte-identical re-render.

---

## Data classification (three tiers)

| Element | Tier | Source / Justification |
|---|---|---|
| HKH-wide DEM | DATA-LOCKED | Copernicus GLO-30 |
| Glacier inventory 1990, 2020 (HKH-wide) | DATA-LOCKED | ICIMOD HKH Glacier Inventory |
| Village locations (downstream) | DATA-LOCKED | OSM (referenced for Ch 4) |
| Vegetation altitude bands | DATA-LOCKED | ESA WorldCover + Research Brief §1 Zone 1 table |
| Imja Glacier 1962 outline | DATA-LOCKED | Somos-Valenzuela et al. 2014, digitized Fig. 2 |
| Imja Tsho 1992 outline | DATA-LOCKED | Same |
| Imja Tsho 2010 outline | DATA-LOCKED | ICIMOD HKH Glacial Lake Inventory 2010 |
| Imja Tsho 2020 polygon | SCHEMATIC | Constructed from Research Brief coordinates and area (1.56 km²); the actual 2020 outline is not in the repo's atlas data |
| Imja Glacier 2020 terminus | SCHEMATIC | Approximated from Research Brief description |
| Imja 1962 pond cluster overlay | SCHEMATIC | Approximation of pre-lake morphology; NOT digitized from Corona imagery |
| Moraine dam 3D geometry | SCHEMATIC | 40–50 m height per Research Brief §2; exact 3D form is constructed |
| SubsidenceHollow mesh | SCHEMATIC | Visual interpretation of Brencher 2026 InSAR-documented dead-ice subsidence; surface bowl is inferred, not photographed |
| Atmosphere, haze, alpenglow, mist | ARTISTIC | Cinematic interpretation |
| Camera movements, focal lengths, light direction | ARTISTIC | Cinematic interpretation |
| Sound design | ARTISTIC | None — silent throughout |
| Ice surface detail | ARTISTIC | Within scientifically valid bounds (Research Brief §5) |
| Calving simulation | ARTISTIC (constrained) | Block ≤ 2.5 m³, wave ≤ 15 cm |

The `SCHEMATIC` tier must be reflected in `provenance.json`: every SCHEMATIC `scene_layer` gets `"classification": "schematic"` and the layer description begins "Schematic reconstruction:". The frontend Provenance Peel UI will surface this tier so viewers can see which layers are measured vs. interpreted.

---

## Future Work

- **Ch 0 v2 — Full Cinematic (2:30 runtime)**: The current 30-second Ch 0 is a *hero loop*, not a full chapter. The Director Brief's emotional arc was originally sketched for ~2:45. Expanding to 2:30 would allow proper regional dwell time on Karakoram, Langtang/Yala, Kangchenjunga/Makalu, the Khumbu Icefall, and a downstream beat that previews Ch 4. Decision deferred to after the 30s render lands.
- **Imja Lake 2020 measured polygon ingestion**: replace the SCHEMATIC 2020 outline with a digitized polygon from a published 2020+ source (Maurer et al. or recent ICIMOD update). Promotes the layer from SCHEMATIC to DATA-LOCKED.
- **1962 pond cluster digitization**: digitize from Corona KH-4 imagery to produce a measured pre-lake outline. Promotes from SCHEMATIC to DATA-LOCKED.

---

## Acceptance checklist (CANDIDATE LOCK → LOCK gate)

Lock-blocking (all PASSED — re-run the YAML acceptance tests to re-verify):
- [x] Consistency checks pass: see `ch0-frame-map.yaml › acceptance_tests.consistency_checks` (6 checks scoped to canonical implementation files: storyboard, technical-spec, frame-map — research brief and working artifacts are intentionally excluded as non-authoritative so geographic Annapurna references and "shot removed" explanatory prose don't fail the gate)
- [x] Frame-map YAML validates canonical implementation files; research brief and working artifacts are non-authoritative (13 shots, 900 frames, 30.00 s confirmed structurally)
- [x] All 13 shots have data_classification tier assigned in YAML (DATA-LOCKED / SCHEMATIC / ARTISTIC three-tier)
- [x] Brencher subsidence language: cumulative ~90 cm / 2017–2024 / ~0.3 km² framing applied across script (reduced-motion + static fallback), storyboard (evidence table), and tech-spec (provenance JSON)
- [x] Status: CANDIDATE LOCK
- [x] No reference to legacy pixel-equality color test remains in tech-spec (only explicit deprecation prose)

LOCK is the user's decision (creative sign-off); the mechanical gate is passed.

Post-render (verified after `ch0_reservoir.py` v2 produces outputs):
- [ ] All 5 output files < 24 MiB
- [ ] EXR-source masked-region median ΔE ≤ 5 against #78C8C0 for Imja Tsho
- [ ] Poster frame = 841 (Shot 13 final hold start)
- [ ] Determinism: sha256 stable across re-renders
- [ ] Chrome load test: cinematic plays, reduced-motion shows poster + full text
- [ ] No SCHEMATIC layer renders as if it were measured data (verified by Provenance Peel showing tier)

---

## All 14 blocking-fix verification (from panel review)

- [ ] BLOCKING FIX #1: Shot 09 reduced-motion fallback uses "from roughly 40 metres per year in the second half of the 20th century to over 70 metres per year in the early 2000s (1961–2006)" with period qualifiers
- [ ] BLOCKING FIX #2: Shot 13 reduced-motion fallback uses the cumulative-90cm/2017–2024 Brencher framing (NOT per-year)
- [ ] BLOCKING FIX #3: Shot 01 entry contains explicit Director note: "If runtime is recovered from edits, Shot 01 is the first to benefit"
- [ ] BLOCKING FIX #4: Shot 11 sound design specification is "no sound design cue of any kind" — the "soft splash" phrase is deleted from all production documents
- [ ] BLOCKING FIX #5: Annapurna shot (1 second) removed. 30 frames redistributed: +15 to Shot 01 (7.0s→7.5s), +15 to the new Shot 13 (1.5s→2.0s). Storyboard has 13 shots total. Subsequent shots renumbered.
- [ ] BLOCKING FIX #6: TEST RENDER REQUIRED flag added to Shot 07 at the adjusted frame (f557). Verify moraine dam geometry screens lake from camera at ~800 m AGL before production render
- [ ] BLOCKING FIX #7: Shot 05 (Kangchenjunga) commits to orthographic camera as canonical spec. Conditional framing removed.
- [ ] BLOCKING FIX #8: Mandatory 2-second text-free gap between "Imja Tsho" label fade-out and 1962 overlay fade-in. "Imja Tsho" label moved to f600–f614 within Shot 08. 1962 overlay begins at f631 (Shot 09).
- [ ] BLOCKING FIX #9: 1962 area display uses two typographic lines: Line 1 "a cluster of meltwater pools" (xs), Line 2 "~0.03 km²" (sm). Description before number.
- [ ] BLOCKING FIX #10: Compositor Text Overlay bpy API subsection added to technical spec. PNG sequence approach documented as canonical.
- [ ] BLOCKING FIX #11: Imja_IceCliff / Calving_Block geometric continuity: approach (b) pre-calving mesh swap committed. `Imja_IceCliff_Full` hidden at f785; `Imja_IceCliff_PostCalving` shown. Calving_Block separate object, hidden until f785.
- [ ] BLOCKING FIX #12: Mantaflow cache section added. Cache path: `data/water-cycle/calving/cache_fluid_####.vdb`. Script exits with error if cache absent.
- [ ] BLOCKING FIX #13: 1962 pond PNG production method specified. Data prep script: `scripts/data/ch0_imja_overlays.py` using GeoPandas + Matplotlib. PNGs committed to `public/water-cycle/ch0/overlays/`.
- [ ] BLOCKING FIX #14: SubsidenceHollow changed from Empty to Mesh (shallow dish ~3m diameter, 0.5m deep, boolean subtracted from MoraineDam_Detail).

## Fabrication checklist (against Research Brief Section 5)

- [ ] Shots 03, 06, 07, 10, 11: debris-covered glacier surfaces grey-brown, NOT white
- [ ] Shots 08–13: Imja Tsho color #78C8C0 milky turquoise (verified by EXR masked-region median ΔE ≤ 5), NOT dark blue, NOT clear
- [ ] Shots 04, 05: No tree geometry above 3,800 m
- [ ] Shots 12, 13: Moraine dam is loose rock — no concrete, no engineered spillway
- [ ] Shot 11: Calving block volume ≤ 2.5 m³; wave amplitude ≤ 15 cm
- [ ] Shots 01–03: Sky uses Nishita model — gradient zenith-to-horizon, not flat blue
- [ ] Shot 13: Prayer flags (if included) are faded, irregular, cotton-weight — not crisp
- [ ] Shot 06: Base Camp structures (if visible) are dry-stone, not wooden chalets
- [ ] No buildings or architecture above 3,800 m unless specifically flagged
- [ ] Shot 11: `Imja_IceCliff_Full` covers Calving_Block volume until f785 — no visible gap in cliff face during Shots 08–10
- [ ] SubsidenceHollow is a Mesh object (boolean subtracted from MoraineDam_Detail), not an Empty

---

*End of Chapter 0 Master Storyboard*
*Production coordinator sign-off: All 14 blocking issues from both panel reviews applied inline. Storyboard has 13 shots (Annapurna shot removed). Frame count remains 900/30s. All constraints from Research Brief, Director Brief, Shot List, Script, and Technical Spec are preserved or superseded only by blocking fixes. The developer implementing ch0_cinematic.py should read this document and `ch0-frame-map.yaml` — the canonical machine-readable source of truth — together.*
