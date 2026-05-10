# 03 — Chapter Storyboards (frame-by-frame)

Every chapter spec includes:

- **Goal**: what the chapter must teach
- **Hero shot**: Blender cinematic specification
- **Camera path**: keyframes
- **Diegetic data** (rendered in 3D scene): what 3D type, signage, markers
- **HTML overlay** (rendered in DOM on top of video): captions, charts, citations chip
- **Provenance layers**: what data sources back this chapter
- **Acceptance criteria**: visual + technical
- **Shareable still**: the moment to use as poster.jpg / OG image

**Cross-cutting rules** (apply to every chapter):

- Resolution: 1280×720 (16:9). Locked.
- Frame rate: 30 fps. Locked.
- Duration: targets 15-30s per chapter. Hard cap 30s.
- Format: AV1 primary (`.webm`), H.264 fallback (`.mp4`), VP9 low-bitrate scrub master (`-scrub.webm`).
- File size cap: 24 MiB per file (Cloudflare Workers static asset limit + safety margin).
- Render samples: Cycles 128 spp + denoise minimum (Codex caveat: 64 spp insufficient for production atmospherics).
- Color grammar: enforce sky `#7DD3FC` for ice, teal `#0E7490` for lakes, etc. (full grammar in WATER_CYCLE_SPEC.md §7).
- No motion blur on scrub masters.
- All seeds fixed (deterministic).

---

## Chapter 0 — The reservoir

**Goal**: in 30s, the user sees the entire HKH range, watches ~9% of its ice dissolve, and understands the scale (516 km³ of water).

### Hero shot specification

- **Duration**: 30s = 900 frames
- **Camera**: oblique aerial flyover, west to east
- **Path**: starts above western Karakoram (~73°E, 36°N, alt 200km), oblique pitch -45°, sweeps east to Hengduan Shan (~98°E, 28°N, alt 200km)
- **Hidden cut**: at ~t=20s, cut from continental view to Khumbu region (one matched-cut transition; cut feels like a smooth zoom)
- **Final 5s**: camera holds on Imja basin; teal lake polygon outline appears as a "ring" around Imja Tsho — this is the teaser for Ch 2

### Frame-by-frame storyboard

| Frame | Time | Visual state | Diegetic data | HTML overlay |
|---|---|---|---|---|
| 0-30 | 0-1s | Static frame: 1990 HKH ice extent, sky-blue volumetric. Mountains in slate `#475569`. Sun low-east. | None yet | Page title fade in: "The reservoir" |
| 30-150 | 1-5s | Camera begins sweep east. Year ticker bottom-left starts at "1990". Ice volume static. | "1990" 3D type embedded near Karakoram peaks | Caption: "9% of all this is gone." (fade in over 1s) |
| 150-450 | 5-15s | Camera continues east. Ice volume DISSOLVES frame-by-frame: 1990→2000→2010→2020 over 10s. Glacier shells visibly thin and retreat. As shells disappear, expose underlying terrain. | Year ticker increments: 1990→1995→2000→2005→2010→2015→2020 | Mass counter ticks down: "0 km³ → 516 km³" lost |
| 450-510 | 15-17s | Hidden cut: camera "dives" into continental view (rapid zoom + pitch change), ending on Khumbu region | None | Citation chip slides in bottom-right: "Sources: ICIMOD 2026 · Farinotti 2019" |
| 510-810 | 17-27s | Khumbu/Imja region in oblique view. Imja Glacier 2020 outline visible. Lake outline pulses faintly. | "Imja Tsho" 3D label hovering near the lake | Final headline: "9% of HKH ice — 516 km³ of water" (large tabular-nums) |
| 810-870 | 27-29s | Lake outline pulses brighter, ring expands then contracts | None | Subtitle: "More than the entire freshwater storage of London for 700 years." (rough scale anchor) |
| 870-900 | 29-30s | Hold final frame | "Continue scrolling →" prompt | None |

### Camera path keyframes (for Blender)

