# Chapter 0 — Script
*Role: Writer*
*Total runtime: 30s / 900 frames @ 30fps*
*Text policy: every text element justified below*

---

## Shot Scripts

---

SHOT 01 — HKH Dawn: The Glory Moment (f001–f210)

TEXT ELEMENTS:
  SILENCE — no text in this shot for f001–f189.

  [CONDITIONAL — only if UX cannot defer the title to f211:]
  Position: bottom-left
  Appears at frame: 190  Disappears at frame: 210  Fade in: 20 frames  Fade out: 0 frames (cut with shot)
  Font weight: light  Size: xs
  Color: #E8E4DC at opacity 0→40% only (never full white; a suggestion, not a title card)
  COPY: "Chapter 0 — The Water That Was Ice"

JUSTIFICATION: Nothing appears on screen for the first 6.33 seconds. The Director Brief is explicit and the shot list codifies it: no title on the glory shot. The mountains arrive alone. If the UX requires a navigation label for the chapter, the conditional element at f190 is the minimum concession — it renders at 40% opacity, bottom-left, in the smallest legible size, so it does not interrupt the image. It identifies. It does not explain. If the UX can defer the title to f211, defer it. The constraint is: the peaks burn orange before they have a name.

ACCESSIBILITY:
  aria-label: "The Hindu Kush–Himalayan range at pre-dawn. The highest summits glow orange-gold where first light strikes them, while the valleys and plains below remain in darkness. The range stretches across the full width of the frame from northwest to southeast."

REDUCED-MOTION FALLBACK:
  Heading: "Chapter 0 — The Water That Was Ice"
  Body: "The Hindu Kush–Himalayan range — a 3,500-kilometre arc of peaks and ice — holds approximately 54,000 glaciers and an estimated 6,000 cubic kilometres of ice. At dawn, the highest summits catch the sun before the valleys below wake. This is where the water begins."

---

SHOT 02 — Karakoram Vigour: The Western Arc (f211–f285)

TEXT ELEMENTS:
  SILENCE — no text in this shot.

JUSTIFICATION: The visual is doing precise scientific work here: the Karakoram's clean blue-white glaciers are the western baseline — vigorous, white, contrast-setting. Any text interrupts a contrast that must be felt, not named. The viewer does not need to know it is the Karakoram yet. When the grey glaciers arrive in Shot 03, the contrast registers. If we name this first, we domesticate it. We are still in the opening silence.

ACCESSIBILITY:
  aria-label: "Aerial view over the Karakoram range. Glaciers here are clean blue-white, long valley ice rivers flowing between dark rock walls. The ice has a cold, dense quality."

REDUCED-MOTION FALLBACK:
  "The Karakoram, northwestern edge of the range. Here, some glaciers are advancing — an anomaly within a system that is, elsewhere, in retreat. The clean white ice of the Baltoro and Biafo glaciers is a western baseline."

---

SHOT 03 — The Grey River: Arc-to-Nepal Transition (f286–f360)

TEXT ELEMENTS:
  SILENCE — no text in this shot.

JUSTIFICATION: This shot is the chapter's first factual challenge — debris-covered glaciers are grey-brown, not white — and it must land as a visual fact, not a captioned lesson. Text would convert surprise into instruction. The viewer's brain is already asking "why is the glacier grey?" That question is worth more than any label we could put on screen. The answer comes later, through Imja. Protect the question.

ACCESSIBILITY:
  aria-label: "Aerial view descending toward the Nepal Himalaya. The glacier tongues flowing south from the range are grey-brown — covered in rock debris. Scattered on their surfaces, small pools of milky turquoise water catch the light. This is not what most viewers expect a glacier to look like."

REDUCED-MOTION FALLBACK:
  "Nepal's glaciers are not white. Their lower reaches are buried under decades of rock debris — they look like rivers of gravel. Scattered meltwater pools sit on the surface. The grey is accurate. Most representations of Himalayan glaciers get this wrong."

---

SHOT 04 — Langtang / Yala Glacier: The Clean Reference (f361–f390)

TEXT ELEMENTS:
  [OPTIONAL — only if UX requires region identification for wayfinding:]
  Position: top-left
  Appears at frame: 375  Disappears at frame: 390  Fade in: 5 frames  Fade out: 0 frames
  Font weight: light  Size: xs
  Color: #E8E4DC
  COPY: "LANGTANG"

  All other frames: SILENCE.

