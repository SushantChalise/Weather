"""Cycles render presets. Production = 128 spp + denoise minimum (Codex caveat).

Usage:
    import render_settings
    render_settings.apply_preset("preview")   # fast Eevee, 360p, ~1 min
    render_settings.apply_preset("scrub")     # Cycles 64spp 480p
    render_settings.apply_preset("production")          # Cycles 128spp 720p
    render_settings.apply_preset("production_atmosphere")  # 256spp for volumetrics
    render_settings.setup_sky_lighting()      # sun + procedural sky (call after scene setup)
"""
from __future__ import annotations

import math
import bpy

PRESETS: dict[str, dict] = {
    "preview": {
        "engine": "BLENDER_EEVEE",
        "samples": 16,
        "denoise": False,
        "resolution": (640, 360),
        "use_motion_blur": False,
    },
    "scrub": {
        "engine": "CYCLES",
        "samples": 64,
        "denoise": True,
        "denoiser": "OPENIMAGEDENOISE",
        "resolution": (854, 480),
        "use_motion_blur": False,
    },
    "production": {
        "engine": "CYCLES",
        "samples": 128,
        "denoise": True,
        "denoiser": "OPENIMAGEDENOISE",
        "resolution": (1280, 720),
        "use_motion_blur": False,  # Never on scrub masters — causes smear
    },
    "production_atmosphere": {
        # For chapters with volumetrics (Ch 0 orbital, Ch 5 impurities)
        "engine": "CYCLES",
        "samples": 256,
        "denoise": True,
        "denoiser": "OPENIMAGEDENOISE",
        "volumetric_steps_max": 64,
        "resolution": (1280, 720),
        "use_motion_blur": False,
    },
}


def apply_preset(name: str) -> None:
    """Apply a named render preset to the current scene."""
    if name not in PRESETS:
        raise ValueError(
            f"Unknown preset '{name}'. Valid presets: {list(PRESETS.keys())}"
        )
    p = PRESETS[name]
    s = bpy.context.scene

    s.render.engine = p["engine"]  # type: ignore[assignment]
    s.render.resolution_x, s.render.resolution_y = p["resolution"]
    s.render.use_motion_blur = p.get("use_motion_blur", False)

    if p["engine"] == "CYCLES":
        s.cycles.samples = p["samples"]  # type: ignore[assignment]
        s.cycles.use_denoising = p["denoise"]  # type: ignore[assignment]
        if "denoiser" in p:
            s.cycles.denoiser = p["denoiser"]  # type: ignore[assignment]
        if "volumetric_steps_max" in p:
            s.cycles.volume_max_steps = p["volumetric_steps_max"]  # type: ignore[assignment]

    elif p["engine"] == "BLENDER_EEVEE":
        # Eevee settings
        try:
            s.eevee.taa_render_samples = p["samples"]
        except AttributeError:
            pass  # Blender 5.1 Eevee may have different attribute names

    print(
        f"[render_settings] Preset '{name}': engine={p['engine']}, "
        f"samples={p.get('samples','n/a')}, "
        f"resolution={p['resolution'][0]}x{p['resolution'][1]}"
    )


def enable_gpu_if_available() -> str:
    """Enable GPU compute (OPTIX for NVIDIA, HIP for AMD, METAL for Apple).

    Must be called BEFORE scene setup.
    Returns the device type string or 'CPU' if no GPU found.
    """
    prefs = bpy.context.preferences
    cycles_prefs = prefs.addons["cycles"].preferences

    # Try OPTIX (NVIDIA) first, then HIP (AMD), then METAL (Apple), else CPU
    for device_type in ("OPTIX", "HIP", "METAL"):
        try:
            cycles_prefs.compute_device_type = device_type  # type: ignore[assignment]
            cycles_prefs.refresh_devices()
            devices = cycles_prefs.devices
            # Enable all GPU devices
            gpu_found = False
            for device in devices:
                if device.type != "CPU":
                    device.use = True
                    gpu_found = True
                else:
                    device.use = False
            if gpu_found:
                bpy.context.scene.cycles.device = "GPU"
                print(f"[render_settings] GPU enabled: {device_type}")
                return device_type
        except Exception:
            pass

    # Fallback to CPU
    bpy.context.scene.cycles.device = "CPU"
    print("[render_settings] No GPU found, using CPU render")
    return "CPU"