```python
camera_keyframes = [
  # frame, lon, lat, alt_m, pitch_deg, yaw_deg, focal_mm
  (0,    73.0, 36.0, 200_000, -45, 90, 35),
  (450,  98.0, 28.0, 200_000, -45, 90, 35),
  (510,  86.93, 27.95, 8_000, -55, 0, 50),  # hidden cut here
  (810,  86.93, 27.95, 5_000, -60, 0, 70),
  (900,  86.93, 27.90, 5_000, -60, 0, 70),
]
```

### Diegetic data layers

- **Glacier-1990**: ICIMOD 1990 polygons, extruded 100-300m using Farinotti 2019 thickness, sky `#7DD3FC` material with volumetric scattering
- **Glacier-2020**: ICIMOD 2020 polygons, same treatment, used for the dissolve-to state
- **Year ticker**: bpy `Text` object animated via shape keys, position in 3D space near current camera focus, color white `#FFFFFF`
- **Mass counter**: same approach, bottom-left corner of frame in 3D space (anchored to camera-relative position to feel "in the world")
- **Imja ring**: lake outline curve, animated color pulse via material driver

### HTML overlay (rendered in DOM on top of `<video>`)

- **Page title** (top-left, ch0-only): "The reservoir" in serif, large
- **Caption** (left-centered): static text, fades in via CSS transition timed to scroll progress
- **Mass counter** (HTML, bottom-center, top-aligned with the in-3D counter for redundancy): tabular-nums, source-cited
- **Citation chip** (bottom-right, persistent throughout): "Sources: ICIMOD 2026 · Farinotti 2019. Show all →" — clicking opens Provenance Peel
- **Continue prompt** (bottom-center, last 2 seconds only): subtle "↓ Continue" with arrow animation

### Provenance layers (for provenance.json)

```json
{
  "scene_layers": [
    {
      "id": "glacier-1990",
      "type": "polygon-extrusion",
      "source": {
        "dataset": "ICIMOD HKH Glacier Inventory 1990",
        "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
        "doi": "10.26066/rds.1972729",
        "year_keyframe": 1990,
        "n_features": 65188
      },
      "render_geometry_id": "Glacier1990",
      "thickness_model": {
        "method": "Farinotti 2019 consensus estimate",
        "doi": "10.5194/tc-13-665-2019",
        "uncertainty_pct": 25
      },
      "color": "#7DD3FC"
    },
    {
      "id": "glacier-2020",
      "type": "polygon-extrusion",
      "source": {
        "dataset": "ICIMOD HKH Glacier Inventory 2020",
        "url": "https://rds.icimod.org/...",
        "year_keyframe": 2020,
        "n_features": 63761
      },
      "color": "#7DD3FC"
    },
    {
      "id": "imja-ring",
      "type": "polygon-flat",
      "source": {
        "dataset": "ICIMOD Glacial Lake Inventory 2024",
        "url": "https://rds.icimod.org/..."
      },
      "color": "#0E7490"
    }
  ],
  "headline_numbers": [
    {
      "value": "516 km³",
      "label": "water-equivalent ice lost 1990-2020",
      "citation": "doi:icimod-2026-cryosphere-assessment"
    },
    {
      "value": "9%",
      "label": "share of total HKH ice volume lost",
      "citation": "doi:icimod-2026-cryosphere-assessment"
    }
  ]
}
```

### Acceptance criteria

| Test | Pass condition |
|---|---|
| Visual: ice clearly diminishes over the 1990→2020 timeline | Manual review by Mother |
| Visual: hidden cut at t=17s feels like a smooth zoom, not a jarring jump | Manual review |
| Technical: file size < 24 MiB | `stat cinematic.webm` |
| Technical: provenance.json validates against schema | `tsx scripts/transform/water-cycle/validate-provenance.ts ch0` |
| Technical: poster.jpg is the final frame at full quality | Visual diff against frame 899 |
| Mass counter ends at exactly "516 km³" | Read counter text from Blender script log |
| Color: ice volumes are sky `#7DD3FC` (no purples or grays) | Color sample from rendered frames |
| Determinism: re-running ch0_reservoir.py produces byte-identical output | sha256 hash comparison |