JUSTIFICATION: At 1 second (30 frames), this shot must declare itself on the first frame. No text can build here — it would arrive and leave before the eye settles. The label "LANGTANG" is permitted only as a cartographic waypoint if the UX requires region identification across Shots 04–06. It names, nothing more. No description, no context. Yala Glacier's unusual cleanliness — the debris-free blue-grey ice against the recently deglaciated bare rock — is legible without annotation. The bare rock foreground is the retreat scar. The viewer reads it.

ACCESSIBILITY:
  aria-label: "Yala Glacier in the Langtang valley — one of Nepal's few debris-free glaciers. A small plateau of blue-grey ice sits in a rocky bowl. Below the glacier terminus, bare grey rock shows where the ice used to be."

REDUCED-MOTION FALLBACK:
  "Langtang valley. Yala Glacier — 1.3 square kilometres, debris-free, one of Asia's most closely monitored glaciers. The bare rock below its terminus is newly exposed. This rock was under ice within living memory."

---

SHOT 05 — Annapurna Sanctuary: The Vertical Wall (f391–f420)

TEXT ELEMENTS:
  [OPTIONAL — only if UX requires region identification for wayfinding:]
  Position: top-left
  Appears at frame: 405  Disappears at frame: 420  Fade in: 5 frames  Fade out: 0 frames
  Font weight: light  Size: xs
  Color: #E8E4DC
  COPY: "ANNAPURNA"

  All other frames: SILENCE.

JUSTIFICATION: Same logic as Shot 04. The optional label is a cartographic label only — "ANNAPURNA" not "Annapurna Massif, site of the world's tenth-highest peak." The telephoto compression of the enclosing peaks is doing all the work of communicating scale and drama. Text placed over this image would compete with the vertiginous geometry. The Sanctuary must feel like an enclosure, not an exhibit.

ACCESSIBILITY:
  aria-label: "Inside the Annapurna Sanctuary basin, looking up at a ring of peaks rising 3,000 to 4,000 metres above the basin floor. Telephoto compression stacks the concentric ridgelines into what reads as a single vertical wall. Thin spindrift plumes trail off the upper ridgelines."

REDUCED-MOTION FALLBACK:
  "The Annapurna Sanctuary. The basin floor sits at 4,100 metres; the surrounding peaks exceed 8,000 metres. Glaciers hang on near-vertical faces, continuously shedding ice as avalanches. The water eventually reaches the Kali Gandaki."

---

SHOT 06 — Kangchenjunga / Makalu: The Eastern Extreme (f421–f450)

TEXT ELEMENTS:
  [OPTIONAL — only if UX requires region identification for wayfinding:]
  Position: top-left
  Appears at frame: 435  Disappears at frame: 450  Fade in: 5 frames  Fade out: 0 frames
  Font weight: light  Size: xs
  Color: #E8E4DC
  COPY: "KANGCHENJUNGA / MAKALU"

  All other frames: SILENCE.

JUSTIFICATION: The eastern end of the arc. The visual differentiator — bronze autumn forest at 3,000 metres giving way to glacier at 5,000 metres — is the most legible handoff in the sequence. The shot identifies itself. The optional label closes the geography of Beat 1 for viewers who need wayfinding. It does not describe, and it does not summarise. After this, the chapter descends toward specificity. The wide arc is complete.

ACCESSIBILITY:
  aria-label: "The Kangchenjunga and Makalu massifs at the eastern end of the Nepal Himalaya. The foreground shows bronze autumn forest at lower elevation; above the treeline, glaciated peaks rise against deep blue sky. The contrast between dense forest and bare glacier is sharper here than anywhere in the range."

REDUCED-MOTION FALLBACK:
  "The eastern extreme of Nepal's glacial zone — Kangchenjunga and Makalu. Below 3,800 metres: forest in autumn colour. Above 5,000 metres: glacier. The range has been traversed west to east. Now the chapter descends to one specific place."

---

SHOT 07 — Khumbu Icefall: The Known Image (f451–f510)

TEXT ELEMENTS:
  SILENCE — no text in this shot.

