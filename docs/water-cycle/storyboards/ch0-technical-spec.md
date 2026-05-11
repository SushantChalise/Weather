# Chapter 0 — Technical Specification
*Role: Blender Technical Director / Pipeline Engineer*
*Date: 2026-05-11*
*Target script: `scripts/render/water-cycle/ch0_cinematic.py` (new version)*
*Do NOT use `ch0_reservoir.py` as a structural template — that script served a different storyboard.*

---

## Overview

Chapter 0 ("The Water That Was Ice") is a 30-second, 900-frame cinematic covering 14 shots across three beats. It spans spatial scales from 200 km orbital altitude (shots 01–02) down to 20 m above lake surface (shots 11–12). The scene uses **five distinct geographic areas**, each requiring its own DEM resolution and camera rig. The most technically demanding element is the Imja Tsho water shader, which must hit hex `#78C8C0` with volumetric Tyndall-scattering physics. The calving event (shot 12) uses a pre-baked particle/fluid simulation composited over the lake render.

**Hard constraints from WATER_CYCLE_SPEC.md §7 (none negotiable):**
- Resolution: 1280 × 720 @ 30 fps
- Duration: 30 s = 900 frames (frame indices 0–899 inclusive in Blender; note the old script used 0-indexed, this spec continues that convention)
- Engine: Cycles 128 spp + OIDN for production; Eevee for preview
- GPU: NVIDIA OPTIX path tracing
- Output: `public/water-cycle/ch0/cinematic.webm` (AV1 primary), `cinematic.mp4` (H.264), `cinematic-scrub.webm` (scrub master), `poster.jpg` (frame 855 — Shot 14 moraine dam, the chapter's last non-black frame)
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
    - SceneCamera        | Camera    | Single animated camera; all shots share this object
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
  Visibility: frames 0–360 (shots 01–03)
  Notes: At 200 km altitude the individual DEM quads are not resolved; the terrain reads
         as a textured surface. Resolution 256 is sufficient and keeps GPU memory within
         bounds. Use dem_mod.load_dem_as_mesh() with resolution=256.

Collection: Terrain_Nepal
  Objects:
    - Nepal_DEM_regional | Mesh      | CopDEM 30m (or SRTM 30m fallback), bbox [83–88°E, 27–29°N].
                                       512-quad res. Used for shots 03–08. Material: MAT_Terrain.
    - Langtang_DEM       | Mesh      | Sub-tile DEM, bbox [85.25–85.75°E, 28.0–28.5°N], 256-quad.
                                       Shot 04 only.
    - Annapurna_DEM      | Mesh      | Sub-tile DEM, bbox [83.5–84.5°E, 28.2–29.0°N], 256-quad.
                                       Shot 05 only.
    - Kangchenjunga_DEM  | Mesh      | Sub-tile DEM, bbox [87.5–88.5°E, 27.3–28.1°N], 256-quad.
                                       Shot 06 only.
  Visibility: frames 286–510 (shots 03–08). Langtang/Annapurna/Kang sub-tiles additionally
              hidden when not in their respective shot's frame window (see notes).
  Notes: The three regional sub-tiles are expensive. Gate visibility: Langtang_DEM only
         renders frames 361–390, Annapurna_DEM only 391–420, Kangchenjunga_DEM only 421–450.
         Use hide_render keyframes. Overlap is intentional (adjacent shots may see edges).

Collection: Terrain_Imja
  Objects:
    - Imja_Basin_DEM     | Mesh      | ALOS AW3D30 or SRTM 30m, bbox [86.85–87.05°E, 27.83–28.0°N].
                                       512-quad res. Moraine dam geometry (40–50 m rise above
                                       valley floor at ~86°54'30"E) must be topographically correct.
                                       If real DEM is absent, the moraine dam must be manually
                                       sculpted into the procedural fallback — it is the chapter's
                                       visual pivot in beat 3.
    - MoraineDam_Detail  | Mesh      | Hand-modelled overlay mesh providing boulder-scale detail
                                       on the dam crest. Applied over the DEM. Material: MAT_MoraineDam.
                                       Includes the subsidence hollow (~5–8 m diameter, ~0.5 m deep).
    - SubsidenceHollow   | Empty     | Locator for the subsidence hollow position.
                                       Used to position MAT_MoraineDam subsidence in procedural noise.
    - PrayerFlag_String  | Mesh      | Single faded prayer flag string, one end unattached (trailing).
                                       Located on moraine crest. Visible shots 13–14 only.
                                       Material: flat diffuse, #A87848 (faded orange-red).
  Visibility: frames 511–899 (shots 08–14). PrayerFlag_String: frames 826–899 only.
  Notes: The moraine dam at 86°54'20"E must read as 40–50 m higher than the Imja Khola
         valley floor below it. Cross-check DEM against Research Brief coordinates. If the
         DEM flattens this feature, sculpt-correct in Blender edit mode or use a displacement
         modifier with a hand-drawn mask.

Collection: Glaciers
  Objects:
    - Glacier_Clean_HKH  | Instances | Karakoram clean glaciers for shots 01–02. Point-cloud
                                       representation or instanced billboard meshes (see §6).
                                       Material: MAT_IceClean.
    - Glacier_Debris_Nepal | Instances | Nepal debris-covered glaciers for shots 03, 07, 08.
                                         Material: MAT_IceDebris.
    - Imja_Glacier_Tongue | Mesh      | Debris-covered lower tongue of Imja Glacier.
                                        Bbox: 86°54'–87°00'E, 27°53'–27°55'N.
                                        Used shots 08–11. Material: MAT_IceDebris.
    - Imja_IceCliff       | Mesh      | The calving face — 10–15 m above waterline, at
                                        ~86°56'E. Separate mesh so it can receive
                                        MAT_IceClean (blue-white fresh ice) with debris band
                                        overlay. Used shots 09–12.
    - Khumbu_Icefall      | Mesh      | Simplified serac geometry for Khumbu Icefall.
                                        Located at ~86°51'E, 27°58'N. Material: MAT_IceClean.
                                        Shot 07 only.
    - Yala_Glacier        | Mesh      | Clean plateau glacier, bbox [85.55–85.65°E, 28.20–28.28°N].
                                        Material: MAT_IceClean. Shot 04 only.
  Visibility: Per-object hide_render keyframes (see §5 fcurve table).
  Notes: Karakoram glaciers in shots 01–02 must NOT show debris material. Nepal glaciers in
         shots 03+ must NOT show clean ice material except at lateral cliff exposures.
         The material binary (clean vs debris) is the chapter's core visual argument.

Collection: LakeSystem
  Objects:
    - ImjaTsho_2020      | Mesh      | Flat polygon mesh at z=5.010 km (lake surface altitude).
                                       Polygon derived from Research Brief: western end ~86°54'30"E,
                                       eastern end ~86°56'30"E, width ~550 m N-S. Area ~1.56 km².
                                       Material: MAT_LakeWater. Active shots 09–14.
    - ImjaTsho_1962_Overlay | Empty  | Parent for 1962 pond outlines (see §4 compositor).
                                        Not a 3D mesh — the 1962 ponds are rendered in the
                                        compositor as 2D overlay vectors, not 3D geometry.
    - ImjaKhola_Stream   | Mesh      | Braided stream channel below the moraine dam.
                                       Material: MAT_River (existing make_river_material() from
                                       shared/materials.py, #38BDF8 but with opacity 0.8 and
                                       milky white additive mix to simulate glacial turbidity).
                                       Shots 13–14 only.
    - SuperglacialPonds  | Instances | Small milky-turquoise ponds scattered on Imja_Glacier_Tongue
                                        surface. Use instanced disc meshes, 20–30 instances.
                                        Material: MAT_LakeWater at shallow depth setting.
                                        Shots 08, 11 visible.
    - Calving_Block      | Mesh      | Pre-keyframed ice block for shot 12. 2.0 m × 1.5 m × 0.8 m
                                        (2.4 m³, within 2–2.5 m³ spec). Animated pivot from ice
                                        cliff into lake. Material: MAT_IceClean (fresh break).
    - Calving_Splash     | Particles | Mantaflow or particle system for splash/wave. Baked cache.
                                        Domain: 30 m × 30 m × 5 m box at calving point.
                                        Wave amplitude: max 15 cm. Shot 12 only.
  Visibility: ImjaTsho_2020 frames 586–899; ImjaKhola_Stream 826–899;
              Calving_Block and Calving_Splash 781–825 only.
  Notes: ImjaTsho_2020 must NEVER be hidden during shots 09–14. The lake color is the
         chapter's non-negotiable visual anchor.

Collection: DataOverlays_2D
  Objects:
    - ChapterTitle_Text  | Empty     | Marker only — chapter title is a compositor overlay,
                                       not 3D geometry. Renders via compositor (see §4).
    - ImjaTsho_Label     | Empty     | Marker for "Imja Tsho" name label placement (shot 09).
    - Overlay_1962_Ponds | Empty     | Marker for 1962 pond vector overlay (shot 10).
    - RegionLabel_Langtang | Empty   | Marker for "LANGTANG" optional label (shot 04).
    - RegionLabel_Annapurna | Empty  | Marker for "ANNAPURNA" optional label (shot 05).
    - RegionLabel_Kangch | Empty     | Marker for "KANGCHENJUNGA / MAKALU" optional label (shot 06).
  Visibility: driven by compositor; 3D objects are just position references
  Notes: ALL text overlays in Chapter 0 are generated in the Blender compositor (Image →
         Text node or external SVG) or in the front-end HTML/CSS, NOT as 3D bpy.types.Font
         objects. The ch0_reservoir.py approach of using make_year_ticker() and
         make_mass_counter() as 3D scene objects is NOT used in this chapter — the script
         document specifies compositor-layer text with precise opacity/timing constraints
         that 3D text cannot satisfy. Use the compositor approach described in §4.

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
         (sun_elevation = -3°), shot 14 is midday (sun_elevation ≈ 55°). Keyframe the
         WC_Sun rotation_euler and the sky_tex.sun_elevation / sun_rotation inputs
         per shot group (not per frame — one keyframe per shot boundary is sufficient with
         CONSTANT interpolation at cuts and LINEAR between related shots).
```

---

## 2. Camera Rig

**Architecture:** Single camera object `SceneCamera` (bpy.types.Camera), position and rotation animated via keyframes. Hard cuts use CONSTANT interpolation at the cut frame (via `cameras_mod.set_constant_cut()`). The old script's approach of 5 keyframes for a single HKH flyover is replaced by 22 keyframes for 14 distinct shots.

**Coordinate system:** All geographic coordinates map to Blender space via `cameras_mod._lonlat_alt_to_blender()` (inherited from shared module). The formula: `x = (lon − 83.0) × 96.126`, `y = (lat − 30.0) × 111.0`, `z = alt_m × 0.001`.

**Rotation convention:** `cam_obj.rotation_euler = (pitch_rad + π/2, 0.0, yaw_rad)` in XYZ euler order, where pitch_deg is the camera tilt from horizontal (negative = looking down).

---

### SHOT 01 — HKH Dawn: The Glory Moment (f001–f210)

```
Type: Orthographic (bpy.types.Camera.type = "ORTHO")
Geographic position: 84°E, 30°N, altitude 200,000 m
Blender location: (96.126, 0.0, 200.0)
Rotation: (−π/2, 0.0, 0.0) — looking straight down
  [Camera looks straight down in orthographic mode; the range orientation
   is achieved via the scene's geographic layout, not camera tilt]
  NOTE: For the tilted view from the shot list (showing the range as a
  diagonal white spine), use rotation_euler = (−60° in rad, 0, 80° in rad)
  looking south-southeast. This tilted ortho still suppresses perspective distortion.
Ortho scale: 2000.0 (Blender units = km; shows ~2000 km of range width)
DOF: disabled (orthographic)
Frames: f001–f210
Camera movement: STATIC — absolutely no keyframe change within this shot.
  Single keyframe at f001. No keyframe at f210.
Transition to next: CUT at f211 via set_constant_cut(cam_obj, 210).
  The "movement" at cut to shot 02 IS the first motion after 7s stillness.

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

### SHOT 02 — Karakoram Vigour: The Western Arc (f211–f285)

```
Type: Perspective
Geographic position start: 76°E, 36°N, altitude 80,000 m
Geographic position end: 80°E, 35.5°N, altitude 75,000 m (slow eastward drift)
Blender location start: ((76−83)×96.126, (36−30)×111.0, 80.0) = (−672.9, 666.0, 80.0)
Blender location end: ((80−83)×96.126, (35.5−30)×111.0, 75.0) = (−288.4, 610.5, 75.0)
Rotation: (math.radians(−45) + π/2, 0.0, math.radians(90))
  [pitch = -45° looking south-southeast across the range]
Focal length: 300.0 mm
  [camera uses cam_data.type = "PERSP"; telephoto compresses Karakoram into a wall]
DOF: disabled
Frames: f211–f285
Camera movement: SLOW LATERAL DRIFT — BEZIER interpolation.
  Keyframe at f211 (start position), keyframe at f285 (end position).
  F-curve interpolation: BEZIER with flat handles — eases in and out so the
  drift reads as breathing, not mechanical panning.
  Speed equivalent: ~40 km per second of screen time at 80 km altitude.

fcurve interpolation:
  location: BEZIER, handles set to AUTO (Blender default for smooth ease)
  rotation: CONSTANT (no rotation change — stays pointing south-southeast)
  lens: CONSTANT (no focal length change)

Transition to next: CUT at f286 via set_constant_cut(cam_obj, 285).
```

---

### SHOT 03 — The Grey River (f286–f360)

```
Type: Perspective
Geographic position start: 84°E, 28.5°N, altitude 30,000 m
Geographic position end: 84°E, 28.5°N, altitude 15,000 m (descending push)
Blender location start: (96.126, −166.5, 30.0)
Blender location end: (96.126, −166.5, 15.0)
Rotation: (math.radians(−55) + π/2, 0.0, math.radians(0))
  [pitched at -55° looking north-northeast at the debris-covered glacier tongues]
Focal length: 200.0 mm
DOF: disabled
Frames: f286–f360
Camera movement: LINEAR PUSH — altitude drops from 30.0 to 15.0 BU linearly.
  Keyframe at f286 (z=30.0), keyframe at f360 (z=15.0).
  F-curve: LINEAR interpolation on location.z; CONSTANT on location.x and .y (no lateral move).
  Simultaneously: slight eastward drift — add keyframe at f286 with x=96.126, at f360 with
  x=100.0 (approximately 84.4°E). BEZIER interpolation on x.

Transition to next: CUT at f361 via set_constant_cut(cam_obj, 360).
```

---

### SHOT 04 — Langtang / Yala Glacier (f361–f390)

```
Type: Perspective
Geographic position: 85.37°E, 28.14°N, altitude 2,000 m AGL
  Terrain at Yala Glacier: ~5,100 m ASL → camera at ~7,100 m ASL
Blender location: ((85.37−83)×96.126, (28.14−30)×111.0, 7.1) = (228.0, −206.5, 7.1)
Rotation: (math.radians(−70) + π/2, 0.0, math.radians(225))
  [looking slightly south-southwest at the glacier on its plateau shelf]
Focal length: 85.0 mm
DOF: disabled (vast depth of field at this focal length at 2 km distance)
Frames: f361–f390
Camera movement: STATIC. Single keyframe at f361.
Transition to next: CUT at f391 via set_constant_cut(cam_obj, 390).
```

---

### SHOT 05 — Annapurna Sanctuary (f391–f420)

```
Type: Perspective (with note: switch to ORTHO if z-fighting occurs — see shot list)
Geographic position: 83.97°E, 28.34°N, altitude ~5,100 m ASL (1,000 m above Sanctuary floor)
Blender location: ((83.97−83)×96.126, (28.34−30)×111.0, 5.1) = (93.3, −184.3, 5.1)
Rotation: (math.radians(−20) + π/2, 0.0, math.radians(330))
  [tilted up -20° from horizontal looking north-northwest at the ring of peaks;
   camera is INSIDE the Sanctuary bowl, looking UP at the surrounding walls]
Focal length: 400.0 mm
  [telephoto compression stacks concentric peak rings into a single wall]
DOF: disabled (everything at similar distance in telephoto compression)
Frames: f391–f420
Camera movement: STATIC. Single keyframe at f391.
Z-fighting mitigation: if DEM quads at 400mm focal length produce z-fighting,
  increase cam_data.clip_start to 0.01 (10 m) and clip_end to 10000.0 (10,000 km).
Transition to next: CUT at f421 via set_constant_cut(cam_obj, 420).
```

---

### SHOT 06 — Kangchenjunga / Makalu (f421–f450)

```
Type: Perspective
Geographic position: 87.95°E, 27.82°N, altitude 8,000 m AGL
  Terrain at viewpoint: ~3,000 m → camera at ~11,000 m ASL
Blender location: ((87.95−83)×96.126, (27.82−30)×111.0, 11.0) = (475.8, −241.9, 11.0)
Rotation: (math.radians(−45) + π/2, 0.0, math.radians(100))
  [looking east-southeast at the Kangchenjunga massif right, Makalu left]
Focal length: 200.0 mm
DOF: disabled
Frames: f421–f450
Camera movement: STATIC. Single keyframe at f421.
Transition to next: CUT at f451 via set_constant_cut(cam_obj, 450).
  NOTE: This is a hard geographic jump from east Nepal to the Khumbu.
  The cut is the chapter's Beat 1→2 transition.
```

---

### SHOT 07 — Khumbu Icefall (f451–f510)

```
Type: Perspective
Geographic position: 86.851°E, 27.967°N, altitude ~5,865 m ASL (500 m AGL above Base Camp)
Blender location: ((86.851−83)×96.126, (27.967−30)×111.0, 5.865) = (370.4, −225.7, 5.865)
Rotation: (math.radians(−25) + π/2, 0.0, math.radians(155))
  [looking south-southeast at the Khumbu Icefall; slight downward tilt reveals
   both the icefall and the Base Camp moraine foreground]
Focal length: 300.0 mm
DOF: enabled
  focus_distance: 2.0 BU (2 km — focused on mid-icefall)
  f_stop: 5.6 (moderate; background Lhotse face slightly soft but readable)
Frames: f451–f510
Camera movement: STATIC. Single keyframe at f451.
Headlamp point light: Add a small point light (energy 0.1, radius 0.002 BU = 2 m)
  at mid-icefall position (86.852°E, 27.964°N, ~6,200 m ASL). Animate it moving
  upward 50 m over frames f451–f510 (imperceptibly slow). See §5 for keyframes.
Transition to next: CUT at f511 via set_constant_cut(cam_obj, 510).
```

---

### SHOT 08 — Imja Descent (f511–f585)

```
Type: Perspective
Geographic position start: 86.867°E, 27.933°N, altitude 8,000 m ASL (3,000 m AGL)
Geographic position end: 86.920°E, 27.898°N, altitude 5,810 m ASL (800 m AGL above lake)
Blender location start: ((86.867−83)×96.126, (27.933−30)×111.0, 8.0) = (371.9, −229.6, 8.0)
Blender location end: ((86.92−83)×96.126, (27.898−30)×111.0, 5.81) = (376.9, −233.5, 5.81)
Rotation start: (math.radians(−55) + π/2, 0.0, math.radians(80))
  [looking east-northeast down the Imja valley]
Focal length start: 200.0 mm → end: 85.0 mm
  [zoom-out as altitude drops — maintains subject scale while revealing context]
DOF: disabled (depth of field would blur terrain during descent and is distracting)
Frames: f511–f585
Camera movement: BEZIER interpolation on all channels.
  The lake must NOT appear in frame during f511–f571 (first 2.0s).
  At f572 (end of descent), the moraine dam crest just clears the bottom of frame.
  Camera trajectory: start 3,000 m AGL looking down the valley; altitude drops such
  that the moraine dam crest enters the bottom of frame at approximately f572.
  The director constraint is: lake hidden until cut to shot 09. Verify in viewport
  that the moraine dam geometry (40–50 m above valley floor) screens the lake.
  If the lake is visible early, lower the end-altitude target or adjust focal length.
Transition to next: CUT at f586 via set_constant_cut(cam_obj, 585).
  This cut IS the lake reveal.
```

---

### SHOT 09 — Imja Tsho Reveal (f586–f645)

```
Type: Perspective
Geographic position: 86.922°E, 27.899°N, altitude 5,310 m ASL (300 m AGL above lake)
  Lake surface: 5,010 m ASL
Blender location: ((86.922−83)×96.126, (27.899−30)×111.0, 5.31) = (377.1, −233.4, 5.31)
Rotation: (math.radians(−85) + π/2, 0.0, math.radians(260))
  [near-nadir (−85° from horizontal = 5° from vertical) looking slightly west-northwest
   across the full lake length, with calving front at right-of-frame east end,
   moraine dam and outlet at left-of-frame west end]
Focal length: 50.0 mm
  [normal lens — no compression, the lake's actual proportions read correctly]
DOF: disabled
Frames: f586–f645
Camera movement: STATIC. Single keyframe at f586.
Transition to next: DISSOLVE to shot 10.
  Implementation: set camera keyframe at f645 identical to f586 (no movement).
  The dissolve is achieved in the compositor (see §4), NOT via in-camera motion.
```

---

### SHOT 10 — 1962 Overlay (f646–f720)

```
Type: Perspective
Geographic position: IDENTICAL to shot 09
Blender location: IDENTICAL to shot 09 (377.1, −233.4, 5.31)
Rotation: IDENTICAL to shot 09
Focal length: 50.0 mm
Frames: f646–f720
Camera movement: STATIC. No keyframe needed (inherits shot 09's keyframe).
  The 1962 pond overlays are compositor elements, not 3D geometry.
Transition to next: CUT at f721 via set_constant_cut(cam_obj, 720).
```

---

### SHOT 11 — Calving Front Lateral Track (f721–f780)

```
Type: Perspective
Geographic position start: 86.934°E, 27.900°N, altitude 5,030 m ASL (20 m AGL above lake)
Geographic position end: 86.920°E, 27.900°N, altitude 5,030 m ASL
  [tracking westward along the calving front at constant low altitude]
Blender location start: ((86.934−83)×96.126, (27.9−30)×111.0, 5.03) = (378.3, −233.1, 5.03)
Blender location end: ((86.92−83)×96.126, (27.9−30)×111.0, 5.03) = (376.9, −233.1, 5.03)
Rotation: (math.radians(−5) + π/2, 0.0, math.radians(180))
  [near-horizontal, looking slightly downward (−5°) along the ice cliff face;
   we are at the calving front looking west along it, lake surface fills foreground]
Focal length: 85.0 mm
DOF: enabled
  focus_distance: 0.15 BU (150 m — focused on ice cliff face)
  f_stop: 8.0 (moderate; lake surface foreground slightly soft, cliff in focus)
Frames: f721–f780
Camera movement: LINEAR westward drift. Rate: ~14 km/min screen equiv → 2.0s × (≈0.014 BU/frame).
  Keyframe at f721 (x=378.3), keyframe at f780 (x=376.9).
  Only x changes; y and z are CONSTANT.
Transition to next: CUT at f781 via set_constant_cut(cam_obj, 780).
```

---

### SHOT 12 — The Calving Event (f781–f825)

```
Type: Perspective
Geographic position: 86.930°E, 27.901°N, altitude 5,030 m ASL (20 m AGL)
  [same low altitude as shot 11; camera has drifted ~100 m west during shot 11,
   now positioned perpendicular to ice face, looking directly at a 3–4 m section]
Blender location: ((86.93−83)×96.126, (27.901−30)×111.0, 5.03) = (377.8, −233.0, 5.03)
Rotation: (math.radians(−10) + π/2, 0.0, math.radians(270))
  [looking due west into the north-facing calving face at −10° below horizontal]
Focal length: 135.0 mm
  [slightly telephoto — isolates the section of cliff face, compresses
   foreground water surface into a tight layer]
DOF: enabled
  focus_distance: 0.05 BU (50 m — sharp on the ice face)
  f_stop: 11.0 (deep — both ice cliff and near lake surface in acceptable focus)
Frames: f781–f825
Camera movement: STATIC. ABSOLUTE. The camera does not move or pan to follow the
  calving event. This is the hardest constraint in the chapter. Single keyframe at f781.
  Use set_constant_cut(cam_obj, 780) (already called for shot 11 transition) and
  set a new CONSTANT keyframe at f781 to lock camera position.
Transition to next: CUT at f826 via set_constant_cut(cam_obj, 825).
```

---

### SHOT 13 — Moraine Dam Orientation (f826–f855)

```
Type: Perspective
Geographic position: 86.906°E, 27.892°N, altitude 5,510 m ASL (500 m AGL)
Blender location: ((86.906−83)×96.126, (27.892−30)×111.0, 5.51) = (375.5, −233.8, 5.51)
Rotation: (math.radians(−65) + π/2, 0.0, math.radians(60))
  [looking east-northeast at angle that shows: lake in background, dam in middle,
   Imja Khola valley in foreground. The composition traces the flood path top→bottom.]
Focal length: 35.0 mm
  [wide — shows both lake above and valley below in single frame]
DOF: disabled
Frames: f826–f855
Camera movement: STATIC. Single keyframe at f826.
Transition to next: DISSOLVE to shot 14 (4-frame dissolve in compositor).
```

---

### SHOT 14 — Moraine Dam Final Hold (f856–f900)

```
Type: Perspective
Geographic position: 86.908°E, 27.893°N, altitude 5,210 m ASL (200 m AGL)
  [closer to the dam, tighter framing]
Blender location: ((86.908−83)×96.126, (27.893−30)×111.0, 5.21) = (375.7, −233.7, 5.21)
Rotation: (math.radians(−75) + π/2, 0.0, math.radians(60))
  [steeper downward angle at 200 m AGL; dam crest fills lower two-thirds,
   lake fills upper third]
Focal length: 85.0 mm
  [normal-to-medium; dam surface close enough that individual boulders are legible]
DOF: disabled
  [everything at 200 m distance; DOF would soften the boulder textures we need]
Frames: f856–f900
Camera movement: STATIC. ABSOLUTE. No drift, no pull-back. Single keyframe at f856.
Transition to next: FADE TO BLACK. 10-frame fade (f891–f900 → black). Compositor.
  After fade: chapter-end UI (if required) appears, not over the final image.

CRITICAL: The last frame before the fade (f890) should show the subsidence hollow
  visible as a slight bowl-shaped depression in the moraine. Do not add dramatic
  lighting to this feature — just ensure the midday sun catches its north-facing
  slope edge as a thin shadow line. The viewer notices without being directed.
```

---

## 3. Material Specifications

All materials are created via the shared `materials.py` module functions. New materials for this chapter extend that module with new factory functions. All use `_get_or_create()` for caching.

---

### MAT_IceClean
```
Material name in bpy: "wc_ice_clean"
Used on: Glacier_Clean_HKH (shots 01–02), Khumbu_Icefall (shot 07),
         Yala_Glacier (shot 04), Imja_IceCliff (shots 09–12), Calving_Block (shot 12)
Factory function: materials.make_ice_clean_material()  [NEW — add to materials.py]

Nodes: Principled BSDF
  Base Color: linear(#7DD3FC) = (0.4902, 0.8275, 0.9882, 1.0)
    [locked ice grammar color from WATER_CYCLE_SPEC.md §7]
  Roughness: 0.10
    [slightly specular — clean ice reflects sky; not mirror-like]
  Metallic: 0.0
  Subsurface Weight: 0.15
    [Cycles SSS kernel: Random Walk (volumetric); gives internal translucency]
  Subsurface Radius: (0.35, 0.35, 0.45) in Blender units
    [blue-biased: ice absorbs red more than blue inside the crystal structure]
  Subsurface Scale: 0.008 (8 m effective scatter path — appropriate for glacier seracs)
  Alpha: 1.0

Blender-specific notes:
  - In Cycles, enable "Screen Space Subsurface Scattering" in Render Properties > Light Paths
    for the subsurface to render correctly with OIDN denoising.
  - The SSS kernel "Random Walk" is selected via:
    bsdf.subsurface_method = "RANDOM_WALK"  (Blender 5.x attribute name)
  - At orbital altitude (shots 01–02), SSS is not visible; the material reads as blue-white
    from the base color. The SSS only matters for shots 07, 09–12 (close-up ice faces).
  - For the Imja_IceCliff, add a Noise Texture → MixRGB (Multiply) over the base color
    to introduce subtle variance (blue patches more saturated than debris-stained patches).
    Keep the noise very fine (scale 50.0) and low contrast (0.1 factor).
```

---

### MAT_IceDebris
```
Material name in bpy: "wc_ice_debris"
Used on: Glacier_Debris_Nepal (shots 03, 07, 08), Imja_Glacier_Tongue (shots 08–11)
Factory function: materials.make_ice_debris_material()  [NEW — add to materials.py]

Nodes: Principled BSDF
  Base Color: (0.4784, 0.4314, 0.3765, 1.0)  [linear(#7A6E60) — grey-brown debris]
    Driven by texture: MixRGB between debris_color and pond_color, masked by
    a Noise Texture at scale 8.0 (supraglacial pond scatter pattern).
    pond_color = linear(#7EC8C0) = (0.48, 0.78, 0.75, 1.0)  [muted turquoise supraglacial ponds]
    pond_mask = Noise Texture, scale=8.0, detail=4.0, distortion=0.8
    Resulting color: predominantly grey-brown with ~8–12% of pixels showing pond turquoise.
  Roughness: 0.90
    [debris mantle is very rough — unsorted rock and silt]
  Metallic: 0.0
  Subsurface Weight: 0.0 (no SSS — the ice is buried, not exposed)
  Normal: MuSGrave Texture → Normal Map node at scale 2.0
    [simulates rough boulder surface texture; reduces flat/plastic appearance]

Blender-specific notes:
  - This material intentionally looks UNSCENIC. The grey-brown must read from altitude.
  - The supraglacial pond color (#7EC8C0 muted turquoise) is distinct from Imja Tsho
    (#78C8C0): the ponds are darker, murkier, smaller. The muted_turquoise vs clean_turquoise
    distinction must be visible at shot 08 altitude.
  - The lateral moraine ice cliff exposures are separate objects (use MAT_IceClean);
    do NOT mix MAT_IceDebris and MAT_IceClean on the same object. Use separate mesh islands.
  - Flow lines (longitudinal banding) are added via a Voronoi Texture at scale 0.5,
    oriented along the glacier flow direction (Y-axis in Blender km space), mixed at
    0.08 factor over the base color. This is the "differential flow" visual the shot list
    requires to distinguish glacier from valley wall.
```

---

### MAT_LakeWater
```
Material name in bpy: "wc_lake_imja"
Used on: ImjaTsho_2020, SuperglacialPonds (at reduced density)
Factory function: materials.make_imja_lake_material()  [NEW — replaces make_lake_material() for Imja]

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
      [lake surface is nearly flat; sub-capillary roughness from glacial flour particles]
    Metallic: 0.0
    Specular: 0.5 (slight specular for afternoon glint)
    Alpha: 0.85
      [NEVER fully transparent — glacial flour makes the water opaque at all depths.
       The constraint from the shot list: "you cannot see the bottom in any part of the lake"]
    Transmission Weight: 0.0 (no refractive transmission — the water is opaque)

  VOLUME shader (Principled Volume):
    Color: (0.55, 0.90, 0.88, 1.0)  [linear of a slightly lighter turquoise]
    Density: 0.8
      [high enough to produce milky opacity; low enough to avoid black at depth]
    Anisotropy: 0.3
      [slight forward scattering; simulates Tyndall scattering of ~20 micron flour particles
       preferentially scattering short wavelengths forward]
    Absorption Color: (0.95, 0.60, 0.55, 1.0)
      [removes red/orange from transmitted light; combined with the scatter,
       the surviving wavelengths are blue-green — the Tyndall effect]
    Emission Strength: 0.0

  PERFORMANCE FALLBACK (if volume render time exceeds budget):
    Disable volume; use depth-blended surface shader only:
    Surface Base Color: mix between #94D4CC (shallow, near shore) and #78C8C0 (mid),
    and #4AACAA (>20m depth). Alpha = 0.85 hard cap. This gives the milky appearance
    without volumetric cost. Verify #78C8C0 target hex is met in a test render
    before committing to the fallback.

  WATER SURFACE RIPPLES (shots 09, 10, 11, 12):
    Add a Normal Map driven by Wave Texture (type RINGS, scale 150.0, distortion 0.4)
    to simulate capillary ripples (~2 cm wavelength). Map strength: 0.08.
    This does NOT change color; it adds texture to the specular highlight only.
    Disable for the calving shot (shot 12) water surface near the impact point — the
    Calving_Splash particle system handles the water surface deformation there.

Blender-specific notes:
  - Volume shaders require Cycles (not Eevee). In Eevee preview, use surface-only fallback.
  - Set mat.blend_method = "BLEND" and alpha = 0.85 for the surface BSDF.
  - The volume domain is the lake mesh itself (closed manifold required). Ensure
    ImjaTsho_2020 mesh is manifold (no holes, consistent normals).
  - For Cycles volumetrics, set cycles.volume_max_steps = 64 in render settings.
    Use the "production_atmosphere" preset (256 spp) for shots 09–14 if volumetric
    quality is insufficient at 128 spp. Time budget: these 6 shots = 390 frames,
    the most expensive in the chapter.
  - COLOR VERIFICATION: After test render of shot 09, sample the lake center pixel in
    Blender's rendered view with color management set to sRGB. The sampled hex must be
    within ±5 units per channel of #78C8C0. If outside tolerance:
    1. Adjust Volume Density (increase = more milky = lighter).
    2. Adjust Absorption Color (increase absorption red/orange = more blue-green).
    3. Adjust Surface Alpha (increase = less background influence).
```

---

### MAT_Terrain
```
Material name in bpy: "wc_terrain"
Used on: HKH_DEM_orbital, Nepal_DEM_regional, Langtang_DEM, Annapurna_DEM,
         Kangchenjunga_DEM, Imja_Basin_DEM
Factory function: materials.make_terrain_material()  [EXISTING — no change required]

Nodes: Principled BSDF with height-ramp ColorRamp
  [Full specification already in shared/materials.py TERRAIN_RAMP_STOPS]
  Height stops:
    0.000 km: #7A6B5A (warm brown — plains/foothills)
    2.000 km: #475569 (locked slate base — mid range)
    4.000 km: #94A3B8 (lighter slate — upper rock)
    8.849 km: #E0F2FE (snow-white cyan — summit/permanent snow)
  Roughness: 0.75
  The ramp correctly produces the "brown plain / white spine" contrast needed for
  shot 01 at orbital altitude.

  SEASONAL SNOW OVERRIDE for shots 04–06 (regional close-ups):
    Shots 04–06 show morning light with fresh snow or ablated ice depending on season.
    The existing terrain ramp handles this via the >6,000 m snow-white stop.
    For Kangchenjunga (shot 06, post-monsoon), more fresh snow on upper faces:
    add a separate snow_overlay material blended via a driver on camera altitude.
    [Low priority; the base terrain ramp is adequate for the 1-second shots.]

Blender-specific notes:
  - The terrain ramp node tree is rebuilt on every call to make_terrain_material().
    Do not call this function from within an animation callback — call once at setup.
  - At orbital altitude (shot 01, 200 km), the terrain mesh reads correctly with 256 quads.
    At Imja basin (shots 08–14), use 512 quads. The DEM resolution in dem_mod.load_dem_as_mesh()
    must match per geographic region (see §6 data pipeline).
```

---

### MAT_MoraineDam
```
Material name in bpy: "wc_moraine_dam"
Used on: MoraineDam_Detail, portions of Imja_Basin_DEM at dam location
Factory function: materials.make_moraine_material()  [NEW — add to materials.py]

Nodes: Principled BSDF with procedural noise texture
  Base Color: linear(#7E7668) = (0.4902, 0.4588, 0.4118, 1.0)
    [mixed angular rock — grey-brown-beige, no uniform color;
     simulate with Noise Texture (scale 12.0, detail 8.0) mixed 30% over base]
  Roughness: 0.95
    [unconsolidated glacial till — the roughest surface in the scene]
  Metallic: 0.0
  Normal Map: Musgrave Texture at scale 4.0, strength 1.5
    [boulder-scale surface relief; every boulder casts a short hard shadow at midday]

  SUBSIDENCE HOLLOW (shot 14):
    A separate mesh object (SubsidenceHollow) driven by a boolean modifier applied to
    MoraineDam_Detail creates a ~5–8 m diameter, ~0.5 m deep bowl. The hollow uses
    the same MAT_MoraineDam material but with Roughness 0.98 (slightly more disturbed
    surface in the subsidence area). The hollow is NOT labelled; it is a geometric
    feature only.

  OUTLET CHANNEL (shots 13–14):
    The 2016 UNDP control channel is a 0.5 m deep, 1–2 m wide incision through the
    moraine crest. It uses MAT_MoraineDam with Roughness 1.0 and a slightly darker
    base color (#5A5448). Render as geometry (a small cut in the moraine mesh),
    not as a texture map. It should barely register in the shot — "a thin dark line,
    nothing more" (shot list).

Blender-specific notes:
  - MoraineDam_Detail should NOT use smooth shading. Flat shading required for the
    angular rock appearance. Call mesh.use_auto_smooth = False and
    bpy.ops.object.shade_flat() after mesh creation.
  - The dam must look like "any other moraine" — no visual cues of engineering or
    purpose. If the material reads as dramatic or threatening, desaturate further.
    The "terrifying banality" is the point.
```

---

### MAT_Sky
```
Material: World Background (Nishita sky texture, not a mesh material)
Configuration: via render_settings.setup_sky_lighting(), extended with animation keyframes.

Shot 01 (f001–f210): sun_elevation = -3.0°, sun_azimuth = 80.0° (astronomical twilight)
  sky_tex.altitude = 200_000.0 (satellite altitude — nearly vacuum)
  [Results in deep navy zenith (#0D1B3E equiv), near-black sky above peaks]
Shot 02 (f211–f285): sun_elevation = 2.0°, sun_azimuth = 82.0° (first light)
  sky_tex.altitude = 80_000.0
Shot 03 (f286–f360): sun_elevation = 8.0°, sun_azimuth = 85.0° (early morning)
  sky_tex.altitude = 15_000.0
Shots 04–06 (f361–f450): sun_elevation = 12.0°–18.0°, azimuth 86.0°–90.0°
  sky_tex.altitude = 2_000.0–8_000.0 (per camera altitude)
Shot 07 (f451–f510): sun_elevation = 18.0°, azimuth 88.0°
  sky_tex.altitude = 500.0
Shots 08–12 (f511–f825): sun_elevation = 45.0°–50.0°, azimuth 180.0° (overhead south)
  sky_tex.altitude = 0.0 (lake level)
Shots 13–14 (f826–f900): sun_elevation = 55.0°, azimuth 180.0° (midday)
  sky_tex.altitude = 0.0

Keyframe approach: Insert keyframes on sky_tex.sun_elevation, sky_tex.sun_rotation,
  sky_tex.altitude, and WC_Sun.rotation_euler at the start frame of each shot.
  Use CONSTANT interpolation so the sky jumps at each cut (not cross-fades).
  Exception: shots 01→02 sun_elevation can be LINEAR to simulate sunrise.

Blender-specific notes:
  - sky_tex.altitude controls how thin the simulated atmosphere is. At 200 km,
    the zenith reads almost black (vacuum). This produces the "Himalayan blue" deep
    cobalt described in the Research Brief.
  - sun_data.angle = 0.0087 radians (~0.5° solar disc) throughout — this produces
    the razor-sharp shadow edges documented in the Research Brief's "shadow hardness"
    section. Do not increase this value.
  - sun_data.color: animate from (1.0, 0.7, 0.4) (deep orange alpenglow, shots 01–02)
    through (1.0, 0.95, 0.85) (warm morning, shots 03–07) to (1.0, 0.98, 0.95)
    (neutral midday, shots 08–14). Keyframe sun_data.color at shot boundaries.
```

---

## 4. Compositor Node Tree

The compositor handles: shot transitions, text overlays, color grading, the 1962 pond overlay, calving simulation composite, and final fade to black.

**Node tree overview:**
```
[Render Layer: Main] ──────────────────────────┐
[Render Layer: Calving] (shots 781–825 only) ──┤── [Alpha Over] ──┐
[Render Layer: Calving_Splash] ────────────────┘                  │
                                                                   ├─ [Color Correction] ─┐
[Text Overlays (compositor Text nodes)] ───────────────────────── │                      │
[1962 Pond Vectors (Image/SVG)] ─────────────────────────────────┘                      │
                                                                                         ├─ [Output]
[Vignette (Ellipse Mask → Mix → Multiply)] ──────────────────────────────────────────── │
```

### Transitions

**Hard cuts (all shots except 09→10 and 13→14):**
Scene markers define cut boundaries. The compositor's `Frame` input routes to different render layer mixes. In practice, for a single Blender scene with animated camera, cuts are achieved by CONSTANT interpolation on camera keyframes — no special compositor node is needed for cuts.

**Dissolve 09→10 (shots f645→f646, 3-frame dissolve):**
```
Alpha Over node:
  Fac: driven by Frame_Range driver:
    f643: 0.0 (100% shot 09)
    f646: 1.0 (100% shot 10 composite with 1962 overlay)
  This is rendered as a single scene; the "dissolve" is the 1962 overlay
  fading in over 3 frames via the overlay opacity driver.
  Implementation: the 1962 pond overlay Image node's Opacity is keyframed
  0.0 at f643, 0.0 at f645, 0.6 at f660. This reads as a soft cut, not
  a cross-dissolve of camera positions (camera is static in both shots).
```

**Dissolve 13→14 (shots f855→f856, 4-frame dissolve):**
```
Alpha Over node:
  This is the one true camera-to-camera dissolve.
  Both cameras share the same object (animated); the "dissolve" here is
  achieved via a 4-frame linear fade between the shot 13 and shot 14
  camera keyframes already set at f855 and f856.
  Blender will smoothly interpolate camera position and focal length over
  these 4 frames since they are adjacent keyframes with BEZIER handles.
  Set the fcurve from f855→f856 to BEZIER (not CONSTANT) for this transition.
```

**Fade to black (f891–f900, 10 frames):**
```
Mix node (type: Mix):
  Input 1: Rendered image
  Input 2: Black (0, 0, 0)
  Fac: 0.0 at f891, 1.0 at f900 (LINEAR interpolation via fcurve on Fac socket)
```

### Color Grading

```
Color Balance node (after Render Layer, before text overlays):
  Lift:    (0.98, 0.99, 1.02)  [very slight cool shadow lift — simulates
                                  high-altitude ambient fill from blue sky]
  Gamma:   (1.00, 1.00, 1.00)  [no mid-range correction]
  Gain:    (0.98, 0.99, 1.00)  [very slight warm highlight roll-off —
                                  matches NatGeo/Planet Earth grade:
                                  whites that lean ever so slightly warm,
                                  never blue-white blown out]

RGB Curves node:
  R curve: S-curve, very subtle — 5% contrast increase in shadows only
  G curve: flat
  B curve: very slight boost (+3%) in deep shadows only
  [Combined: slight cool-shadow contrast increase. The Himalayan pre-dawn
   sky should feel genuinely cold without being tinted.]

Glare node:
  Type: BLOOM (NOT STREAKS — streaks are lens artifacts not present in clean HKH air)
  Iterations: 3
  Mix: −0.90  [subtract most of the bloom; retain only 10% for subtle glow on
                summit ice faces in shots 01–02]
  Threshold: 0.85  [only very bright pixels — summit alpenglow — get any bloom]
  RENDER TIME COST: Bloom glare adds ~8% to compositor time. Acceptable.
  If production falls behind schedule, set Mix = −1.0 (disable) — the shots
  do not require bloom; it is a refinement only.
```

### Vignette

```
Ellipse Mask node:
  Width: 1.4, Height: 1.2  [mask extends beyond frame edges — only corners are vignetted]
  Mask output → Invert → MixRGB (Multiply) → into Color Balance
  Mix factor: 0.25  [very subtle; vignette should not be visible as a visible effect,
                     only as a slight darkening of corners that makes the composition
                     feel bounded without framing the viewer explicitly]
```

### Text Overlays (Compositor Text Nodes or SVG)

**Implementation note:** Use the Blender compositor `Text` node (added in Blender 4.0) or pre-render text elements as PNG sequences with alpha. Do NOT use bpy.types.Font 3D objects for any text in this chapter. The 3D font approach from ch0_reservoir.py is not used here.

```
Text overlay timing (all driven by Frame fcurves on Opacity/Mix factor):

CONDITIONAL CHAPTER TITLE (f190–f210, optional):
  Text: "Chapter 0 — The Water That Was Ice"
  Position: bottom-left, 12pt equivalent, color #E8E4DC
  Opacity: 0→40% over 20 frames (never reaches full white)
  Node: Mix node between Rendered Image and Text Image, Fac 0.0→0.40

LANGTANG label (f375–f390, optional):
  Text: "LANGTANG", 9pt, #E8E4DC, top-left
  Opacity: 5-frame fade in, hold, cut with shot

ANNAPURNA label (f405–f420, optional):
  Text: "ANNAPURNA", same spec as above

KANGCHENJUNGA / MAKALU label (f435–f450, optional):
  Text: "KANGCHENJUNGA / MAKALU", same spec

IMJA TSHO NAME (f630–f645):
  Text: "Imja Tsho", bottom-right, 14pt, weight 300, #E8E4DC
  Opacity: 0→100% over 10 frames (f630→f640), hold at 100%, cut at f645

1962 POND OVERLAY (f646–f720):
  Implementation: Pre-rendered SVG/PNG of the 1962 pond outlines in #F5E090 (amber).
  The 1962 ponds are 6–8 irregular polygons, each 100–200 m diameter, scattered
  across the eastern two-thirds of the modern lake area (concentrated near the
  calving front at 86°56'E). These are NOT real polygon data — they are artistic
  approximations of the Research Brief's description ("cluster of small meltwater
  pools"). Render them as a 1280×720 PNG with alpha, positioned as a compositor
  Image node over the rendered lake.
  Opacity schedule:
    f646: 0.0
    f660: 0.60 (peak)
    f690: 0.60 (hold)
    f705: 0.0 (fade out)
    f706: 0.0 (the "2020" label appears simultaneously as ponds fade)

1962 YEAR LABEL (f646–f705):
  Text: "1962", bottom-center, 14pt, weight 300, #F5E090
  Opacity: 14-frame fade in (f646→f660), hold (f660→f690), 14-frame fade out (f690→f705)

1962 AREA LABEL (f646–f705):
  Text: "~0.03 km²  —  a cluster of meltwater pools", below year, 9pt, #F5E090
  Opacity: same schedule as year label

2020 YEAR LABEL (f691–f720):
  Text: "2020", bottom-center, 14pt, weight 300, #F5E090
  Opacity: 10-frame fade in (f691→f701), hold (f701–f715), 10-frame fade out (f715→f720)

2020 AREA LABEL (f691–f720):
  Text: "~1.56 km²", below year, 9pt, #F5E090
  Opacity: same schedule

NOTE: "1962" label and "2020" label share the same compositor Mix node Fac socket.
When one fades out, the other fades in. They do NOT appear simultaneously.
```

### Calving Water Simulation Composite (Shot 12)

```
The calving simulation (Mantaflow or FLIP Fluids) is rendered in a SEPARATE Blender scene
("Ch0_Calving_Sim") at 640×360 or 1280×720 and composited over the main render.

Separate scene setup:
  - Domain: 30 m × 30 m × 5 m box centered on calving impact point
  - Resolution: 80 (domain subdivisions) — adequate for the 15 cm max wave
  - Bake simulation before main render: cache to tmp/ch0/calving_cache/
  - Render frames 781–825 (45 frames) from the calving scene
  - Output: PNG sequence with alpha at same resolution as main render

Compositor integration:
  Image node (calving simulation frames) → Alpha Over → Main Render
  The calving scene renders only the water surface deformation and splash.
  The ice cliff geometry is from the main render (Imja_IceCliff object).
  The Calving_Block object is in the MAIN scene, animated to match the
  simulation's rigid body collision timing.

Calving_Block animation (f781–f825):
  - f781: Block at rest, fused with cliff face (hide_render = True until f800)
  - f800: First frame of separation — block becomes visible
  - f801: Block begins pivot rotation (Rotation X keyframe: 0→-45° over 8 frames)
  - f809: Block clear of cliff face, in freefall
  - f812: Block impacts lake surface (z = lake_surface_z = 5.010 BU)
  - f813–f825: Block sinks; opacity 1.0→0.0 over 12 frames (turbidity obscures it)

Constraint: Do not use a rigid body simulation for the calving block — it is
  hand-keyframed to guarantee determinism (rigid body sims are not seeded).
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
| SceneCamera | data.lens | 1 | 35.0 (ortho_scale 2000.0) | CONSTANT |
| SceneCamera | location.x | 211 | −672.9 | BEZIER |
| SceneCamera | location.y | 211 | 666.0 | BEZIER |
| SceneCamera | location.z | 211 | 80.0 | BEZIER |
| SceneCamera | location.x | 285 | −288.4 | BEZIER |
| SceneCamera | location.y | 285 | 610.5 | BEZIER |
| SceneCamera | location.z | 285 | 75.0 | BEZIER |
| SceneCamera | data.lens | 211 | 300.0 | CONSTANT |
| SceneCamera | location.z | 286 | 30.0 | LINEAR |
| SceneCamera | location.z | 360 | 15.0 | LINEAR |
| SceneCamera | data.lens | 286 | 200.0 | CONSTANT |
| SceneCamera | location | 361 | (228.0, −206.5, 7.1) | CONSTANT |
| SceneCamera | data.lens | 361 | 85.0 | CONSTANT |
| SceneCamera | location | 391 | (93.3, −184.3, 5.1) | CONSTANT |
| SceneCamera | data.lens | 391 | 400.0 | CONSTANT |
| SceneCamera | location | 421 | (475.8, −241.9, 11.0) | CONSTANT |
| SceneCamera | data.lens | 421 | 200.0 | CONSTANT |
| SceneCamera | location | 451 | (370.4, −225.7, 5.865) | CONSTANT |
| SceneCamera | data.lens | 451 | 300.0 | CONSTANT |
| SceneCamera | location.x | 511 | 371.9 | BEZIER |
| SceneCamera | location.y | 511 | −229.6 | BEZIER |
| SceneCamera | location.z | 511 | 8.0 | BEZIER |
| SceneCamera | location.x | 585 | 376.9 | BEZIER |
| SceneCamera | location.y | 585 | −233.5 | BEZIER |
| SceneCamera | location.z | 585 | 5.81 | BEZIER |
| SceneCamera | data.lens | 511 | 200.0 | BEZIER |
| SceneCamera | data.lens | 585 | 85.0 | BEZIER |
| SceneCamera | location | 586 | (377.1, −233.4, 5.31) | CONSTANT |
| SceneCamera | data.lens | 586 | 50.0 | CONSTANT |
| SceneCamera | location | 721 | (378.3, −233.1, 5.03) | LINEAR |
| SceneCamera | location.x | 780 | 376.9 | LINEAR |
| SceneCamera | data.lens | 721 | 85.0 | CONSTANT |
| SceneCamera | location | 781 | (377.8, −233.0, 5.03) | CONSTANT |
| SceneCamera | data.lens | 781 | 135.0 | CONSTANT |
| SceneCamera | location | 826 | (375.5, −233.8, 5.51) | CONSTANT |
| SceneCamera | data.lens | 826 | 35.0 | CONSTANT |
| SceneCamera | location | 856 | (375.7, −233.7, 5.21) | BEZIER |
| SceneCamera | data.lens | 856 | 85.0 | BEZIER |
| WC_Sun | rotation_euler | 1 | sun_elev=−3°, azimuth=80° | CONSTANT |
| WC_Sun | rotation_euler | 211 | sun_elev=2°, azimuth=82° | CONSTANT |
| WC_Sun | rotation_euler | 286 | sun_elev=8°, azimuth=85° | CONSTANT |
| WC_Sun | rotation_euler | 361 | sun_elev=12°, azimuth=87° | CONSTANT |
| WC_Sun | rotation_euler | 451 | sun_elev=18°, azimuth=88° | CONSTANT |
| WC_Sun | rotation_euler | 511 | sun_elev=30°, azimuth=170° | CONSTANT |
| WC_Sun | rotation_euler | 826 | sun_elev=55°, azimuth=180° | CONSTANT |
| WC_Sun | data.color | 1 | (1.0, 0.70, 0.40) | CONSTANT |
| WC_Sun | data.color | 286 | (1.0, 0.90, 0.80) | LINEAR |
| WC_Sun | data.color | 511 | (1.0, 0.97, 0.93) | LINEAR |
| Glacier_Clean_HKH | hide_render | 0 | False | CONSTANT |
| Glacier_Clean_HKH | hide_render | 361 | True | CONSTANT |
| Glacier_Debris_Nepal | hide_render | 0 | True | CONSTANT |
| Glacier_Debris_Nepal | hide_render | 286 | False | CONSTANT |
| Glacier_Debris_Nepal | hide_render | 511 | True | CONSTANT |
| Imja_Glacier_Tongue | hide_render | 0 | True | CONSTANT |
| Imja_Glacier_Tongue | hide_render | 511 | False | CONSTANT |
| Imja_IceCliff | hide_render | 0 | True | CONSTANT |
| Imja_IceCliff | hide_render | 586 | False | CONSTANT |
| ImjaTsho_2020 | hide_render | 0 | True | CONSTANT |
| ImjaTsho_2020 | hide_render | 586 | False | CONSTANT |
| Khumbu_Icefall | hide_render | 0 | True | CONSTANT |
| Khumbu_Icefall | hide_render | 451 | False | CONSTANT |
| Khumbu_Icefall | hide_render | 511 | True | CONSTANT |
| Yala_Glacier | hide_render | 0 | True | CONSTANT |
| Yala_Glacier | hide_render | 361 | False | CONSTANT |
| Yala_Glacier | hide_render | 391 | True | CONSTANT |
| Langtang_DEM | hide_render | 0 | True | CONSTANT |
| Langtang_DEM | hide_render | 361 | False | CONSTANT |
| Langtang_DEM | hide_render | 391 | True | CONSTANT |
| Annapurna_DEM | hide_render | 0 | True | CONSTANT |
| Annapurna_DEM | hide_render | 391 | False | CONSTANT |
| Annapurna_DEM | hide_render | 421 | True | CONSTANT |
| Kangchenjunga_DEM | hide_render | 0 | True | CONSTANT |
| Kangchenjunga_DEM | hide_render | 421 | False | CONSTANT |
| Kangchenjunga_DEM | hide_render | 451 | True | CONSTANT |
| Calving_Block | hide_render | 0 | True | CONSTANT |
| Calving_Block | hide_render | 800 | False | CONSTANT |
| Calving_Block | hide_render | 826 | True | CONSTANT |
| Calving_Block | rotation_euler.x | 800 | 0.0 | BEZIER |
| Calving_Block | rotation_euler.x | 809 | −0.785 (−45°) | BEZIER |
| Calving_Block | location.z | 800 | 5.025 (ice cliff mid) | BEZIER |
| Calving_Block | location.z | 812 | 5.010 (lake surface) | BEZIER |
| Calving_Block | data.alpha | 812 | 1.0 | LINEAR |
| Calving_Block | data.alpha | 825 | 0.0 | LINEAR |
| Headlamp_Light | location.z | 451 | 6.180 BU | LINEAR |
| Headlamp_Light | location.z | 510 | 6.230 BU | LINEAR |
| Compositor.FadeToBlack.Fac | value | 891 | 0.0 | LINEAR |
| Compositor.FadeToBlack.Fac | value | 900 | 1.0 | LINEAR |
| Compositor.1962Overlay.Opacity | value | 646 | 0.0 | LINEAR |
| Compositor.1962Overlay.Opacity | value | 660 | 0.6 | CONSTANT |
| Compositor.1962Overlay.Opacity | value | 690 | 0.6 | LINEAR |
| Compositor.1962Overlay.Opacity | value | 705 | 0.0 | CONSTANT |

---

## 6. Data Pipeline

### Geographic data flow overview

```
public/glaciers/hkh/1990-points.geojson  ─┐
public/glaciers/hkh/2020-points.geojson  ─┤─ glaciers_mod.load_glaciers() ─┐
                                           │   bbox filter per region       │
data/water-cycle/dem/srtm-hkh-30m.tif   ─┤─ dem_mod.load_dem_as_mesh() ───┤
data/water-cycle/lakes/imja-2020.geojson ─┤─ lakes_mod.load_lakes()  ──────┤
data/water-cycle/lakes/imja-1962-ponds.geojson ─ [compositor overlay PNG]  │
                                                                             ▼
                                                               Blender scene objects
                                                                             │
                                                               render_frames() → tmp/ch0/####.exr
                                                                             │
                                                               encode_mod.encode_chapter() → outputs
                                                                             │
                                                               provenance_mod.write_provenance() → JSON
```

### Glacier point data filtering

The existing `public/glaciers/hkh/1990-points.geojson` and `2020-points.geojson` contain point geometries (simplified from polygon inventory). The `glaciers_mod.load_glaciers()` function currently loads up to `max_features` from the top of the file with no bbox filter.

**Required change:** Add bbox filtering to `load_glaciers()` before passing to the geometry builder:

```python
# In glaciers_mod.load_glaciers(), add before the sample_features slice:
if bbox_lonlat is not None:
    west, south, east, north = bbox_lonlat
    def _in_bbox(feat):
        coords = feat.get("geometry", {}).get("coordinates", [])
        if len(coords) >= 2:
            return west <= coords[0] <= east and south <= coords[1] <= north
        return False
    features = [f for f in features if _in_bbox(f)]
```

**Per-shot bbox filters for glacier loading:**

| Shot group | Region | Bbox (W, S, E, N) | Max features | Material |
|---|---|---|---|---|
| 01–02 | Karakoram (HKH-wide) | [70, 33, 80, 37] | 200 (preview) / 500 (production) | MAT_IceClean |
| 01–02 | Full HKH (orbital view) | [70, 26, 95, 36] | 300 (preview) / 800 (production) | MAT_IceClean (all; at orbital scale no debris visible) |
| 03 | Nepal Himalaya | [82, 27, 88, 30] | 150 / 400 | MAT_IceDebris |
| 07–08 | Khumbu | [86.7, 27.8, 87.1, 28.1] | 10 / 30 | MAT_IceDebris |

**HKH-wide shots (01–02) — 65k points rendering strategy:**

At 200 km altitude, individual glacier polygons are not resolved. Rendering 65k separate mesh objects would tank GPU memory (each object has its own BVH entry; 65k objects × typical serac mesh = GPU OOM). Use one of these strategies in order of preference:

1. **Instanced geometry with custom attribute:** Convert all glacier points to a single instancer object using `bpy.ops.object.convert(target="MESH")` on a particle system, or use Blender's Geometry Nodes to instance a billboard quad at each glacier point position. One draw call for 65k instances. Memory cost: single mesh + 65k transform matrices (manageable).

2. **Particle system:** Create a single mesh emitter; emit particles at glacier point positions (load positions into a particle system via `particle_obj.particle_systems[0].settings.count`). Material: MAT_IceClean. Point size: 0.5 BU radius per point. This is the fastest approach but loses individual glacier sizing.

3. **Baked visibility:** For preview/scrub presets, use max_features=300 (existing approach). For production, switch to instanced geometry.

**Implementation in ch0_cinematic.py:**
```python
# For shots 01–02: instanced glacier dots
def build_glacier_instances(glacier_points: list[tuple[float,float,float]], 
                            name: str, color_hex: str) -> bpy.types.Object:
    """Create a single mesh with all glacier points as vertices, 
    then use a Geometry Nodes or particle system to instance a small disc at each."""
    # ... see §9 Risk Register for fallback if instancing is not available
```

### Imja Tsho polygon construction

The Imja Tsho 2020 polygon is NOT available in the existing atlas data. The existing `2020-points.geojson` contains glacier points, not the lake outline. The lake must be constructed from the Research Brief coordinates:

```python
# Imja Tsho 2020 approximate polygon (Research Brief §2, digitized)
# Oriented east-west; western end = moraine outlet, eastern end = calving front
IMJA_TSHO_2020_RING = [
    [86.9083, 27.8980],  # SW corner (near moraine dam outlet)
    [86.9400, 27.8960],  # SE corner (near calving front south shore)
    [86.9417, 27.9000],  # East end center (at calving front)
    [86.9410, 27.9030],  # NE corner (calving front north)
    [86.9100, 27.9050],  # NW corner (lake north shore)
    [86.9083, 27.8980],  # Close ring
]
# Area: approximately 1.56 km² — verify by computing polygon area in Python

# Imja Tsho 1962 "ponds" (Research Brief §2; NOT real data — artistic approximation)
# Scattered across eastern 2/3 of lake area, concentrated near 86.94°E
IMJA_1962_PONDS = [
    # [west, south, east, north] bounding boxes for 6 irregular ponds
    # Largest: ~200 m across; smallest: ~50 m across
    # These render only in the compositor as amber vector outlines, not as 3D geometry
]
```

**Imja Glacier and Calving Front coordinates:**
- Imja Glacier tongue: polygon covering 86°54'E to 87°00'E, 27°53' to 27°55'N
- Calving face position: approximately 86°56'E, 27°54'N (eastern end of lake)
- Moraine dam location: approximately 86°54'20"E, 27°53'30"N (western end)
- Moraine dam height: 40–50 m above Imja Khola valley floor (DEM must show this)

### DEM resolution per geographic region

| Scene area | DEM source | Bbox | Blender mesh resolution | Usage |
|---|---|---|---|---|
| HKH orbital | SRTM 90m | [70, 26, 95, 36] | 256 × 256 quads | Shots 01–02 |
| Nepal regional | SRTM 30m | [83, 27, 88, 29] | 512 × 512 quads | Shots 03–06 |
| Khumbu | SRTM 30m / AW3D30 | [86.7, 27.8, 87.1, 28.1] | 512 × 512 quads | Shot 07 |
| Imja basin | SRTM 30m / AW3D30 | [86.85, 27.83, 87.05, 28.0] | 512 × 512 quads | Shots 08–14 |

**DEM fallback chain** (from dem.py `_find_dem_file()`):
1. Pre-processed `.npy` file (fastest)
2. SRTM GeoTIFF direct parse (no rasterio needed; dem.py struct-based reader)
3. Procedural fallback (`_make_procedural_dem()`): adequate for shots 01–03; inadequate for shots 08–14 where the moraine dam geometry is critical. If the procedural fallback is used for the Imja basin, the MoraineDam_Detail overlay mesh MUST be present and manually positioned to compensate.

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

**Notes:**
- Preview uses PNG 8-bit for fast disk writes; production uses EXR 16-bit for lossless intermediate (ffmpeg reads EXR).
- The `production_atmosphere` preset (256 spp, 128 volume steps) is used when the volumetric Imja water shader (shots 09–14, ~390 frames) needs more samples for clean convergence. This is the expected production path.
- Motion blur is OFF on all presets per the shot list requirement (no temporal smear on the calving event; no blur on static shots).
- Denoise timing: OIDN pass runs after every tile. Adds ~5–8% overhead vs no denoise; eliminates fireflies in volumetric water shader.
- Frame sequence output directory: `tmp/ch0/####.exr` (zero-indexed: `0001.exr` through `0900.exr`).

**Preset selection in script:**
```python
# Apply preset as inherited from ch0_reservoir.py pattern
rs_mod.apply_preset(args.preset)
rs_mod.enable_gpu_if_available()
```

The `apply_preset()` function in `shared/render_settings.py` handles all engine configuration. The `production_atmosphere` preset already exists in `render_settings.py` for volumetrics.

---

## 8. Encoding Pipeline

After render completes to `tmp/ch0/####.exr`:

```bash
# Step 0: Locate ffmpeg (handled by encode_mod._find_ffmpeg())
# On this machine: check PATH, then common Windows paths, then WinGet packages

# ── AV1 primary (cinematic.webm) — TARGET < 8 MiB ────────────────────────────
# Two-pass AV1 encoding using libsvtav1 (faster than libaom-av1; quality equivalent)
# Pass 1: analysis
ffmpeg -y \
  -framerate 30 \
  -i "tmp/ch0/%04d.exr" \
  -c:v libsvtav1 \
  -crf 32 \
  -preset 6 \
  -pix_fmt yuv420p \
  -an \
  "public/water-cycle/ch0/cinematic.webm"
# Note: libsvtav1 does not support traditional 2-pass in the same way as libaom.
# Single-pass CRF 32 with preset 6 produces ~1.2–1.8 Mbps at 1280×720 for scenic content.
# For 30 seconds: estimated 4.5–6.75 MB — within the 8 MiB target.
# If file exceeds 8 MiB: increase CRF to 35 (loses ~5% visual quality, saves ~20% size).

# ── H.264 fallback (cinematic.mp4) — TARGET < 16 MiB ─────────────────────────
ffmpeg -y \
  -framerate 30 \
  -i "tmp/ch0/%04d.exr" \
  -c:v libx264 \
  -crf 21 \
  -preset slow \
  -pix_fmt yuv420p \
  -movflags +faststart \
  "public/water-cycle/ch0/cinematic.mp4"
# CRF 21 at 1280×720 × 30fps for 30s: estimated 8–12 MB — within 16 MiB target.
# If file exceeds 16 MiB: increase CRF to 23 (existing encode_mod.py default).

# ── Scrub master (cinematic-scrub.webm) — TARGET < 6 MiB ─────────────────────
# VP9 at 854×480, dense keyframes (every 15 frames = 0.5s) for smooth scrubbing
ffmpeg -y \
  -framerate 30 \
  -i "tmp/ch0/%04d.exr" \
  -vf "scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2" \
  -c:v libvpx-vp9 \
  -crf 36 \
  -b:v 0 \
  -g 15 \
  -quality good \
  -speed 4 \
  -pix_fmt yuv420p \
  "public/water-cycle/ch0/cinematic-scrub.webm"
# Estimated size: ~2.5–4 MB — well within 6 MiB target.
# The -g 15 (keyframe every 15 frames = 0.5s) enables smooth scrubbing at any point.
# CRF 36 at 480p is acceptable visual quality for the scrub thumbnail use case.

# ── Poster (poster.jpg) — frame 855 (Shot 14 final hold, moraine dam) ─────────
# Frame 855 = 0-indexed frame 855 in the sequence = file "0855.exr" (0-indexed)
# OR if Blender outputs 1-indexed: "0856.exr" — verify against actual output naming.
# The shot list specifies frame 856 (1-indexed) as the start of shot 14.
# The poster should be the FIRST frame of shot 14 (moraine dam tight shot):
POSTER_FRAME=855  # 0-indexed; adjust to 856 if Blender output is 1-indexed
ffmpeg -y \
  -i "tmp/ch0/$(printf '%04d' $POSTER_FRAME).exr" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -q:v 2 \
  "public/water-cycle/ch0/poster.jpg"
# The poster shows: moraine dam in foreground, Imja Tsho milky turquoise in background.
# This is the share card for the entire atlas. The color #78C8C0 must be recognizable.
# Verify: open poster.jpg and eyedropper the lake — should read approximately #78C8C0.
```

**encode_mod integration:** The above commands are called via `encode_mod.encode_chapter()` with `poster_frame=855`. The existing `encode_chapter()` function handles libsvtav1 for AV1 and libvpx-vp9 for scrub. Confirm ffmpeg build on this machine has these codecs: `ffmpeg -codecs | findstr "svt\|vpx"`.

**File size cap enforcement:** The existing `_MAX_MIB = 24.0` cap in encode_mod.py remains. Add chapter-specific soft targets:
```python
CHAPTER_SOFT_TARGETS = {
    "cinematic.webm": 8.0,   # AV1
    "cinematic.mp4": 16.0,   # H.264
    "cinematic-scrub.webm": 6.0,  # VP9
    # poster.jpg: no cap (small file)
}
```

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 65k glacier points OOM GPU during shots 01–02 | **High** | Render crash; VRAM exhausted | Use Geometry Nodes instancing or particle system (see §6). Single BVH entry for all instances. If instancing unavailable, cap at 800 features and accept reduced density. At orbital altitude, 800 white dots read identically to 65k to the viewer. |
| Imja Tsho water color fails to hit #78C8C0 within ±5 units | **High** | Chapter fails director test (color is the non-negotiable anchor) | Run color verification render (single frame, shot 09) before full production render. Adjust Volume Density and Absorption Color iteratively. Add a test assertion in the script that samples the rendered frame's center pixel and raises ValueError if hex delta > 5. |
| Calving simulation (shot 12) produces waves > 15 cm or dramatic splash | **High** | Director constraint violated; chapter "lies" | Pre-bake simulation; manually inspect wave amplitude in Blender viewport fluid domain stats. Constrain: block volume 2.0–2.5 m³ max, fall height 1.5 m, domain resolution 80. If simulation consistently exceeds 15 cm waves, reduce block volume to 1.5 m³. |
| SRTM DEM missing for Imja basin; procedural fallback has no moraine dam | **High** | Shots 13–14 moraine dam geometry missing; chapter loses its climax | MoraineDam_Detail is a separate hand-modelled overlay mesh (§1 scene graph). It does NOT depend on the DEM. The DEM provides the valley floor context; the dam mesh is always present. Load MoraineDam_Detail unconditionally. |
| DEM download times out or rate-limited from OpenTopography | **Medium** | Script fails at data load; no terrain for any shot | dem.py fallback chain already handles this: `.npy` cache → GeoTIFF → procedural. Pre-download and cache the SRTM tiles to `data/water-cycle/dem/` before production render. For CI renders, the procedural fallback is acceptable for shots 01–06 (orbital/regional). |
| 400mm telephoto shot 05 produces z-fighting on Annapurna DEM | **Medium** | Terrain mesh flickers at render; unusable shot | As noted in camera spec §2: increase `cam_data.clip_start` to 0.01, `clip_end` to 10000.0. If z-fighting persists, switch shot 05 to orthographic projection (`cam_data.type = "ORTHO"`, `cam_data.ortho_scale = 50.0`). Log in render output. |
| HKH orbital shots 01–02 look flat without atmospheric haze | **Medium** | Shot 01 reads as a data visualization, not a cinematic | HKH_AtmosVolume (§1) provides Principled Volume scatter. Set density very low (0.002) so haze is barely perceptible at camera altitude but creates aerial perspective at the range scale. If render time is prohibitive (+2 hrs), fake with Distance Fog in compositor instead. |
| Calving_Block animation is deterministic but physics look wrong | **Medium** | Block pivots/falls unrealistically; undermines "pedestrian" quality | The director constraint (pedestrian, quiet) actually reduces the visual demands. The block should pivot slowly, not accelerate dramatically. BEZIER handles on the rotation keyframe with flat tangents ensure a slow, smooth pivot. Test render shot 12 in isolation and verify against Research Brief: "pivots slowly at first, then accelerates as gravity takes it over." |
| Nishita sky model unavailable in Blender 5.1 (API change) | **Low** | Sky falls back to gradient; deep navy pre-dawn look is lost | The existing `setup_sky_lighting()` already has a fallback gradient sky. The Nishita sky texture is available in Blender 5.1 under `ShaderNodeTexSky` with `sky_type = "NISHITA"`. If the API has changed, check Blender 5.1 release notes for the new attribute name. |
| Encoding: libsvtav1 not in ffmpeg build on this machine | **Low** | AV1 encode fails; no primary output | Check: `ffmpeg -codecs \| findstr svtav1`. If absent, fall back to `libvpx-vp9` for the primary AV1-equivalent output (rename to `.webm`; same container, VP9 codec). Target CRF 30 for VP9 at 1280×720 to hit ~8 MiB. Update `encode_mod.py` to try SVT-AV1 first, fall back to VP9. |

---

## 10. Determinism Plan

### Seed inventory

All random seeds are derived from the SHA-256 hash of the script file (`ch0_cinematic.py`) via `seed_mod.lock_seeds()`. This ensures seeds change only when the script changes.

| Seed source | Target | Value derivation |
|---|---|---|
| `seed_mod.lock_seeds(script_path)` | `bpy.context.scene.cycles.seed` | `int(sha256[:8], 16) & 0x7FFF_FFFF` |
| `seed_mod.lock_seeds(script_path)` | Python `random.seed()` | Same int value |
| DEM procedural fallback | `np.random.default_rng(42)` | Hard-coded seed 42 (in dem.py `_make_procedural_dem`) |
| Calving simulation | Pre-baked cache | Simulation baked once; cache files committed to `data/water-cycle/calving/`. Re-running reads cache, not re-simulating. This guarantees byte-identical calving output. |
| MAT_LakeWater Noise Texture | Procedural | Noise Texture in Blender is deterministic given fixed UV/position inputs; no separate seed needed. |
| MAT_IceDebris Noise Texture | Procedural | Same — deterministic from geometry. |

**Critical: do NOT use `bpy.ops.fluid.bake_all()` in the render script for the calving simulation.** Mantaflow bakes are not seeded by Blender's Cycles seed. The calving simulation must be baked separately, cache committed to the repo, and the render script reads the cache via `scene.rigidbody_world.point_cache.use_disk_cache = True`.

### Blender version pinning

```
Blender: 5.1 (exact sub-version TBD; pin to 5.1.1 or the installed sub-version)
Path: C:\Program Files\Blender Foundation\Blender 5.1\blender.exe
Provenance field: blender_version = "5.1.1"  (update if installed version differs)
```

If a newer Blender 5.1.x is installed, re-run the calving cache bake. Mantaflow sim results can differ between minor Blender versions.

### Frame output format

- Production: EXR 16-bit (`scene.render.image_settings.file_format = "OPEN_EXR"`, `color_depth = "16"`)
- Preview: PNG 8-bit (fast, acceptable for composition check)
- EXR is lossless; the same frame EXR will always encode to the same ffmpeg output given identical ffmpeg flags.

### SHA-256 verification

```python
# In ch0_cinematic.py main():
import hashlib

# Verify script hash (self-check)
script_hash = seed_mod.lock_seeds(Path(__file__))

# Verify output files after encode
output_files = [
    output_dir / "cinematic.webm",
    output_dir / "cinematic.mp4",
    output_dir / "cinematic-scrub.webm",
    output_dir / "poster.jpg",
]
hashes = {}
for f in output_files:
    if f.exists():
        h = hashlib.sha256(f.read_bytes()).hexdigest()
        hashes[f.name] = h
        print(f"[ch0] SHA-256 {f.name}: {h[:16]}...")

# Write hashes to provenance.json under "_output_hashes" key (extra metadata)
```

### What breaks determinism (and must be guarded against)

1. **Calving simulation re-bake:** Mantaflow is stochastic even with the same settings across Blender versions. Guard: commit simulation cache; read-only in render script.
2. **Particle system "random" seed on GPU:** Blender's particle system has a separate seed from Cycles. Set `particle_settings.seed = seed_int` explicitly after `lock_seeds()` is called.
3. **OS-level file system ordering:** `glaciers_mod.load_glaciers()` loads features in JSON array order. GeoJSON files must not be re-sorted between runs. The existing atlas data files should be treated as immutable.
4. **OIDN denoiser:** OIDN denoising is deterministic for the same input and OIDN version. If the OIDN library version changes, denoised output changes. Pin OIDN version via Blender's bundled OIDN (do not use a separately-installed OIDN).
5. **Time-based seeds:** Do not use `datetime.now()` or `os.getpid()` as seeds anywhere in the pipeline.
6. **Float precision differences between CPU and GPU:** At 1280×720 with OPTIX, floating point results are GPU-deterministic but may differ from CPU Cycles results. Always render with OPTIX for production; never mix CPU and GPU render nodes.

---

## 11. Provenance JSON Specification

The `write_provenance()` function from `shared/provenance.py` is called at the end of `ch0_cinematic.py`. The following is the complete `scene_layers` array for the new 14-shot storyboard.

```json
{
  "chapter_id": "ch0",
  "shot_id": "hkh-14shot-cinematic",
  "duration_s": 30,
  "frames": 900,
  "fps": 30,
  "resolution": { "w": 1280, "h": 720 },
  "camera_path": {
    "keyframes": [
      { "t": 0.033, "lon": 84.0, "lat": 30.0, "alt_m": 200000, "pitch_deg": -60, "yaw_deg": 80 },
      { "t": 7.033, "lon": 76.0, "lat": 36.0, "alt_m": 80000, "pitch_deg": -45, "yaw_deg": 90 },
      { "t": 9.500, "lon": 80.0, "lat": 35.5, "alt_m": 75000, "pitch_deg": -45, "yaw_deg": 90 },
      { "t": 9.533, "lon": 84.0, "lat": 28.5, "alt_m": 30000, "pitch_deg": -55, "yaw_deg": 0 },
      { "t": 12.0,  "lon": 84.0, "lat": 28.5, "alt_m": 15000, "pitch_deg": -55, "yaw_deg": 0 },
      { "t": 12.033,"lon": 85.37,"lat": 28.14,"alt_m": 7100,  "pitch_deg": -70, "yaw_deg": 225 },
      { "t": 13.033,"lon": 83.97,"lat": 28.34,"alt_m": 5100,  "pitch_deg": -20, "yaw_deg": 330 },
      { "t": 14.033,"lon": 87.95,"lat": 27.82,"alt_m": 11000, "pitch_deg": -45, "yaw_deg": 100 },
      { "t": 15.033,"lon": 86.851,"lat": 27.967,"alt_m":5865, "pitch_deg": -25, "yaw_deg": 155 },
      { "t": 17.033,"lon": 86.867,"lat": 27.933,"alt_m":8000, "pitch_deg": -55, "yaw_deg": 80 },
      { "t": 19.5,  "lon": 86.92, "lat": 27.898,"alt_m":5810, "pitch_deg": -55, "yaw_deg": 80 },
      { "t": 19.533,"lon": 86.922,"lat": 27.899,"alt_m":5310, "pitch_deg": -85, "yaw_deg": 260 },
      { "t": 24.033,"lon": 86.934,"lat": 27.9,  "alt_m":5030, "pitch_deg": -5,  "yaw_deg": 180 },
      { "t": 26.033,"lon": 86.93, "lat": 27.901,"alt_m":5030, "pitch_deg": -10, "yaw_deg": 270 },
      { "t": 27.533,"lon": 86.906,"lat": 27.892,"alt_m":5510, "pitch_deg": -65, "yaw_deg": 60 },
      { "t": 28.533,"lon": 86.908,"lat": 27.893,"alt_m":5210, "pitch_deg": -75, "yaw_deg": 60 }
    ]
  },
  "scene_layers": [
    {
      "id": "terrain-hkh-orbital",
      "type": "raster",
      "source": {
        "dataset": "SRTM GL1 30m DEM (OpenTopography SRTMGL1_E)",
        "url": "https://portal.opentopography.org/raster?opentopoID=OTSRTM.082015.4326.1",
        "doi": "10.5069/G9445JDF",
        "filter": "HKH bbox [70°E, 26°N, 95°E, 36°N]; resampled to 256×256 for orbital shots"
      },
      "render_geometry_id": "HKH_DEM_orbital",
      "color": "#475569"
    },
    {
      "id": "terrain-nepal-regional",
      "type": "raster",
      "source": {
        "dataset": "SRTM GL1 30m DEM / CopDEM GLO-30 (fallback)",
        "url": "https://portal.opentopography.org/raster?opentopoID=OTSRTM.082015.4326.1",
        "doi": "10.5069/G9445JDF",
        "filter": "Nepal Himalaya [83°E, 27°N, 88°E, 29°N]; 512×512 quads"
      },
      "render_geometry_id": "Nepal_DEM_regional",
      "color": "#475569"
    },
    {
      "id": "terrain-imja-basin",
      "type": "raster",
      "source": {
        "dataset": "SRTM GL1 30m DEM — Imja basin sub-tile",
        "url": "https://portal.opentopography.org/raster?opentopoID=OTSRTM.082015.4326.1",
        "doi": "10.5069/G9445JDF",
        "filter": "Imja basin [86.85°E, 27.83°N, 87.05°E, 28.0°N]; 512×512 quads",
        "preprocessing": ["Moraine dam geometry cross-referenced against Research Brief §2 coordinates"]
      },
      "render_geometry_id": "Imja_Basin_DEM",
      "color": "#475569"
    },
    {
      "id": "glacier-hkh-karakoram-clean",
      "type": "particle-system",
      "source": {
        "dataset": "ICIMOD HKH Glacier Inventory (1990 and 2020 combined for visual clarity)",
        "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
        "doi": "10.26066/rds.1972729",
        "filter": "Karakoram bbox [70°E, 33°N, 80°E, 37°N]; point geometry instanced as disc meshes",
        "n_features": "up to 800 instanced points (orbital altitude; individual sizes not resolved)"
      },
      "render_geometry_id": "Glacier_Clean_HKH",
      "color": "#7DD3FC"
    },
    {
      "id": "glacier-nepal-debris",
      "type": "particle-system",
      "source": {
        "dataset": "ICIMOD HKH Glacier Inventory (2020 points)",
        "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
        "doi": "10.26066/rds.1972729",
        "filter": "Nepal Himalaya bbox [82°E, 27°N, 88°E, 30°N]; debris-covered representation",
        "n_features": "up to 400 instances (regional altitude)"
      },
      "render_geometry_id": "Glacier_Debris_Nepal",
      "color": "#475569"
    },
    {
      "id": "glacier-yala-clean",
      "type": "polygon-flat",
      "source": {
        "dataset": "Yala Glacier outline (Research Brief §1 Zone 3; approximate from published coordinates)",
        "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
        "doi": "10.26066/rds.1972729",
        "filter": "Yala Glacier, Langtang [85.55–85.65°E, 28.20–28.28°N]; ~1.3 km² debris-free"
      },
      "render_geometry_id": "Yala_Glacier",
      "color": "#7DD3FC"
    },
    {
      "id": "glacier-khumbu-icefall",
      "type": "polygon-flat",
      "source": {
        "dataset": "Khumbu Glacier icefall zone (approximate from Research Brief §1 Zone 2)",
        "url": "https://rds.icimod.org/Home/DataDetail?metadataId=1972729",
        "doi": "10.26066/rds.1972729",
        "filter": "Khumbu Icefall zone [86.83–86.87°E, 27.95–28.0°N]; clean-ice upper section only"
      },
      "render_geometry_id": "Khumbu_Icefall",
      "color": "#7DD3FC"
    },
    {
      "id": "glacier-imja-tongue",
      "type": "polygon-flat",
      "source": {
        "dataset": "Imja Glacier debris-covered tongue (derived from ICIMOD inventory + Research Brief §2)",
        "url": "https://rds.icimod.org/Home/DataDetail?metadataId=9362830",
        "doi": "10.26066/rds.9362830",
        "filter": "Imja Glacier tongue [86°54'–87°00'E, 27°53'–27°55'N]; ~2020 extent"
      },
      "render_geometry_id": "Imja_Glacier_Tongue",
      "color": "#475569"
    },
    {
      "id": "lake-imja-tsho-2020",
      "type": "polygon-flat",
      "source": {
        "dataset": "Imja Tsho 2020 outline (digitized from Research Brief §2 coordinates + Somos-Valenzuela 2014)",
        "url": "https://rds.icimod.org/Home/DataDetail?metadataId=9362830",
        "doi": "10.26066/rds.9362830",
        "year_keyframe": 2020,
        "filter": "Imja Tsho western end 86°54'30\"E to eastern end 86°56'30\"E; ~1.56 km²",
        "preprocessing": [
          "Polygon vertices digitized from Research Brief §2 coordinates",
          "Area verified: ~1.56 km² per Somos-Valenzuela et al. (2014) DOI:10.5194/tc-8-1661-2014"
        ]
      },
      "render_geometry_id": "ImjaTsho_2020",
      "color": "#78C8C0"
    },
    {
      "id": "lake-imja-tsho-1962-overlay",
      "type": "polygon-flat",
      "source": {
        "dataset": "Imja Tsho 1962 meltwater pond outlines (artistic approximation from Somos-Valenzuela 2014 + Research Brief §2)",
        "url": "https://doi.org/10.5194/tc-8-1661-2014",
        "doi": "10.5194/tc-8-1661-2014",
        "year_keyframe": 1962,
        "filter": "~0.03 km² cluster of small ponds on glacier surface; NOT rendered as 3D geometry — compositor 2D overlay only",
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
      "source": {
        "dataset": "Imja moraine dam geometry (Research Brief §2 + Brencher, Henderson & Shean 2026 InSAR measurements)",
        "url": "https://doi.org/10.5194/tc-20-67-2026",
        "doi": "10.5194/tc-20-67-2026",
        "filter": "Moraine dam at 86°54'20\"E, 27°53'30\"N; height 40–50 m above valley floor; includes subsidence hollow (~0.5 m deep)"
      },
      "render_geometry_id": "MoraineDam_Detail",
      "color": "#7E7668"
    },
    {
      "id": "sky-atmosphere",
      "type": "raster",
      "source": {
        "dataset": "Nishita sky model (Blender built-in procedural atmosphere)",
        "url": "https://www.blender.org/",
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
    }
  ],
  "caption_text": "Imja Tsho did not exist as a lake in 1962 — it was a cluster of small meltwater pools on the glacier surface. By 2020 it had grown to approximately 1.56 km². A moraine dam of loose, unconsolidated glacial debris retains 61.7 million cubic metres of water. The dam makes no sound.",
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
- `chapter_id` must be `"ch0"` (already registered in `provenance.py` valid set).
- `shot_id` changes from the old `"hkh-flyover"` to `"hkh-14shot-cinematic"` to reflect the new storyboard.
- All `scene_layers[].color` values must match `^#[0-9a-fA-F]{6}$`. Note: `ImjaTsho_2020` color is `#78C8C0` (real water color), NOT `#0E7490` (data grammar lake color). Both are valid hex; the provenance records which color is used in the render, which in this case is the physically-derived Tyndall turquoise.
- The `_output_hashes` and `_used_real_dem` keys are extra metadata (not in the schema's validated fields); they are permitted as passthrough keys by `write_provenance()` since `json.dump()` serializes the full `data` dict.
- `resolution` must be `{"w": 1280, "h": 720}` — the schema validator enforces this. Do not change.

---

## Appendix A: New Factory Functions Required in materials.py

The following functions must be added to `shared/materials.py`:

```python
def make_ice_clean_material() -> bpy.types.Material:
    """Clean glacier ice with SSS translucency. Shots 01–02, 04, 07, 09–12."""
    mat = _get_or_create("wc_ice_clean")
    # [Full implementation per §3 MAT_IceClean spec]
    return mat

def make_ice_debris_material() -> bpy.types.Material:
    """Debris-covered glacier. Grey-brown with supraglacial pond scatter. Shots 03, 07–11."""
    mat = _get_or_create("wc_ice_debris")
    # [Full implementation per §3 MAT_IceDebris spec]
    return mat

def make_imja_lake_material() -> bpy.types.Material:
    """Imja Tsho milky turquoise water. Target: #78C8C0. Shots 09–14."""
    mat = _get_or_create("wc_lake_imja")
    # [Full implementation per §3 MAT_LakeWater spec]
    # CRITICAL: verify color output = #78C8C0 ± 5 units per channel in test render
    return mat

def make_moraine_material() -> bpy.types.Material:
    """Loose unconsolidated glacial till for moraine dam. Shots 13–14."""
    mat = _get_or_create("wc_moraine_dam")
    # [Full implementation per §3 MAT_MoraineDam spec]
    # Must NOT use smooth shading. Must NOT look engineered.
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

# Preview (fast composition check, ~10 min)
"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" \
  --background \
  --python scripts/render/water-cycle/ch0_cinematic.py \
  -- \
  --output public/water-cycle/ch0/cinematic.webm \
  --provenance public/water-cycle/ch0/provenance.json \
  --preset preview

# Single-shot test render (e.g. shot 09 for color verification, frames 586–645)
"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" \
  --background \
  --python scripts/render/water-cycle/ch0_cinematic.py \
  -- \
  --output public/water-cycle/ch0/cinematic.webm \
  --provenance public/water-cycle/ch0/provenance.json \
  --preset production \
  --frame-start 586 \
  --frame-end 645
  # Note: add --frame-start / --frame-end args to parse_args() for partial renders
```

---

*End of Chapter 0 Technical Specification*
*This document is the authoritative reference for ch0_cinematic.py (new version).*
*All constraints derive from ch0-research-brief.md, ch0-director-brief.md, and ch0-shotlist.md.*
*Any conflict between this spec and those source documents: source documents take precedence.*