### Shareable still (poster.jpg)

Frame 870 (t=29s): Khumbu region, Imja Tsho ring visible, full headline text overlay rendered, citation chip visible.

---

## Chapter 1 — The retreat

**Goal**: anchor "9% / 516 km³" in real geography. Show four named glaciers shrinking simultaneously. The reader knows by name what's being lost.

### Hero shot specification

- **Duration**: 25s = 750 frames
- **Composition**: 4-up grid (2×2), each cell shows one glacier shrinking 1990→2020 in synchronized timeline
- **Glaciers shown**: Khumbu, Yala, Annapurna I, Imja
- **Camera per cell**: top-down orthographic, locked to glacier extent (no panning per cell)

### Frame-by-frame storyboard

| Frame | Time | Visual state | HTML overlay |
|---|---|---|---|
| 0-60 | 0-2s | Empty grid lines fade in. Year label "1990". Each cell labeled (Khumbu, Yala, Annapurna I, Imja) | Caption: "Four glaciers. Same 30 years." |
| 60-120 | 2-4s | All 4 glaciers fade in at 1990 extent (sky `#7DD3FC` polygons) | Per-cell area labels: "Khumbu: 17.8 km²", "Yala: 1.65 km²", "Annapurna I: 18.4 km²", "Imja: 0.9 km²" |
| 120-720 | 4-24s | Year ticker advances: 1990→2000→2010→2020 over 20s. All 4 polygons shrink synchronously. Per-cell labels tick down. | Synchronized year (large, top-center): "1990 → 2020" tabular-nums |
| 720-750 | 24-25s | Hold 2020 state. Per-cell shows total loss: "Khumbu: -8%", "Yala: -45%", "Annapurna I: -12%", "Imja: -47%" | Caption: "These are the names." |

### Diegetic data layers

- **Per-glacier polygons** (4): from existing `public/glaciers/hkh/{year}-points.geojson` filtered to each glacier's GLIMS_ID region
- **Year ticker**: 3D type centered above grid
- **Per-cell labels**: 3D type pinned to each cell

### HTML overlay

- Caption block (left side, sticky)
- Citation chip
- /atlas/30-years embed BELOW the cinematic in the page (HTML, not video) for "explore mode"

### Provenance layers

```json
{
  "scene_layers": [
    {
      "id": "khumbu-1990-2020",
      "type": "polygon-flat",
      "source": {
        "dataset": "ICIMOD HKH Glacier Inventory",
        "filter": "glaciers within Khumbu region (lon 86.78-86.92, lat 27.92-27.99)",
        "n_features": 4
      },
      "color": "#7DD3FC"
    },
    /* ... yala, annapurna-i, imja same shape ... */
  ],
  "headline_numbers": [
    { "value": "-8%", "label": "Khumbu area 1990-2020", "citation": "..." },
    /* ... */
  ]
}
```

### Acceptance criteria

| Test | Pass condition |
|---|---|
| Visual: all 4 glaciers shrink at the same rate (visually) | Manual review |
| Technical: per-glacier areas match published values within 5% | Compare against ICIMOD inventory directly |
| Visual: year ticker stays synchronized across all 4 cells | Frame-by-frame check |
| Color: all polygons sky `#7DD3FC` | Color sample |
| File size < 24 MiB |  |

### Shareable still

Frame 720 (final state): all 4 cells at 2020 with per-glacier loss labels visible.

---

## Chapter 2 — The lake bloom

**Goal**: Imja Tsho is the unforgettable case study. The lake IS the glacier, now liquid. Where the ice used to be, water now sits.

### Hero shot specification

- **Duration**: 25s = 750 frames
- **Camera**: starts top-down (orthographic), pitches to oblique, then to ground-level following outflow
- **Region**: Imja basin, ~27.9°N 86.93°E