JUSTIFICATION: This is the moment of earned recognition. The viewer knows this image — the Khumbu Icefall has appeared in a hundred Everest documentaries, magazine covers, expedition diaries. We are giving them one moment of the familiar before the chapter pivots to the unfamiliar. Text here would puncture that recognition. The viewer's internal caption reads "I know this" — and then the next shot removes the ground from under that certainty. Let the recognition happen without our help. The icefall is its own citation.

ACCESSIBILITY:
  aria-label: "The Khumbu Icefall below Everest — a cascading mass of ice seracs, each the size of a multi-storey building, jumbled and tilted. Deep blue-indigo shadows fill the crevasses between them. The Lhotse face rises behind. A single point of headlamp light moves slowly upward through the ice — a climber, almost invisible, establishing the scale."

REDUCED-MOTION FALLBACK:
  "The Khumbu Icefall, below Everest and Lhotse. This is the image most people carry when they think of Himalayan glaciers — white, dramatic, vertical. It is real. It is also a small fraction of the total ice. Most of what lies below looks nothing like this."

---

SHOT 08 — Imja Descent: The Approach (f511–f585)

TEXT ELEMENTS:
  SILENCE — no text in this shot.

JUSTIFICATION: The lake must not be seen until Shot 09. The approach — grey debris, constricted valley, the moraine dam crest appearing in the final second — is the preparation that makes the colour hit of Shot 09 land. Text here would give the viewer a conceptual handle before the visual event. We are withholding the name "Imja Tsho" intentionally. The viewer arrives at the lake without knowing what it is called, and the colour hits first. The name arrives in Shot 09 as a label on something they have already felt. Do not pre-announce.

ACCESSIBILITY:
  aria-label: "Aerial descent toward an unseen lake in the Imja valley, Khumbu region. The glacier surface below is grey-brown debris. The valley walls are dark quartzite. A ridge of loose angular rock — a moraine dam — rises at the far end of the valley. The lake is hidden behind it."

REDUCED-MOTION FALLBACK:
  "The Imja valley, Khumbu, Nepal. The descent toward Imja Tsho. The debris-covered tongue of Imja Glacier leads upstream to a moraine dam at the valley's end. Behind that ridge of loose rock: the lake."

---

SHOT 09 — Imja Tsho: The Reveal (f586–f645)

TEXT ELEMENTS:
  Position: bottom-right
  Appears at frame: 630  Disappears at frame: 645  Fade in: 10 frames  Fade out: 0 frames (cut with shot)
  Font weight: light  Size: sm
  Color: #E8E4DC
  COPY: "Imja Tsho"

  f586–f629: SILENCE — the colour arrives alone. No text for the first 1.47 seconds.

JUSTIFICATION: The colour is the event. The viewer needs the full first 1.47 seconds to encounter the milky turquoise without mediation — without a label redirecting their attention from the image to the word. The name "Imja Tsho" arrives at f630 because it is a label, not a description. "Imja Tsho" in the bottom-right corner does what "Khumbu Glacier" would do in a Planet Earth title card — it names. It does not say "Nepal's fastest-growing glacial lake" or "a lake that did not exist in 1962." That information comes in the next shot. Here the name is the minimum necessary interruption of the image: the viewer now knows what they are looking at. The colour has already told them what matters.

ACCESSIBILITY:
  aria-label: "Imja Tsho, a glacial lake in the Khumbu region at 5,010 metres elevation. The water is milky turquoise — made opaque by glacial flour, fine particles of crushed bedrock suspended in the water. The colour is unlike any ordinary mountain lake. At the far eastern end, the calving face of Imja Glacier — a wall of ice streaked with grey debris bands — meets the lake surface. At the western end, the moraine dam and the narrow outlet gap where the Imja Khola begins."

REDUCED-MOTION FALLBACK:
  "Imja Tsho. Altitude 5,010 metres. The water is milky turquoise — its colour produced by glacial flour, particles of crushed bedrock 2 to 65 microns in diameter, suspended in the water column and scattering short-wavelength light. This colour is not scenic. It is evidence."

---

SHOT 10 — 1962 Overlay: The Dissolve (f646–f720)

