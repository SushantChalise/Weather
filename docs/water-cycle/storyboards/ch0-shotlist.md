# Chapter 0 — Shot List
*Role: Cinematographer*
*Date: 2026-05-11*
*Total runtime: 30.0 seconds / 900 frames @ 30 fps*
*Beat 1 (The World): Shots 01–06, f001–f450, 0:00–0:15*
*Beat 2 (The Turn): Shots 07–12, f451–f825, 0:15–0:27.5*
*Beat 3 (The Witness): Shots 13–14, f826–f900, 0:27.5–0:30*

---

> **Note on runtime compression.** The Director Brief was drafted against a 2:45 format. This shot list serves the 30-second cinematic brief. All emotional beats, required shots, and "must-not-do" constraints are honoured; durations are compressed proportionally. The glory moment runs 7 seconds (the maximum the prompt allows at 6–8s) rather than 25. Regional visits (Shots 04–06) run 1 second each — the minimum to establish a visual fingerprint. The moraine dam receives 2.5 seconds total across its two shots; any additional hold time should be added here first if the edit buys back time from Beat 2.

---

## Beat 1 — The World (0:00 – 0:15 / f001–f450)

---

### SHOT 01 — HKH Dawn: The Glory Moment

```
Duration: 7.0s (frames 001–210 @ 30fps)
Type: Establishing wide / Composite aerial
Camera position: ~84°E, 30°N — approximate centre of mass of the HKH arc,
                 altitude ~200 km (orthographic satellite perspective, not perspective
                 projection). Camera oriented south-southeast, range reads left-to-right
                 across frame. Enough arc width to show ~2,000 km of range — from the
                 Karakoram (northwest) to the central Nepal Himalaya — as a single system.
Camera movement: Static. Absolutely no movement for the full 7 seconds.
Focal length: Orthographic — flat projection. No horizon distortion. The range
              reads as it would from a high-altitude reconnaissance pass.
Altitude: ~200 km above mean sea level (satellite analogue, not drone)
Light: East-northeast, pre-dawn astronomical alpenglow. Hard-edged; the peaks are
       lit by direct sunlight while the valleys and plains remain in night shadow.
       Color temperature: summit ice faces at ~2,900K (vivid orange-gold);
       shadow fill from the clear pre-dawn atmosphere at ~9,500K (deep cold blue-indigo).
       The gradient runs left-to-right across the sky as well — east (right side of
       frame) slightly lighter, approaching astronomical twilight.
Foreground: None — we are above the range. The brown-black Tibetan plateau occupies
            the upper third of frame, featureless in pre-dawn darkness.
Midground: The HKH main range as a sawtooth white spine, glowing orange-gold on
           summit ice faces. Not a smooth ridge — a complex multi-strand system with
           parallel bands (Great Himalaya, Lesser Himalaya) stepping down to the south.
           Individual glaciers invisible at this scale; the overall impression is a
           crumpled edge of white fire.
Background: The Gangetic plain / South Asian lowlands — entirely dark in pre-dawn,
            no detail. The contrast between lit range and dark plain is the compositional
            anchor: white against black, light born above darkness.
Color palette:
  Summit ice (alpenglow):   #D4622A  (deep orange, not saturated — this is a real fire
                                       color, not a gradient preset)
  Transition zone on peaks: #B09070  (warm taupe where shadow and light meet on
                                       rock faces)
  Pre-dawn sky zenith:      #0D1B3E  (deep navy-indigo — the true Himalayan pre-dawn
                                       sky, not black, but close)
  Shadow fill on valleys:   #1A2744  (cold blue-indigo; the sky is the fill light)
  Tibetan plateau (north):  #1C1610  (dark brown-black, pre-dawn, no detail)
  Gangetic plain (south):   #0A0A0A  (effectively black)
What this shot reveals: The scale of the HKH system as a single geological event —
                        a range so high that it catches the sun before the ground below
                        wakes. No text. No name. Just the thing itself.
Transition in: Fade from black (2-frame fade, barely perceptible — not a slow dissolve,
               a flick open)
Transition out: Hold — Shot 02 begins as the first barely-perceptible lateral drift
                replaces the static, so the cut feels like the mountain deciding to
                move rather than the camera deciding to pan.
Data overlay: None. No title, no text, no graphic of any kind for the full 7 seconds.
              The chapter title "Chapter 0 / The Water That Was Ice" may appear at
              f190–f210 (last 0.67s of this shot) as a quiet 12pt typographic fade-in
              in #E8E4DC (warm off-white) bottom-left corner, opacity 0→40% only —
              not full white, a suggestion. This is the one concession to navigation
              need; if the UX can defer the title to f211, defer it.
Director note reference: Section 4 (The Glory Moment); Section 7 pacing — "camera
                         does not move for the first twenty seconds [scaled to 7s here]."
                         Section 5 items 1 and 8 (no lake before range; no title on
                         glory shot — if title is deferred, this constraint is met).
Cinematographer note: At Blender this is a sun lamp set at solar elevation ~-3°
                      (astronomical twilight, sun just below geometric horizon at
                      the latitude of the peaks). Sun azimuth ~080° (east-northeast,
                      slightly north of due east for pre-dawn geometry at 30°N in
                      October). Angular diameter 0.53° for razor shadow edges.
                      Sky shader: use Nishita sky model, altitude 200,000m, air
                      density 0.0 (vacuum-adjacent — we are in near-orbit), ozone
                      density low. The deep navy zenith comes from this, not from
                      a manual sky color. DO NOT use a stock HDRI — the Nishita
                      model at this altitude produces the specific cobalt-to-black
                      gradient the Research Brief calls "Himalayan blue."
                      Terrain mesh should be the SRTM/CopDEM 90m global DEM at
                      this zoom; individual glacier textures are not required — the
                      ice reads as white-orange from reflected summit light at this
                      scale. Critical: the Tibetan plateau must read as DARKER than
                      the range — invert your instinct to make terrain readable.
```

---

### SHOT 02 — Karakoram Vigour: The Western Arc

```
Duration: 2.5s (frames 211–285 @ 30fps)
Type: Aerial tracking
Camera position: Above the central Karakoram, approximately 76°E, 36°N,
                 altitude ~80 km. Camera oriented south-southwest, looking across
                 the Baltoro/Biafo glacier system.
Camera movement: Slow lateral drift eastward (right to left in frame, since east
                 is left-of-center in the arc orientation). The drift is so slow it
                 reads as the world breathing rather than a camera move. Drift speed
                 ~40 km per second of screen time at this altitude — the equivalent
                 of a walking pace relative to the full HKH scale.
Focal length: Equivalent 300mm on full-frame (telephoto compression flattens the
              range into a wall of white serrations).
Altitude: ~80 km AGL (well above atmosphere for visual purposes, but lower than
          Shot 01 — we are descending toward the range)
Light: Pre-dawn transitioning to first light. Sun now just above horizon to the
       east. Summit ice faces on Karakoram peaks (K2, Broad Peak, Gasherbrum
       group — not named on screen) burning white-gold. Shadow fill still cold blue.
       Color temperature: lit faces ~3,800K; shadows ~8,500K.
Foreground: Nothing — open air above the plateau.
Midground: The Karakoram chain as an east-west white wall. Key visual fact: the
           glaciers here are CLEAN — brilliant white-blue, minimal debris cover.
           Long valley glaciers (Baltoro, Biafo) are legible from this altitude
           as white rivers flowing between dark rock walls. The ice has a blue-white
           quality distinct from the orange-gold alpenglow at the very tips.
Background: The Hindu Kush ranges fading west in haze; Tibetan plateau to north.
Color palette:
  Karakoram glacier ice:  #C8D8E0  (blue-white, cold, clean)
  Summit lit faces:       #D4A060  (gold-orange, less saturated than Shot 01 —
                                     sun is higher, color temperature rising)
  Rock walls:             #3A3028  (dark grey-brown, heavily shadowed)
  Sky at this altitude:   #0E2040  (still deep navy, slightly lighter than zenith
                                     of Shot 01)
What this shot reveals: The Karakoram's characteristic clean white ice — establishing
                        the western baseline before the character change into Nepal.
Transition in: Cut from Shot 01 (the first movement after 7 seconds of stillness
               — the cut IS the movement beginning; the drift starts on the first
               frame of Shot 02)
Transition out: Cut to Shot 03
Data overlay: None
Director note reference: Beat 1 — "We cross the Karakoram (brilliant white, clean
                         glaciers, the anomalous zone where some glaciers are advancing)."
Cinematographer note: The Karakoram Anomaly (some glaciers advancing) is a visual
                      fact here — show the glaciers as full and white, not retreating.
                      Do NOT add calving or collapse visual cues here. The contrast
                      with the Nepal grey glaciers in Shot 03 is the point; if both
                      look the same, the contrast is lost. Blender flag: glacier
                      geometry here should be rendered as predominantly white-blue
                      surface material (low debris_mask value); save the grey debris
                      shader for Shots 03, 07, 08.
```

