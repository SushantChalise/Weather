"""Cycles render presets. Production = 128 spp + denoise minimum (Codex caveat).

Usage:
    import render_settings
    render_settings.apply_preset("preview")   # fast Eevee, 360p, ~1 min
    render_settings.apply_preset("scrub")     # Cycles 64spp 480p
    render_settings.apply_preset("production")          # Cycles 128spp 720p
    render_settings.apply_preset("production_atmosphere")  # 256spp for volumetrics
"""
from __future__ import annotations

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
