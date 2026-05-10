"""Camera path utilities for water-cycle renders.

Each chapter declares keyframes; this module animates them onto the
scene camera.

Locked focal lengths per scale band (mm equivalent):
    orbital:  35mm, alt=200km, pitch=-45
    regional: 50mm, alt=8km,   pitch=-55
    valley:   70mm, alt=5km,   pitch=-60
    macro:    100mm, alt=2km,  pitch=-75

Coordinate system:
    lon = X axis (degrees east)
    lat = Y axis (degrees north)
    alt = Z axis (metres above sea level, not above terrain)

Hidden cuts:
    Insert two keyframes one frame apart with CONSTANT interpolation.
    The gap = 1 frame renders as a hard cut on encode, but appears
    seamless because the matching shot entry/exit are choreographed.
"""
from __future__ import annotations

import math
import bpy


# ── Constants ─────────────────────────────────────────────────────────────────

CAMERA_PRESETS: dict[str, dict[str, float]] = {
    "orbital":  {"focal_mm": 35,  "alt_m": 200_000, "pitch": -45},
    "regional": {"focal_mm": 50,  "alt_m": 8_000,   "pitch": -55},
    "valley":   {"focal_mm": 70,  "alt_m": 5_000,   "pitch": -60},
    "macro":    {"focal_mm": 100, "alt_m": 2_000,   "pitch": -75},
}

# World scale: 1 Blender unit = 1 km in this pipeline
# lon/lat are treated as km-equivalent (small-area linearisation is fine for
# visualisation; we do NOT need geodetic correctness for artistic renders).
# 1° latitude ≈ 111 km   1° longitude ≈ 111 * cos(lat) km
_KM_PER_DEG_LAT = 111.0
_REF_LAT = 30.0  # reference latitude for cos scaling (HKH centre)
_KM_PER_DEG_LON = 111.0 * math.cos(math.radians(_REF_LAT))

# Height scale: alt in metres, 1 BU = 1 km
_M_TO_BU = 1.0 / 1_000.0


def _lonlat_alt_to_blender(
    lon: float, lat: float, alt_m: float
) -> tuple[float, float, float]:
    """Convert geographic position to Blender XYZ (km units)."""
    x = (lon - 83.0) * _KM_PER_DEG_LON   # centre on ~83°E (HKH midpoint)
    y = (lat - 30.0) * _KM_PER_DEG_LAT   # centre on ~30°N
    z = alt_m * _M_TO_BU
    return (x, y, z)


def setup_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    """Create and activate the scene camera. Returns the camera object."""
    if "SceneCamera" in bpy.data.objects:
        cam_obj = bpy.data.objects["SceneCamera"]
    else:
        cam_data = bpy.data.cameras.new("SceneCamera")
        cam_obj = bpy.data.objects.new("SceneCamera", cam_data)
        scene.collection.objects.link(cam_obj)

    scene.camera = cam_obj
    return cam_obj


def animate_camera(
    keyframes: list[tuple[int, float, float, float, float, float, float]],
    scene: bpy.types.Scene | None = None,
    cam_obj: bpy.types.Object | None = None,
) -> bpy.types.Object:
    """Add keyframes to the active camera.

    keyframes: list of (frame, lon, lat, alt_m, pitch_deg, yaw_deg, focal_mm)

    Hidden cuts (sharp camera jumps) are achieved by calling this with
    adjacent frames that differ in position — Blender's LINEAR interpolation
    between frames N and N+1 at near-identical times produces a step.

    For an actual hard cut, ensure the cut frame's keyframe uses CONSTANT
    interpolation (see set_constant_cut() below).
    """
    if scene is None:
        scene = bpy.context.scene
    if cam_obj is None:
        cam_obj = setup_camera(scene)

    cam_data: bpy.types.Camera = cam_obj.data  # type: ignore[assignment]

    for frame, lon, lat, alt_m, pitch_deg, yaw_deg, focal_mm in keyframes:
        scene.frame_set(frame)

        x, y, z = _lonlat_alt_to_blender(lon, lat, alt_m)
        cam_obj.location = (x, y, z)

        # Blender: pitch = rotation around local X (tilt up/down)
        # yaw   = rotation around global Z (pan left/right)
        # We use ZXY euler order for cinematic feel.
        pitch_rad = math.radians(pitch_deg)  # negative = look down
        yaw_rad   = math.radians(yaw_deg)
        cam_obj.rotation_euler = (pitch_rad + math.pi / 2, 0.0, yaw_rad)
        cam_obj.rotation_mode = "XYZ"

        # Focal length
        cam_data.lens = focal_mm

        # Insert keyframes
        cam_obj.keyframe_insert("location", frame=frame)
        cam_obj.keyframe_insert("rotation_euler", frame=frame)
        cam_data.keyframe_insert("lens", frame=frame)

    return cam_obj


def _iter_fcurves(action: bpy.types.Action):
    """Iterate over all F-curves in an Action, handling Blender 5.x and earlier APIs."""
    # Blender 4.x and earlier: action.fcurves
    if hasattr(action, "fcurves"):
        yield from action.fcurves
        return
    # Blender 5.x: action.layers[*].strips[*].channelbags[*].fcurves
    if hasattr(action, "layers"):
        for layer in action.layers:
            if not hasattr(layer, "strips"):
                continue
            for strip in layer.strips:
                if not hasattr(strip, "channelbags"):
                    continue
                for bag in strip.channelbags:
                    if hasattr(bag, "fcurves"):
                        yield from bag.fcurves


def set_constant_cut(cam_obj: bpy.types.Object, cut_frame: int) -> None:
    """Mark the keyframe at cut_frame as CONSTANT interpolation.

    This makes the transition between cut_frame and cut_frame+1 a hard
    jump — the hidden cut. Call this after animate_camera() for any
    frame that should be a cut rather than a smooth move.
    """
    if cam_obj.animation_data is None:
        return
    action = cam_obj.animation_data.action
    if action is None:
        return
    for fcurve in _iter_fcurves(action):
        for kp in fcurve.keyframe_points:
            if abs(kp.co[0] - cut_frame) < 0.5:
                kp.interpolation = "CONSTANT"


def animate_focal_length_ramp(
    cam_obj: bpy.types.Object,
    frame_start: int,
    frame_end: int,
    focal_start: float,
    focal_end: float,
) -> None:
    """Smoothly ramp focal length from focal_start to focal_end."""
    cam_data: bpy.types.Camera = cam_obj.data  # type: ignore[assignment]
    scene = bpy.context.scene
    for frame, focal in [(frame_start, focal_start), (frame_end, focal_end)]:
        scene.frame_set(frame)
        cam_data.lens = focal
        try:
            cam_data.keyframe_insert("lens", frame=frame)
        except Exception:
            cam_data.keyframe_insert(data_path="lens", frame=frame)
