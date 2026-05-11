# Chapter 0 — Panel Review AB

> **ARCHIVED — historical artifact**. This document captures the panel review (or v1→v2 ripple check) from the Ch 0 pipeline run. It is not canonical. Canonical sources: `ch0-storyboard.md` (human-readable) and `ch0-frame-map.yaml` (machine-readable).

*Reviewers: Himalayan Researcher (Role A) / Director (Role B)*
*Date: 2026-05-11*
*Documents reviewed: ch0-research-brief.md, ch0-director-brief.md, ch0-shotlist.md, ch0-script.md, ch0-technical-spec.md*

---

## ROLE A: Himalayan Researcher

```
ROLE: Himalayan Researcher / Glaciologist
VERDICT: CONDITIONAL PASS
SCORE: 8/10
```

### BLOCKING ISSUES

**1. SHOT 10 / Script §Headline Numbers / Reduced-Motion Fallback — retreat rate figure introduced without a source in the Research Brief.**

The script's reduced-motion fallback for Shot 10 states: "The glacier retreated at an average of 40 to 74 metres per year." The Research Brief (Section 2, "Imja Glacier retreat" table) documents "41 m/yr" for 1961–2000 and "74 m/yr" for 2001–2006 — these are period-specific rates, not a single continuous average range. Collapsing them into "40 to 74 metres per year" without specifying the periods is defensible as a summary range but the script does not anchor it to the period dates. The Research Brief explicitly says: "Do NOT cite a single 2020 retreat length figure without acknowledging uncertainty." The reduced-motion fallback violates this by presenting the range as if it were a single quoted figure spanning the whole record rather than two distinct accelerating periods. Fix: add the period qualifiers — "from roughly 40 metres per year in the second half of the 20th century to over 70 metres per year in the early 2000s" — exactly as worded in the Research Brief's "What is scientifically defensible" entry. The static fallback body text (Script §Static fallback) already uses this correct wording; the reduced-motion fallback for Shot 10 does not. This is an inconsistency between two script sections that could produce a verifiably wrong on-screen claim.

**2. SHOT 14 / Script §Shot 14 reduced-motion fallback — subsidence figures cited without exact Research Brief traceability.**

The Shot 14 reduced-motion fallback reads: "Buried within its structure, dead ice melts, causing the dam to subside 8.5 to 9.4 centimetres per year (Bhushan et al., 2026)." The Research Brief (Section 2, "The moraine dam") states: "seasonal downward displacement of 8.5–9.4 cm/yr and lateral movement of approximately 90 cm over 2017–2024 (Bhushan et al., *The Cryosphere*, 2026)." The script omits the "seasonal" qualifier and omits the lateral movement figure. "Seasonal downward displacement" and "annual subsidence" are meaningfully different to a technical reader: seasonal displacement includes elastic/thermal deformation, while true structural degradation is measured net over years. Omitting "seasonal" overstates the rate of permanent structural loss. Fix: add "seasonal" before "downward displacement" in the Shot 14 reduced-motion fallback text.

**3. SHOT 01 / Shot List / Technical Spec — the "3,500 km arc length" is implied but not stated on-screen; confirm the glory shot covers sufficient arc to make this legible without fabricating scale.**

The Director Brief (Section 3, Beat 1) asserts the viewer feels "a range so high it catches the sun before the ground below wakes." The shot list specifies a 2,000 km ortho scale width (~2,000 km arc visible in Shot 01), not the full 3,500 km arc. The Research Brief states the arc length is "~3,500 km (east-west)" and the bounding coordinates are 71°E to 98°E — a span of 27° longitude, or roughly 2,900 km at 30°N. The shot covers approximately 2,000 km from the Hindu Kush to central Nepal Himalaya (Shot 01) and does NOT show the eastern end (Kangchenjunga, Namcha Barwa), which is established in Shot 06 separately. This is an acceptable editorial compression but is NOT a fabrication error provided the chapter does not claim the opening frame shows the "full arc." Review the reduced-motion fallback for Shot 01: it states "The Hindu Kush–Himalayan range — a 3,500-kilometre arc of peaks and ice." If the single glory shot frame only renders ~2,000 km, this is technically correct (the reduced-motion text refers to the range as a whole, not to the frame) but could be read as implying Shot 01 contains the full 3,500 km. The aria-label ("The range stretches across the full width of the frame from northwest to southeast") is accurate as written. No fabrication, but the production team should be warned this nuance exists.