### Frame-by-frame storyboard

| Frame | Time | Visual state | HTML overlay |
|---|---|---|---|
| 0-60 | 0-2s | Top-down 1962 Imja basin. Glacier (sky) fills upper basin. No lake. Villages downstream barely visible (faint gold dots). | Caption: "1962. There was no lake here." |
| 60-180 | 2-6s | Year ticker advances 1962→1975→1992. Glacier morphs (flubber-style polygon interpolation in Blender). Tiny lake polygon (teal `#0E7490`) emerges at glacier terminus. | Lake area counter: "0.04 km² (1975)" → "0.61 km² (1992)" |
| 180-360 | 6-12s | Year ticker → 2010 → 2020. Lake grows to 1.4 km². Glacier visibly smaller than lake by 2020. | Annotation: "35× bigger than 1975" (NOT "doubled", per Codex review) |
| 360-510 | 12-17s | Camera pitches from top-down to oblique view (~45°). Reveals depth (60m bathymetry visualized as darker teal). | "60m deep · 1.4 km²" |
| 510-660 | 17-22s | Camera tilts further down and follows the Imja Khola outflow downstream. Villages light up as gold dots: Pheriche, Pangboche, Tengboche, Khumjung, Namche Bazaar, Lukla, Phakding. | Per-village labels appear briefly as camera passes |
| 660-720 | 22-24s | Hold final shot showing the full valley with lake at top, river to villages at bottom. | Caption: "South Lhonak (Sikkim) failed in 2023. 24 dead, 70+ missing. Imja is being actively monitored." |
| 720-750 | 24-25s | Final hold | Citation chip: "ICIMOD 2024 · Somos-Valenzuela 2014" |

### Diegetic data layers

- **Imja Glacier** (5 keyframes 1962/1975/1992/2010/2020): from `data/water-cycle/glaciers/imja-keyframes.geojson`, animated via shape-key morph between keyframe meshes
- **Imja Tsho** (5 keyframes): from `data/water-cycle/lakes/imja-keyframes.geojson`, same approach
- **Bathymetry**: depth visualized as opacity gradient on lake surface
- **Imja Khola outflow**: SVG-traced path imported as Bézier curve in Blender, animated stroke-on
- **Villages**: spheres at OSM-sourced coordinates, gold `#FCD34D`, brightness animated

### HTML overlay

- Captions (each above)
- Inline D3 area chart (below the cinematic, HTML): "Imja Tsho area 1962-2020", with the moment in cinematic mapped to chart highlight
- Citation chip
- 1962 expedition photo + 2020 satellite image as static side-by-side BELOW the cinematic (HTML, used as OG image too)

### Provenance layers

Glacier keyframes, lake keyframes, bathymetry, villages, 1962 photo, satellite imagery — all listed with sources, DOIs, licenses.

### Acceptance criteria

| Test | Pass condition |
|---|---|
| Visual: lake growth feels mechanical (no SVG-soup glitches) | Manual review |
| Visual: glacier morph between keyframes is smooth | Frame-by-frame |
| Number: "35x" annotation is correct for 0.04→1.4 km² (verify math) |  |
| Number: "24 dead, 70+ missing" matches Nature 2026 reconstruction | Citation correct |
| File size < 24 MiB |  |
| Color: lake teal `#0E7490`, glacier sky `#7DD3FC` |  |
| Provenance contract honors co-registration warning (do NOT splice Somos-Valenzuela 1962 with ICIMOD 2024 without note) |  |

### Shareable still

The 1962 B&W expedition photo (Hillary-era) + 2020 satellite image, side by side, NOT a frame from the cinematic. Per Claude's review: "*The lake is the glacier. That's the image newspapers will run.*"

---

## Chapter 3 — Where it went (Sankey)

**Goal**: answer "where did the water go?" honestly. Most stayed in HKH (lakes, rivers); small ocean contribution.

### Hero shot specification