---

### SHOT 03 — The Grey River: Arc-to-Nepal Transition

```
Duration: 2.5s (frames 286–360 @ 30fps)
Type: Aerial tracking (continuing eastward drift, altitude dropping)
Camera position: Above central Nepal Himalaya, approximately 84°E, 28.5°N,
                 altitude ~30 km. Transition from the high satellite perspective
                 of Shots 01–02 down to an altitude where individual glacier
                 tongues are legible. Camera oriented north-northeast, looking
                 down at the debris-covered glacier tongues of the Nepal Himalaya.
Camera movement: Slow push toward (altitude decreasing, ~30 km to ~15 km AGL
                 over 2.5s) combined with continued eastward lateral drift. The
                 push is gentle — "the feeling of a long lens slowly resolving a
                 distant subject" (Director Brief, Section 7).
Focal length: 200mm equivalent (we are descending and compressing)
Altitude: ~30 km descending to ~15 km AGL
Light: Early direct sunlight, sun at ~10° elevation. Hard shadows. East-facing
       ice cliff exposures lit gold-orange; north and west faces still in cold blue
       shadow. Color temperature: direct sunlight ~4,500K (still warm morning, not
       yet neutral day); sky fill ~7,000K (cold).
Foreground: The top surface of the Nepal Himalaya main range ridge — rock and snow.
Midground: THE KEY VISUAL FACT OF THIS SHOT: the debris-covered glacier tongues
           descending southward from the Nepal main range. These are GREY-BROWN.
           Not white. They look like rivers of rock and gravel flowing between valley
           walls. This is the visual disruption of expectation set up by Shot 02.
           The sudden grey is the chapter's first factual challenge to the viewer's
           mental image of what a glacier looks like. Supraglacial ponds — vivid
           turquoise-grey-green spots — are scattered across the debris surface.
Background: The green-brown Gangetic foothills and plains appearing at the bottom
            of frame as altitude drops, showing the south face of the range.
Color palette:
  Debris-covered glacier surface:  #7A6E60  (grey-brown — the dominant tone,
                                              not scenic, not pretty)
  Supraglacial ponds:              #7EC8C0  (muted turquoise-grey, smaller and
                                              murkier than Imja)
  Ice cliff exposures:             #B8D4DC  (blue-white, brief flashes at lateral
                                              margins only)
  Rock walls:                      #4A4238  (dark grey-brown)
  Nepal plains (distant):          #6B7840  (olive-green, out of focus)
What this shot reveals: The grey reality of debris-covered glaciers — the visual
                        correction to the white-ice assumption, delivered before any
                        narration explains it.
Transition in: Cut from Shot 02
Transition out: Cut to Shot 04
Data overlay: None
Director note reference: Beat 1 — "The lower glacier tongues go grey-brown,
                         debris-covered... This visual fact — the grey glacier —
                         is the chapter's first gentle challenge to assumption."
Cinematographer note: This shot does the work the Director describes as "the first
                      gentle challenge to assumption." The grey must land. If the
                      debris-covered surface is too similar in tone to the rock walls
                      and valley floor, the grey reads as generic mountain terrain
                      and the challenge is lost. Distinguish the glacier from the
                      valley walls by the flow lines: supraglacial debris has lateral
                      moraines that are sharply defined, the glacier surface has
                      subtle longitudinal banding from differential flow, and the
                      supraglacial ponds are scattered specifically on the glacier
                      surface, not the valley walls. Blender flag: use a separate
                      glacier_debris material (grey-brown, rough, with scattered
                      pond cutouts) so the TD can distinguish glacier from adjacent
                      valley floor terrain.
```

---

### SHOT 04 — Langtang / Yala Glacier: The Clean Reference

```
Duration: 1.0s (frames 361–390 @ 30fps)
Type: Static wide / medium aerial
Camera position: 28°14'N, 85°37'E — directly above Yala Glacier, Langtang valley.
                 Altitude ~2 km AGL, looking slightly southwest toward the glacier
                 on its plateau shelf. Kyanjin Gompa is visible in the valley below.
Camera movement: Static — cut in, cut out. No movement within this 1-second flash.
Focal length: 85mm equivalent (medium-wide, enough to show glacier in its plateau
              context without losing the surrounding terrain character)
Altitude: ~2,000 m AGL
Light: Early morning, sun from east at ~15° elevation. Side light raking across
       the ice surface revealing texture. Hard shadows from the bergschrund crevasse.
       Color temperature: ~4,800K direct; ~7,500K sky fill. Shadow edges razor-sharp.
Foreground: The moraine/debris immediately downvalley of the glacier terminus —
            bare grey rock and gravel, the recently deglaciated proglacial zone.
Midground: Yala Glacier — the EXCEPTION to the grey rule. Debris-free blue-grey
           ice, the full ablation surface visible, surface texture showing cryoconite
           holes as scattered dark specks. A clear bergschrund at the upper margin.
           Area ~1.3 km² — small enough to see the whole glacier in frame. The
           plateau setting makes it read as a white table sitting in a rocky bowl.
Background: The enclosing ridges of the Langtang valley; distant hints of the
            Tibetan border peaks.
Color palette:
  Yala Glacier ice (ablation zone):  #A8C0C8  (blue-grey, exposed ice — notably
                                                 LIGHTER and more distinctly icy
                                                 than the grey-brown of Shot 03)
  Bergschrund shadow:                #2A4050  (deep blue-black crevasse shadow)
  Proglacial bare rock:              #7A7060  (pale grey, freshly exposed bedrock)
  Sky:                               #1A3560  (Himalayan blue, ~6,200K equivalent
                                               at 5,100m altitude — noticeably
                                               deeper than sea-level blue)
What this shot reveals: Langtang's Yala Glacier as the clean debris-free counterpoint
                        to the grey Nepal glaciers — its whiteness underscores how
                        unusual it is, reinforcing the grey-as-reality lesson of Shot 03.
Transition in: Cut from Shot 03
Transition out: Cut to Shot 05
Data overlay: None. [Optional micro-label: "LANGTANG" in 9pt #E8E4DC, top-left,
              appears at f375 only if the UX requires region identification.
              Not a narration element — purely cartographic wayfinding.]
Director note reference: Beat 1 regional visits — "these can be brief (3–5 seconds
                         each) but must be visually distinct from each other."
                         [At 30s total runtime, 1s is the compressed equivalent.]
Cinematographer note: At 1 second (30 frames), this shot must make its visual
                      statement on the first frame — no build. The key compositional
                      choice is the proglacial bare rock in the foreground: that newly
                      exposed grey rock is the glacier's retreat scar, and the eye
                      reads it immediately as absence. Blender: Yala uses the clean
                      ice shader (low debris_mask), unlike all other Nepal glaciers
                      in this chapter. The bergschrund must be visible as a dark
                      incised line at the upper margin — if it reads as just a shadow,
                      add a crevasse mesh geometry rather than relying on AO alone.
```