*This item does not rise to a blocking issue on review — it is a production-awareness note. Reclassified to Non-Blocking Note 1 below.*

### NON-BLOCKING NOTES

**1. The "3,500 km arc" claim in Shot 01 static fallback vs. ~2,000 km frame coverage (see Blocking Issue 3 above — reclassified).**

The static fallback and aria-label language are technically correct. No fix required, but the production team should document that Shot 01 renders the western-to-central arc; Shot 06 closes the eastern arc; the full system is established across both, not in a single frame.

**2. SHOT 06 — Kangchenjunga glacier area figure not traceable to Research Brief.**

The Research Brief (Section 1, Zone 5) states Kangchenjunga's total glacierized area is "~314 km² across all flanks, 120 glaciers of which 17 are debris-covered." This figure is correct in the Brief but does not appear in the script or shot list. No number is claimed for Shot 06 on-screen, so there is no fabrication risk. Note only: if any caption or accessibility text is later added for Shot 06 that cites a glacier count or area, use the Research Brief's figures (not the HKH-wide 54,000 count).

**3. SHOT 06 — "post-monsoon snowfall makes them more white" is correctly handled.**

The Research Brief (Zone 5) states Kangchenjunga's "upper faces are often more white than grey because fresh snow has just been deposited" post-monsoon. Shot 06 in the shot list correctly specifies "Glacier face (post-monsoon): #D0D8E0 (white-grey, fresh snow over ice)" and the fabrication checklist does not flag Shot 06 for the grey debris requirement. This is correct: the post-monsoon exception is respected.

**4. SHOT 07 — headlamp figure introduction not from the Research Brief.**

The Research Brief (Section 6, Shot 2) specifically mentions "a human figure (climber with headlamp) appears as a tiny point of light on the ice" as a scale reference element. The shot list's cinematographer note reproduces this reasoning accurately and correctly attributes it. The shot list also notes the Director Brief's "Baraka/Samsara" instinct would strip it. This is an in-document conflict, not a fabrication — both options are discussed. The Research Brief supports the headlamp. The Director Brief is ambivalent. No fabrication risk either way. Resolved correctly as a conditional element.

**5. SHOT 09 / SHOT 10 — lake area figures are correctly sourced.**

0.03 km² (1962) and 1.56 km² (2020) are both traceable to Research Brief Section 4 (Somos-Valenzuela et al. 2014 for 1962–2012 data; 2020 figure derived from the published growth rate as documented). The ~0.03 km² figure is flagged correctly in the script as "not a lake — a cluster of meltwater pools," which is exactly the Research Brief's defensibility framing. The 52-fold ratio is not cited anywhere on-screen. Pass.

**6. SHOT 14 — 61.7 ± 3.7 million m³ volume figure appears only in accessibility text and reduced-motion fallback, not on-screen.**

Script §Headline Numbers Number 2 confirms this number does NOT appear as on-screen text in Chapter 0. Correct: this is the conservative choice endorsed by the Research Brief. The figure is sourced from the 2012 survey (Somos-Valenzuela et al. 2014) and is acknowledged as having grown since. The accessibility text correctly attributes the 2012 survey date.

**7. SHOT 14 / Technical Spec §Scene Graph — the subsidence hollow geometry.**

The shot list and technical spec both describe a "~5–8 m diameter, ~0.5 m deep" subsidence hollow in the moraine dam, derived from the InSAR subsidence rate. This is a scientifically reasonable geometric interpretation of the documented 8.5–9.4 cm/yr seasonal displacement over multiple years — it is not directly stated in the Research Brief as a visible surface feature. The Research Brief documents the InSAR measurements (Bhushan et al. 2026) but does not explicitly state a surface bowl is visible in photographs. This is a valid extrapolation (dead ice melt does produce surface subsidence and hollow formation, documented in glaciological literature) but is one step beyond the Research Brief's explicit claims. The shot list and script handle this correctly: the hollow is "not labelled," "does not need to be." It functions as a plausible, unemphasized detail. No fabrication concern, but the TD should not represent this feature as a specifically observed and documented surface morphology — it is an inferred render addition consistent with the physics.

