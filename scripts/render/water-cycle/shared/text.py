"""3D diegetic text objects for water-cycle renders.

Creates bpy Text objects for year tickers, mass counters, and labels.
These are rendered IN the 3D scene, not as DOM overlays.

Per anti-patterns: use HTML overlay for exact precision values;
3D type is for headlines and ordinals only.
"""
from __future__ import annotations

import bpy
import math

import materials

_KM_PER_DEG_LAT = 111.0
_REF_LAT = 30.0
_KM_PER_DEG_LON = 111.0 * math.cos(math.radians(_REF_LAT))
_M_TO_BU = 1.0 / 1_000.0


def make_3d_text(
    text: str,
    name: str,
    location: tuple[float, float, float],
    size: float = 1.0,
    color_key: str = "white",
    align: str = "CENTER",
) -> bpy.types.Object:
    """Create a 3D text object at the given Blender location.

    Parameters
    ----------
    text     : initial text string
    name     : object name (must be unique)
    location : (x, y, z) in Blender units (km space)
    size     : font size in BU
    color_key: key into materials.COLORS
    align    : "LEFT", "CENTER", or "RIGHT"
    """
    if name in bpy.data.objects:
        return bpy.data.objects[name]

    curve = bpy.data.curves.new(name=name, type="FONT")
    curve.body = text
    curve.size = size
    curve.align_x = align

    obj = bpy.data.objects.new(name, curve)
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)

    # Assign emissive text material
    mat = materials.make_text_material(color_key)
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

    return obj


def animate_text_value(
    obj: bpy.types.Object,
    frame_values: list[tuple[int, str]],
) -> None:
    """Keyframe a text object's body to different string values at given frames.

    Blender does not support string keyframes natively, so we use shape keys
    or — more practically — we pre-create separate text objects for each
    value and keyframe their visibility.

    This implementation uses the shape-key workaround via hide_render
    toggling between pre-created objects for each distinct value.

    Parameters
    ----------
    obj         : the reference text object (will be hidden after setup)
    frame_values: list of (frame, text_string) tuples
    """
    if not frame_values:
        return

    scene = bpy.context.scene
    base_name = obj.name
    mat = materials.make_text_material("white")

    value_objects: list[tuple[int, bpy.types.Object]] = []

    for frame, value_str in frame_values:
        sub_name = f"{base_name}_v{frame}"
        if sub_name in bpy.data.objects:
            sub_obj = bpy.data.objects[sub_name]
        else:
            curve = bpy.data.curves.new(name=sub_name, type="FONT")
            curve.body = value_str
            curve.size = obj.data.size  # type: ignore[union-attr]
            curve.align_x = obj.data.align_x  # type: ignore[union-attr]
            sub_obj = bpy.data.objects.new(sub_name, curve)
            sub_obj.location = obj.location
            bpy.context.scene.collection.objects.link(sub_obj)
            if sub_obj.data.materials:
                sub_obj.data.materials[0] = mat
            else:
                sub_obj.data.materials.append(mat)
        value_objects.append((frame, sub_obj))

    # Hide the reference object entirely
    obj.hide_render = True

    # Keyframe visibility: each sub-object is visible only in its window
    for i, (frame, sub_obj) in enumerate(value_objects):
        next_frame = value_objects[i + 1][0] if i + 1 < len(value_objects) else scene.frame_end + 1

        sub_obj.hide_render = True
        sub_obj.keyframe_insert("hide_render", frame=0)

        if frame > 0:
            sub_obj.hide_render = True
            sub_obj.keyframe_insert("hide_render", frame=frame - 1)

        sub_obj.hide_render = False
        sub_obj.keyframe_insert("hide_render", frame=frame)

        sub_obj.hide_render = True
        sub_obj.keyframe_insert("hide_render", frame=next_frame)

    scene.frame_set(0)


def make_year_ticker(
    name: str = "YearTicker",
    location: tuple[float, float, float] = (0.0, 0.0, 0.0),
    size: float = 2.0,
    years_and_frames: list[tuple[int, int]] | None = None,
) -> bpy.types.Object:
    """Convenience function: create animated year counter.

    years_and_frames: list of (frame, year) where the year changes.
    Returns the base text object.
    """
    if years_and_frames is None:
        years_and_frames = [(0, 1990), (150, 1995), (250, 2000), (350, 2010), (450, 2020)]

    obj = make_3d_text(
        text="1990",
        name=name,
        location=location,
        size=size,
        color_key="white",
        align="CENTER",
    )
    animate_text_value(obj, [(frame, str(year)) for frame, year in years_and_frames])
    return obj


def make_mass_counter(
    name: str = "MassCounter",
    location: tuple[float, float, float] = (0.0, 0.0, 0.0),
    size: float = 1.5,
    steps: list[tuple[int, str]] | None = None,
) -> bpy.types.Object:
    """Create animated mass counter ticking from 0 → 516 km³ lost.

    steps: list of (frame, text) — the text to show at each frame.
    Default: smooth progression from 0 to 516 km³.
    """
    if steps is None:
        steps = [
            (0,   "0 km³ lost"),
            (150, "~100 km³ lost"),
            (250, "~250 km³ lost"),
            (350, "~400 km³ lost"),
            (450, "516 km³ lost"),
        ]

    obj = make_3d_text(
        text="0 km³ lost",
        name=name,
        location=location,
        size=size,
        color_key="ice",
        align="CENTER",
    )
    animate_text_value(obj, steps)
    return obj