- **Duration**: 15s = 450 frames
- **Composition**: HKH landscape in mid-foreground; 3D Sankey diagram floating in foreground space; numerical labels as 3D type
- **Camera**: subtle slow zoom-in (10% over the 15s)

### Frame-by-frame storyboard

| Frame | Time | Visual state | HTML overlay |
|---|---|---|---|
| 0-60 | 0-2s | HKH landscape visible. Sankey nodes appear as cubes labeled: "Frozen storage", "Lakes", "Rivers", "Ocean". | Caption: "Where did the water go?" |
| 60-180 | 2-6s | First flow: Frozen → Lakes (teal volumetric ribbon). Lake compartment grows. Counter: "+56% lake area HKH-wide" | "Lakes: +56%" (HTML overlay, bigger / more legible) |
| 180-300 | 6-10s | Second flow: Frozen → Rivers (living-blue ribbon). Rivers compartment swells. | "Rivers: temporarily +12%, then -10% by 2050" |
| 300-420 | 10-14s | Third flow: Frozen → Ocean (slate-thin ribbon). Ocean compartment barely changes. | "Ocean: 0.04 mm/yr — barely a sliver" |
| 420-450 | 14-15s | Hold. Caption appears: "Most of the water stayed in the mountains." | Final headline |

### Codex caveat applied

The Sankey ribbons MUST encode dimensional values (km³/yr) explicitly via labels at each node, NOT just intensity/speed/brightness. HTML overlay shows exact numbers; 3D ribbons are visual only.

### Diegetic data layers

- 4 compartment cubes with text labels
- 3 flow ribbons with material color = source-encoded
- Counter labels at each node (3D type)

### HTML overlay

- Big-font headline numbers (top-right corner of the cinematic)
- Caption (top-left)
- Citation chip
- "Show data" expandable `<table>` below cinematic with km³/yr values

### Provenance layers

- HMA Glacial Lake Inventory (delta 1990-2020)
- PyGEM HMA runoff projections
- Hugonnet 2021 mass balance

### Acceptance criteria

| Test | Pass condition |
|---|---|
| Numbers shown as 3D AND in HTML are identical | Schema cross-check |
| HTML `<table>` lists all flow values with units | Manual check |
| Color: each compartment matches its semantic color | Color sample |

### Shareable still

Final state (frame 420): all 4 compartments, 3 flows visible with labels.

---

## Chapter 4 — When it comes (Hydrological Clock)

**Goal**: peak water is a CALENDAR problem. The water arrives at the wrong time of year.

### Hero shot specification

**Hybrid: 3D cinematic background + 2D HTML/SVG foreground UI.** The clock UI is HTML/SVG (not 3D), per Codex's caveat that timing precision needs axes/labels.

- **Duration**: 20s = 600 frames (cinematic only — clock UI animates separately on the page)
- **Cinematic**: Imja basin transitioning seasons over 20s — winter snow building → spring melt → summer flooding → autumn settling
- **Clock UI**: rendered in HTML on top, two hands

### Frame-by-frame (cinematic background)

| Frame | Time | Visual state |
|---|---|---|
| 0-150 | 0-5s | Winter Imja basin: snow-covered mountains, lake frozen partial. Cold tones. |
| 150-300 | 5-10s | Spring melt: snow line recedes, lake outflow begins. Warm-cool transition. |
| 300-450 | 10-15s | Summer flooding: lake swells, river roars, lush green slopes. Warm tones. |
| 450-600 | 15-20s | Autumn settling: water clear, snow returning at high elevation. |

### Frame-by-frame (clock UI on top)

| Time | Clock state |
|---|---|
| 0-3s | Clock face appears, no hands, year label "1990" |
| 3-7s | Hand A draws: peak meltwater in 1990 = April |
| 7-12s | Year label rotates to "2070", hand B draws: peak meltwater in 2070 = February |
| 12-17s | Both hands visible. Annotation: "Peak shifts 8 weeks earlier — into pre-monsoon dry season." |
| 17-20s | Crop calendar overlay (bottom of clock): "Wheat needs water April-June" — gap visible |

