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
  terrain    #475569  slate neutral  (BASE; ramp adds tonal variation by elevation)

Terrain height ramp (elevation in metres):
  <2,000 m   warm brown/khaki   #7A6B5A  (Indo-Gangetic plain, foothills)
  2,000–4,000 m  slate base     #475569  (mid-range — matches the locked token)
  4,000–6,000 m  lighter rock   #94A3B8  (high plateau / pre-summit rock)
  >6,000 m   snow-white cyan   #E0F2FE  (permanent snow / summit zone)

The ramp PASSES THROUGH the locked terrain base (#475569) at mid elevations,
so it extends rather than replaces the locked color grammar.

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
    "terrain": (0.2784, 0.3333, 0.4118, 1.0),  # #475569 (locked base)
    "white":   (1.0,   1.0,   1.0,   1.0),
    "black":   (0.0,   0.0,   0.0,   1.0),
}

# Terrain height ramp stops — elevation in Blender units (1 BU = 1 km = 1000 m).
# Stops are (elevation_km, linear_R, linear_G, linear_B).
# The ramp passes through the locked #475569 terrain base at ~3 km (mid elevations).
# All colour values are linear-space sRGB (gamma 2.2 conversion of the hex codes).
TERRAIN_RAMP_STOPS: list[tuple[float, float, float, float]] = [
    # elev_km  R        G        B
    (0.000,  0.1899,  0.1490,  0.1106),  # #7A6B5A warm brown — plains / foothills
    (2.000,  0.2784,  0.3333,  0.4118),  # #475569 locked slate base — mid range
    (4.000,  0.5529,  0.6275,  0.7216),  # #94A3B8 lighter slate / upper rock
    (8.849,  0.8784,  0.9490,  0.9882),  # #E0F2FE snow-white cyan — summit / permanent snow
]


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
    """Height-based terrain material.

    Uses a Principled BSDF so Cycles sun/sky lighting produces real shading
    (normals affect brightness).  A ColorRamp driven by the mesh's Z coordinate
    (Blender units = km) ramps from warm brown at plains level, through the
    locked #475569 slate base at mid-range, up to snow-white at summit elevations.

    The ramp STOPS are defined in TERRAIN_RAMP_STOPS above.  Because Blender's
    Geometry → Position Z is in the world/object space (1 BU = 1 km), the ramp
    input is normalised against Earth's max elevation (8.849 km = Everest).

    All subsequent chapter renders that call make_terrain_material() will inherit
    this improvement automatically.
    """
    mat = _get_or_create("wc_terrain")
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    # Always rebuild node tree so the ramp is up-to-date even if material existed.
    for n in list(nodes):
        nodes.remove(n)

    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    # Roughness: rocky terrain — slightly rough but not matte
    bsdf.inputs["Roughness"].default_value = 0.75  # type: ignore[index]
    bsdf.inputs["Metallic"].default_value = 0.0    # type: ignore[index]
    bsdf.inputs["Alpha"].default_value = 1.0        # type: ignore[index]

    # ── Height-driven Color Ramp ─────────────────────────────────────────────
    # 1. Geometry node gives us the vertex position in object/world space.
    geom = nodes.new("ShaderNodeNewGeometry")

    # 2. Separate XYZ to isolate Z (elevation in km / Blender units).
    sep_xyz = nodes.new("ShaderNodeSeparateXYZ")
    links.new(geom.outputs["Position"], sep_xyz.inputs["Vector"])

    # 3. Divide Z by Everest height (8.849 km) → normalise to [0, 1].
    #    Use a Math → Divide node.
    div_node = nodes.new("ShaderNodeMath")
    div_node.operation = "DIVIDE"
    div_node.inputs[1].default_value = 8.849  # type: ignore[index]
    links.new(sep_xyz.outputs["Z"], div_node.inputs[0])

    # Clamp to [0, 1] in case procedural terrain goes outside range.
    clamp_node = nodes.new("ShaderNodeClamp")
    clamp_node.inputs["Min"].default_value = 0.0  # type: ignore[index]
    clamp_node.inputs["Max"].default_value = 1.0  # type: ignore[index]
    links.new(div_node.outputs["Value"], clamp_node.inputs["Value"])

    # 4. ColorRamp driven by the normalised elevation.
    ramp = nodes.new("ShaderNodeValToRGB")
    links.new(clamp_node.outputs["Result"], ramp.inputs["Fac"])

    # Configure ramp stops from TERRAIN_RAMP_STOPS.
    # Blender's default ramp has 2 stops; we need 4.
    cr = ramp.color_ramp
    cr.interpolation = "LINEAR"

    # Blender initialises with exactly 2 elements (index 0 and 1).
    # We add the extra 2 (total 4).
    while len(cr.elements) < len(TERRAIN_RAMP_STOPS):
        cr.elements.new(0.0)

    for i, (elev_km, r, g, b) in enumerate(TERRAIN_RAMP_STOPS):
        pos = elev_km / 8.849  # normalised position in [0, 1]
        el = cr.elements[i]
        el.position = pos
        el.color = (r, g, b, 1.0)

    # 5. Wire the ramp output into BSDF Base Color.
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])

    # ── Node layout (cosmetic — keeps the shader editor readable) ────────────
    output.location    = (600,  0)
    bsdf.location      = (300,  0)
    ramp.location      = ( 0, -100)
    clamp_node.location = (-200, -100)
    div_node.location  = (-400, -100)
    sep_xyz.location   = (-600, -100)
    geom.location      = (-800, -100)

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
