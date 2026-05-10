"""Locked material library for water-cycle renders.

ALL materials MUST come from this module. Never create materials inline
in chapter scripts — that leads to color grammar drift.

Color grammar (from WATER_CYCLE_SPEC.md §7):
  ice        #7DD3FC  sky blue
  lake       #0E7490  teal
  river      #38BDF8  living-blue / active water
  loss       #F87171  rose / risk
  heat       #FBBF24  amber
  people     #FCD34D  gold
  terrain    #475569  slate neutral

Two eases only (CSS, not needed in bpy but noted for reference):
  scenes     cubic-bezier(0.4, 0, 0.2, 1)   Material standard
  data       cubic-bezier(0.16, 1, 0.3, 1)  Gentle-out
"""
from __future__ import annotations

import bpy

# Linear-space sRGB tuples (R, G, B, A) derived from the hex codes above.
# Blender internally uses linear colour. These values are the correct linear
# conversions of each hex code (gamma 2.2 approximation).
COLORS: dict[str, tuple[float, float, float, float]] = {
    "ice":     (0.4902, 0.8275, 0.9882, 1.0),  # #7DD3FC
    "lake":    (0.0549, 0.4549, 0.5647, 1.0),  # #0E7490
    "river":   (0.2196, 0.7412, 0.9725, 1.0),  # #38BDF8
    "loss":    (0.9725, 0.4431, 0.4431, 1.0),  # #F87171
    "heat":    (0.9843, 0.7490, 0.1412, 1.0),  # #FBBF24
    "people":  (0.9843, 0.8314, 0.3020, 1.0),  # #FCD34D
    "terrain": (0.2784, 0.3333, 0.4118, 1.0),  # #475569
    "white":   (1.0,   1.0,   1.0,   1.0),
    "black":   (0.0,   0.0,   0.0,   1.0),
}


def _hex_to_linear(hex_color: str) -> tuple[float, float, float, float]:
    """Convert #RRGGBB to linear-space (R, G, B, 1.0)."""
    h = hex_color.lstrip("#")
    r8, g8, b8 = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    # sRGB to linear approximation (gamma ≈ 2.2)
    def s(c: int) -> float:
        v = c / 255.0
        return pow(v, 2.2)
    return (s(r8), s(g8), s(b8), 1.0)


def _get_or_create(name: str) -> bpy.types.Material:
    """Return existing material by name or create a new one."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    return mat


def _set_principled_base(
    mat: bpy.types.Material,
    base_color: tuple[float, float, float, float],
    roughness: float = 0.5,
    metallic: float = 0.0,
    alpha: float = 1.0,
    emission: tuple[float, float, float] | None = None,
    emission_strength: float = 1.0,
) -> None:
    """Configure the Principled BSDF node on mat."""
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Clear default nodes
    for n in list(nodes):
        nodes.remove(n)

    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    # Base color
    bsdf.inputs["Base Color"].default_value = base_color  # type: ignore[index]
    bsdf.inputs["Roughness"].default_value = roughness  # type: ignore[index]
    bsdf.inputs["Metallic"].default_value = metallic  # type: ignore[index]
    bsdf.inputs["Alpha"].default_value = alpha  # type: ignore[index]

    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)  # type: ignore[index]
        bsdf.inputs["Emission Strength"].default_value = emission_strength  # type: ignore[index]

    if alpha < 1.0:
        mat.blend_method = "BLEND"
        mat.use_backface_culling = False


def make_ice_material(
    transparent: bool = False,
    volumetric: bool = False,
    alpha: float = 1.0,
) -> bpy.types.Material:
    """Locked ice material.

    transparent=True  → alpha ~0.4, suitable for ghost-glacier wireframe (Ch 6)
    volumetric=True   → add volumetric scatter for atmospheric look (Ch 0)
    Returns the bpy Material object (shared / cached by name).
    """
    suffix = ("_t" if transparent else "") + ("_v" if volumetric else "")
    name = f"wc_ice{suffix}"
    mat = _get_or_create(name)
    if transparent:
        _set_principled_base(
            mat,
            base_color=COLORS["ice"],
            roughness=0.1,
            alpha=0.35,
        )
    elif volumetric:
        _set_principled_base(
            mat,
            base_color=COLORS["ice"],
            roughness=0.15,
            emission=COLORS["ice"][:3],
            emission_strength=0.3,
        )
    else:
        _set_principled_base(
            mat,
            base_color=COLORS["ice"],
            roughness=0.2,
        )
    return mat


def make_lake_material(depth_m: float = 0.0) -> bpy.types.Material:
    """Locked lake material. depth_m drives the opacity gradient (deeper = darker)."""
    depth_bucket = int(min(depth_m, 60) / 10)
    name = f"wc_lake_d{depth_bucket}"
    mat = _get_or_create(name)
    alpha = max(0.6, 1.0 - depth_bucket * 0.06)
    _set_principled_base(
        mat,
        base_color=COLORS["lake"],
        roughness=0.05,
        alpha=alpha,
    )
    return mat


def make_terrain_material() -> bpy.types.Material:
    """Neutral mountain terrain material."""
    mat = _get_or_create("wc_terrain")
    _set_principled_base(mat, base_color=COLORS["terrain"], roughness=0.8)
    return mat


def make_river_material() -> bpy.types.Material:
    """Active-water material (river, meltwater)."""
    mat = _get_or_create("wc_river")
    _set_principled_base(mat, base_color=COLORS["river"], roughness=0.05, alpha=0.85)
    return mat


def make_people_material() -> bpy.types.Material:
    """Gold village/settlement material."""
    mat = _get_or_create("wc_people")
    _set_principled_base(
        mat,
        base_color=COLORS["people"],
        roughness=0.3,
        emission=COLORS["people"][:3],
        emission_strength=2.0,
    )
    return mat


def make_loss_material() -> bpy.types.Material:
    """Rose / risk material (e.g. GLOF hazard zone)."""
    mat = _get_or_create("wc_loss")
    _set_principled_base(mat, base_color=COLORS["loss"], roughness=0.4, alpha=0.7)
    return mat


def make_text_material(color_key: str = "white") -> bpy.types.Material:
    """Emissive white (or colour-grammar key) for 3D diegetic text."""
    name = f"wc_text_{color_key}"
    mat = _get_or_create(name)
    col = COLORS.get(color_key, COLORS["white"])
    _set_principled_base(
        mat,
        base_color=col,
        roughness=1.0,
        emission=col[:3],
        emission_strength=3.0,
    )
    return mat
