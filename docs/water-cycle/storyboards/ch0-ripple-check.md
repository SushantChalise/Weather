# Ch 0 Ripple Check (v1 → v2 research brief revision)

## Summary

**Total propagations found: 6** (1 directional inconsistency, 5 Bhushan citation occurrences across 4 documents)
**Total documents requiring edits: 4** (script, technical-spec, master storyboard; shot list needs verification on Shot 07)
**Severity: MAJOR** — the wrong citation (Bhushan vs. Brencher) is the most-repeated propagation and appears in the source-of-truth citations table, the reduced-motion accessible fallback (user-visible), and the data-contract / static-fallback (user-visible).

Director brief is clean. Shot list is clean except for the directional check on Shot 07 (see Error 1).

---

## Error 1: Directional language

**Status: ONE inconsistency found — Shot 07 (Khumbu Icefall) in `ch0-technical-spec.md` and the parallel shot in `ch0-shotlist.md`.**

### Where the language is FINE (no fix needed)

The v2 correction was specifically about views of Everest from Kala Patthar / EBC (Everest bears ~030° NNE, not south). The downstream docs do not contain any shot whose camera looks at the summit of Everest, Lhotse, or Nuptse from south of those peaks. The eastward-arc drift shots (Shots 01–03) look "south-southeast" from a satellite position above the Tibetan Plateau (~30°N) toward the Himalayan main range, which is geographically correct — the range is south of that camera.

- `ch0-technical-spec.md` line 209: "looking south-southeast" — Shot 01 from 30°N. OK.
- `ch0-technical-spec.md` line 239: "pitch = -45° looking south-southeast across the range" — Shot 02 over Karakoram (36°N). OK.
- `ch0-technical-spec.md` line 252: Shot 02 rotation "stays pointing south-southeast". OK.
- `ch0-storyboard.md` lines 68, 93: HKH satellite shot "northwest to southeast" / "south-southeast" — OK (camera north of range).
- `ch0-technical-spec.md` line 292: Shot 04 Langtang/Yala "looking slightly south-southwest at the glacier". OK (camera north of Yala).
- `ch0-storyboard.md` lines 259, 289, 368, 435, 463: solar-azimuth descriptions ("sun from south", "sun overhead-south", "sun ~55° from south", etc.) — these describe the sun, not the camera. OK.
- `ch0-script.md`: no camera-direction language; no occurrences.

### Where the language is INCONSISTENT (fix recommended)

**`ch0-technical-spec.md` lines 349–355 — Shot 07 (Khumbu Icefall):**

```
Rotation: (math.radians(−25) + π/2, 0.0, math.radians(155))
  [looking south-southeast at the Khumbu Icefall; slight downward tilt reveals
   both the icefall and the Base Camp moraine foreground]
Focal length: 300.0 mm
DOF: enabled
  focus_distance: 2.0 BU (2 km — focused on mid-icefall)
  f_stop: 5.6 (moderate; background Lhotse face slightly soft but readable)
```

The icefall and Lhotse face are roughly south-southeast of a camera positioned above EBC — that much is geographically defensible. However, the parallel shot in the shot list (Shot 07, lines 396–457) lists Everest's "Yellow Band (Ordovician limestone) at ~8,600 m on Everest's southwest face, barely visible at upper right, lit warm" *in the background of a south-southeast-facing camera*. From EBC, Everest is NNE (bearing ~030°). The Yellow Band cannot be in the upper right of a frame pointing SSE — it would be behind the camera.

**Parallel issue in `ch0-storyboard.md` Shot 06 (renumbered Khumbu Icefall, lines 217–243):** "sun ~18°, azimuth: ~088°. Direct light on icefall face-on (facing south-southeast)." That's the icefall face orientation, not camera azimuth — OK. But the aria-label says "Khumbu Icefall below Everest" and "Lhotse face rises behind", which the technical-spec's SSE-pointing camera cannot fit if Everest is supposed to be in the frame.

### Suggested fix

In `ch0-technical-spec.md` Shot 07, drop the Everest Yellow Band reference from the cinematography description (it belongs in the shot list, line 432 — `Background: The Lhotse face... The Yellow Band (Ordovician limestone) at ~8,600 m on Everest's southwest face`). The Yellow Band on Everest's SW face cannot share a frame with the SSE-facing icefall shot, given EBC's geography.

Replacement for `ch0-shotlist.md` Shot 07 (lines 425–436), `Background:` block:
> Background: The Lhotse face — a tilted plane of blue-grey ice and rock bands rising to the top of frame. The Nuptse-Lhotse ridge frames the icefall's upper extent. (Remove the "Yellow Band on Everest's southwest face" reference — Everest is NNE of EBC, not in the SSE-facing field of view.)