---

### SHOT 05 — Annapurna Sanctuary: The Vertical Wall

```
Duration: 1.0s (frames 391–420 @ 30fps)
Type: Establishing wide / telephoto compress
Camera position: ~28°32'N, 83°58'E — above the Annapurna Sanctuary basin floor,
                 looking north-northwest. Altitude ~1 km above the Sanctuary floor
                 (~5,100 m AGL), so camera is at ~5,100 m absolute and looking up
                 at Annapurna's south face. This is NOT a shot from the ground —
                 it is an aerial position inside the Sanctuary bowl, low enough to
                 show the walls rising vertiginously.
Camera movement: Static
Focal length: 400mm equivalent (telephoto compression stacks the concentric ring
              of peaks — Hiunchuli, Annapurna South, Annapurna I, Gangapurna —
              into a single layered wall, eliminating depth perception)
Altitude: ~1,000 m AGL above Sanctuary basin floor (~5,100 m absolute)
Light: Pre-dawn / first light. The Sanctuary floor is still in complete shadow —
       the ring of peaks above ~6,000 m is catching first direct light, burning
       orange-white. The south face of Annapurna I (8,091 m) at the top of frame
       is the brightest element. Near-continuous spindrift plumes visible off the
       upper ridgelines as thin white streamers.
Foreground: The flat white basin floor of the Sanctuary — snow-covered, featureless
            in pre-dawn shadow. The absence of detail emphasizes the enclosure.
Midground: The concentric ring of peaks rising 3,000–4,000 m above the basin floor.
           The telephoto compression makes them read as a single vertical wall.
Background: The summit of Annapurna I and its south face — a tilted white plane at
            a terrifying angle, lit from below in the first rays. Spindrift from
            the ridge reads as white calligraphy on deep blue sky.
Color palette:
  Annapurna summit face (lit):    #D4B080  (orange-warm gold, first light)
  Mid-height peaks (semi-lit):    #8090A0  (grey-blue, still in shadow transition)
  Sanctuary basin floor:          #1C2030  (deep blue-grey, pre-dawn shadow)
  Sky above summits:              #0C1828  (near-black Himalayan pre-dawn blue)
  Spindrift plumes:               #E0E8F0  (near-white, back-lit by sky)
What this shot reveals: Annapurna's vertiginous scale — the sense of enclosure in
                        the Sanctuary, the walls rising impossibly high, the basin
                        floor as the bottom of something rather than the top.
Transition in: Cut from Shot 04
Transition out: Cut to Shot 06
Data overlay: [Optional: "ANNAPURNA" micro-label, identical spec to Shot 04, at f405]
Director note reference: Beat 1 regional visits. Research Brief, Zone 4 — "arguably
                         the most dramatic vertical relief in the range... 3,000 m
                         in roughly 3 km of horizontal distance."
Cinematographer note: The telephoto compression is doing all the work here. Without
                      it, the Sanctuary reads as a wide alpine bowl and the scale is
                      lost. At 400mm, the rings of peaks stack into a wall. If the
                      Blender camera frustum produces unacceptable z-fighting at this
                      focal length (common with DEM terrain at high zoom), switch to
                      a true orthographic projection for this shot only and note it
                      in the render log.
                      IMPORTANT: Do NOT show the south face at close range without
                      showing its angle — the Research Brief describes it as "a white-
                      grey wall at distance" with the distinction between ice and snow
                      lost at the extreme angle. Render at distance where this ambiguity
                      is truthful, not at close range where the detail of seracs would
                      imply a different kind of shot.
```

---

### SHOT 06 — Kangchenjunga / Makalu: The Eastern Extreme

```
Duration: 1.0s (frames 421–450 @ 30fps)
Type: Static wide / medium aerial
Camera position: ~27°50'N, 88°00'E — northwest approach to Kangchenjunga,
                 altitude ~8 km AGL looking east-southeast. Kangchenjunga's
                 northwest face fills the right half of frame; Makalu and its
                 Barun valley occupy the left-middle.
Camera movement: Static
Focal length: 200mm equivalent
Altitude: ~8,000 m AGL
Light: Post-dawn, sun at ~25° elevation from the east. The upper faces of
       Kangchenjunga are in full direct morning light — more neutral (5,200K) than
       the deep alpenglow of earlier shots. The fresh post-monsoon snow on upper
       faces makes them white-bright. Forest at base (~3,000 m) has autumn colour
       — bronze and gold of rhododendron and birch below the glacier line.
Foreground: The Makalu-Barun valley — forest canopy with autumn bronze and gold,
            distinctly different from any other shot. This is the visual identifier
            for this region: vegetation close to glacier, the biodiversity-glacier
            contrast described in the Research Brief.
Midground: Makalu (left) and Kangchenjunga (right) rising from forest to glacier.
           Upper glacier faces are freshly snow-covered (post-monsoon) — more white
           than grey here, consistent with Research Brief note on post-monsoon snowfall.
Background: The eastern sky, slightly lighter than in earlier shots — we have moved
            east into more advanced morning.
Color palette:
  Forest (autumn, 3,000m):     #8B6040  (bronze-brown, autumn rhododendron)
  Glacier face (post-monsoon): #D0D8E0  (white-grey, fresh snow over ice)
  Rock buttresses:             #5A5048  (grey-brown mountain rock)
  Sky:                         #1A3060  (Himalayan blue, mid-morning, ~6,400K)
  Lower valley forest:         #5A7040  (dark conifer green)
What this shot reveals: The eastern extreme of Nepal's glacial zone — the forest-to-
                        glacier transition sharper here than anywhere else in the HKH,
                        and the range system read as complete: we have traversed it.
Transition in: Cut from Shot 05
Transition out: Cut to Shot 07
Data overlay: [Optional: "KANGCHENJUNGA / MAKALU" micro-label at f435]
Director note reference: Beat 1 regional visits — "must be visually distinct from
                         each other, not interchangeable." The forest foreground and
                         autumn colour make this unambiguous.
Cinematographer note: The critical differentiator from Shots 04 and 05 is the
                      VEGETATION. No other shot in this chapter shows a forested
                      foreground — use it. The Research Brief is specific: "the
                      visual contrast between dense subtropical forest below and
                      clean glacier above is sharper here than anywhere else in
                      Nepal." Bronze autumn foliage at ~3,000 m against white
                      glacier at 5,000 m is the composition. Blender: use a
                      procedural forest shader below ~3,800 m in this shot only;
                      the treeline constraint applies — no forest above 3,800 m.
                      Check this rigorously: if trees appear above this elevation
                      in the render, it is a fabrication error (Research Brief,
                      Section 5, item 8).
```

---

## Beat 2 — The Turn (0:15 – 0:27.5 / f451–f825)

---

### SHOT 07 — Khumbu Icefall: The Known Image