**8. Population figures — correctly handled throughout.**

The 240 million / 1.6 billion formulation from HI-WISE 2023 appears in the static fallback and is the only population figure used. "2 billion" does not appear anywhere in the script. The 71,752 figure for the Early Warning System appears in the shot list, script, and technical spec — all three attribute it to UNDP/Government of Nepal 2016 project documentation, consistent with Research Brief Section 3. Pass.

**9. Debris-covered glacier colour treatment — correctly propagated.**

The Research Brief's fabrication warning (Section 5, item 1) — "debris-covered glaciers look grey-brown, not white" — is correctly propagated into: Shot 03 (dominant colour #7A6E60 grey-brown), Shot 07 (Base Camp moraine same grey-brown palette), Shot 08 (Imja Glacier debris #7A6E62), Shot 11 (glacier surface above cliff #7A7060). The fabrication checklist in the shot list explicitly flags Shots 03, 07, 08, 11, 12 for this check. The technical spec creates a dedicated `MAT_IceDebris` material with the correct grey-brown base. Full pass.

**10. Imja Tsho colour (#78C8C0, Tyndall scattering) — correctly handled throughout.**

The hex #78C8C0 is specified in: Shot 09 shot list (with "±5 units" tolerance), Shot 09 through 14 in the colour palette tables, the MAT_LakeWater material specification (volumetric Tyndall scatter physics, absorption removing red/orange, depth blend #78C8C0 to #4AACAA), the fabrication checklist, the script ("THE COLOR IS THE SHOT," Shot 09 justification), and the Director Brief (multiple references). The physics explanation (glacial flour, 2–65 micron grain size, Tyndall scattering) appears accurately in the script's accessibility aria-label for Shot 09 and in the Shot 09 reduced-motion fallback. Full pass.

**11. Calving event scale — correctly constrained.**

Research Brief Section 6 (Shot 7): "2–5 cubic metre ice blocks shearing off." Shot list Shot 12 specifies: "approximately 2 m × 1.5 m × 0.8 m (within the 2–5 cubic metre Research Brief specification)." Technical spec §LakeSystem: "2.0 m × 1.5 m × 0.8 m (2.4 m³, within 2–2.5 m³ spec)." Wave amplitude "cap at 15 cm" matches Research Brief "small waves that ripple across the milky turquoise surface" (10–20 cm wavelets documented in Surface behavior section). Full pass.

**12. Moraine dam description — correctly propagated.**

Height "approximately 40–50 m above the Imja Khola valley floor" (Research Brief Section 2) appears in Shot 08 cinematographer note, Shot 13 description, and Technical Spec §Terrain_Imja notes. Loose unconsolidated glacial till with no bedrock — confirmed in MAT_MoraineDam spec ("unconsolidated glacial till — the roughest surface in the scene"; flat shading required). The 2016 outlet channel is correctly described as "a narrow incision through the moraine crest" and appears in both shot list and technical spec without engineering embellishment. The Research Brief's fabrication warning (Section 5, item 10) — "Do not render it with any engineered structure" — is satisfied. Full pass.

**13. Downstream village names and locations — correct.**

Dingboche (~4,360 m), Namche Bazaar (~3,440 m), Phakding (~2,610 m) appear in the Director Brief and script. The Research Brief table (Section 2) confirms all three are in the flood path and at the stated approximate elevations. No village is misnamed or mislocated. The moraine dam orientation shot (Shot 13) reduced-motion fallback correctly names "Dingboche, Namche Bazaar, Phakding" in flood-path order. Pass.

---

## ROLE B: Director

```
ROLE: Director
VERDICT: CONDITIONAL PASS
SCORE: 7/10
```

### BLOCKING ISSUES

**1. The glory moment is compressed from 25 seconds to 7 seconds — the emotional function is at risk of failure.**

The Director Brief (Section 4) states: "Twenty-five seconds of complete stillness" and "The camera does not move for the first twenty seconds. This is non-negotiable." The shot list compresses this to 7 seconds, with a note in the preamble: "The glory moment runs 7 seconds (the maximum the prompt allows at 6–8s) rather than 25." The Director Brief also states in Section 7: "The silent glory section: The camera should be in full wide-angle altitude view with no text for a minimum of twenty to twenty-five seconds." The shot list acknowledges this tension but does not resolve it — it asserts "7 seconds" as the constraint, then in the Shot 01 director note reference quotes "scaled to 7s here" without explaining the basis for the scale factor (25s → 7s → 28% of original). At 7 seconds, the emotional function described in the Director Brief — "the specific emotion of encountering something that does not need you," "the involuntary smallness" — has been given the minimum viable time to land, but it depends entirely on execution. The Director Brief is explicit that in the edit suite this will "feel too long" at 25s, and it is not too long. At 7s, it genuinely might be too short.

This is a blocking issue not because 7s cannot work, but because the shot list does not document a test or rationale for why 7s preserves the emotional function rather than merely approximating the gesture. The shot list must either (a) demonstrate that the 30-second total runtime is genuinely a hard constraint and document how that constraint was arrived at, or (b) identify the glory moment as the first and largest beneficiary of any runtime expansion. The shot list does say "any additional hold time should be added here first if the edit buys back time from Beat 2" — this is the right instinct, but it is buried in the preamble note rather than appearing as a hard priority in the Shot 01 entry itself. Fix: add to Shot 01 "Director note": "If total runtime expands beyond 30s, this shot receives additional time first. The 7s floor is a production constraint, not a creative optimum. Every additional second here multiplies the value of everything that follows."

**2. SHOT 12 — the script's silence discipline is correct but the technical spec introduces a contradicting default.**

The Director Brief (Section 5, item 4): "If we give this event dramatic sound design, a swelling score, or a dramatic camera push, we turn a slow catastrophe into a spectacle." The shot list (Shot 12 cinematographer note) specifies: "Sound design: the event should produce a soft splash followed by the gentle lapping of the outgoing wave. No bass hit, no reverb. Less than a cup of tea spilling." The script (Shot 12 justification): "No text. No sound design cue. No emphasis." These two documents conflict. The shot list permits sound; the script prohibits it. The Director Brief's language ("underplay this or the chapter lies") is more consistent with the script's prohibition than with the shot list's permission of any sound design, however subtle.

The Director Brief does not explicitly prohibit all ambient sound — it prohibits "dramatic sound design." But "soft splash" could easily become "artfully subtle splash" in the hands of a sound designer who decides that complete silence is itself a dramatic choice, and that a small, intimate, barely-audible sound is more "real." The problem is that any sound design decision for this event frames it. The Research Brief (Section 7) documents the Imja Tsho surface behavior as nearly soundless — "surface chop with wavelets 10–20 cm high" in afternoon wind, but the calving event described in Section 6 has no sound characterisation. The shot list's "less than a cup of tea spilling" contradicts the script's absolute prohibition.

Fix: The shot list must be revised to align with the script's silence discipline for Shot 12. Remove the sound design specification from the Shot 12 cinematographer note. The final decision belongs to the sound designer under Director approval, but the production documents must give a single instruction. The script's instruction ("no sound design cue") is correct and the shot list's note should be changed to: "Sound design: defer to Director. Script specifies no sound design cue for this shot."

**3. BEAT 3 — the final hold of 1.5 seconds is demonstrably insufficient for the emotional function the Director Brief assigns it.**

The Director Brief (Section 7): "The final shot of the moraine dam, last five seconds. No drift, no pull-back. Just the dam." The Director Brief's test (Section 8, item 1): "A viewer who stayed to the end and then paused — looking at the final image, not immediately scrolling — shows that the final frame produced something they needed a moment to sit with." Shot 14 runs 1.5 seconds. The shot list notes "compressed to 1.5s here; extend if edit allows" and designates Shot 14 as the first beneficiary of any runtime recovery. This is correct process but the 1.5s is so far below the Director Brief's 5-second minimum (30% of the stated requirement) that the chapter as currently timed cannot deliver the test described in Section 8 item 1. A viewer cannot "pause on the moraine dam final frame for at least three seconds" if the shot only exists for 1.5 seconds before fading to black.

This is not a problem if the runtime can expand — the shot list correctly identifies this shot for any additional time. But at 30 seconds total, the distribution of time between beats is:

- Beat 1 (The World): 15 seconds (50%)
- Beat 2 (The Turn): 12.5 seconds (41.7%)
- Beat 3 (The Witness): 2.5 seconds (8.3%)

The Director Brief's emotional arc places "The Witness" as the chapter's payload — the held image that carries forward. Giving it 8.3% of the runtime against Beat 1's 50% inverts the weight of the chapter's emotional structure. Beat 1 can function in compressed form (regional visits are 1s each and are visual fingerprints, not emotional beats). Beat 3 cannot be compressed to a gesture without gutting the chapter's reason for existing.

Fix: Redistribute runtime from Shots 04–06 (1s each, regional visits) by cutting one of the three regional shots. Shot 05 (Annapurna Sanctuary) is the weakest candidate for inclusion — it contributes the least to the narrative arc, its visual character (enclosed bowl) does not contrast with other shots as strongly as Shots 04 (debris-free Yala) and 06 (forest-to-glacier transition). Cutting Shot 05 and redistributing its 1 second to Shot 14 brings the final hold to 2.5 seconds — still below the Director Brief's 5s target but meaningfully above the threshold at which the pause function (Section 8 item 1) could operate. The remaining 2.5 seconds needed to reach 5s should come from further compression of Beat 2 shots, with Shot 08 (Imja Descent) as the second candidate for reduction from 2.5s to 1.5s.

This restructuring is a blocking issue because the chapter as timed cannot deliver the Director's stated test of success. The moraine dam hold is not a style preference; it is the mechanical requirement for the emotional function the chapter exists to produce.

### NON-BLOCKING NOTES

**1. The emotional arc (awe → intimate wonder → unease → forward lean) is achievable with this shot list, even at the compressed runtime.**

The arc is present: Shot 01 delivers awe; Shots 02–06 transition through wonder; Shots 07–09 pivot to unease via the colour reveal; Shots 10–12 generate dawning recognition; Shots 13–14 produce the held unease. The compressed durations mean the transitions happen faster than the Director Brief describes, but no beat is absent. The chapter will work — it will work better with more time at the beginning and end, but it will not fail.

**2. The "turn" — Imja Tsho milky turquoise reveal — lands correctly.**

The lake colour (#78C8C0) is protected by multiple redundant constraints across all five documents. The shot list's explicit note ("THE COLOR IS THE SHOT") and the technical spec's colour verification procedure (sample the lake center pixel, ±5 unit tolerance) ensure the non-negotiable visual fact survives into the render. The 2-second hold before any text (Shot 09, f586–f629 = 1.47 seconds silent) is just below the Director Brief's "three-second hold" specification but within reasonable tolerance for a 30-second total runtime. Non-blocking.

**3. The text frequency discipline is correctly enforced.**

The script documents: "79% of frames carry no text element. If the three optional regional labels are omitted, 87% of frames are text-free." The Director Brief's pacing rules (Section 7) specify: "data should enter on a three-second fade and stay no longer than six seconds... after any data beat, return to image for at least four seconds." The script's Shot 10 text timing (total text visible ~2.5 seconds) is below the six-second cap. The four-second image-only buffer after Shot 10 data is Shots 11 and 12 (3.5s total) — just under the four-second buffer requirement. This is marginal but acceptable given runtime constraints. Non-blocking.

**4. The 1962 overlay — "no ratio, no multiplier, no percentage" — is correctly enforced.**

Director Brief Section 5 item 9 and the Research Brief's defensibility warning are both satisfied: the script presents only two year/value pairs and explicitly prohibits the ratio construction. The script's "Headline Numbers" section formally documents what must not appear. The technical spec's compositor text nodes implement only the permitted elements. Full pass.

**5. The calving event's "pedestrian quality" — the camera does not move — is protected redundantly across three documents.**

Shot list Shot 12: "The camera does not pan to follow the falling ice. The camera does not push in. The camera watches." Technical spec §SHOT 12: "Camera movement: STATIC. ABSOLUTE. Single keyframe at f781." Script Shot 12 justification: "A text element — any text element — would frame this event as a moment. It is not a moment. It is Tuesday." The redundancy is appropriate: this is the most fragile shot emotionally and the most likely to be "improved" by a TD or sound designer who doesn't have the brief. The multiple explicit constraints should hold.

**6. The final image (moraine dam, no text, quiet) survives into the script's silence discipline.**

Shot 14 shot list: "No text of any kind in the final frame." Script Shot 14: "SILENCE — no text of any kind. The chapter does not end with a word." Technical spec §SHOT 14: "The last frame before the fade (f890) should show the subsidence hollow... Do not add dramatic lighting." Chapter-end UI deferred to after the fade to black. Full pass on the silence discipline for the final frame.

**7. The 30-second runtime feels compressed for the emotional arc described, but not fatally so.**

The Director Brief was drafted against a 2:45 format. The 30-second constraint compresses every beat. The chapter at 30 seconds is a trailer for the chapter the Director Brief describes, not the chapter itself. This is not a failing of the documents — the shot list is transparent about the compression and correctly identifies the compromise points. If the chapter is intended to be the opening cinematic of the Water Cycle Atlas (not a promotional trailer), the runtime should be a conversation before render, not a constraint inherited from a different deliverable. Non-blocking for the storyboard; blocking for the production calendar if unaddressed.

**8. The Director Brief's prohibition on "centring Western emotional responses" (Section 5 item 5) has no direct implementation in the shot list or script.**

The Sherpa villages — Dingboche, Namche, the HRA hospital at Pheriche — are mentioned in the Director Brief and the Research Brief but do not appear as visual elements in the shot list. The chapter is entirely glacial and atmospheric; no village, no monastery, no prayer flag in context (the prayer flag in Shot 14 is incidental evidence of human passage, not a representation of Sherpa presence). This is consistent with the Director Brief's intent (the chapter's subject is the glacier and the lake, not the village) but the downstream arc — where the human presence is established — is deferred entirely to Chapter 1. Non-blocking for Chapter 0 considered in isolation. The shot list's choice to include an incidental prayer flag in Shot 14 is the minimum viable gesture.

---

## Summary

Both reviewers find the storyboard package technically well-grounded and internally consistent across most dimensions. The three blocking issues are:

**Researcher Blocking Issue 1:** Reduced-motion fallback for Shot 10 omits period qualifiers for the retreat rate range (40–74 m/yr). Fix is one sentence, traceable to existing Research Brief language.

**Researcher Blocking Issue 2:** Reduced-motion fallback for Shot 14 omits "seasonal" qualifier for subsidence figure. Fix is one word.

**Director Blocking Issue 1:** The glory moment (Shot 01, 7s) requires explicit documentation that it is the first beneficiary of any runtime expansion, placed in the Shot 01 entry itself rather than the preamble. This is a pipeline protection issue, not a render change.

**Director Blocking Issue 2:** Shot 12 sound design specification in the shot list contradicts the script's silence discipline. One of the two must yield; the script's position ("no sound design cue") is the one consistent with the Director Brief.

**Director Blocking Issue 3:** Beat 3 total runtime (2.5s) is structurally insufficient to deliver the chapter's stated test of success (viewer pausing on the moraine dam). A runtime redistribution from Shot 05 (Annapurna, 1s) and Shot 08 (Imja Descent, partial) to Shot 14 is required before render begins.

The non-blocking notes are substantive but none prevent rendering. The storyboard package is unusually well-cross-referenced; the main production risk is not consistency failures but the runtime compression forcing every emotional beat to operate at its minimum viable duration.

---

*End of Panel Review AB*