Remove `Yellow Band (far upper): #B09060` color entry from the palette (line 436).

No camera rotation change is required for Shot 07 — the icefall and Lhotse face do lie SSE of EBC. Only the impossible Everest detail needs to be removed.

---

## Error 2: Vegetation altitude

**Status: Not propagated. Documents are clean.**

All downstream documents enforce the treeline rule (no trees above 3,800 m) and use it as an explicit fabrication check:

- `ch0-shotlist.md` line 384–387 (Shot 06 Kangchenjunga/Makalu): "use a procedural forest shader below ~3,800 m in this shot only; the treeline constraint applies — no forest above 3,800 m. Check this rigorously: if trees appear above this elevation in the render, it is a fabrication error."
- `ch0-shotlist.md` line 1025 (Fabrication checklist): "Shot 04, 06: No tree geometry above 3,800 m in any shot."
- `ch0-script.md` lines 124, 127 (Shot 06 fallbacks): "Below 3,800 metres: forest. Above 5,000 metres: glacier."
- `ch0-storyboard.md` line 202: "TREELINE CONSTRAINT: no trees above 3,800 m. Fabrication check: verify rigorously."
- `ch0-technical-spec.md` line 717: "Shots 04, 05: No tree geometry above 3,800 m".
- `ch0-storyboard.md` line 553 (Shot 09 Imja Tsho composition): "Absolute absence of vegetation. The bareness is information."

No shot description shows trees, juniper, or rhododendron near Gorak Shep, the Khumbu Icefall, Imja, or any other location above 4,000 m. The Imja basin is described as having bare angular rock and gravel only. Clean.

---

## Error 3: Citation (Bhushan → Brencher, Henderson & Shean 2026)

**Status: MAJOR propagation. The v1 "Bhushan et al. 2026" attribution appears in FIVE places across THREE downstream documents and needs replacement in all of them.**

### Occurrences

1. **`ch0-script.md` line 278** (Shot 14 reduced-motion fallback — USER-VISIBLE):
   > "Buried dead ice melting within it, causing subsidence of 8.5 to 9.4 centimetres per year **(Bhushan et al., 2026)**. In 2016, a controlled outlet reduced the lake level by 3.4 metres."

2. **`ch0-script.md` line 333** (Static fallback Sources line — USER-VISIBLE):
   > "Sources: Somos-Valenzuela et al. (2014) DOI: 10.5194/tc-8-1661-2014; ICIMOD HI-WISE (2023); **Bhushan et al. (2026)** DOI: 10.5194/tc-20-67-2026."

3. **`ch0-technical-spec.md` line 631** (Data contract / citations table):
   > "| Dead ice subsidence (seasonal downward displacement) | 8.5–9.4 cm/yr **(Bhushan et al. 2026)** | Shot 13 | **Bhushan et al. (2026)**, The Cryosphere | 10.5194/tc-20-67-2026 |"

4. **`ch0-technical-spec.md` line 686** (Verification checklist):
   > "BLOCKING FIX #2: Shot 13 reduced-motion fallback uses 'seasonal downward displacement of 8.5–9.4 centimetres per year **(Bhushan et al. 2026)**'"

5. **`ch0-technical-spec.md` lines 1580–1582** (Data source JSON manifest):
   > `"dataset": "Imja moraine dam geometry (Research Brief §2 + Bhushan et al. 2026 InSAR measurements)"`

6. **`ch0-storyboard.md` line 472** (Shot 13 SubsidenceHollow blocking-fix narrative):
   > "consistent with the InSAR-documented dead-ice melt subsidence **(Bhushan et al. 2026)**. It is NOT labelled."

7. **`ch0-storyboard.md` line 479** (Shot 13 reduced-motion fallback — USER-VISIBLE, duplicates script):
   > "causing **seasonal downward displacement of 8.5 to 9.4 centimetres per year (Bhushan et al., The Cryosphere, 2026)** — and lateral movement of approximately 90 cm over 2017–2024."

8. **`ch0-storyboard.md` line 631** (Data contract table):
   > "| Dead ice subsidence (seasonal downward displacement) | 8.5–9.4 cm/yr **(Bhushan et al. 2026)** | Shot 13 | **Bhushan et al. (2026)**, The Cryosphere | 10.5194/tc-20-67-2026 |"

9. **`ch0-storyboard.md` line 686** (Verification checklist; duplicate of tech-spec entry):
   > "BLOCKING FIX #2: Shot 13 reduced-motion fallback uses 'seasonal downward displacement of 8.5–9.4 centimetres per year **(Bhushan et al. 2026)**'"

### Suggested fix (apply globally)