def setup_sky_lighting(
    sun_elevation_deg: float = 29.0,
    sun_azimuth_deg: float = 225.0,
    sun_strength: float = 3.0,
    sky_strength: float = 1.0,
) -> dict:
    """Add a sun light + Nishita procedural sky to the current scene.

    This should be called from chapter setup_scene() INSTEAD OF manually adding
    a sun / world background. All Phase-3 chapters that call this function will
    inherit consistent late-afternoon Himalayan lighting.

    Sun position: ~29° elevation from the south-west (azimuth 225°) simulates
    late-afternoon light that casts oblique shadows across ridges — maximally
    revealing terrain relief.

    Sky: Nishita sky texture (Blender built-in). Matches the sun direction so
    the atmospheric scattering is physically consistent with the sun position.
    Falls back to a simple gradient sky if the Nishita texture is unavailable.

    Parameters
    ----------
    sun_elevation_deg : sun elevation above the horizon (degrees, 0–90)
    sun_azimuth_deg   : sun azimuth clockwise from north (degrees, 0–360)
                        225° = south-west
    sun_strength      : sun light energy (default 3.0 — readable but not blown out)
    sky_strength      : world background strength for the sky texture

    Returns
    -------
    dict with keys "sun_object", "used_nishita" (bool)
    """
    scene = bpy.context.scene

    # ── Sun light ─────────────────────────────────────────────────────────────
    # Convert elevation + azimuth to Blender rotation_euler.
    # Blender sun: default points down (−Z). We use rotation_euler to tilt it.
    # elevation angle from horizon: 0° = horizontal, 90° = straight up.
    # azimuth: 0° = north (−Y in default Blender orientation with Y-forward).
    # Blender axes (default): X=east, Y=north, Z=up.
    #
    # rotation_euler = (pitch_from_zenith, 0, -(azimuth_from_north))
    # pitch_from_zenith = 90° - elevation (0° = pointing up, 90° = horizontal)
    sun_pitch = math.radians(90.0 - sun_elevation_deg)
    sun_yaw   = math.radians(-sun_azimuth_deg)  # clockwise azimuth → CCW yaw

    bpy.ops.object.light_add(type="SUN", location=(0, 0, 100))
    sun = bpy.context.active_object
    sun.name = "WC_Sun"
    sun.rotation_euler = (sun_pitch, 0.0, sun_yaw)
    sun.data.energy = sun_strength
    sun.data.angle = 0.0087   # ~0.5° solar disc width
    sun.data.color = (1.0, 0.96, 0.90)  # warm late-afternoon tint

    # ── World / sky ───────────────────────────────────────────────────────────
    world = scene.world
    if world is None:
        world = bpy.data.worlds.new("WC_World")
        scene.world = world

    world.use_nodes = True
    wt = world.node_tree
    for n in list(wt.nodes):
        wt.nodes.remove(n)

    wo_out = wt.nodes.new("ShaderNodeOutputWorld")
    bg_node = wt.nodes.new("ShaderNodeBackground")
    wt.links.new(bg_node.outputs["Background"], wo_out.inputs["Surface"])
    bg_node.inputs["Strength"].default_value = sky_strength  # type: ignore[index]

    used_nishita = False
    try:
        # Nishita procedural sky (Blender 2.90+ / 5.x)
        sky_tex = wt.nodes.new("ShaderNodeTexSky")
        sky_tex.sky_type = "NISHITA"

        # Sun direction matching the sun light
        sky_tex.sun_elevation   = math.radians(sun_elevation_deg)
        sky_tex.sun_rotation    = math.radians(sun_azimuth_deg)

        # Himalayan atmosphere: thin, relatively clear at altitude
        sky_tex.air_density   = 1.0     # standard air density
        sky_tex.dust_density  = 0.5     # moderate dust (realistic HKH)
        sky_tex.ozone_density = 1.0     # standard ozone

        wt.links.new(sky_tex.outputs["Color"], bg_node.inputs["Color"])
        used_nishita = True
        print("[render_settings] Nishita sky texture applied")

    except Exception as exc:
        # Fallback: simple gradient sky (zenith = pale blue, horizon = warm white)
        # via a ColorRamp + Geometry/Position trick.
        print(f"[render_settings] Nishita unavailable ({exc}), using gradient sky fallback")
        try:
            # Use a Layer Weight / Facing direction to get zenith–horizon gradient
            sky_tex = wt.nodes.new("ShaderNodeValToRGB")
            sky_ramp = sky_tex.color_ramp
            sky_ramp.interpolation = "LINEAR"
            # horizon (fac=0): warm white-pink
            sky_ramp.elements[0].position = 0.0
            sky_ramp.elements[0].color = (0.95, 0.88, 0.82, 1.0)
            # zenith (fac=1): pale sky blue
            if len(sky_ramp.elements) < 2:
                sky_ramp.elements.new(1.0)
            sky_ramp.elements[1].position = 1.0
            sky_ramp.elements[1].color = (0.49, 0.67, 0.90, 1.0)

            # Layer Weight Facing ≈ 0 at horizon, 1 at zenith for world background
            lw = wt.nodes.new("ShaderNodeLayerWeight")
            lw.inputs["Blend"].default_value = 0.5  # type: ignore[index]
            wt.links.new(lw.outputs["Facing"], sky_tex.inputs["Fac"])
            wt.links.new(sky_tex.outputs["Color"], bg_node.inputs["Color"])
        except Exception:
            # Last resort: solid pale blue sky
            bg_node.inputs["Color"].default_value = (0.53, 0.74, 0.95, 1.0)  # type: ignore[index]

    # Layout
    wo_out.location  = (300, 0)
    bg_node.location = (0,   0)
    if "sky_tex" in dir():
        sky_tex.location = (-300, 0)

    print(
        f"[render_settings] Sky lighting: sun_elevation={sun_elevation_deg}°, "
        f"azimuth={sun_azimuth_deg}°, strength={sun_strength}, "
        f"nishita={used_nishita}"
    )

    return {"sun_object": sun, "used_nishita": used_nishita}