```
Duration: 2.0s (frames 451–510 @ 30fps)
Type: Static wide / telephoto compress
Camera position: ~27°58'N, 86°51'E — above the Western Cwm lateral moraine /
                 Base Camp puja flat, altitude ~500 m AGL (~5,865 m absolute),
                 looking south-southeast at the Khumbu Icefall. The icefall rises
                 in the middle distance; Lhotse face fills the upper background.
Camera movement: Static
Focal length: 300mm equivalent (telephoto compresses the icefall seracs into a
              dense wall; removes the foreground-to-icefall depth that would make
              the scale readable — the ambiguity of scale is the point until a
              human figure reads the serac height)
Altitude: ~500 m AGL
Light: Early morning, sun at ~18° elevation from the east, striking the icefall
       face-on (icefall faces roughly south-southeast). Strong direct light on the
       west-facing serac faces; hard shadow on the east sides producing blue-indigo
       crevasse interiors. Color temperature: lit faces ~4,500K; shadow interiors
       ~8,000K (sky fill through clear high-altitude atmosphere).
Foreground: The flat moraine of Base Camp — grey silt, some scattered prayer flags
            (limp, faded, cotton — not crisp), the smudged dark of yak dung smoke
            residue on tent platforms. No tents in the shot (removes expedition-
            specific connotation; this is the place, not a particular expedition).
Midground: The Khumbu Icefall — seracs of white-blue ice the size of apartment
           buildings, jumbled and tilted. Deep blue-indigo crevasse shadows between
           seracs. This is the visual that viewers know: if the Research Brief's
           "classic Himalayan glacier look" has a location, this is it. The icefall
           is the small fraction of the Khumbu that looks like the glacier of
           imagination. Let the viewer have this moment of recognition.
Background: The Lhotse face — a tilted plane of blue-grey ice and rock bands rising
            to the top of frame. The Yellow Band (Ordovician limestone) at ~8,600 m
            on Everest's southwest face, barely visible at upper right, lit warm.
Color palette:
  Serac lit faces:         #D8E4EA  (white-blue, cold direct light — NOT warm white)
  Crevasse interiors:      #2A4A60  (deep blue-indigo, very deep shadow)
  Lhotse face ice:         #8AAAC0  (grey-blue ice at distance)
  Rock bands (Lhotse):     #4A4040  (dark grey-brown)
  Base Camp moraine:       #6A6058  (grey silt — same grey-brown palette as Shot 03,
                                      reinforcing the grey reality)
  Yellow Band (far upper): #B09060  (warm limestone, barely visible)
What this shot reveals: The familiar "classic glacier" image — earned recognition —
                        before the pivot to the grey debris reality of the Khumbu's
                        lower glacier and to Imja.
Transition in: Cut from Shot 06
Transition out: Cut to Shot 08
Data overlay: None
Director note reference: Beat 2 — "The Khumbu Icefall appears... the image the
                         viewer knows from a hundred Everest photographs. We let
                         them have one moment of recognition."
Cinematographer note: The Research Brief, Shot 2 description, mentions a human figure
                      (climber with headlamp) as a scale reference. The Director Brief
                      (Baraka/Samsara reference) would strip this out. In a 30-second
                      cinematic, the headlamp figure is the more powerful choice — it
                      appears for only 2 seconds and needs no explanation, but it
                      makes the scale legible in a way that no text could. Recommendation:
                      include a single headlamp point-light at mid-icefall, ~8 pixels
                      in diameter, moving imperceptibly upward. Do not highlight it.
                      If the Director's Baraka-mode instinct wins and the figure is
                      removed, note that scale reading will be ambiguous and the TD
                      should increase serac count to compensate.
```

---

### SHOT 08 — Imja Descent: The Approach

```
Duration: 2.5s (frames 511–585 @ 30fps)
Type: Aerial tracking / slow descent
Camera position: Beginning at ~27°56'N, 86°52'E, altitude ~3,000 m AGL (~8,000 m
                 absolute), looking east-northeast. The Imja valley is below; the
                 debris-covered tongue of Imja Glacier is visible as a grey corridor
                 below the camera. Over 2.5s the camera descends from ~3,000 m AGL
                 to ~800 m AGL above the lake surface, resolving the distant grey
                 into the specific texture of Imja's terrain.
Camera movement: Slow push toward — altitude dropping, slight forward drift east.
                 "The approach takes twelve to fifteen seconds from first sight of
                 the lake" (Director Brief, Section 7 — scaled to 2.5s here).
                 The lake is NOT visible for the first 1.5s of this shot — it is
                 below the moraine crest. The viewer sees only the debris-covered
                 glacier tongue and the containing valley walls.
Focal length: 200mm equivalent at start, pulling to 85mm as altitude drops (zoom-
              out as we approach, maintaining the subject scale while revealing
              more context — the standard nature-documentary "push on long lens"
              move).
Altitude: ~3,000 m AGL descending to ~800 m AGL
Light: Late morning, sun at ~45° elevation from south-southeast. The lake basin
       is oriented east-west; south-facing valley walls are lit, north-facing walls
       in shadow. The moraine dam at the western end of the basin is catching direct
       sun — its loose rock surfaces have multiple exposure angles, reading as a
       complex textured ridge rather than a wall.
Foreground: The debris-covered surface of Imja Glacier's lower tongue — grey-brown,
            rocky, supraglacial ponds visible as milky green-grey spots.
Midground: The valley walls of the Imja Khola — dark quartzite and schist, steeply
           incised. The moraine dam crest at the west end of the lake basin becomes
           visible in the final second of this shot as the camera clears its height.
Background: The upper peaks of the Island Peak (Imja Tse, 6,189 m) to the south
            and Baruntse (7,129 m) to the northeast — framing the basin.
Color palette:
  Imja Glacier debris:      #7A6E62  (grey-brown — consistent with Shot 03)
  Supraglacial ponds:       #6ABCB4  (murky turquoise, darker than the lake)
  Valley rock walls:        #3C3830  (very dark grey-brown, heavily shadowed on
                                       north-facing sides)
  Moraine dam crest:        #8A8070  (lighter grey, angular loose rock, direct sun)
  Sky:                      #1C3A68  (deep Himalayan blue, ~6,200K, mid-morning)
What this shot reveals: The journey into the lake basin — the viewer is drawn in,
                        altitude and distance resolving from abstract to specific.
                        The grey debris prepares for the colour shock of the lake.
Transition in: Cut from Shot 07
Transition out: Cut to Shot 09 (the cut is the moment the moraine crest clears
               and the lake becomes fully visible — the cut is the reveal)
Data overlay: None
Director note reference: Beat 2 — "we move east past Everest, past Lhotse, following
                         the Imja Khola upstream." Section 7 — "The approach takes
                         twelve to fifteen seconds from first sight of the lake to
                         its full reveal" (scaled to 2.5s in this compressed version).
Cinematographer note: The decision NOT to show the lake in this shot is critical.
                      The reveal is Shot 09. This shot is the approach — the grey,
                      the rock, the valley constriction — so that the colour hit
                      of Shot 09 has nowhere to prepare. If the lake is glimpsed
                      at the bottom of frame in the final frames of Shot 08,
                      cut earlier or adjust the descent trajectory to keep it
                      hidden behind the moraine crest. The moraine dam geometry
                      must be tall enough to screen the lake until the camera
                      clears it — approximately 40–50 m above valley floor
                      (Research Brief, Section 2: "approximately 40–50 m above
                      the Imja Khola valley floor below").
```

---

### SHOT 09 — Imja Tsho: The Reveal