### Diegetic data layers (cinematic only)

- Imja basin geometry from `data/water-cycle/glaciers/imja-keyframes.geojson` (2020 state, static)
- Snow extent material driven by month-of-year
- Lake material (color, ripple effect) animated

### HTML overlay (the primary teaching surface)

- Clock SVG, 400×400px desktop / 280×280 mobile, in the center
- Two hands with labels
- Annotation strip below
- Citation chip

### Provenance layers

- PyGEM HMA Imja runoff projection (monthly resolution, 1990 vs 2070 SSP2-4.5)
- IPCC AR6 framing
- FAO crop calendar South Asia

### Acceptance criteria

| Test | Pass condition |
|---|---|
| Clock UI is 2D HTML/SVG (NOT 3D) | Code review |
| Two clock hands visible at all times after the reveal | Visual |
| Crop-calendar overlay shows the timing gap | Visual |
| Cinematic seasons feel natural | Manual review |

### Shareable still

The clock with both hands + crop calendar overlay + cinematic frame behind.

---

## Chapter 5 — The feedback loop (light-absorbing impurities)

**Goal**: there's a local feedback. Smoke, dust, and biological growth darken the snow surface, accelerating melt — and some of it comes from the same farming communities depending on the water.

### Codex caveat applied

NOT BC-only "soot apocalypse". This is **light-absorbing impurities** — a mix of black carbon (BC), mineral dust, and biological growth (snow algae). Per Kaspari 2014:
- BC alone: 6-10% albedo reduction
- Dust: dominant in Solu-Khumbu (488-525 W/m² vs 75-120 W/m² for BC)
- Combined: dust is the bigger contributor

### Hero shot specification

- **Duration**: 20s = 600 frames
- **Composition**: vertical mountain transect (Imja-style cross-section). Soot+dust haze drifts up from south (Indo-Gangetic plain). Snow visibly darkens at high elevation.

### Frame-by-frame storyboard

| Frame | Time | Visual state | HTML overlay |
|---|---|---|---|
| 0-90 | 0-3s | Mountain transect, pristine snow at top, Indo-Gangetic plain at bottom (haze-free) | Caption: "Light-absorbing impurities" |
| 90-300 | 3-10s | Particles drift up from plain (mix of dark BC + light dust). Particles settle on mountain. | Annotation: "Dust dominates in Solu-Khumbu (Kaspari 2014). BC: 6-10% albedo reduction." |
| 300-450 | 10-15s | Snow darkens (white → grey-purple via shader). Melt rate visibly accelerates (water flow at glacier base intensifies). | Dual-axis chart (HTML below cinematic): BC concentration timeseries + dust optical depth |
| 450-600 | 15-20s | Hold. Caption: "Some of this is from the same farming communities downstream — crop-residue burning. The water that depends on these glaciers is also accelerating their loss." | Citation chip |

### Diegetic data layers

- Mountain geometry (SRTM-derived)
- Particle systems (BC and dust as separate emitters with different colors and velocities)
- Snow material animated via shader driver (RGB shift)
- Glacier base water particles

### HTML overlay

- Captions
- Dual-axis chart of BC + dust values from Kaspari 2014 (or sourced timeseries)
- Citation chip

### Provenance layers

- Kaspari et al. 2014
- Jacobi et al. 2015
- Optionally NASA SPIRES NRT if HKH coverage exists (verify in ingestion task)

### Acceptance criteria

| Test | Pass condition |
|---|---|
| Caption explicitly names BOTH BC and dust (not BC-only) | Text check |
| HTML chart shows DUST values larger than BC values per Kaspari 2014 | Chart values match cited paper |
| Color: snow shifts from white `#FFFFFF` → muted grey-purple `#A5A5BB` (not pure black) | Frame sample |

### Shareable still

Mountain transect with darkened snow + caption visible.

---