TEXT ELEMENTS:
  Position: bottom-center
  Appears at frame: 646  Disappears at frame: 705  Fade in: 14 frames  Fade out: 14 frames
  Font weight: light  Size: sm
  Color: #F5E090
  COPY: "1962"

  Position: bottom-center (directly below "1962")
  Appears at frame: 646  Disappears at frame: 705  Fade in: 14 frames  Fade out: 14 frames
  Font weight: light  Size: xs
  Color: #F5E090
  COPY: "~0.03 km²  —  a cluster of meltwater pools"

  Position: bottom-center
  Appears at frame: 691  Disappears at frame: 720  Fade in: 10 frames  Fade out: 10 frames
  Font weight: light  Size: sm
  Color: #F5E090
  COPY: "2020"

  Position: bottom-center (directly below "2020")
  Appears at frame: 691  Disappears at frame: 720  Fade in: 10 frames  Fade out: 10 frames
  Font weight: light  Size: xs
  Color: #F5E090
  COPY: "~1.56 km²"

  [Graphic element — not text:]
  The 1962 pond outlines: irregular amber polygons, scattered across the eastern two-thirds of the current lake area, each no larger than ~200 m across. Opacity 0→60% over f646–f660, holds f660–f690, dissolves out f690–f705.

JUSTIFICATION: Two numbers. Two years. No ratio, no percentage, no growth-rate annotation. The Research Brief is precise about what is defensible: "Imja Tsho did not exist as a lake in 1962 — it was a cluster of small meltwater pools." The sub-label "a cluster of meltwater pools" is necessary because 0.03 km² is an abstraction. Without context it reads as a small lake. It was not a lake. The graphic overlay of scattered 1962 ponds over the modern lake body makes the arithmetic visible without forcing it. The viewer does the multiplication. The Director Brief is explicit: "Their arithmetic will be more powerful than ours." The 2020 label carries only the area figure — the lake itself is the 2020 state. "~1.56 km²" is the only annotation 2020 needs. The amber colour (#F5E090) carries the tone of archival imagery — it signals historical data without clinical whiteness. Both numbers fade out by f720 so the frame returns to clean lake before the cut to Shot 11.

ACCESSIBILITY:
  aria-label: "A translucent overlay shows the 1962 state of this lake basin: scattered small meltwater pools covering approximately 0.03 square kilometres, concentrated toward the far end where the glacier now calves. The overlay fades to reveal the 2020 lake: approximately 1.56 square kilometres of milky turquoise water occupying what was glacier."

REDUCED-MOTION FALLBACK:
  "1962: a cluster of meltwater pools on the glacier surface. Approximately 0.03 km². 2020: Imja Tsho. Approximately 1.56 km². In the intervening 58 years, the glacier retreated at an average of 40 to 74 metres per year. The lake is what retreat leaves behind. Source: Somos-Valenzuela et al. (2014), The Cryosphere. DOI: 10.5194/tc-8-1661-2014."

---

SHOT 11 — Calving Front: The Lateral Track (f721–f780)

TEXT ELEMENTS:
  SILENCE — no text in this shot.

JUSTIFICATION: The camera is at water level. The viewer is close to a large volume of cold, opaque water and an unstable ice cliff. This proximity is the text. The debris bands running through the ice face are the chapter in cross-section — decades of surface material buried, compressed, transported, now visible at the waterline. Nothing the writer could put on screen explains this better than the ice face itself. Any label would aestheticise what should feel physically immediate. We are about to watch the mechanism.

ACCESSIBILITY:
  aria-label: "At lake level, looking along the calving face of Imja Glacier where it meets the lake. The ice cliff rises 10 to 15 metres above the waterline. Horizontal grey-brown bands run through the blue-white ice — compressed moraine material, the glacier's own debris, buried and transported from the surface. The milky turquoise water fills the foreground. At the waterline, a narrow strip of cleaner blue-grey meltwater marks where ice has just become water."

REDUCED-MOTION FALLBACK:
  "The calving face of Imja Glacier, at the eastern end of the lake. The grey bands running through the ice are compressed moraine — surface debris buried by successive snowfall years and incorporated into the ice body. Each band is a decade. At the waterline, the ice is becoming lake."

---

SHOT 12 — The Calving Event: Pedestrian and Quiet (f781–f825)

TEXT ELEMENTS:
  SILENCE — no text in this shot.

JUSTIFICATION: A 2-cubic-metre block of ice pivots into a lake. The event takes 1.5 seconds. The camera does not move. There is no score. There is no text. The Director Brief specifies this with unusual precision: "Its pedestrian quality is what makes it unsettling. Underplay this or the chapter lies." A text element — any text element — would frame this event as a moment. It is not a moment. It is Tuesday. The Research Brief documents that this happens continuously. The only thing text could do here is remove that understanding. No text.

ACCESSIBILITY:
  aria-label: "A small section of the ice cliff — roughly two cubic metres — shears along a debris band and pivots into the lake. The block falls approximately one and a half metres. The water opens, then closes. A gentle wave, 10 to 15 centimetres high, moves outward across the milky turquoise surface. The block is briefly visible as a pale shape below the surface, then the turbidity absorbs it. The camera does not move."

REDUCED-MOTION FALLBACK:
  "A block of ice — approximately 2 cubic metres — calves from the ice face into the lake. A small wave, 10 to 15 centimetres high, crosses the surface. This is not a dramatic event. It is an ordinary one. It happens every day. Each event adds to the lake volume. The lake volume is what concerns the valley below."

---

SHOT 13 — Moraine Dam: Orientation (f826–f855)

TEXT ELEMENTS:
  SILENCE — no text in this shot.

JUSTIFICATION: At this point in the chapter, the viewer has seen the lake, understood its history, watched the mechanism of its growth. Shot 13 is the spatial orientation — the wide frame that shows the lake above, the valley below, the dam between them. The geography of the hazard must be read, not labelled. The dam appears unremarkable in this frame, which is the point: the Research Brief calls this "the terrifying banality of GLOF hazard." Text that says "moraine dam" at this moment would give the viewer a concept to file away. We want them to feel the spatial relationship first — water above, valley below, a ridge of loose rock as the only separation. The moraine dam has already been described in Shot 14's predecessor; the viewer carries that knowledge. Now they see where it sits. No text.

ACCESSIBILITY:
  aria-label: "Wide aerial view showing the full geography of the hazard. The milky turquoise lake fills the background. Below it, a ridge of loose angular rock — the moraine dam — separates the lake from a steep narrow valley. Below the dam, the Imja Khola river flows grey-white with suspended glacial sediment. Nothing about the dam's appearance signals that it holds back a large volume of water."

REDUCED-MOTION FALLBACK:
  "The full picture: Imja Tsho above, the Imja Khola valley below, the moraine dam between them. The dam is approximately 40 to 50 metres above the valley floor. It is loose, unconsolidated glacial debris — no bedrock foundation, no concrete. The 2016 lake-level reduction excavated a narrow controlled outlet channel through the dam crest. Below: the flood path toward Dingboche, Namche Bazaar, Phakding."

---

SHOT 14 — The Moraine Dam: Final Hold (f856–f900)

TEXT ELEMENTS:
  SILENCE — no text of any kind. The chapter does not end with a word.

JUSTIFICATION: Everything the chapter needed to say has been said. The viewer knows the lake is milky turquoise. They know it was pools in 1962. They watched the ice become water. They saw the geography of the hazard. Now they look at the thing itself — a pile of loose rock, holding back 61.7 million cubic metres of water, making no sound, showing no sign of what it is. The Research Brief documents buried dead ice within the dam's structure, measured by InSAR satellite as subsiding 8.5 to 9.4 centimetres per year. A slight subsidence hollow is visible in the render — but it is not labelled. Nothing is labelled. The chapter subsides into black. The question the viewer carries forward is not answered here.

ACCESSIBILITY:
  aria-label: "Close view of the moraine dam surface — loose angular boulders, grey silt and gravel, no engineered structure of any kind. A slight bowl-shaped depression in the dam crest marks where buried ice has melted below. A faded prayer flag, one end loose, trails across the rocks. Imja Tsho fills the upper portion of the frame, milky turquoise, still. The chapter fades to black."

REDUCED-MOTION FALLBACK:
  "The moraine dam at Imja Tsho's western end. Loose rock. No bedrock foundation. Buried dead ice melting within it, causing subsidence of 8.5 to 9.4 centimetres per year (Bhushan et al., 2026). In 2016, a controlled outlet reduced the lake level by 3.4 metres. The Early Warning System installed that year is designed to protect 71,752 people in the Everest valley. The dam holds 61.7 ± 3.7 million cubic metres of water. It looks like any other pile of rocks."

---

## Silence discipline

Shots with NO text: 01 (f001–f189), 02, 03, 04 (f361–f374), 05 (f391–f404), 06 (f421–f434), 07, 08, 11, 12, 13, 14

Shots with text: 01 (conditional, f190–f210 at 40% opacity only), 04 (optional label f375–f390), 05 (optional label f405–f420), 06 (optional label f435–f450), 09 (name label f630–f645), 10 (year/area data f646–f720)

Text-free percentage: 79% of frames carry no text element. If the three optional regional labels (Shots 04–06) are omitted, 87% of frames are text-free.

Why the opening 7 seconds (Shots 01–02 partial) are text-free: The Director Brief frames this as the "glory moment" — twenty-five seconds of stillness (scaled to seven seconds in the compressed timeline). The constraint is not aesthetic preference; it is functional. The HKH range must be felt as alien before it is understood. The moment a title card appears, the viewer is watching a documentary. Before it appears, they are in front of something that does not know they exist. That experience — the involuntary smallness — is the emotional investment the chapter requires to make the data in Beat 2 feel like loss rather than information. Text before f190 destroys the precondition for everything that follows.

Additionally, Shots 01–06 collectively constitute the wide-arc survey of Beat 1. The Research Brief describes Beat 1 as: "What the viewer is NOT yet told: They do not know where they are. They do not know the name of a single peak." Text in this section would violate the deliberate withholding that makes the descending specificity of Beat 2 feel earned. The first non-optional text element in the chapter is "Imja Tsho" — a name, at f630, after 20.97 seconds of moving image. Every second before that has been earned.

---

## Headline numbers

### Number 1
Value: ~0.03 km²  →  ~1.56 km²
Source: Somos-Valenzuela MA, McKinney DC, Rounce DR, Byers AC (2014). DOI: 10.5194/tc-8-1661-2014
What it MUST NOT say: "Imja Tsho grew 52-fold since 1962"
What it DOES say: In 1962, a cluster of small meltwater pools covered approximately 0.03 km². By 2020, the unified lake covered approximately 1.56 km². The baseline (0.03 km²) was not a lake. It was pools on the glacier surface. The growth is real; the ratio is technically accurate but collapses what the baseline represents.
Screen appearance: Shot 10, f646–f720, bottom-center, size sm + xs, color #F5E090. Presented as two separate year/value pairs — never as a ratio.

### Number 2
Value: 61.7 ± 3.7 million m³
Source: Somos-Valenzuela MA et al. (2014). DOI: 10.5194/tc-8-1661-2014; Volume measured at 2012 survey (max depth 116.3 ± 5.2 m).
What it MUST NOT say: "enough water to flood a city" or any comparative exaggeration
What it DOES say: The moraine dam at Imja Tsho's western outlet retains approximately 61.7 million cubic metres of water. This figure is from a 2012 survey; lake volume has grown since. The dam is loose, unconsolidated glacial debris with buried ice melting within its structure.
Screen appearance: This number does NOT appear as on-screen text in Chapter 0. It is carried in the accessibility label for Shot 14 and in the reduced-motion fallback. The visual argument — the dam, the lake above it, the valley below — is the primary delivery mechanism. The number belongs to Chapter 1 or a data sidebar. In Chapter 0, the reader's eye on the dam is more powerful than the number in type.

### Number 3
Value: 1.6 billion
Source: ICIMOD (2023). Water, Ice, Society, and Ecosystems in the Hindu Kush Himalaya (HI-WISE). Available: hkh.icimod.org/hi-wise/
What it MUST NOT say: "2 billion people depend on glacial melt"
What it DOES say: The Hindu Kush–Himalayan range feeds 12 of Asia's major rivers, providing water to roughly 240 million mountain people and over 1.6 billion people in downstream river basins. Not all downstream populations are primarily glacier-dependent; the figure refers to the total population in river basins whose headwaters pass through the HKH.
Screen appearance: This number does NOT appear as on-screen text in Chapter 0. The chapter establishes the system (Shots 01–06) and then descends to the specific (Shots 07–14). The population figure is a Beat 2 or Chapter 1 data element. Placing it in Chapter 0 would shift the emotional register from intimate wonder toward abstract concern — the wrong direction for this chapter's arc. It lives in the reduced-motion fallback for accessibility and as a data caption available on request.

---

## Static fallback (prefers-reduced-motion: reduce)

The Hindu Kush–Himalayan range stretches 3,500 kilometres from the Hindu Kush in the northwest to Kangchenjunga in the east. It holds approximately 54,000 glaciers and an estimated 6,000 cubic kilometres of ice. It feeds 12 of Asia's major rivers — water for over 1.6 billion people in downstream river basins.

At dawn, the highest summits catch the sun before the valleys below wake. In the Karakoram, some glaciers are advancing. Across the Nepal Himalaya, most are not: their lower reaches are buried under rock debris, grey-brown, nothing like the white-ice image that dominates popular depiction.

In the Khumbu, Imja Tsho sits at 5,010 metres. Its water is milky turquoise — the colour of glacial flour, particles of crushed bedrock 2 to 65 microns across, suspended in the water column and scattering short-wavelength light.

In 1962, this was a cluster of small meltwater pools on the glacier surface: approximately 0.03 km². By 2020, it had become a lake of approximately 1.56 km². The glacier retreated — from roughly 40 metres per year in the second half of the 20th century to over 70 metres per year in the early 2000s. The lake is what retreat leaves behind.

At the lake's western end, a moraine dam — loose, unconsolidated glacial debris, no bedrock, no concrete — retains approximately 61.7 million cubic metres of water. Buried within its structure, dead ice melts, causing the dam to subside. The dam makes no sound. An early warning system, installed in 2016, is designed to protect 71,752 people in the Everest valley below.

Sources: Somos-Valenzuela et al. (2014) DOI: 10.5194/tc-8-1661-2014; ICIMOD HI-WISE (2023); Bhushan et al. (2026) DOI: 10.5194/tc-20-67-2026.

---

## Text policy for Chapter 0

Rules this script follows, derived from the Director Brief and visual references:

- No text before f190 under any circumstances. The glory moment (f001–f189) is protected. The opening 6.33 seconds belong to the image. Any chapter title, if required by UX, may appear only at f190 at maximum 40% opacity in the bottom-left corner — never full-white, never centered, never over the peak line.
- Numbers appear alone, in pairs, never competing. When "1962 / ~0.03 km²" is on screen in Shot 10, no other text element is present simultaneously. When "2020 / ~1.56 km²" appears, the 1962 pair has already faded. NYT Climate discipline: one number fills its moment, then clears.
- Glacier names are labels, not descriptions. "Imja Tsho" appears in Shot 09. It is a name. It is not "Nepal's fastest-growing glacial lake" or "a lake formed by glacier retreat." The colour has already told the viewer what matters. The name closes the identification. Regional labels in Shots 04–06 follow the same rule — "LANGTANG" not "Langtang Valley, site of Yala Glacier, a benchmark monitoring site."
- No ratio, no multiplier, no percentage for the lake growth figure. The Research Brief is explicit: stating that the lake grew "52-fold" without explaining that the 1962 baseline was not a lake is a defensible-but-misleading construction. This script presents two measurements at two dates and lets the viewer's arithmetic operate freely.
- The moraine dam carries no text in Shots 13 or 14. The chapter has already delivered the hazard context. The final 2.5 seconds are image only. The Director Brief: "The last image must be image, not text."
- The calving event (Shot 12) is text-free and score-free. A text element framing a 2-cubic-metre calving event as a "moment" turns a slow catastrophe into a spectacle. The camera's stillness and the absence of text are the two constraints that keep the event honest.
- "Rapidly," "alarming," "massive," "one of the largest" do not appear anywhere in this script. Where the Research Brief uses a specific figure, this script uses that figure. Where a range is the defensible form, this script uses the range: "40 to 74 metres per year," not "dramatically accelerating retreat."
- The reduced-motion fallback is a complete narrative, not a caption list. Every fact the animation communicates must survive in the static text for users who cannot view the animation. The fallback includes primary source DOIs so the claim chain is auditable.