```
Duration: 2.0s (frames 586–645 @ 30fps)
Type: Static wide
Camera position: ~27°53'55"N, 86°55'20"E — above the lake center, altitude ~300 m
                 AGL (~5,310 m absolute). Camera looking west-northwest across the
                 full length of the lake, with the calving front (ice cliff) of
                 Imja Glacier at the far right (east) end. The moraine dam and
                 outlet gap are visible at the far left (west) end.
Camera movement: Static for the full 2.0s. "A three-second hold on the milky
                 turquoise surface before any graphic appears" (Director Brief,
                 Section 7 — compressed to 2.0s here).
Focal length: 50mm equivalent (close to normal lens — this is what the eye would
              see, no compression or distortion, the lake's actual proportions)
Altitude: ~300 m AGL
Light: Late morning, sun at ~50° elevation from south. The lake surface has
       specular component — the afternoon valley winds have not yet built (those
       come after noon), so the surface is nearly flat, with faint capillary ripples
       (~2 cm wavelength) catching the light as a scattered specular texture rather
       than discrete waves. The color is generated by the water column, not
       reflections — the milky turquoise is present even in the shadowed portions
       of the lake near the north shore.
Foreground: The southern moraine shore — bare angular rock and gravel, patches of
            wind-blown snow on the north-facing faces of larger boulders. Absolute
            absence of vegetation. The bareness is information.
Midground: Imja Tsho in full. THE COLOR IS THE SHOT.
           Milky turquoise — the opacity of glacial flour in colloidal suspension.
           NOT clear. NOT dark blue. NOT a mountain tarn. The water is visibly
           turbid — you cannot see the bottom in any part of the lake.
           At the east end: the calving ice cliff — 10–15 m above waterline,
           grey-brown at base (debris bands), transitioning to blue-white at fresh
           ice exposures. The cliff is mirrored faintly on the lake surface.
           At the west end: the moraine dam crest, and through the outlet gap,
           the first 50 m of Imja Khola — milky grey water, rushing.
Background: The containing valley walls — steep quartzite schist, dark grey.
            Island Peak (Imja Tse) partially visible to the south.
Color palette:
  Imja Tsho body:                 #78C8C0  (milky turquoise — THIS IS THE HEX.
                                             This must match this exact value ± 5
                                             units in any component. It is milky —
                                             add a SSS scatter or opacity layer to
                                             desaturate toward white slightly at
                                             shallow depths.)
  Imja Tsho near-shore (shallow): #94D4CC  (slightly lighter, more milky where
                                             the turbid plume enters from the calving)
  Ice cliff face (blue-white):    #B4D0DC  (cold, not electric — subtle internal
                                             blue, not neon)
  Ice cliff base (debris band):   #7A7060  (grey-brown, compressed moraine)
  Moraine shore:                  #6A6258  (angular grey-brown rock)
  Sky:                            #1A3C6A  (deep Himalayan blue, ~6,200K)
What this shot reveals: The colour anomaly — the milky turquoise of Imja Tsho that
                        no stock glacier image has prepared the viewer for. This
                        colour is the chapter's non-negotiable visual anchor.
Transition in: Cut from Shot 08 (this cut IS the reveal — the camera has just
               cleared the moraine crest and the lake floods the frame)
Transition out: Dissolve to Shot 10 (3-frame dissolve — barely a dissolve, more
               a soft cut, preserving the lake color as the overlay arrives)
Data overlay: None in this shot. The 3-second hold is image only.
Director note reference: Beat 2 — "And then the lake. Imja Tsho. The turn is the
                         colour." Section 7 — "A beat of stillness on the lake
                         surface... A three-second hold on the milky turquoise
                         surface before any graphic appears." Section 5 item 6:
                         "Milky turquoise. Get it wrong and the chapter loses its
                         only non-replicable visual anchor."
Cinematographer note: Everything else in this chapter is in service of this shot.
                      The hex #78C8C0 is a spec, not a suggestion. Test it against
                      the Research Brief's physics description: glacial flour (2–65
                      micron particles) in colloidal suspension producing Tyndall
                      scattering. In Blender, the water shader should use volumetric
                      scatter with a scattering coefficient biased toward short
                      wavelengths (blue-green), combined with absorption that removes
                      red/orange. Particle density parameter: increase by ~40% from
                      clear alpine water baseline to simulate suspended flour at
                      October turbidity levels (intermediate melt season). Do NOT
                      use a flat texture map for the lake color — the volumetric
                      approach gives the milky opacity at shallow depths and deeper
                      saturation in the lake center. If render time prohibits full
                      volumetric, use a depth-blended mix between surface color
                      #78C8C0 (shallow) and #4AACAA (deep center), with opacity
                      capped at 0.85 (never fully transparent — there is no lake
                      bottom visible at any depth in this lake).
```

---

### SHOT 10 — 1962 Overlay: The Dissolve

```
Duration: 2.5s (frames 646–720 @ 30fps)
Type: Composite / data — same camera position as Shot 09
Camera position: Identical to Shot 09: ~27°53'55"N, 86°55'20"E, ~300 m AGL.
Camera movement: Static
Focal length: 50mm equivalent (identical to Shot 09)
Altitude: ~300 m AGL
Light: Identical to Shot 09
Foreground/Midground/Background: Identical to Shot 09 — the full lake in milky
                                  turquoise. This is a continuous visual with the
                                  previous shot; the lake has not changed. What
                                  changes is the overlay.
Color palette: Identical to Shot 09. The data overlay colors:
  1962 pond outlines:   #F5E090  (warm amber, the color of old Landsat/Corona
                                    imagery — deliberate historical tone, NOT
                                    clinical white)
  1962 year label:      #F5E090  (same; 14pt, weight 300, set in the atlas
                                    typographic system — restrained, bottom-center)
  2020 area boundary:   None added — the lake itself IS the 2020 state.
                        The 1962 boundary makes the absence speak.
What this shot reveals: Sixty years of lake growth made visual — the 1962 state
                        as scattered small pond outlines across what is now a
                        single lake, the absence and presence speaking without
                        narration.
Data overlay:
  TIMING:
  - f646–f660 (0.5s): overlay fades in from 0% to 60% opacity. The year "1962"
    appears in bottom-center in the atlas type system, fading in simultaneously.
  - f661–f690 (1.0s): overlay holds at 60% opacity. The 1962 pond outlines sit
    ghosted over the modern lake — translucent amber lines showing where the
    meltwater pools were. Below the "1962" label: "cluster of meltwater pools,
    ~0.03 km²" in 9pt weight 300 (a whisper, not a declaration).
  - f691–f705 (0.5s): the "1962" label and pond outlines dissolve out; "2020"
    appears (same position, same type, same amber color) with "~1.56 km²" below.
    The lake itself is unchanged — the 2020 state needs no outline, it IS the frame.
  - f706–f720 (0.5s): "2020 / ~1.56 km²" fades out. Frame returns to clean lake.
  SPECIFICATION: The 1962 pond outlines are drawn from the Research Brief's
  description — "a cluster of small meltwater pools on the glacier surface."
  They are scattered across approximately the eastern two-thirds of the current
  lake area, concentrated toward the calving face. They are irregular polygons,
  not circles. They are small — the largest would be ~200m across in 1962.
Transition in: Dissolve from Shot 09 (3-frame dissolve — see Shot 09 notes)
Transition out: Cut to Shot 11
Director note reference: Beat 2 — "A translucent overlay appears showing Imja
                         Tsho's boundary in 1962. It is a cluster of small
                         meltwater pools." Section 7 — "data should enter on a
                         three-second fade and stay no longer than six seconds."
                         Section 5 item 3: "No year labels, no area figures, no
                         population numbers before the emotional ground is
                         established."
Cinematographer note: The Director Brief is explicit — "Their arithmetic will be
                      more powerful than ours." Resist the urge to add growth
                      rate text, percentage increase, or any additional annotation.
                      The two numbers (0.03 km² in 1962, 1.56 km² in 2020) plus
                      the visual of scattered ponds vs. a full lake are sufficient.
                      The Research Brief warns against saying "it grew X-fold
                      without specifying the baseline year" — do not add a ratio
                      or multiplier. Just the two measurements.
                      Do NOT add sound design cues on the data appearance — this
                      is an image event, not an infographic event.
```