## Chapter 6 — The choice (SSP1-2.6 vs SSP5-8.5)

**Goal**: end the story on a choice. Not a documentation of loss; a reckoning with what's possible.

### Codex caveat applied

Use **SSP1-2.6 vs SSP5-8.5** for IPCC AR6 framing. NOT RCP 4.5 (deprecated, was sloppily called "worst case"). Rounce et al. 2023 is the source.

### Hero shot specification

- **Duration**: 30s = 900 frames
- **Composition**: split-cinematic. Same HKH-arc oblique flyover camera path as Ch 0, but at 2100. Left half = SSP1-2.6 best case; right half = SSP5-8.5 worst case.
- **Ghost-glacier overlay**: SSP1-2.6 ice shown as glowing wireframe inside SSP5-8.5 mass — "this is the volume of our indecision."

### Frame-by-frame storyboard

| Frame | Time | Visual state | HTML overlay |
|---|---|---|---|
| 0-90 | 0-3s | Split screen reveal: 2100 fade-in from black. Both halves at 2020 baseline. | Caption: "What's possible." |
| 90-300 | 3-10s | Year ticker advances 2020 → 2050. SSP1-2.6 (left) and SSP5-8.5 (right) ice masses diverge. Ghost wireframe of SSP1-2.6 begins to overlay on right half. | Annotation: "SSP1-2.6: 1.5°C-aligned. SSP5-8.5: high-emissions." |
| 300-600 | 10-20s | Year ticker → 2080 → 2100. Right half loses ~50% more mass than left. Wireframe shows the difference. | Counter: "SSP1-2.6: -45% by 2100 / SSP5-8.5: -75% by 2100" |
| 600-810 | 20-27s | Camera pulls back to whole arc. Both endstates visible. Light bridges the gap (the wireframe). | Caption: "This wireframe is the volume of our indecision." |
| 810-900 | 27-30s | Hold. Closing line appears. | "**The glacier was your reservoir. We are draining it.**" (large, sticky for 3s) |

### Diegetic data layers

- 2020 baseline ice (both halves)
- 2100 SSP1-2.6 ice (left half + wireframe overlay on right)
- 2100 SSP5-8.5 ice (right half)
- Year ticker

### HTML overlay

- Captions
- Per-scenario closer-headline (HTML for sharp typography)
- Citation chip: "Sources: Rounce 2023 · Miles 2021 · IPCC AR6"
- Closing thesis line

### Provenance layers

- Rounce et al. 2023 (per-scenario projections)
- Miles et al. 2021 (250M dependent population)
- IPCC AR6 SSP framing

### Acceptance criteria

| Test | Pass condition |
|---|---|
| Captions name SSP1-2.6 and SSP5-8.5 (NOT RCP 4.5) | Text check |
| 2100 mass losses match Rounce 2023 published values within 5% | Cross-check |
| Closing line "The glacier was your reservoir. We are draining it." appears | Visual |
| Color: ghost wireframe is teal-blue `#38BDF8`, NOT rose | Color sample |

### Shareable still

Final frame: split scene + ghost wireframe + closing thesis line.

---

## Cross-chapter coherence checks (manual review by Mother before merge)

| Check | How |
|---|---|
| Color grammar consistent across all 7 chapters | Frame-sample each chapter, verify colors match WATER_CYCLE_SPEC.md §7 |
| Hidden cuts feel continuous (Ch 0 → Ch 1, etc.) | Watch all 7 chapters in sequence at full quality |
| Year/area/mass numbers consistent across chapters when same metric appears | Cross-reference provenance.json files |
| Citation chips appear on every chapter | Visual sweep |
| No motion blur on any scrub master | Frame-by-frame scrub test on each cinematic-scrub.webm |
| All 7 chapters have working reduced-motion fallback | CSS test (force `prefers-reduced-motion`) |
| All 7 chapters render correctly in mobile card-stack | Mobile preview |
| Provenance Peel works on every chapter | Click-test each |