Replace every instance of:
- `Bhushan et al. 2026` → `Brencher, Henderson & Shean 2026` (in narrative text)
- `Bhushan et al. (2026)` → `Brencher, Henderson & Shean (2026)` (in citation form)
- `Bhushan et al., 2026` → `Brencher, Henderson & Shean, 2026` (parenthetical form)
- `Bhushan et al., The Cryosphere, 2026` → `Brencher, Henderson & Shean, The Cryosphere, 2026`

DOI `10.5194/tc-20-67-2026` is correct in v2 and is already present everywhere — no DOI change required, only the author surname(s).

The director brief contains no "Bhushan" reference — it is clean.

The shot list contains no "Bhushan" reference — it is clean.

---

## Error 4: "20–40% dry-season glacier melt" overgeneralization

**Status: Not propagated. Documents are clean.**

A full grep for `20.40`, `dry-season`, `20%.*40%` across all five downstream docs returned no hits in narrative content. The figure does not appear in the script's static fallback, the storyboard data contract, or anywhere else.

No fix required.

---

## Error 5: Altitude tagging (ASL/AGL)

**Status: Largely propagated correctly. Minor gaps in shot list.**

### Technical spec — CLEAN

Every shot in `ch0-technical-spec.md` §3 (Camera rig) tags altitude consistently:
- Shot 01: `altitude 200,000 m` (orbital — implicit ASL)
- Shot 02: `altitude 80,000 m` (orbital — implicit ASL)
- Shot 03: `altitude 30,000 m` → `altitude 15,000 m` (descending, implicit ASL)
- Shot 04: `altitude 2,000 m AGL` (and explicit terrain note `Terrain at Yala Glacier: ~5,100 m ASL → camera at ~7,100 m ASL`)
- Shot 05: `altitude ~5,100 m ASL (1,000 m above Sanctuary floor)`
- Shot 06: `altitude 8,000 m AGL` (and explicit `Terrain at viewpoint: ~3,000 m → camera at ~11,000 m ASL`)
- Shot 07: `altitude ~5,865 m ASL (500 m AGL above Base Camp)`
- Shot 08: `altitude 8,000 m ASL (3,000 m AGL)` → `altitude 5,810 m ASL (800 m AGL above lake)`
- Shot 09: `altitude 5,310 m ASL (300 m AGL above lake)`
- Shot 11: `altitude 5,030 m ASL (20 m AGL above lake)`
- Shot 12: `altitude 5,030 m ASL (20 m AGL)`
- Shot 13: `altitude 5,510 m ASL (500 m AGL)`
- Shot 14: `altitude 5,210 m ASL (200 m AGL)` (line 507)

Tech-spec is fully compliant with v2's ASL/AGL tagging rule.

### Shot list — INCONSISTENT

`ch0-shotlist.md` uses inconsistent tagging:
- Shot 01 (line 33): `Altitude: ~200 km above mean sea level (satellite analogue, not drone)` — explicit ASL phrasing. OK.
- Shot 02 (line 116): `Altitude: ~80 km AGL`. Since Karakoram peaks are ~7–8 km, "80 km AGL" is essentially equivalent to ASL here, but the tag is **AGL** without an ASL companion. Minor inconsistency.
- Shot 03 (line 168): `Altitude: ~30 km descending to ~15 km AGL`. Same — AGL with no ASL companion.
- Shot 04 (line 228): `Altitude: ~2,000 m AGL` — no ASL companion (terrain is 5,100 m, so camera is ~7,100 m ASL).
- Shot 05 (line 289): `Altitude: ~1,000 m AGL above Sanctuary basin floor (~5,100 m absolute)` — has both. OK.
- Shot 06 (line 346): `Altitude: ~8,000 m AGL` — no ASL companion.
- Shot 07 (line 410): `Altitude: ~500 m AGL` — no ASL companion (terrain is 5,365 m, so camera is ~5,865 m ASL).
- Shot 08 (line 482): `Altitude: ~3,000 m AGL descending to ~800 m AGL` — no ASL companion.
- Shot 09 (line 543): `Altitude: ~300 m AGL` — no ASL companion.
- Shot 11 (line 697): `Altitude: ~20 m AGL above lake surface` — no ASL companion.
- Shot 12 (line 771): `Altitude: ~20 m AGL` — no ASL companion.
- Shot 13 (line 850): `Altitude: ~500 m AGL` — no ASL companion.
- Shot 14 (line 915): `Altitude: ~200 m AGL` — no ASL companion.

### Suggested fix

For each shot in `ch0-shotlist.md` that has only AGL, append the ASL equivalent in parentheses (the technical spec already has these computed). Example replacement for Shot 04:
> `Altitude: ~2,000 m AGL (~7,100 m ASL)`