---

### SHOT 11 — Calving Front: The Lateral Track

```
Duration: 2.0s (frames 721–780 @ 30fps)
Type: Static wide / close-medium
Camera position: ~27°54'N, 86°56'E — at the eastern end of Imja Tsho, the calving
                 front. Camera is at lake level, ~20 m above the water surface
                 (~5,030 m absolute), looking west-northwest along the ice cliff
                 face. The ice cliff is at approximately 90° to the camera axis —
                 we are looking along the face laterally, not at the face head-on.
Camera movement: Slow lateral drift from east to west along the calving face.
                 Drift speed: ~8 m/s screen equivalent — slow enough to read the
                 debris bands in the ice over 2.0s but covering approximately half
                 the calving front width (~200 m). "A very slow lateral track along
                 the ice cliff face, lasting five to seven seconds" (Director Brief —
                 compressed to 2.0s here).
Focal length: 85mm equivalent (medium lens — shows the ice face in detail while
              maintaining enough context to see the waterline relationship)
Altitude: ~20 m AGL above lake surface
Light: Late morning / noon, sun high and slightly south. The ice cliff face,
       oriented roughly north (facing the lake), receives indirect diffuse light
       from sky fill rather than direct sun — this is correct and desirable: diffuse
       light reveals the debris banding and ice colour without harsh specular
       glare on the wet ice surface. Color temperature: ~7,000K (sky fill dominant).
Foreground: The lake surface — milky turquoise, close and immediate. The camera is
            low, almost at water level. Small capillary waves (~2 cm amplitude)
            catching diffuse light. The water is opaque — no lake bottom visible.
Midground: The calving ice cliff: 10–15 m above waterline. The cliff shows
           horizontal debris bands — compressed moraine material sandwiched in
           the ice, grey-brown stripes running through the blue-white ice body.
           These bands are the ice's biography: decades of surface debris getting
           buried and transported. At the waterline, a narrow strip of ice-blue
           meltwater — the freshest, coldest water, slightly different in color
           from the turbid lake body (cleaner blue-grey vs. milky turquoise).
Background: The upper glacier surface above the cliff — debris-covered, grey-
            brown, receding into the mountain flanks. Baruntse (7,129 m) partially
            visible above.
Color palette:
  Lake surface (close):           #88D0C8  (milky turquoise, foreground — slightly
                                             lighter than Shot 09 because we are
                                             closer and looking at shallower water)
  Ice cliff (blue-white):         #A8C8D8  (cold blue-white, internal ice colour
                                             — subtle, NOT electric)
  Debris bands in ice:            #6A6050  (grey-brown compressed moraine)
  Waterline meltwater strip:      #90B8C8  (cleaner blue-grey, distinctly different
                                             from the milky lake — the freshest water)
  Glacier surface (above cliff):  #7A7060  (grey-brown debris, consistent palette)
What this shot reveals: The mechanism — where glacier becomes water, the cliff face
                        showing the ice's internal structure, the debris bands
                        telling the story of what surface material gets incorporated
                        into the ice body over time.
Transition in: Cut from Shot 10
Transition out: Cut to Shot 12
Data overlay: None. This is pure image.
Director note reference: Beat 2 — "We close on the calving front." Section 7 —
                         "a very slow lateral track along the ice cliff face."
                         Section 5 item 4: "Make the calving event dramatic [NOT]."
Cinematographer note: The camera height (20 m above lake surface) is the key
                      compositional choice — it puts the viewer nearly at water
                      level, making the lake surface a dominant foreground element
                      and reducing the ice cliff to something approachable rather
                      than dramatic. This is the anti-drama choice. If the camera
                      were at 200 m AGL looking down at the cliff, it would be
                      an aerial spectacle. At 20 m, it is intimate and slightly
                      uncomfortable — you are close to a lot of cold water and
                      unstable ice.
                      Technical flag: do not animate ice cliff cracking or movement
                      in this shot. The cliff is static. The calving event is Shot 12.
                      Any premature calving animation in this shot telegraphs the
                      event and undermines the "small and ordinary" quality the
                      Director requires.
```

---

### SHOT 12 — The Calving Event: Pedestrian and Quiet

```
Duration: 1.5s (frames 781–825 @ 30fps)
Type: Close-up / insert
Camera position: Same lateral position as Shot 11 — ~27°54'N, 86°56'E, 20 m above
                 the lake surface. Camera has drifted ~100 m west along the calving
                 front during Shot 11 and is now positioned perpendicular to the
                 ice face, looking directly at a 3–4 m section of the cliff face
                 at the waterline.
Camera movement: Static — Cut in static, the event happens in frame, no camera
                 response to the event. The camera does not pan to follow the
                 falling ice. The camera does not push in. The camera watches.
Focal length: 135mm equivalent (slightly telephoto — isolates this section of the
              cliff face and compresses the foreground water surface into a tight
              layer below the ice)
Altitude: ~20 m AGL
Light: Identical to Shot 11 — diffuse sky fill, ~7,000K, no direct sun on the
       north-facing cliff.
Foreground: The lake surface, milky turquoise, occupying the bottom quarter of
            frame.
Midground: A 3–4 m section of ice cliff face. At f801 (~0.67s into this shot),
           a block of ice — approximately 2 m × 1.5 m × 0.8 m (within the 2–5
           cubic metre Research Brief specification) — shears at a horizontal
           debris band line and pivots outward into the lake. It does not explode.
           It does not crash. It pivots slowly at first (rotational momentum from
           the shear), then accelerates as gravity takes it over the waterline and
           it falls ~1.5 m into the lake.
           On entry: a small splash — the water opens, then closes. A wave
           propagates outward from the impact point, ~10–15 cm amplitude (Research
           Brief: "small waves that ripple across the milky turquoise surface").
           The block is briefly visible below the milky water surface as a pale
           shape, then the turbidity obscures it within ~1 second.
Background: The upper glacier debris surface, unchanged.
Color palette:
  Lake surface (disturbed):  #78C8C0  (identical to Shot 09 — the wave does not
                                         change the color, only the surface texture)
  Calved ice block:          #C0D4DC  (lighter blue-white than the cliff face —
                                         fresh break exposes interior ice)
  Splash/foam:               #E8F0F4  (very pale, almost white — the one moment
                                         of light in this shot, brief)
  Wave propagation:          The color is unchanged; the wave is a texture
                              deformation, not a color event.
What this shot reveals: The mechanism of lake growth — small, quiet, unhurried.
                        Two cubic metres of ice becomes lake water. This happens
                        every day. The pedestrian scale is the point.
Transition in: Cut from Shot 11
Transition out: Cut to Shot 13
Data overlay: None. No sound design cue. No emphasis. The event speaks for itself
              at its natural scale, or it says the wrong thing.
Director note reference: Beat 2 — "A block of ice — the Research Brief says
                         '2–5 cubic metre blocks' — shears off the face and falls
                         into the milky water." Section 5 item 4: "If we give this
                         event dramatic sound design... we turn a slow catastrophe
                         into a spectacle." The Director specifically flags underplay
                         as non-negotiable. Section 7 — "Its pedestrian quality is
                         what makes it unsettling."
Cinematographer note: This is the hardest shot in the chapter to execute correctly
                      in Blender. The failure mode is a physically impressive calving
                      animation — the simulation will want to produce dramatic splash,
                      foam, and wave. Constrain the simulation:
                      - Block volume: 2.0–2.5 m³ maximum. Not 5 m³. Use the smaller
                        end of the Research Brief's range.
                      - Fall height: the block shears at the waterline, so the fall
                        is ~1.5 m, not from the top of the cliff.
                      - Wave amplitude: cap at 15 cm. If the simulation produces
                        larger waves, reduce block volume.
                      - Sound design (if present): the event should produce a soft
                        splash followed by the gentle lapping of the outgoing wave.
                        No bass hit, no reverb. Less than a cup of tea spilling.
                      - Camera: does not move. This is the most important constraint.
                        A static camera watching a small calving event with no
                        score and no camera response says: this happens all the time.
                        A camera that pushes in says: this is a moment. It is not.
                        It is Tuesday.
```

