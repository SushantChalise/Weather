# Chapter 0 — Technical Specification

> **STATUS**: Working artifact — see `ch0-storyboard.md` for canonical version, `ch0-frame-map.yaml` for machine-readable source of truth.

*Role: Blender Technical Director / Pipeline Engineer*
*Date: 2026-05-11*
*Target script: `scripts/render/water-cycle/ch0_cinematic.py` (new version)*
*Do NOT use `ch0_reservoir.py` as a structural template — that script served a different storyboard.*

---

## Overview

Chapter 0 ("The Water That Was Ice") is a 30-second, 900-frame cinematic covering **13 shots** across three beats. It spans spatial scales from 200 km orbital altitude (shots 01–02) down to 20 m above lake surface (shots 10–11). The scene uses **four distinct geographic areas**, each requiring its own DEM resolution and camera rig. The most technically demanding element is the Imja Tsho water shader, which must hit hex `#78C8C0` with volumetric Tyndall-scattering physics. The calving event (shot 11) uses a pre-baked particle/fluid simulation composited over the lake render.

**Hard constraints from WATER_CYCLE_SPEC.md §7 (none negotiable):**
- Resolution: 1280 × 720 @ 30 fps
- Duration: 30 s = 900 frames (frame indices 1–900 inclusive in Blender, 1-based; the encoded outputs are 0-indexed at the ffmpeg layer)
- Engine: Cycles 128 spp + OIDN for production; Eevee for preview
- GPU: NVIDIA OPTIX path tracing
- Output: `public/water-cycle/ch0/cinematic.webm` (AV1 primary), `cinematic.mp4` (H.264), `cinematic-scrub.webm` (scrub master), `poster.jpg` (frame 841 — Shot 13 moraine dam, the chapter's last non-black frame before fade)
- File size: cinematic.webm < 8 MiB, cinematic.mp4 < 16 MiB, scrub < 6 MiB, each < 24 MiB cap
- Determinism: byte-identical re-runs with same seeds

**Blender coordinate system (inherited from shared modules):**
- Origin: 83°E, 30°N (HKH midpoint)
- X = (lon − 83.0) × 96.126 km/° (111.0 × cos(30°))
- Y = (lat − 30.0) × 111.0 km/°
- Z = elevation_m × 0.001 (metres to Blender units where 1 BU = 1 km)
- This is a flat-earth linearisation, adequate for artistic renders at all scales in this chapter.

---

## 1. Scene Graph

The scene uses **seven collections**. Collections with frame-range visibility are controlled via `hide_render` fcurves on the collection or on individual objects. The Blender `bpy.context.scene.collection` is the root; all named collections are children of it.

```
Collection: CAM_Rigs
  Objects:
    - SceneCamera        | Camera    | Single animated camera; all 13 shots share this object
                                       with position/rotation/focal-length keyframed per shot.
                                       See Section 2 for per-shot specs.
  Visibility: all frames
  Notes: Use cameras_mod.setup_camera() + cameras_mod.animate_camera(). Hard cuts via
         cameras_mod.set_constant_cut() with CONSTANT interpolation at cut frames.

Collection: Terrain_HKH
  Objects:
    - HKH_DEM_orbital    | Mesh      | SRTM 90m DEM, bbox [70–95°E, 26–36°N], 256-quad res.
                                       Used for shots 01–03. Orthographic-scale; individual
                                       glacier textures not resolved. Material: MAT_Terrain
                                       (height ramp, existing make_terrain_material()).
    - HKH_AtmosVolume    | Volume    | Cube encompassing the HKH scene (~3000 km × 2000 km × 200 km).
                                       Principled Volume shader, very low scatter density.
                                       Active only for shots 01–03. Provides atmospheric haze
                                       visible at satellite altitude. See Risk Register §9.
  Visibility: frames 1–375 (shots 01–03)
  Notes: At 200 km altitude the individual DEM quads are not resolved; the terrain reads
         as a textured surface. Resolution 256 is sufficient and keeps GPU memory within
         bounds. Use dem_mod.load_dem_as_mesh() with resolution=256.

Collection: Terrain_Nepal
  Objects:
    - Nepal_DEM_regional | Mesh      | CopDEM 30m (or SRTM 30m fallback), bbox [83–88°E, 27–29°N].
                                       512-quad res. Used for shots 03–07. Material: MAT_Terrain.
    - Langtang_DEM       | Mesh      | Sub-tile DEM, bbox [85.25–85.75°E, 28.0–28.5°N], 256-quad.
                                       Shot 04 only.
    - Kangchenjunga_DEM  | Mesh      | Sub-tile DEM, bbox [87.5–88.5°E, 27.3–28.1°N], 256-quad.
                                       Shot 05 only.
  Visibility: frames 301–495 (shots 03–06). Langtang/Kang sub-tiles additionally
              hidden when not in their respective shot's frame window (see notes).
  Notes: The two regional sub-tiles are expensive. Gate visibility: Langtang_DEM only
         renders frames 376–405; Kangchenjunga_DEM only 406–435.
         Use hide_render keyframes. Overlap is intentional (adjacent shots may see edges).

Collection: Terrain_Imja
  Objects:
    - Imja_Basin_DEM     | Mesh      | ALOS AW3D30 or SRTM 30m, bbox [86.85–87.05°E, 27.83–28.0°N].
                                       512-quad res. Moraine dam geometry (40–50 m rise above
                                       valley floor at ~86°54'30"E) must be topographically correct.
                                       If real DEM is absent, the moraine dam must be manually
                                       sculpted into the procedural fallback — it is the chapter's
                                       visual pivot in beat 3.
                                       data_layer.classification = "SCHEMATIC" in provenance.json
                                       (the moraine geometry is reconstructed from Research Brief
                                       coordinates, not measured from a moraine-specific dataset).
    - MoraineDam_Detail  | Mesh      | Hand-modelled overlay mesh providing boulder-scale detail
                                       on the dam crest. Applied over the DEM. Material: MAT_MoraineDam.
                                       Includes the subsidence hollow (~3 m diameter, ~0.5 m deep) as
                                       a boolean subtraction (BLOCKING FIX #14).
                                       data_layer.classification = "SCHEMATIC".
    - SubsidenceHollow   | Mesh      | Shallow dish geometry (~3 m diameter, 0.5 m deep), boolean
                                       subtracted from MoraineDam_Detail (BLOCKING FIX #14 —
                                       changed from Empty to Mesh). Visible as a subtle bowl-shaped
                                       depression in the dam crest, consistent with InSAR-documented
                                       dead-ice subsidence (Brencher, Henderson & Shean 2026 — a 0.3
                                       km² area of the moraine dam cumulatively subsided about
                                       90 cm over 2017–2024). NOT labelled in render.
                                       data_layer.classification = "SCHEMATIC".
    - PrayerFlag_String  | Mesh      | Single faded prayer flag string, one end unattached (trailing).
                                       Located on moraine crest. Visible Shot 13 only.
                                       Material: flat diffuse, #A87848 (faded orange-red).
  Visibility: frames 496–900 (shots 07–13). PrayerFlag_String: frames 841–900 only.
  Notes: The moraine dam at 86°54'20"E must read as 40–50 m higher than the Imja Khola
         valley floor below it. Cross-check DEM against Research Brief coordinates. If the
         DEM flattens this feature, sculpt-correct in Blender edit mode or use a displacement
         modifier with a hand-drawn mask.

Collection: Glaciers
  Objects:
    - Glacier_Clean_HKH  | Instances | Karakoram clean glaciers for shots 01–02. Point-cloud
                                       representation or instanced billboard meshes (see §6).
                                       Material: MAT_IceClean.
    - Glacier_Debris_Nepal | Instances | Nepal debris-covered glaciers for shots 03, 06, 07.
                                         Material: MAT_IceDebris.
    - Imja_Glacier_Tongue | Mesh      | Debris-covered lower tongue of Imja Glacier.
                                        Bbox: 86°54'–87°00'E, 27°53'–27°55'N.
                                        Used shots 07–10. Material: MAT_IceDebris.
                                        data_layer.classification = "SCHEMATIC" (terminus approximated
                                        from Research Brief description; NOT a measured 2020 outline).
    - Imja_IceCliff_Full  | Mesh      | The calving face — 10–15 m above waterline, at ~86°56'E.
                                        Used shots 08–11 (f571–f784). At f785, this mesh is hidden
                                        and Imja_IceCliff_PostCalving is shown (BLOCKING FIX #11).
                                        Material: MAT_IceClean with debris band overlay.
    - Imja_IceCliff_PostCalving | Mesh | Same cliff with the Calving_Block volume removed.
                                         Visible f785–f810. Material: MAT_IceClean.
    - Khumbu_Icefall      | Mesh      | Simplified serac geometry for Khumbu Icefall.
                                        Located at ~86°51'E, 27°58'N. Material: MAT_IceClean.
                                        Shot 06 only.
    - Yala_Glacier        | Mesh      | Clean plateau glacier, bbox [85.55–85.65°E, 28.20–28.28°N].
                                        Material: MAT_IceClean. Shot 04 only.
  Visibility: Per-object hide_render keyframes (see §5 fcurve table).
  Notes: Karakoram glaciers in shots 01–02 must NOT show debris material. Nepal glaciers in
         shots 03+ must NOT show clean ice material except at lateral cliff exposures.
         The material binary (clean vs debris) is the chapter's core visual argument.

Collection: LakeSystem
  Objects:
    - ImjaTsho_2020      | Mesh      | Flat polygon mesh at z=5.010 km (lake surface altitude).
                                       Polygon constructed from Research Brief coordinates:
                                       western end ~86°54'30"E, eastern end ~86°56'30"E,
                                       width ~550 m N-S. Area ~1.56 km².
                                       Material: MAT_LakeWater. Active shots 08–13.
                                       data_layer.classification = "SCHEMATIC" — the 2020 outline
                                       is constructed from research-brief coordinates and area;
                                       it is NOT the measured 2020 outline (no such polygon in
                                       the repo atlas data at this time).
    - ImjaTsho_1962_Overlay | Empty  | Parent for 1962 pond outlines (see §4 compositor).
                                        Not a 3D mesh — the 1962 ponds are rendered in the
                                        compositor as 2D overlay vectors, not 3D geometry.
                                        data_layer.classification = "SCHEMATIC" — artistic
                                        approximation of pre-lake supraglacial pond cluster;
                                        NOT digitized from Corona imagery.
    - ImjaKhola_Stream   | Mesh      | Braided stream channel below the moraine dam.
                                       Material: MAT_River (existing make_river_material() from
                                       shared/materials.py, #38BDF8 but with opacity 0.8 and
                                       milky white additive mix to simulate glacial turbidity).
                                       Shots 12–13 only.
    - SuperglacialPonds  | Instances | Small milky-turquoise ponds scattered on Imja_Glacier_Tongue
                                        surface. Use instanced disc meshes, 20–30 instances.
                                        Material: MAT_LakeWater at shallow depth setting.
                                        Shots 07, 10 visible.
    - Calving_Block      | Mesh      | Pre-keyframed ice block for shot 11. 2.0 m × 1.5 m × 0.8 m
                                        (2.4 m³, within 2–2.5 m³ spec). Hidden until f785, then
                                        revealed with hand-keyed pivot animation. Material:
                                        MAT_IceClean (fresh break). BLOCKING FIX #11: separate
                                        object, not carved from cliff mesh from the start.
    - Calving_Splash     | Particles | Mantaflow or particle system for splash/wave. Baked cache.
                                        Domain: 30 m × 30 m × 5 m box at calving point.
                                        Wave amplitude: max 15 cm. Shot 11 only.
  Visibility: ImjaTsho_2020 frames 571–900; ImjaKhola_Stream 811–900;
              Calving_Block and Calving_Splash 766–810 only.
  Notes: ImjaTsho_2020 must NEVER be hidden during shots 08–13. The lake color is the
         chapter's non-negotiable visual anchor.

Collection: DataOverlays_2D
  Objects:
    - ChapterTitle_Text  | Empty     | Marker only — chapter title is a compositor overlay,
                                       not 3D geometry. Renders via compositor (see §4).
    - ImjaTsho_Label     | Empty     | Marker for "Imja Tsho" name label placement (shot 08).
    - Overlay_1962_Ponds | Empty     | Marker for 1962 pond vector overlay (shot 09).
    - RegionLabel_Langtang | Empty   | Marker for "LANGTANG" optional label (shot 04).
    - RegionLabel_Kangch | Empty     | Marker for "KANGCHENJUNGA / MAKALU" optional label (shot 05).
  Visibility: driven by compositor; 3D objects are just position references
  Notes: ALL text overlays in Chapter 0 are pre-rendered transparent-background PNG sequences
         loaded as Image nodes in the compositor (see §4 BLOCKING FIX #10), NOT as 3D
         bpy.types.Font objects. The ch0_reservoir.py approach of using make_year_ticker() and
         make_mass_counter() as 3D scene objects is NOT used in this chapter — the script
         document specifies compositor-layer text with precise opacity/timing constraints
         that 3D text cannot satisfy.

Collection: Sky_Lighting
  Objects:
    - WC_Sun             | Light (Sun) | Animated sun lamp. Single sun object; its elevation,
                                         azimuth, and colour temperature are keyframed per shot
                                         group. See §5 fcurve table.
    - WC_World           | World      | Nishita sky texture. sky_type = "NISHITA". All sky
                                         parameters are keyframed to match the sun position per
                                         shot. Altitude parameter is keyframed to match camera
                                         altitude (affects atmospheric density in the sky model).
  Visibility: all frames
  Notes: setup_sky_lighting() from shared/render_settings.py sets a single sky state.
         For this chapter, the sky must animate — shot 01 is pre-dawn astronomical twilight
         (sun_elevation = -3°), shot 13 is midday (sun_elevation ≈ 55°). Keyframe the
         WC_Sun rotation_euler and the sky_tex.sun_elevation / sun_rotation inputs
         per shot group (not per frame — one keyframe per shot boundary is sufficient with
         CONSTANT interpolation at cuts and LINEAR between related shots).
```

---

## 2. Camera Rig

**Architecture:** Single camera object `SceneCamera` (bpy.types.Camera), position and rotation animated via keyframes. Hard cuts use CONSTANT interpolation at the cut frame (via `cameras_mod.set_constant_cut()`). The old script's approach of 5 keyframes for a single HKH flyover is replaced by **20 keyframes for 13 distinct shots** (post-Annapurna removal).

**Coordinate system:** All geographic coordinates map to Blender space via `cameras_mod._lonlat_alt_to_blender()` (inherited from shared module). The formula: `x = (lon − 83.0) × 96.126`, `y = (lat − 30.0) × 111.0`, `z = alt_m × 0.001`.

**Rotation convention:** `cam_obj.rotation_euler = (pitch_rad + π/2, 0.0, yaw_rad)` in XYZ euler order, where pitch_deg is the camera tilt from horizontal (negative = looking down).

---

### SHOT 01 — HKH Dawn: The Glory Moment (f001–f225)

```
Type: Orthographic (bpy.types.Camera.type = "ORTHO")
Geographic position: 84°E, 30°N, altitude 200,000 m
Blender location: (96.126, 0.0, 200.0)
Rotation: (math.radians(-60), 0.0, math.radians(80))
  [tilted ortho looking south-southeast — suppresses perspective distortion while
   showing the range as a diagonal white spine]
Ortho scale: 2000.0 (Blender units = km; shows ~2000 km of range width)
DOF: disabled (orthographic)
Frames: f001–f225 (BLOCKING FIX #5 — extended from 7.0s to 7.5s, +15 frames redistributed
                   from the removed Annapurna shot)
Camera movement: STATIC — absolutely no keyframe change within this shot.
  Single keyframe at f001. No keyframe at f225.
Transition to next: CUT at f226 via set_constant_cut(cam_obj, 225).
  The "movement" at cut to shot 02 IS the first motion after 7.5s stillness.

Blender API note:
  cam_data.type = "ORTHO"
  cam_data.ortho_scale = 2000.0
  scene.frame_set(1)
  cam_obj.location = _lonlat_alt_to_blender(84.0, 30.0, 200_000)
  cam_obj.rotation_euler = (math.radians(-60), 0.0, math.radians(80))
  cam_obj.keyframe_insert("location", frame=1)
  cam_obj.keyframe_insert("rotation_euler", frame=1)
```

---

### SHOT 02 — Karakoram Vigour: The Western Arc (f226–f300)

```
Type: Perspective
Geographic position start: 76°E, 36°N, altitude 80,000 m
Geographic position end: 80°E, 35.5°N, altitude 75,000 m (slow eastward drift)
Blender location start: ((76−83)×96.126, (36−30)×111.0, 80.0) = (−672.9, 666.0, 80.0)
Blender location end: ((80−83)×96.126, (35.5−30)×111.0, 75.0) = (−288.4, 610.5, 75.0)
Rotation: (math.radians(−45) + π/2, 0.0, math.radians(90))
  [pitch = -45° looking south-southeast across the range]
Focal length: 300.0 mm
DOF: disabled
Frames: f226–f300
Camera movement: SLOW LATERAL DRIFT — BEZIER interpolation.
  Keyframe at f226 (start position), keyframe at f300 (end position).
  F-curve interpolation: BEZIER with flat handles — eases in and out so the
  drift reads as breathing, not mechanical panning.
  Speed equivalent: ~40 km per second of screen time at 80 km altitude.

Transition to next: CUT at f301 via set_constant_cut(cam_obj, 300).
```

---

### SHOT 03 — The Grey River (f301–f375)

```
Type: Perspective
Geographic position start: 84°E, 28.5°N, altitude 30,000 m
Geographic position end: 84°E, 28.5°N, altitude 15,000 m (descending push)
Blender location start: (96.126, −166.5, 30.0)
Blender location end: (96.126, −166.5, 15.0)
Rotation: (math.radians(−55) + π/2, 0.0, math.radians(0))
Focal length: 200.0 mm
DOF: disabled
Frames: f301–f375
Camera movement: LINEAR PUSH — altitude drops from 30.0 to 15.0 BU linearly.
  Keyframe at f301 (z=30.0), keyframe at f375 (z=15.0).
  Simultaneously: slight eastward drift — add keyframe at f301 with x=96.126, at f375 with
  x=100.0 (approximately 84.4°E). BEZIER interpolation on x.

Transition to next: CUT at f376 via set_constant_cut(cam_obj, 375).
```

---

### SHOT 04 — Langtang / Yala Glacier (f376–f405)

```
Type: Perspective
Geographic position: 85.37°E, 28.14°N, altitude 2,000 m AGL
  Terrain at Yala Glacier: ~5,100 m ASL → camera at ~7,100 m ASL
Blender location: ((85.37−83)×96.126, (28.14−30)×111.0, 7.1) = (228.0, −206.5, 7.1)
Rotation: (math.radians(−70) + π/2, 0.0, math.radians(225))
Focal length: 85.0 mm
DOF: disabled (vast depth of field at this focal length at 2 km distance)
Frames: f376–f405
Camera movement: STATIC. Single keyframe at f376.
Transition to next: CUT at f406 via set_constant_cut(cam_obj, 405).
```

---

### SHOT 05 — Kangchenjunga / Makalu (f406–f435)

```
Type: Orthographic (canonical per BLOCKING FIX #7 — previous conditional
                    perspective/ortho framing from the removed Annapurna shot
                    is deleted; ortho is the production spec for this shot.)
Geographic position: 87.95°E, 27.82°N, altitude 8,000 m AGL
  Terrain at viewpoint: ~3,000 m → camera at ~11,000 m ASL
Blender location: ((87.95−83)×96.126, (27.82−30)×111.0, 11.0) = (475.8, −241.9, 11.0)
Rotation: (math.radians(−45) + π/2, 0.0, math.radians(100))
  [looking east-southeast at the Kangchenjunga massif right, Makalu left]
Ortho scale: equivalent compression to 200mm perspective at this distance.
DOF: disabled
Frames: f406–f435
Camera movement: STATIC. Single keyframe at f406.
Transition to next: CUT at f436 via set_constant_cut(cam_obj, 435).
  NOTE: This is a hard geographic jump from east Nepal to the Khumbu.
  The cut is the chapter's Beat 1→2 transition.
```

---

### SHOT 06 — Khumbu Icefall (f436–f495)

```
Type: Perspective
Geographic position: 86.851°E, 27.967°N, altitude ~5,865 m ASL (500 m AGL above Base Camp)
Blender location: ((86.851−83)×96.126, (27.967−30)×111.0, 5.865) = (370.4, −225.7, 5.865)
Rotation: (math.radians(−25) + π/2, 0.0, math.radians(155))
Focal length: 300.0 mm
DOF: enabled
  focus_distance: 2.0 BU (2 km — focused on mid-icefall)
  f_stop: 5.6 (moderate; background Lhotse face slightly soft but readable)
Frames: f436–f495
Camera movement: STATIC. Single keyframe at f436.
Headlamp point light: Add a small point light (energy 0.1, radius 0.002 BU = 2 m)
  at mid-icefall position (86.852°E, 27.964°N, ~6,200 m ASL). Animate it moving
  upward 50 m over frames f436–f495 (imperceptibly slow). See §5 for keyframes.
Transition to next: CUT at f496 via set_constant_cut(cam_obj, 495).
```

---

### SHOT 07 — Imja Descent (f496–f570)

```
Type: Perspective
Geographic position start: 86.867°E, 27.933°N, altitude 8,000 m ASL (3,000 m AGL)
Geographic position end: 86.920°E, 27.898°N, altitude 5,810 m ASL (800 m AGL above lake)
Blender location start: ((86.867−83)×96.126, (27.933−30)×111.0, 8.0) = (371.9, −229.6, 8.0)
Blender location end: ((86.92−83)×96.126, (27.898−30)×111.0, 5.81) = (376.9, −233.5, 5.81)
Rotation start: (math.radians(−55) + π/2, 0.0, math.radians(80))
Focal length start: 200.0 mm → end: 85.0 mm
DOF: disabled
Frames: f496–f570
Camera movement: BEZIER interpolation on all channels.
  The lake must NOT appear in frame during f496–f557 (first 2.0s).
  At f557 (end of descent), the moraine dam crest just clears the bottom of frame.
  BLOCKING FIX #6: TEST RENDER REQUIRED at f557 before production render to verify
  moraine dam geometry screens lake from camera at end-altitude (~800 m AGL).
  If the eastern two-thirds of the lake are visible from this altitude/angle,
  raise end-altitude or adjust camera trajectory.
Transition to next: CUT at f571 via set_constant_cut(cam_obj, 570).
  This cut IS the lake reveal.
```

---

### SHOT 08 — Imja Tsho Reveal (f571–f630)

```
Type: Perspective
Geographic position: 86.922°E, 27.899°N, altitude 5,310 m ASL (300 m AGL above lake)
  Lake surface: 5,010 m ASL
Blender location: ((86.922−83)×96.126, (27.899−30)×111.0, 5.31) = (377.1, −233.4, 5.31)
Rotation: (math.radians(−85) + π/2, 0.0, math.radians(260))
Focal length: 50.0 mm
DOF: disabled
Frames: f571–f630
Camera movement: STATIC. Single keyframe at f571.
Transition to next: DISSOLVE to shot 09 (3-frame dissolve via 1962 overlay opacity).
```

---

### SHOT 09 — 1962 Overlay (f631–f705)

```
Type: Perspective
Geographic position: IDENTICAL to shot 08
Blender location: IDENTICAL to shot 08 (377.1, −233.4, 5.31)
Rotation: IDENTICAL to shot 08
Focal length: 50.0 mm
Frames: f631–f705
Camera movement: STATIC. No keyframe needed (inherits shot 08's keyframe).
  The 1962 pond overlays are compositor elements, not 3D geometry.
Transition to next: CUT at f706 via set_constant_cut(cam_obj, 705).
```

---

### SHOT 10 — Calving Front Lateral Track (f706–f765)

```
Type: Perspective
Geographic position start: 86.934°E, 27.900°N, altitude 5,030 m ASL (20 m AGL above lake)
Geographic position end: 86.920°E, 27.900°N, altitude 5,030 m ASL
Blender location start: ((86.934−83)×96.126, (27.9−30)×111.0, 5.03) = (378.3, −233.1, 5.03)
Blender location end: ((86.92−83)×96.126, (27.9−30)×111.0, 5.03) = (376.9, −233.1, 5.03)
Rotation: (math.radians(−5) + π/2, 0.0, math.radians(180))
Focal length: 85.0 mm
DOF: enabled
  focus_distance: 0.15 BU (150 m — focused on ice cliff face)
  f_stop: 8.0
Frames: f706–f765
Camera movement: LINEAR westward drift.
  Keyframe at f706 (x=378.3), keyframe at f765 (x=376.9).
  Only x changes; y and z are CONSTANT.
Transition to next: CUT at f766 via set_constant_cut(cam_obj, 765).
```

---

### SHOT 11 — The Calving Event (f766–f810)

```
Type: Perspective
Geographic position: 86.930°E, 27.901°N, altitude 5,030 m ASL (20 m AGL)
Blender location: ((86.93−83)×96.126, (27.901−30)×111.0, 5.03) = (377.8, −233.0, 5.03)
Rotation: (math.radians(−10) + π/2, 0.0, math.radians(270))
Focal length: 135.0 mm
DOF: enabled
  focus_distance: 0.05 BU (50 m — sharp on the ice face)
  f_stop: 11.0
Frames: f766–f810
Camera movement: STATIC. ABSOLUTE. The camera does not move or pan to follow the
  calving event. This is the hardest constraint in the chapter. Single keyframe at f766.
  BLOCKING FIX #11: At f785, Imja_IceCliff_Full is hidden and Imja_IceCliff_PostCalving
  is shown; Calving_Block becomes visible (separate object, hand-keyed pivot animation).
  BLOCKING FIX #4: No sound design cue of any kind.
Transition to next: CUT at f811 via set_constant_cut(cam_obj, 810).
```

---

### SHOT 12 — Moraine Dam Orientation (f811–f840)

```
Type: Perspective
Geographic position: 86.906°E, 27.892°N, altitude 5,510 m ASL (500 m AGL)
Blender location: ((86.906−83)×96.126, (27.892−30)×111.0, 5.51) = (375.5, −233.8, 5.51)
Rotation: (math.radians(−65) + π/2, 0.0, math.radians(60))
Focal length: 35.0 mm
DOF: disabled
Frames: f811–f840
Camera movement: STATIC. Single keyframe at f811.
Transition to next: DISSOLVE to shot 13 (4-frame dissolve in compositor).
```

---

### SHOT 13 — Moraine Dam Final Hold (f841–f900)

```
Type: Perspective
Geographic position: 86.908°E, 27.893°N, altitude 5,210 m ASL (200 m AGL)
Blender location: ((86.908−83)×96.126, (27.893−30)×111.0, 5.21) = (375.7, −233.7, 5.21)
Rotation: (math.radians(−75) + π/2, 0.0, math.radians(60))
Focal length: 85.0 mm
DOF: disabled
Frames: f841–f900 (BLOCKING FIX #5 — extended from 1.5s to 2.0s, +15 frames
                   redistributed from the removed Annapurna shot)
Camera movement: STATIC. ABSOLUTE. No drift, no pull-back. Single keyframe at f841.
Transition to next: FADE TO BLACK. 10-frame fade (f891–f900 → black). Compositor.
  After fade: chapter-end UI (if required) appears, not over the final image.

CRITICAL: The last frame before the fade (f890) should show the subsidence hollow
  visible as a slight bowl-shaped depression in the moraine. BLOCKING FIX #14:
  SubsidenceHollow is a Mesh (shallow dish ~3 m diameter, 0.5 m deep, boolean
  subtracted from MoraineDam_Detail) — NOT an Empty. Do not add dramatic lighting
  to this feature — just ensure the midday sun catches its north-facing slope edge
  as a thin shadow line. The viewer notices without being directed.
```

---

## 3. Material Specifications

All materials are created via the shared `materials.py` module functions. New materials for this chapter extend that module with new factory functions. All use `_get_or_create()` for caching.

---

### MAT_IceClean
```
Material name in bpy: "wc_ice_clean"
Used on: Glacier_Clean_HKH (shots 01–02), Khumbu_Icefall (shot 06),
         Yala_Glacier (shot 04), Imja_IceCliff_Full (shots 08–11 f571–f784),
         Imja_IceCliff_PostCalving (shot 11 f785–f810), Calving_Block (shot 11)
Factory function: materials.make_ice_clean_material()  [NEW — add to materials.py]

Nodes: Principled BSDF
  Base Color: linear(#7DD3FC) = (0.4902, 0.8275, 0.9882, 1.0)
    [locked ice grammar color from WATER_CYCLE_SPEC.md §7]
  Roughness: 0.10
  Metallic: 0.0
  Subsurface Weight: 0.15
  Subsurface Radius: (0.35, 0.35, 0.45) in Blender units
  Subsurface Scale: 0.008 (8 m effective scatter path — appropriate for glacier seracs)
  Alpha: 1.0

Blender-specific notes:
  - In Cycles, enable "Screen Space Subsurface Scattering" for OIDN compatibility.
  - bsdf.subsurface_method = "RANDOM_WALK"  (Blender 5.x attribute name)
  - At orbital altitude (shots 01–02), SSS is not visible; the material reads as blue-white
    from the base color. The SSS only matters for shots 06, 08–11 (close-up ice faces).
  - For the Imja_IceCliff variants, add a Noise Texture → MixRGB (Multiply) over the base color
    to introduce subtle variance (blue patches more saturated than debris-stained patches).
    Keep the noise very fine (scale 50.0) and low contrast (0.1 factor).
```

---

### MAT_IceDebris
```
Material name in bpy: "wc_ice_debris"
Used on: Glacier_Debris_Nepal (shots 03, 06, 07), Imja_Glacier_Tongue (shots 07–10)
Factory function: materials.make_ice_debris_material()  [NEW — add to materials.py]

Nodes: Principled BSDF
  Base Color: (0.4784, 0.4314, 0.3765, 1.0)  [linear(#7A6E60) — grey-brown debris]
    Driven by texture: MixRGB between debris_color and pond_color, masked by
    a Noise Texture at scale 8.0 (supraglacial pond scatter pattern).
    pond_color = linear(#7EC8C0) = (0.48, 0.78, 0.75, 1.0)  [muted turquoise supraglacial ponds]
    pond_mask = Noise Texture, scale=8.0, detail=4.0, distortion=0.8
    Resulting color: predominantly grey-brown with ~8–12% of pixels showing pond turquoise.
  Roughness: 0.90
  Metallic: 0.0
  Subsurface Weight: 0.0 (no SSS — the ice is buried, not exposed)
  Normal: Musgrave Texture → Normal Map node at scale 2.0

Blender-specific notes:
  - This material intentionally looks UNSCENIC. The grey-brown must read from altitude.
  - The supraglacial pond color (#7EC8C0 muted turquoise) is distinct from Imja Tsho
    (#78C8C0): the ponds are darker, murkier, smaller. The muted_turquoise vs clean_turquoise
    distinction must be visible at shot 07 altitude.
  - The lateral moraine ice cliff exposures are separate objects (use MAT_IceClean);
    do NOT mix MAT_IceDebris and MAT_IceClean on the same object. Use separate mesh islands.
  - Flow lines (longitudinal banding) are added via a Voronoi Texture at scale 0.5,
    oriented along the glacier flow direction (Y-axis in Blender km space), mixed at
    0.08 factor over the base color.
```

---

### MAT_LakeWater
```
Material name in bpy: "wc_lake_imja"
Used on: ImjaTsho_2020, SuperglacialPonds (at reduced density)
Factory function: materials.make_imja_lake_material()  [NEW — replaces make_lake_material() for Imja]
Provenance classification: SCHEMATIC (volumetric Tyndall scattering is a physics approximation,
                                       not a measured colour from a 2020 satellite radiance).

THE CRITICAL REQUIREMENT: Imja Tsho must render as #78C8C0 (milky turquoise).
This is NOT the data grammar lake color (#0E7490 teal). The data grammar color
applies to map icons and data overlays. The water itself is physically-derived
glacial flour turquoise. These are two different things.

Nodes: MixShader between Surface and Volume, output to Material Output

  SURFACE shader (Principled BSDF):
    Base Color: linear(#78C8C0) = (0.4627, 0.7843, 0.7529, 1.0)
      Depth blend: MixRGB between #78C8C0 (shallow, near shore) and #4AACAA (>20 m depth)
      Blend factor driven by: Geometry → Position Z, mapped to 0–1 over 0–20 m depth range.
      Result: milky turquoise at surface, slightly deeper turquoise in the center.
    Roughness: 0.03
    Metallic: 0.0
    Specular: 0.5 (slight specular for afternoon glint)
    Alpha: 0.85
      [NEVER fully transparent — glacial flour makes the water opaque at all depths.
       The constraint from the shot list: "you cannot see the bottom in any part of the lake"]
    Transmission Weight: 0.0 (no refractive transmission — the water is opaque)

  VOLUME shader (Principled Volume):
    Color: (0.55, 0.90, 0.88, 1.0)  [linear of a slightly lighter turquoise]
    Density: 0.8
    Anisotropy: 0.3
    Absorption Color: (0.95, 0.60, 0.55, 1.0)
      [removes red/orange from transmitted light; combined with the scatter,
       the surviving wavelengths are blue-green — the Tyndall effect]
    Emission Strength: 0.0

  PERFORMANCE FALLBACK (if volume render time exceeds budget):
    Disable volume; use depth-blended surface shader only:
    Surface Base Color: mix between #94D4CC (shallow, near shore) and #78C8C0 (mid),
    and #4AACAA (>20m depth). Alpha = 0.85 hard cap. Verify #78C8C0 target hex is met
    in a masked-region median ΔE test (see §9 color gate) before committing to the fallback.

  WATER SURFACE RIPPLES (shots 08, 09, 10, 11):
    Add a Normal Map driven by Wave Texture (type RINGS, scale 150.0, distortion 0.4)
    to simulate capillary ripples (~2 cm wavelength). Map strength: 0.08.
    This does NOT change color; it adds texture to the specular highlight only.
    Disable for the calving shot (shot 11) water surface near the impact point — the
    Calving_Splash particle system handles the water surface deformation there.

Blender-specific notes:
  - Volume shaders require Cycles (not Eevee). In Eevee preview, use surface-only fallback.
  - Set mat.blend_method = "BLEND" and alpha = 0.85 for the surface BSDF.
  - The volume domain is the lake mesh itself (closed manifold required).
  - For Cycles volumetrics, set cycles.volume_max_steps = 64 in render settings.
    Use the "production_atmosphere" preset (256 spp) for shots 08–13 if volumetric
    quality is insufficient at 128 spp. Time budget: these 6 shots = 330 frames,
    the most expensive in the chapter.
  - COLOR VERIFICATION: see §9 canonical color gate (masked-region median ΔE).
    The legacy "sample center pixel of encoded output" test has been removed
    (it falsely flagged compliant renders due to chroma subsampling and color-
    management drift in encoded outputs).
```

---

### MAT_Terrain
```
Material name in bpy: "wc_terrain"
Used on: HKH_DEM_orbital, Nepal_DEM_regional, Langtang_DEM, Kangchenjunga_DEM, Imja_Basin_DEM
Factory function: materials.make_terrain_material()  [EXISTING — no change required]

Nodes: Principled BSDF with height-ramp ColorRamp
  Height stops:
    0.000 km: #7A6B5A (warm brown — plains/foothills)
    2.000 km: #475569 (locked slate base — mid range)
    4.000 km: #94A3B8 (lighter slate — upper rock)
    8.849 km: #E0F2FE (snow-white cyan — summit/permanent snow)
  Roughness: 0.75
  The ramp correctly produces the "brown plain / white spine" contrast needed for
  shot 01 at orbital altitude.

  SEASONAL SNOW OVERRIDE for shots 04–05 (regional close-ups):
    For Kangchenjunga (shot 05, post-monsoon), more fresh snow on upper faces:
    add a separate snow_overlay material blended via a driver on camera altitude.
    [Low priority; the base terrain ramp is adequate for the 1-second shots.]

Blender-specific notes:
  - At orbital altitude (shot 01, 200 km), the terrain mesh reads correctly with 256 quads.
    At Imja basin (shots 07–13), use 512 quads.
```

---

### MAT_MoraineDam
```
Material name in bpy: "wc_moraine_dam"
Used on: MoraineDam_Detail, portions of Imja_Basin_DEM at dam location, SubsidenceHollow
Factory function: materials.make_moraine_material()  [NEW — add to materials.py]
Provenance classification: SCHEMATIC

Nodes: Principled BSDF with procedural noise texture
  Base Color: linear(#7E7668) = (0.4902, 0.4588, 0.4118, 1.0)
  Roughness: 0.95 (Roughness 0.98 in SubsidenceHollow region)
  Metallic: 0.0
  Normal Map: Musgrave Texture at scale 4.0, strength 1.5

  SUBSIDENCE HOLLOW (BLOCKING FIX #14, shot 13):
    A separate Mesh object (SubsidenceHollow) — NOT an Empty — implemented as a
    shallow dish ~3 m diameter, 0.5 m deep, boolean subtracted from MoraineDam_Detail.
    The hollow uses the same MAT_MoraineDam material but with Roughness 0.98
    (slightly more disturbed surface in the subsidence area). The hollow is NOT
    labelled; it is a geometric feature only. It is visually consistent with the
    InSAR-documented dead-ice subsidence reported by Brencher, Henderson & Shean
    (2026): a 0.3 km² area of the moraine dam cumulatively subsided about
    90 cm over 2017–2024, with seasonal coherence changes indicating buried ice
    within the dam.

  OUTLET CHANNEL (shots 12–13):
    The 2016 UNDP control channel is a 0.5 m deep, 1–2 m wide incision through the
    moraine crest. It uses MAT_MoraineDam with Roughness 1.0 and a slightly darker
    base color (#5A5448). Render as geometry, not as a texture map.

Blender-specific notes:
  - MoraineDam_Detail should NOT use smooth shading. Flat shading required.
  - The dam must look like "any other moraine" — no visual cues of engineering or
    purpose. The "terrifying banality" is the point.
```

---

### MAT_Sky
```
Material: World Background (Nishita sky texture, not a mesh material)
Configuration: via render_settings.setup_sky_lighting(), extended with animation keyframes.

Shot 01 (f001–f225): sun_elevation = -3.0°, sun_azimuth = 80.0° (astronomical twilight)
  sky_tex.altitude = 200_000.0
Shot 02 (f226–f300): sun_elevation = 2.0°, sun_azimuth = 82.0° (first light)
  sky_tex.altitude = 80_000.0
Shot 03 (f301–f375): sun_elevation = 8.0°, sun_azimuth = 85.0° (early morning)
  sky_tex.altitude = 15_000.0
Shots 04–05 (f376–f435): sun_elevation = 12.0°–18.0°, azimuth 86.0°–90.0°
  sky_tex.altitude = 2_000.0–8_000.0
Shot 06 (f436–f495): sun_elevation = 18.0°, azimuth 88.0°
  sky_tex.altitude = 500.0
Shots 07–11 (f496–f810): sun_elevation = 45.0°–50.0°, azimuth 180.0° (overhead south)
  sky_tex.altitude = 0.0 (lake level)
Shots 12–13 (f811–f900): sun_elevation = 55.0°, azimuth 180.0° (midday)
  sky_tex.altitude = 0.0

Keyframe approach: CONSTANT interpolation at cuts; LINEAR between related shots (e.g.
                   shots 01→02 sun_elevation can be LINEAR to simulate sunrise).
```

---

## 4. Compositor Node Tree

The compositor handles: shot transitions, text overlays, color grading, the 1962 pond overlay, calving simulation composite, and final fade to black.

### Transitions

**Hard cuts (most shot boundaries):**
CONSTANT interpolation on camera keyframes — no special compositor node is needed for cuts.

**Dissolve 08→09 (shots f630→f631, 3-frame dissolve):**
```
Alpha Over node:
  This is rendered as a single scene; the "dissolve" is the 1962 overlay
  fading in over 3 frames via the overlay opacity driver.
```

**Dissolve 12→13 (shots f840→f841, 4-frame dissolve):**
```
Achieved via a 4-frame BEZIER fade between the shot 12 and shot 13 camera
keyframes at f840 and f841.
```

**Fade to black (f891–f900, 10 frames):**
```
Mix node (type: Mix):
  Input 1: Rendered image
  Input 2: Black (0, 0, 0)
  Fac: 0.0 at f891, 1.0 at f900 (LINEAR interpolation)
```

### Color Grading

```
Color Balance node:
  Lift:    (0.98, 0.99, 1.02)  [very slight cool shadow lift]
  Gamma:   (1.00, 1.00, 1.00)
  Gain:    (0.98, 0.99, 1.00)  [very slight warm highlight roll-off]

RGB Curves node:
  R curve: S-curve, very subtle — 5% contrast increase in shadows only
  G curve: flat
  B curve: very slight boost (+3%) in deep shadows only

Glare node:
  Type: BLOOM (NOT STREAKS)
  Iterations: 3
  Mix: −0.90
  Threshold: 0.85
```

### Vignette

```
Ellipse Mask node:
  Width: 1.4, Height: 1.2
  Mix factor: 0.25
```

### Compositor Text Overlay — bpy API (BLOCKING FIX #10)

Text overlays are implemented as **pre-rendered transparent-background PNG sequences** using Pillow or Blender's own text rendering at start-up. Text is NOT implemented as 3D `bpy.types.Font` objects.

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

```
Text overlay timing:

CONDITIONAL CHAPTER TITLE (f210–f225, optional):
  Text: "Chapter 0 — The Water That Was Ice"
  Position: bottom-left, 12pt equivalent, color #E8E4DC
  Opacity: 0→40% over 15 frames (never reaches full white)

LANGTANG label (f390–f405, optional):
  Text: "LANGTANG", xs, #E8E4DC, top-left
  Opacity: 5-frame fade in, hold, cut with shot

KANGCHENJUNGA / MAKALU label (f420–f435, optional):
  Text: "KANGCHENJUNGA / MAKALU", same spec as above

IMJA TSHO NAME (f600–f614, BLOCKING FIX #8 — shifted earlier):
  Text: "Imja Tsho", bottom-right, 14pt sm, weight 300, #E8E4DC
  Opacity: 0→100% over 10 frames (f600→f610), hold, cut at f614/f630
  Note: this label fades out by f614 to provide a 2-second text-free gap before
  the 1962 overlay starts fading in at f631.

1962 POND OVERLAY (f631–f689):
  Implementation: Pre-rendered PNG (1280×720 RGBA with alpha) of the 1962 pond
  outlines in #F5E090 (amber). See BLOCKING FIX #13 below.
  Opacity schedule: 0% at f631, 60% at f645, 60% at f675, 0% at f689.

1962 YEAR LABEL + DESCRIPTION (f631–f689, BLOCKING FIX #9):
  Two lines, description first:
    Line 1 (xs, #F5E090): "a cluster of meltwater pools"
    Line 2 (sm, #F5E090): "~0.03 km²"
  Plus "1962" header (sm, #F5E090) bottom-center.
  Opacity: 14-frame fade in, hold, 14-frame fade out.

2020 YEAR LABEL (f676–f705):
  Text: "2020", bottom-center, sm, weight 300, #F5E090
  Below: "~1.56 km²" (xs, same color)
  Opacity: 10-frame fade in, hold, 10-frame fade out
```

### 1962 Pond Overlay PNG production — BLOCKING FIX #13

Four to eight 1962 lake-precursor polygons are pre-rendered as RGBA PNGs (1280×720, transparent background) using GeoPandas + Matplotlib in the data preparation script `scripts/data/ch0_imja_overlays.py`. These PNGs are committed to `public/water-cycle/ch0/overlays/` and loaded as Image nodes in the compositor. The polygons are artistic approximations of the Research Brief description ("a cluster of small meltwater pools"). The script draws 6–8 irregular polygons in `#F5E090` (amber) with transparent background, each 100–200 m diameter in scene coordinates, scattered across the eastern two-thirds of the modern lake area (concentrated near 86°56'E). `data_layer.classification = "SCHEMATIC"` in provenance.json.

### Calving Water Simulation Composite (Shot 11)

```
The calving simulation (Mantaflow or FLIP Fluids) is rendered in a SEPARATE Blender scene
("Ch0_Calving_Sim") at 1280×720 and composited over the main render.

Separate scene setup:
  - Domain: 30 m × 30 m × 5 m box centered on calving impact point
  - Resolution: 80 (domain subdivisions)
  - Bake simulation before main render: cache to data/water-cycle/calving/
  - Render frames 766–810 (45 frames) from the calving scene
  - Output: PNG sequence with alpha at same resolution as main render

Compositor integration:
  Image node (calving simulation frames) → Alpha Over → Main Render

Calving_Block animation (BLOCKING FIX #11):
  - f766–f784: Block hidden (hide_render = True). Imja_IceCliff_Full visible.
  - f785: Pre-calving mesh swap — Imja_IceCliff_Full hidden;
          Imja_IceCliff_PostCalving shown. Calving_Block becomes visible.
  - f785–f793: Block pivot rotation (Rotation X keyframe: 0→-45° over 8 frames)
  - f794–f798: Block clear of cliff face, in freefall
  - f799: Block impacts lake surface (z = lake_surface_z = 5.010 BU)
  - f800–f810: Block sinks; opacity 1.0→0.0 over 10 frames

Constraint: Do not use a rigid body simulation for the calving block — it is
  hand-keyframed to guarantee determinism.
```

---

## 5. Animation fcurve Table

| Object | Property | Frame | Value | Interpolation |
|--------|----------|-------|-------|---------------|
| SceneCamera | location.x | 1 | 96.126 | CONSTANT |
| SceneCamera | location.y | 1 | 0.0 | CONSTANT |
| SceneCamera | location.z | 1 | 200.0 | CONSTANT |
| SceneCamera | rotation_euler.x | 1 | 0.524 (−60°+π/2) | CONSTANT |
| SceneCamera | rotation_euler.z | 1 | 1.396 (80°) | CONSTANT |
| SceneCamera | data.lens / ortho_scale | 1 | ortho 2000.0 | CONSTANT |
| SceneCamera | location.x | 226 | −672.9 | BEZIER |
| SceneCamera | location.y | 226 | 666.0 | BEZIER |
| SceneCamera | location.z | 226 | 80.0 | BEZIER |
| SceneCamera | location.x | 300 | −288.4 | BEZIER |
| SceneCamera | location.y | 300 | 610.5 | BEZIER |
| SceneCamera | location.z | 300 | 75.0 | BEZIER |
| SceneCamera | data.lens | 226 | 300.0 | CONSTANT |
| SceneCamera | location.z | 301 | 30.0 | LINEAR |
| SceneCamera | location.z | 375 | 15.0 | LINEAR |
| SceneCamera | data.lens | 301 | 200.0 | CONSTANT |
| SceneCamera | location | 376 | (228.0, −206.5, 7.1) | CONSTANT |
| SceneCamera | data.lens | 376 | 85.0 | CONSTANT |
| SceneCamera | location | 406 | (475.8, −241.9, 11.0) | CONSTANT |
| SceneCamera | data.ortho_scale | 406 | (200mm-equivalent) | CONSTANT |
| SceneCamera | location | 436 | (370.4, −225.7, 5.865) | CONSTANT |
| SceneCamera | data.lens | 436 | 300.0 | CONSTANT |
| SceneCamera | location.x | 496 | 371.9 | BEZIER |
| SceneCamera | location.y | 496 | −229.6 | BEZIER |
| SceneCamera | location.z | 496 | 8.0 | BEZIER |
| SceneCamera | location.x | 570 | 376.9 | BEZIER |
| SceneCamera | location.y | 570 | −233.5 | BEZIER |
| SceneCamera | location.z | 570 | 5.81 | BEZIER |
| SceneCamera | data.lens | 496 | 200.0 | BEZIER |
| SceneCamera | data.lens | 570 | 85.0 | BEZIER |
| SceneCamera | location | 571 | (377.1, −233.4, 5.31) | CONSTANT |
| SceneCamera | data.lens | 571 | 50.0 | CONSTANT |
| SceneCamera | location | 706 | (378.3, −233.1, 5.03) | LINEAR |
| SceneCamera | location.x | 765 | 376.9 | LINEAR |
| SceneCamera | data.lens | 706 | 85.0 | CONSTANT |
| SceneCamera | location | 766 | (377.8, −233.0, 5.03) | CONSTANT |
| SceneCamera | data.lens | 766 | 135.0 | CONSTANT |
| SceneCamera | location | 811 | (375.5, −233.8, 5.51) | CONSTANT |
| SceneCamera | data.lens | 811 | 35.0 | CONSTANT |
| SceneCamera | location | 841 | (375.7, −233.7, 5.21) | BEZIER |
| SceneCamera | data.lens | 841 | 85.0 | BEZIER |
| WC_Sun | rotation_euler | 1 | sun_elev=−3°, azimuth=80° | CONSTANT |
| WC_Sun | rotation_euler | 226 | sun_elev=2°, azimuth=82° | CONSTANT |
| WC_Sun | rotation_euler | 301 | sun_elev=8°, azimuth=85° | CONSTANT |
| WC_Sun | rotation_euler | 376 | sun_elev=12°, azimuth=87° | CONSTANT |
| WC_Sun | rotation_euler | 436 | sun_elev=18°, azimuth=88° | CONSTANT |
| WC_Sun | rotation_euler | 496 | sun_elev=30°, azimuth=170° | CONSTANT |
| WC_Sun | rotation_euler | 841 | sun_elev=55°, azimuth=180° | CONSTANT |
| WC_Sun | data.color | 1 | (1.0, 0.70, 0.40) | CONSTANT |
| WC_Sun | data.color | 301 | (1.0, 0.90, 0.80) | LINEAR |
| WC_Sun | data.color | 496 | (1.0, 0.97, 0.93) | LINEAR |
| Glacier_Clean_HKH | hide_render | 1 | False | CONSTANT |
| Glacier_Clean_HKH | hide_render | 376 | True | CONSTANT |
| Glacier_Debris_Nepal | hide_render | 1 | True | CONSTANT |
| Glacier_Debris_Nepal | hide_render | 301 | False | CONSTANT |
| Glacier_Debris_Nepal | hide_render | 496 | True | CONSTANT |
| Imja_Glacier_Tongue | hide_render | 1 | True | CONSTANT |
| Imja_Glacier_Tongue | hide_render | 496 | False | CONSTANT |
| Imja_IceCliff_Full | hide_render | 1 | True | CONSTANT |
| Imja_IceCliff_Full | hide_render | 571 | False | CONSTANT |
| Imja_IceCliff_Full | hide_render | 785 | True | CONSTANT |
| Imja_IceCliff_PostCalving | hide_render | 1 | True | CONSTANT |
| Imja_IceCliff_PostCalving | hide_render | 785 | False | CONSTANT |
| ImjaTsho_2020 | hide_render | 1 | True | CONSTANT |
| ImjaTsho_2020 | hide_render | 571 | False | CONSTANT |
| Khumbu_Icefall | hide_render | 1 | True | CONSTANT |
| Khumbu_Icefall | hide_render | 436 | False | CONSTANT |
| Khumbu_Icefall | hide_render | 496 | True | CONSTANT |
| Yala_Glacier | hide_render | 1 | True | CONSTANT |
| Yala_Glacier | hide_render | 376 | False | CONSTANT |
| Yala_Glacier | hide_render | 406 | True | CONSTANT |
| Langtang_DEM | hide_render | 1 | True | CONSTANT |
| Langtang_DEM | hide_render | 376 | False | CONSTANT |
| Langtang_DEM | hide_render | 406 | True | CONSTANT |
| Kangchenjunga_DEM | hide_render | 1 | True | CONSTANT |
| Kangchenjunga_DEM | hide_render | 406 | False | CONSTANT |
| Kangchenjunga_DEM | hide_render | 436 | True | CONSTANT |
| Calving_Block | hide_render | 1 | True | CONSTANT |
| Calving_Block | hide_render | 785 | False | CONSTANT |
| Calving_Block | hide_render | 811 | True | CONSTANT |
| Calving_Block | rotation_euler.x | 785 | 0.0 | BEZIER |
| Calving_Block | rotation_euler.x | 793 | −0.785 (−45°) | BEZIER |
| Calving_Block | location.z | 785 | 5.025 (ice cliff mid) | BEZIER |
| Calving_Block | location.z | 799 | 5.010 (lake surface) | BEZIER |
| Headlamp_Light | location.z | 436 | 6.180 BU | LINEAR |
| Headlamp_Light | location.z | 495 | 6.230 BU | LINEAR |
| Compositor.FadeToBlack.Fac | value | 891 | 0.0 | LINEAR |
| Compositor.FadeToBlack.Fac | value | 900 | 1.0 | LINEAR |
| Compositor.1962Overlay.Opacity | value | 631 | 0.0 | LINEAR |
| Compositor.1962Overlay.Opacity | value | 645 | 0.6 | CONSTANT |
| Compositor.1962Overlay.Opacity | value | 675 | 0.6 | LINEAR |
| Compositor.1962Overlay.Opacity | value | 689 | 0.0 | CONSTANT |

---

## 6. Data Pipeline

### Geographic data flow overview

```
public/glaciers/hkh/1990-points.geojson  ─┐
public/glaciers/hkh/2020-points.geojson  ─┤─ glaciers_mod.load_glaciers() ─┐
data/water-cycle/dem/srtm-hkh-30m.tif    ─┤─ dem_mod.load_dem_as_mesh() ───┤
data/water-cycle/lakes/imja-2020.geojson ─┤─ lakes_mod.load_lakes()  ──────┤
data/water-cycle/lakes/imja-1962-ponds.geojson ─ [compositor overlay PNG]  │
                                                                            ▼
                                                              Blender scene objects
                                                              render_frames() → tmp/ch0/####.exr
                                                              encode_mod.encode_chapter() → outputs
                                                              provenance_mod.write_provenance() → JSON
```

### Glacier point data filtering

Per-shot bbox filters for glacier loading:

| Shot group | Region | Bbox (W, S, E, N) | Max features | Material |
|---|---|---|---|---|
| 01–02 | Karakoram (HKH-wide) | [70, 33, 80, 37] | 200 (preview) / 500 (production) | MAT_IceClean |
| 01–02 | Full HKH (orbital view) | [70, 26, 95, 36] | 300 (preview) / 800 (production) | MAT_IceClean |
| 03 | Nepal Himalaya | [82, 27, 88, 30] | 150 / 400 | MAT_IceDebris |
| 06–07 | Khumbu | [86.7, 27.8, 87.1, 28.1] | 10 / 30 | MAT_IceDebris |

### Imja Tsho polygon construction (SCHEMATIC)

The Imja Tsho 2020 polygon is constructed from Research Brief coordinates — it is NOT a measured 2020 outline. The corresponding `data_layer.classification` in provenance.json is `"SCHEMATIC"`:

```python
IMJA_TSHO_2020_RING = [
    [86.9083, 27.8980],  # SW corner (near moraine dam outlet)
    [86.9400, 27.8960],  # SE corner (near calving front south shore)
    [86.9417, 27.9000],  # East end center (at calving front)
    [86.9410, 27.9030],  # NE corner (calving front north)
    [86.9100, 27.9050],  # NW corner (lake north shore)
    [86.9083, 27.8980],  # Close ring
]
```

### DEM resolution per geographic region

| Scene area | DEM source | Bbox | Blender mesh resolution | Usage |
|---|---|---|---|---|
| HKH orbital | SRTM 90m | [70, 26, 95, 36] | 256 × 256 quads | Shots 01–02 |
| Nepal regional | SRTM 30m | [83, 27, 88, 29] | 512 × 512 quads | Shots 03–05 |
| Khumbu | SRTM 30m / AW3D30 | [86.7, 27.8, 87.1, 28.1] | 512 × 512 quads | Shot 06 |
| Imja basin | SRTM 30m / AW3D30 | [86.85, 27.83, 87.05, 28.0] | 512 × 512 quads | Shots 07–13 |

---

## 7. Render Settings per Preset

| Setting | Preview (Eevee) | Scrub (Cycles) | Production (Cycles) | Production+Volumetrics |
|---|---|---|---|---|
| Engine | BLENDER_EEVEE | CYCLES | CYCLES | CYCLES |
| Samples | 16 | 64 | 128 | 256 |
| Resolution | 640 × 360 | 854 × 480 | 1280 × 720 | 1280 × 720 |
| Denoiser | None | OIDN | OIDN | OIDN |
| GPU device | OPTIX (if avail) | OPTIX | OPTIX | OPTIX |
| Volume max steps | N/A | 32 | 64 | 128 |
| Motion blur | Off | Off | Off | Off |
| Color management | Filmic | Filmic | Filmic | Filmic |
| Frame output | PNG 8-bit | EXR 16-bit | EXR 16-bit | EXR 16-bit |
| Est. render time | ~5–10 min | ~45–90 min | ~3–5 hrs | ~6–10 hrs |
| Est. GPU VRAM | ~4 GB | ~8 GB | ~12 GB | ~16 GB |

---

## 8. Encoding Pipeline

After render completes to `tmp/ch0/####.exr`:

```bash
# AV1 primary (cinematic.webm) — TARGET < 8 MiB
ffmpeg -y -framerate 30 -i "tmp/ch0/%04d.exr" \
  -c:v libsvtav1 -crf 32 -preset 6 -pix_fmt yuv420p -an \
  "public/water-cycle/ch0/cinematic.webm"

# H.264 fallback (cinematic.mp4) — TARGET < 16 MiB
ffmpeg -y -framerate 30 -i "tmp/ch0/%04d.exr" \
  -c:v libx264 -crf 21 -preset slow -pix_fmt yuv420p \
  -movflags +faststart \
  "public/water-cycle/ch0/cinematic.mp4"

# Scrub master (cinematic-scrub.webm) — TARGET < 6 MiB
ffmpeg -y -framerate 30 -i "tmp/ch0/%04d.exr" \
  -vf "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -g 15 -quality good -speed 4 -pix_fmt yuv420p \
  "public/water-cycle/ch0/cinematic-scrub.webm"

# Poster (poster.jpg) — frame 841 (Shot 13 final hold start, 1-indexed)
POSTER_FRAME=841
ffmpeg -y -i "tmp/ch0/$(printf '%04d' $POSTER_FRAME).exr" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -q:v 2 \
  "public/water-cycle/ch0/poster.jpg"
```

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 65k glacier points OOM GPU during shots 01–02 | **High** | Render crash; VRAM exhausted | Use Geometry Nodes instancing or particle system. Cap at 800 features if instancing unavailable. |
| Imja Tsho water color fails canonical color gate | **High** | Chapter fails director test (color is the non-negotiable anchor) | See canonical color gate below (replaces legacy pixel-equality test). |
| Calving simulation (shot 11) produces waves > 15 cm or dramatic splash | **High** | Director constraint violated | Constrain: block volume 2.0–2.5 m³ max, fall height 1.5 m, domain resolution 80. Reduce block volume to 1.5 m³ if waves consistently exceed 15 cm. |
| SRTM DEM missing for Imja basin; procedural fallback has no moraine dam | **High** | Shots 12–13 moraine dam geometry missing; chapter loses its climax | MoraineDam_Detail is a separate hand-modelled overlay mesh (§1 scene graph). It does NOT depend on the DEM. |
| DEM download times out or rate-limited from OpenTopography | **Medium** | Script fails at data load | dem.py fallback chain already handles this. Pre-download tiles. |
| HKH orbital shots 01–02 look flat without atmospheric haze | **Medium** | Shot 01 reads as a data visualization | HKH_AtmosVolume (§1) provides Principled Volume scatter. |
| Calving_Block animation is deterministic but physics look wrong | **Medium** | Block pivots/falls unrealistically | Hand-keyed BEZIER with flat tangents ensures a slow pivot. |
| Nishita sky model unavailable in Blender 5.1 (API change) | **Low** | Sky falls back to gradient | setup_sky_lighting() has a fallback gradient sky. |
| Encoding: libsvtav1 not in ffmpeg build | **Low** | AV1 encode fails | Fall back to libvpx-vp9 for primary output. |

### Color gate (canonical — replaces legacy pixel-equality test)

Color verification runs in three stages, with different strictness at each:

1. **EXR source (canonical)**: mask the `ImjaTsho_2020` object render pass; compute median sRGB color over the masked region; compare to target `#78C8C0` using CIE ΔE2000; pass if ΔE ≤ 5. This is the scientific check.
2. **Poster JPG (perceptual)**: after color management to sRGB and JPEG encode, visual diff against `expected/poster-frame-841.jpg`; pass if mean ΔE ≤ 8.
3. **WebM/MP4 outputs**: visual QA only (Mother review). No automated pixel-equality test on encoded outputs — chroma subsampling, browser color management, and AV1/H.264 encoding all shift exact values.

Old method (per-channel ±5 on center pixel of encoded output) is removed: it falsely flagged compliant renders due to compression and color-management drift.

---

## 10. Determinism Plan

### Seed inventory

All random seeds are derived from the SHA-256 hash of the script file (`ch0_cinematic.py`) via `seed_mod.lock_seeds()`. This ensures seeds change only when the script changes.

| Seed source | Target | Value derivation |
|---|---|---|
| `seed_mod.lock_seeds(script_path)` | `bpy.context.scene.cycles.seed` | `int(sha256[:8], 16) & 0x7FFF_FFFF` |
| `seed_mod.lock_seeds(script_path)` | Python `random.seed()` | Same int value |
| DEM procedural fallback | `np.random.default_rng(42)` | Hard-coded seed 42 |
| Calving simulation | Pre-baked cache | Simulation baked once; cache files committed to `data/water-cycle/calving/`. |

**Critical: do NOT use `bpy.ops.fluid.bake_all()` in the render script for the calving simulation.** Mantaflow bakes are not seeded by Blender's Cycles seed.

### Blender version pinning

```
Blender: 5.1 (pin to 5.1.1 or the installed sub-version)
Path: C:\Program Files\Blender Foundation\Blender 5.1\blender.exe
Provenance field: blender_version = "5.1.1"
```

### SHA-256 verification

```python
import hashlib
script_hash = seed_mod.lock_seeds(Path(__file__))
output_files = [output_dir / f for f in
    ["cinematic.webm", "cinematic.mp4", "cinematic-scrub.webm", "poster.jpg"]]
hashes = {f.name: hashlib.sha256(f.read_bytes()).hexdigest() for f in output_files if f.exists()}
```

Determinism check: re-render with identical `seed.py` state and confirm `sha256(cinematic.webm)` matches across runs.

---

## 11. Mantaflow Cache Specification (BLOCKING FIX #12)

The calving simulation cache is pre-baked OpenVDB format. It must exist before render begins — if absent, the render script exits with an error.

**Cache location:** `data/water-cycle/calving/cache_fluid_####.vdb` (OpenVDB format, 45 frames f766–f810 using 1-indexed Blender frame numbers).

**bpy API to reference existing cache:**

```python
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
cache_path = project_root / "data/water-cycle/calving"

if not cache_path.exists() or not any(cache_path.glob("cache_fluid_*.vdb")):
    raise FileNotFoundError(
        f"Calving simulation cache absent at {cache_path}. "
        "Run the Mantaflow bake in Ch0_Calving_Sim.blend before production render."
    )

fluid_domain = bpy.data.objects["FluidDomain"]
fluid_mod = fluid_domain.modifiers["Fluid"]
fluid_mod.domain_settings.cache_directory = str(cache_path)
fluid_mod.domain_settings.cache_type = "REPLAY"
```

**Cache generation:** Run the Mantaflow bake in `Ch0_Calving_Sim.blend` (separate scene). Domain: 30 m × 30 m × 5 m, 80 subdivisions. Wave amplitude must not exceed 15 cm.

**Expected file count:** ~45 VDB files (`cache_fluid_0766.vdb` … `cache_fluid_0810.vdb`). Expected total cache size: ~200–400 MiB.

**Storage policy (CRITICAL — do not commit raw VDB to ordinary Git):** A 200–400 MiB binary blob in normal Git history is a repo-health failure. The render script does not commit this cache; it expects it to be present at render time via one of these four mechanisms (pick one before the first production render):

1. **Git LFS** — track `data/water-cycle/calving/*.vdb` via `.gitattributes`. Preferred if the team is already using LFS.
2. **Release artifacts** — bake locally; upload `ch0-calving-cache.tar.zst` as a GitHub release asset; `scripts/data/fetch_ch0_calving_cache.sh` runs `gh release download` on first invocation.
3. **Object storage** — Vercel Blob, S3, or R2; fetch script downloads to `data/water-cycle/calving/`.
4. **Local-only deterministic bake** — `scripts/data/bake_ch0_calving.py` runs once per developer; cache directory is gitignored; CI bakes its own copy.

If the cache is missing at render time, the render script exits with `FileNotFoundError` (see Cache reference block above). Do NOT add a fallback that re-simulates inline — Mantaflow is not Cycles-seed-deterministic, and re-simulation breaks byte-identical re-render.

---

## 12. Provenance JSON Specification

The `write_provenance()` function from `shared/provenance.py` is called at the end of `ch0_cinematic.py`. Each `scene_layer` entry carries a `classification` field corresponding to the data-classification tier (`"data_locked"`, `"schematic"`, or `"artistic"`). The frontend Provenance Peel UI surfaces this tier so viewers can see which layers are measured vs. interpreted.

```json
{
  "chapter_id": "ch0",
  "shot_id": "hkh-13shot-cinematic",
  "duration_s": 30,
  "frames": 900,
  "fps": 30,
  "resolution": { "w": 1280, "h": 720 },
  "camera_path": {
    "keyframes": [
      { "t": 0.033, "lon": 84.0, "lat": 30.0, "alt_m": 200000, "pitch_deg": -60, "yaw_deg": 80 },
      { "t": 7.533, "lon": 76.0, "lat": 36.0, "alt_m": 80000, "pitch_deg": -45, "yaw_deg": 90 },
      { "t": 10.0,  "lon": 80.0, "lat": 35.5, "alt_m": 75000, "pitch_deg": -45, "yaw_deg": 90 },
      { "t": 10.033,"lon": 84.0, "lat": 28.5, "alt_m": 30000, "pitch_deg": -55, "yaw_deg": 0 },
      { "t": 12.5,  "lon": 84.0, "lat": 28.5, "alt_m": 15000, "pitch_deg": -55, "yaw_deg": 0 },
      { "t": 12.533,"lon": 85.37,"lat": 28.14,"alt_m": 7100,  "pitch_deg": -70, "yaw_deg": 225 },
      { "t": 13.533,"lon": 87.95,"lat": 27.82,"alt_m": 11000, "pitch_deg": -45, "yaw_deg": 100 },
      { "t": 14.533,"lon": 86.851,"lat": 27.967,"alt_m":5865, "pitch_deg": -25, "yaw_deg": 155 },
      { "t": 16.533,"lon": 86.867,"lat": 27.933,"alt_m":8000, "pitch_deg": -55, "yaw_deg": 80 },
      { "t": 19.0,  "lon": 86.92, "lat": 27.898,"alt_m":5810, "pitch_deg": -55, "yaw_deg": 80 },
      { "t": 19.033,"lon": 86.922,"lat": 27.899,"alt_m":5310, "pitch_deg": -85, "yaw_deg": 260 },
      { "t": 23.533,"lon": 86.934,"lat": 27.9,  "alt_m":5030, "pitch_deg": -5,  "yaw_deg": 180 },
      { "t": 25.533,"lon": 86.93, "lat": 27.901,"alt_m":5030, "pitch_deg": -10, "yaw_deg": 270 },
      { "t": 27.033,"lon": 86.906,"lat": 27.892,"alt_m":5510, "pitch_deg": -65, "yaw_deg": 60 },
      { "t": 28.033,"lon": 86.908,"lat": 27.893,"alt_m":5210, "pitch_deg": -75, "yaw_deg": 60 }
    ]
  },
  "scene_layers": [
    {
      "id": "terrain-hkh-orbital",
      "type": "raster",
      "classification": "data_locked",
      "source": {
        "dataset": "SRTM GL1 30m DEM (OpenTopography SRTMGL1_E) / Copernicus GLO-30",
        "url": "https://portal.opentopography.org/raster?opentopoID=OTSRTM.082015.4326.1",
        "doi": "10.5069/G9445JDF",
        "filter": "HKH bbox [70°E, 26°N, 95°E, 36°N]; resampled to 256×256 for orbital shots"
      },
      "render_geometry_id": "HKH_DEM_orbital",
      "color": "#475569"
    },
    {
      "id": "terrain-imja-basin",
      "type": "raster",
      "classification": "data_locked",
      "source": {
        "dataset": "SRTM GL1 30m DEM — Imja basin sub-tile",
        "doi": "10.5069/G9445JDF",
        "filter": "Imja basin [86.85°E, 27.83°N, 87.05°E, 28.0°N]; 512×512 quads"
      },
      "render_geometry_id": "Imja_Basin_DEM",
      "color": "#475569"
    },
    {
      "id": "glacier-hkh-karakoram-clean",
      "type": "particle-system",
      "classification": "data_locked",
      "source": {
        "dataset": "ICIMOD HKH Glacier Inventory (1990 and 2020 combined for visual clarity)",
        "doi": "10.26066/rds.1972729",
        "filter": "Karakoram bbox [70°E, 33°N, 80°E, 37°N]; point geometry instanced as disc meshes"
      },
      "render_geometry_id": "Glacier_Clean_HKH",
      "color": "#7DD3FC"
    },
    {
      "id": "glacier-yala-clean",
      "type": "polygon-flat",
      "classification": "data_locked",
      "source": {
        "dataset": "Yala Glacier outline (Research Brief §1 Zone 3)",
        "doi": "10.26066/rds.1972729",
        "filter": "Yala Glacier, Langtang [85.55–85.65°E, 28.20–28.28°N]; ~1.3 km² debris-free"
      },
      "render_geometry_id": "Yala_Glacier",
      "color": "#7DD3FC"
    },
    {
      "id": "glacier-khumbu-icefall",
      "type": "polygon-flat",
      "classification": "data_locked",
      "source": {
        "dataset": "Khumbu Glacier icefall zone (RGI 7.0)",
        "doi": "10.26066/rds.1972729",
        "filter": "Khumbu Icefall zone [86.83–86.87°E, 27.95–28.0°N]; clean-ice upper section only"
      },
      "render_geometry_id": "Khumbu_Icefall",
      "color": "#7DD3FC"
    },
    {
      "id": "glacier-imja-tongue",
      "type": "polygon-flat",
      "classification": "schematic",
      "source": {
        "dataset": "Imja Glacier debris-covered tongue — schematic reconstruction from Research Brief §2",
        "doi": "10.26066/rds.9362830",
        "filter": "Schematic reconstruction: Imja Glacier tongue terminus approximated from Research Brief description; NOT the measured 2020 outline."
      },
      "render_geometry_id": "Imja_Glacier_Tongue",
      "color": "#475569"
    },
    {
      "id": "lake-imja-tsho-2020",
      "type": "polygon-flat",
      "classification": "schematic",
      "source": {
        "dataset": "Imja Tsho 2020 outline — schematic reconstruction",
        "doi": "10.5194/tc-8-1661-2014",
        "year_keyframe": 2020,
        "filter": "Schematic reconstruction: polygon vertices constructed from Research Brief §2 coordinates and area (1.56 km²); the actual measured 2020 outline is not in the repo's atlas data.",
        "preprocessing": [
          "Polygon vertices constructed from Research Brief §2 coordinates (NOT a measured 2020 polygon)",
          "Area ~1.56 km² consistent with Somos-Valenzuela et al. (2014) DOI:10.5194/tc-8-1661-2014"
        ]
      },
      "render_geometry_id": "ImjaTsho_2020",
      "color": "#78C8C0"
    },
    {
      "id": "lake-imja-tsho-1962-overlay",
      "type": "polygon-flat",
      "classification": "schematic",
      "source": {
        "dataset": "Imja Tsho 1962 meltwater pond outlines — artistic approximation",
        "doi": "10.5194/tc-8-1661-2014",
        "year_keyframe": 1962,
        "filter": "Schematic reconstruction: ~0.03 km² cluster of small ponds on glacier surface; rendered as compositor 2D overlay only; NOT digitized from Corona imagery.",
        "preprocessing": [
          "Pond outlines are artistic approximations consistent with published 1962 Imja basin state",
          "Do not claim these are precise reconstructions of 1962 pond boundaries"
        ]
      },
      "render_geometry_id": "ImjaTsho_1962_Overlay",
      "color": "#F5E090"
    },
    {
      "id": "moraine-dam-imja",
      "type": "polygon-extrusion",
      "classification": "schematic",
      "source": {
        "dataset": "Imja moraine dam geometry — schematic reconstruction",
        "doi": "10.5194/tc-20-67-2026",
        "filter": "Schematic reconstruction: moraine dam at 86°54'20\"E, 27°53'30\"N; height 40–50 m above valley floor per Research Brief §2; exact 3D form is constructed. Includes SubsidenceHollow (~3 m diameter, 0.5 m deep) — visual interpretation of Brencher, Henderson & Shean 2026 InSAR-documented dead-ice subsidence (a 0.3 km² area of the moraine dam cumulatively subsided about 90 cm over 2017–2024)."
      },
      "render_geometry_id": "MoraineDam_Detail",
      "color": "#7E7668"
    },
    {
      "id": "sky-atmosphere",
      "type": "raster",
      "classification": "artistic",
      "source": {
        "dataset": "Nishita sky model (Blender built-in procedural atmosphere)",
        "filter": "Animated sun elevation -3° to 55°; altitude 200,000 m to 0 m; matches camera altitude per shot"
      },
      "render_geometry_id": "WC_World_Sky",
      "color": "#0D1B3E"
    }
  ],
  "headline_numbers": [
    {
      "value": "~0.03 km² → ~1.56 km²",
      "label": "Imja Tsho area growth 1962–2020",
      "citation": "doi:10.5194/tc-8-1661-2014",
      "uncertainty": "±0.05 km² (2020 estimate)"
    },
    {
      "value": "61.7 ± 3.7 million m³",
      "label": "Imja Tsho lake volume (2012 survey)",
      "citation": "doi:10.5194/tc-8-1661-2014",
      "uncertainty": "±3.7 million m³ (95% CI)"
    },
    {
      "value": "40–74 m/yr",
      "label": "Imja Glacier retreat rate range (1961–2006)",
      "citation": "doi:10.5194/tc-8-1661-2014"
    },
    {
      "value": "~90 cm over 2017–2024",
      "label": "Cumulative moraine dam subsidence (InSAR + SAR feature tracking)",
      "citation": "doi:10.5194/tc-20-67-2026"
    }
  ],
  "caption_text": "Imja Tsho did not exist as a lake in 1962 — it was a cluster of small meltwater pools on the glacier surface. By 2020 it had grown to approximately 1.56 km². A moraine dam of loose, unconsolidated glacial debris retains 61.7 million cubic metres of water. Satellite InSAR and SAR feature tracking show that a 0.3 km² area of the dam cumulatively subsided about 90 centimetres over 2017–2024, with seasonal coherence changes indicating buried ice within the dam. The dam makes no sound.",
  "generated_at": "[ISO 8601 UTC timestamp at runtime]",
  "blender_version": "5.1.1",
  "bpy_script_hash": "[64-char SHA-256 hex of ch0_cinematic.py]",
  "_used_real_dem": true,
  "_output_hashes": {
    "cinematic.webm": "[SHA-256 of rendered file]",
    "cinematic.mp4": "[SHA-256 of rendered file]",
    "cinematic-scrub.webm": "[SHA-256 of rendered file]",
    "poster.jpg": "[SHA-256 of rendered file]"
  }
}
```

**Provenance schema compliance notes:**
- `chapter_id` must be `"ch0"`.
- `shot_id` is `"hkh-13shot-cinematic"` (post-Annapurna-removal).
- Each `scene_layers[]` entry carries a `classification` field: `"data_locked"`, `"schematic"`, or `"artistic"`. The frontend Provenance Peel UI surfaces this tier.
- For `"schematic"` entries, the source `filter` description begins with `"Schematic reconstruction:"`.
- `resolution` must be `{"w": 1280, "h": 720}`.

---

## Appendix A: New Factory Functions Required in materials.py

```python
def make_ice_clean_material() -> bpy.types.Material:
    """Clean glacier ice with SSS translucency. Shots 01–02, 04, 06, 08–11."""
    mat = _get_or_create("wc_ice_clean")
    return mat

def make_ice_debris_material() -> bpy.types.Material:
    """Debris-covered glacier. Grey-brown with supraglacial pond scatter. Shots 03, 06, 07, 10."""
    mat = _get_or_create("wc_ice_debris")
    return mat

def make_imja_lake_material() -> bpy.types.Material:
    """Imja Tsho milky turquoise water. Target: #78C8C0. Shots 08–13.

    Verification: see canonical color gate in §9 (masked-region median ΔE on EXR source).
    """
    mat = _get_or_create("wc_lake_imja")
    return mat

def make_moraine_material() -> bpy.types.Material:
    """Loose unconsolidated glacial till for moraine dam. Shots 12–13."""
    mat = _get_or_create("wc_moraine_dam")
    return mat
```

## Appendix B: Script Invocation

```bash
# Production render
"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" \
  --background \
  --python scripts/render/water-cycle/ch0_cinematic.py \
  -- \
  --output public/water-cycle/ch0/cinematic.webm \
  --provenance public/water-cycle/ch0/provenance.json \
  --preset production
```

---

*End of Chapter 0 Technical Specification*
*This document is the authoritative reference for ch0_cinematic.py (new version).*
*All constraints derive from ch0-frame-map.yaml (canonical machine-readable), ch0-storyboard.md (canonical human-readable), and ch0-research-brief.md.*
*Any conflict between this spec and ch0-frame-map.yaml / ch0-storyboard.md: those documents take precedence.*