For Shot 07: `Altitude: ~500 m AGL (~5,865 m ASL)`
For Shot 09: `Altitude: ~300 m AGL (~5,310 m ASL)`
For Shots 11/12: `Altitude: ~20 m AGL above lake surface (~5,030 m ASL)`
For Shot 13: `Altitude: ~500 m AGL (~5,510 m ASL)`
For Shot 14: `Altitude: ~200 m AGL (~5,210 m ASL)`

This is a MINOR fix — the tech-spec is the implementation contract and is already complete. The shot list could be left as-is if scoping the ripple-check tightly, but bringing it into ASL/AGL parity with the brief is a small, low-risk change.

The script, director brief, and storyboard largely use altitudes in narrative form ("at 5,010 metres elevation") without ASL/AGL tags — those are user-facing prose and the v2 rule applies to camera-rig specifications, not prose. No fix needed there.

---

## Error 6: Bhutan anomaly framing

**Status: Not propagated. Documents are clean.**

The only "Bhutan" references in the storyboard pipeline are inside `ch0-research-brief.md` itself (v2's explicit correction). No downstream document mentions Bhutan, the Bhutan anomaly, or frames Bhutan glaciers as parallel to the Karakoram. The Karakoram Anomaly references in `ch0-shotlist.md` Shot 02 (line 142), `ch0-storyboard.md` line 114, and `ch0-script.md` Shot 02 fallback are all standalone — they describe the Karakoram alone and do not invoke Bhutan as a parallel case.

No fix required.

---

## Documents that need editing

### `ch0-script.md`
- **Line 278** (Shot 14 reduced-motion fallback): `(Bhushan et al., 2026)` → `(Brencher, Henderson & Shean, 2026)`
- **Line 333** (static fallback sources): `Bhushan et al. (2026) DOI: 10.5194/tc-20-67-2026` → `Brencher, Henderson & Shean (2026) DOI: 10.5194/tc-20-67-2026`

### `ch0-technical-spec.md`
- **Line 349–355** (Shot 07 cinematography): verify with the shot-list edit below; the SSE camera rotation can stand, but the parallel shot-list description in `ch0-shotlist.md` lines 425–436 references Everest's Yellow Band in a SSE-facing frame, which is geographically impossible. The tech-spec itself does not name Everest in Shot 07, so the only fix here is internal consistency with the shot list.
- **Line 631** (citations table — both data-source and citation columns): `Bhushan et al. 2026` → `Brencher, Henderson & Shean 2026`; `Bhushan et al. (2026), The Cryosphere` → `Brencher, Henderson & Shean (2026), The Cryosphere`
- **Line 686** (verification checklist BLOCKING FIX #2 reminder): update narrative to `(Brencher, Henderson & Shean 2026)`
- **Lines 1580–1582** (data manifest entry): `"Imja moraine dam geometry (Research Brief §2 + Bhushan et al. 2026 InSAR measurements)"` → `"Imja moraine dam geometry (Research Brief §2 + Brencher, Henderson & Shean 2026 InSAR measurements)"`

### `ch0-storyboard.md`
- **Line 472** (Shot 13 SubsidenceHollow narrative): `(Bhushan et al. 2026)` → `(Brencher, Henderson & Shean 2026)`
- **Line 479** (Shot 13 reduced-motion fallback — USER-VISIBLE): `(Bhushan et al., The Cryosphere, 2026)` → `(Brencher, Henderson & Shean, The Cryosphere, 2026)`
- **Line 631** (data contract table): same replacement as tech-spec line 631
- **Line 686** (verification checklist): same replacement as tech-spec line 686

### `ch0-shotlist.md`
- **Lines 425–436** (Shot 07 Background and Color palette): remove the "Yellow Band (Ordovician limestone) at ~8,600 m on Everest's southwest face, barely visible at upper right" reference and its color palette entry `Yellow Band (far upper): #B09060`. Everest is NNE of EBC and cannot appear in a SSE-pointing frame. (Suggested replacement text given under Error 1 above.)
- **Shots 02, 03, 04, 06, 07, 08, 09, 11, 12, 13, 14** (Altitude lines): append ASL equivalents to the existing AGL tags per Error 5. Minor / non-blocking.

---

## Documents that are clean (no propagation)

- **`ch0-director-brief.md`** — completely clean. No Bhushan citation, no problematic directional language toward Everest, no Bhutan anomaly framing, no "20–40% dry-season" figure. The Karakoram Anomaly mentions in Beat 1 (line 37) are standalone and do not invoke Bhutan.

- **`ch0-research-brief.md`** — this is v2 itself, the source of the corrections.

---

*End of ripple check.*