---

## Beat 3 — The Witness (0:27.5 – 0:30 / f826–f900)

---

### SHOT 13 — Moraine Dam: Orientation

```
Duration: 1.0s (frames 826–855 @ 30fps)
Type: Aerial wide
Camera position: ~27°53'30"N, 86°54'20"E — above and slightly west of the moraine
                 dam, altitude ~500 m AGL (~5,510 m absolute), looking east-northeast.
                 This is the orientation frame: wide enough to see the full relationship
                 between the lake above and the valley below the dam.
Camera movement: Static
Focal length: 35mm equivalent (wide — shows both the lake and the valley below the
              dam in a single frame)
Altitude: ~500 m AGL
Light: Midday, sun at ~55° from south. The moraine dam receives direct frontal
       light — its full surface texture is visible: angular loose boulders, grey
       silt and gravel between them, irregular slope, no engineered surface of any
       kind. The narrow outlet channel (the 2016 UNDP excavation) is visible as a
       slight incision through the moraine crest — a thin dark line, nothing more.
Foreground: The upper reach of Imja Khola — the braided grey-white meltwater stream
            immediately below the dam, heavily laden with glacial silt. The valley
            here is narrow, steep-sided, V-shaped. No vegetation. Bare rock and
            glacial deposits.
Midground: The moraine dam itself, occupying the center of the frame — a ridge of
           loose angular rock, ~40–50 m above the valley floor. It looks like any
           other moraine. It looks like nothing. There is nothing to distinguish it.
           The outlet channel is barely visible. This is the critical visual fact.
Background: Imja Tsho — the milky turquoise lake, its surface visible above the
            moraine dam crest. The calving face of Imja Glacier at the far eastern
            end. The lake appears to float above the valley.
Color palette:
  Moraine dam:              #7E7668  (loose angular rock — grey-brown-beige,
                                       mixed composition, no uniform color)
  Imja Khola (below dam):   #9ABCB4  (milky grey-white, heavily silted — very
                                       different from the lake color; more opaque,
                                       whiter, faster-moving)
  Lake above (background):  #78C8C0  (maintaining the lake color identity)
  Valley walls:             #3E3830  (dark grey rock)
  Outlet channel:           #5A5448  (slightly darker incision in moraine surface
                                       — the only human modification)
What this shot reveals: The spatial relationship — the lake above, the valley
                        below, and the moraine dam as the only thing between them.
                        The viewer now has the geography of the hazard.
Transition in: Cut from Shot 12
Transition out: Dissolve to Shot 14 (4-frame dissolve — a slow breath)
Data overlay: None. We have already told the viewer what the moraine dam is.
              No text appears in this shot.
Director note reference: Beat 3 — "The moraine dam holds 61.7 million cubic metres
                         of water. It looks like any other pile of rocks."
                         Section 3 Beat 3: the final image sequence.
Cinematographer note: The composition rule for this shot is that the moraine dam
                      must occupy a visually unimpressive center — it should be
                      the least dramatic thing in the frame, with the milky lake
                      above it as the visual magnet. The viewer's eye is drawn to
                      the lake, then reads down to the dam, then reads down to the
                      valley. That reading direction traces the flood path. This is
                      the composition — not the moraine as hero, but the moraine
                      as threshold.
```

---

### SHOT 14 — The Moraine Dam: Final Hold

```
Duration: 1.5s (frames 856–900 @ 30fps)
Type: Static wide (tighter than Shot 13)
Camera position: ~27°53'35"N, 86°54'30"E — closer to the dam, altitude ~200 m
                 AGL (~5,210 m absolute), looking east-northeast. The lake still
                 visible in the upper portion of frame; the dam crest occupies the
                 lower two-thirds. The valley below the dam is cropped out —
                 we are looking at the dam and the lake, nothing else.
Camera movement: Static. Absolutely no movement. No drift, no pull-back.
                 "Completely still for the last five to eight seconds of the chapter.
                 No drift, no pull-back. Just the dam." (Director Brief, Section 7 —
                 compressed to 1.5s here; any runtime recovery should go here first.)
Focal length: 85mm equivalent (normal-to-medium — the dam surface is close enough
              that individual boulder shapes are legible)
Altitude: ~200 m AGL
Light: Midday, sun overhead-south. The moraine surface in direct light. Every boulder
       casts a short hard shadow to the north. The irregular topography of the dam
       surface — loose, unconsolidated, no bedrock anywhere — reads clearly. There
       is a slight subsidence hollow visible in the dam crest where dead ice has
       melted below — a subtle bowl-shaped depression. It is not labelled. It is
       not explained. It is there.
Foreground: The moraine dam crest — irregular, loose, angular boulders up to 1–2 m
            diameter interspersed with grey silt and gravel. Nothing engineered.
            A small patch of late-season snow in a shaded hollow between two
            large boulders. Faded prayer flag string (one end has come loose,
            trailing on the rocks — placed by a trekker at some earlier season).
            These flags are not a composition element — they are incidental
            evidence of human passage.
Midground: The mid-section of the dam ridge — the same loose rock, but the
           subsidence hollow more visible here. The narrow outlet channel cut in
           2016 is barely visible as a slight incision, not a structure.
Background: Imja Tsho — milky turquoise, filling the upper third of frame above
            the dam crest. The lake is still. The calving front is a distant
            grey-brown strip at the far end. The sky above the lake is the
            deep Himalayan blue of mid-morning.
Color palette:
  Moraine dam surface:      #7E7668  (identical to Shot 13)
  Subsidence hollow:        #6A6058  (slightly darker — less direct light)
  Snow patch:               #E0E8F0  (cool white in shadow)
  Prayer flag (faded):      #A87848  (faded orange-red — barely legible as color)
  Lake (background):        #78C8C0  (the color, present to the end)
  Sky:                      #1A3C6A  (deep Himalayan blue)
What this shot reveals: Nothing new. It holds what has already been understood.
                        The viewer sits with the silence of a hazard they cannot
                        hear — a pile of loose rock holding back 61.7 million cubic
                        metres of water, actively degrading, making no sound.
Transition in: Dissolve from Shot 13 (4-frame dissolve)
Transition out: Fade to black (10-frame fade — slow, deliberate. Not a cut.
                The chapter does not end — it subsides.)
Data overlay: None. No text of any kind in the final frame.
              The chapter title card or chapter-end UI element, if required by
              the UX, must appear AFTER the fade to black is complete — not
              over the final image.
Director note reference: Beat 3 — "No text appears in this final frame... The last
                         image must be image, not text." Section 7 — "The final shot
                         of the moraine dam, last five seconds [compressed to 1.5s
                         here; extend if edit allows]. No score, no ambient sound,
                         no motion." Section 5 item 10: "End on an information slide
                         [NOT]."
Cinematographer note: The faded prayer flag is a deliberate addition not in either
                      brief. Justification: the Research Brief documents prayer flags
                      as appearing at passes, stupas, and high points above ~3,000 m —
                      the moraine crest qualifies as a high point. A trekking route
                      runs past Imja Tsho; visitors leave prayer flags. A single
                      faded flag with one end loose is not decoration — it is evidence
                      of human presence, of the 71,752 people the early warning system
                      was built to protect, of the fact that someone stood on this
                      pile of rocks and placed an offering. It does not undermine the
                      "terrifying banality" — it is part of it. A flag placed on a
                      dam that could drown a valley. If the Director judges this
                      addition sentimental, remove it. The composition works without it.
                      
                      SUBSIDENCE HOLLOW: The Research Brief (Section 2) documents
                      InSAR-measured downward displacement of 8.5–9.4 cm/yr from
                      dead ice melting within the dam structure. The subsidence hollow
                      should be visible in the dam geometry — a slight irregular bowl
                      ~5–8 m diameter, ~0.5 m deep. This is scientifically defensible
                      (dead ice melt produces surface subsidence visible in field
                      photographs) and adds nothing dramatic — just a subtle wrongness
                      in the dam surface that a careful viewer will notice. It is not
                      labelled. It does not need to be.
                      
                      SOUND DESIGN for the final shot (if the chapter has ambient
                      audio): the Research Brief Section 7 documents the moraine dam
                      as "silent — a dam holding 61.7 million cubic metres of water
                      makes no sound audible to human perception." The sound design
                      for this shot should therefore be: silence. If the chapter has
                      been carrying ambient Himalayan sound (wind, meltwater), it
                      should be cut at the start of Shot 13 or faded out over Shot 13
                      so that Shot 14 is genuinely silent. The viewer experiences
                      what the Research Brief describes — the silence of the hazard.
```

---

## Shot Summary Table

| # | Name | Frames | Duration | Beat | Camera move | Key constraint |
|---|------|--------|----------|------|-------------|----------------|
| 01 | HKH Dawn: The Glory Moment | f001–f210 | 7.0s | 1 | Static | No text for 7s; title only at f190 if required |
| 02 | Karakoram Vigour | f211–f285 | 2.5s | 1 | Lateral drift east | Glacier WHITE here — Karakoram Anomaly |
| 03 | The Grey River | f286–f360 | 2.5s | 1 | Push toward + drift | Glacier GREY-BROWN here — fabrication check |
| 04 | Langtang / Yala | f361–f390 | 1.0s | 1 | Static | Debris-free; proglacial rock visible |
| 05 | Annapurna Sanctuary | f391–f420 | 1.0s | 1 | Static | Telephoto compression; south-face verticality |
| 06 | Kangchenjunga / Makalu | f421–f450 | 1.0s | 1 | Static | Forest foreground; treeline ≤ 3,800m |
| 07 | Khumbu Icefall | f451–f510 | 2.0s | 2 | Static | Viewer recognition moment; scale ambiguity |
| 08 | Imja Descent | f511–f585 | 2.5s | 2 | Push toward (descend) | Lake hidden until Shot 09 cut |
| 09 | Imja Tsho Reveal | f586–f645 | 2.0s | 2 | Static | Color spec: #78C8C0. Non-negotiable. |
| 10 | 1962 Overlay | f646–f720 | 2.5s | 2 | Static | Two numbers only; no ratio; amber type |
| 11 | Calving Front Lateral | f721–f780 | 2.0s | 2 | Lateral drift west | Camera at water level; no calving in this shot |
| 12 | The Calving Event | f781–f825 | 1.5s | 2 | Static | ≤ 2.5 m³ block; ≤ 15 cm wave; no camera response |
| 13 | Moraine Dam Orientation | f826–f855 | 1.0s | 3 | Static | Dam as unimpressive; lake as visual magnet |
| 14 | Moraine Dam Final Hold | f856–f900 | 1.5s | 3 | Static — absolute | No text; no motion; silence; fade to black |

**Total: 900 frames / 30.0 seconds**

---

## Fabrication checklist (against Research Brief Section 5)

Before rendering any shot in this list, verify:

- [ ] Shot 03, 07, 08, 11, 12: Debris-covered glacier surfaces use grey-brown material (#7A6E60 range), NOT white
- [ ] Shot 09, 10, 11, 12, 13, 14: Imja Tsho color is #78C8C0 milky turquoise, NOT dark blue, NOT clear
- [ ] Shot 04, 06: No tree geometry above 3,800 m in any shot
- [ ] Shot 13, 14: Moraine dam is loose rock — no concrete, no engineered spillway, no retaining wall geometry
- [ ] Shot 12: Calving block volume ≤ 2.5 m³; wave amplitude ≤ 15 cm
- [ ] Shot 01, 02, 03: Sky uses Nishita model or equivalent — gradient zenith-to-horizon, not flat blue
- [ ] Shot 14: Prayer flags (if included) are faded, irregular, cotton-weight — not crisp or freshly-dyed
- [ ] Shot 07: Base Camp structures (if visible) are dry-stone, not wooden chalets
- [ ] All shots: No buildings or architecture above 3,800 m unless specifically flagged

---

## Notes for the Blender TD

1. **Two glacier material presets needed:** `glacier_clean` (Shots 02, 04 — blue-white, low scatter, no debris_mask) and `glacier_debris` (Shots 03, 07, 08, 11, 12 — grey-brown, rough, scattered supraglacial pond cutouts). These are the chapter's visual binary.

2. **Lake water shader** (Shots 09–14): volumetric scatter with short-wavelength bias + absorption removing red/orange. Depth blend between #78C8C0 (surface/shallow) and #4AACAA (>20m depth). Max opacity 0.85 — never fully transparent.

3. **Sky shader:** Nishita sky model throughout. Solar elevation: Shot 01 at -3° (astronomical twilight); Shot 02 at 2° (first light); Shot 03 at 8°; Shots 04–06 at 12–18° (morning); Shots 07–12 at 20–45° (morning to midday); Shots 13–14 at 55° (midday). Altitude input for the sky model: match camera altitude per shot — the sky reads differently at 200 km vs. 2 km AGL.

4. **The calving simulation** (Shot 12): run in a separate Blender scene; composite over the lake render. Use FLIP Fluids or Mantaflow for the water response; constrain wave amplitude. Render at 4× upscale, composite at final res. The goal is a plausible small calving event, not a simulation showcase.

5. **DEM source:** SRTM 90m for HKH-wide shots (Shots 01–03); CopDEM 30m for Nepal regional shots (Shots 04–06); ALOS AW3D30 or equivalent for Khumbu/Imja shots (Shots 07–14). The Imja basin geometry (moraine dam height, lake extent, calving front) should be cross-referenced against the Research Brief coordinates and the 2020 lake polygon approximation.

6. **Camera rigs:** Shots 01–06 use the orthographic/satellite rig. Shots 07–14 use the documentary aerial rig (perspective, focal-length-accurate). Do not mix rigs within a shot.

---

*End of Chapter 0 Shot List*
*Cinematographer sign-off: All shots are filmable in Blender. All coordinates derive from the Research Brief. All constraints derive from the Director Brief. Where the two conflict (e.g., moraine hold time of 5s vs. available runtime of 1.5s), the constraint is noted and the available runtime is given; the moraine sequence should be the first beneficiary of any edit-time recovery.*
