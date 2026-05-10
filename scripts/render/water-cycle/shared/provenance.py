"""Generate provenance.json for a chapter. Strict schema enforcement.

This module matches the TypeScript schema at:
  scripts/render/water-cycle/shared/provenance-schema.ts
  src/lib/water-cycle/types.ts

Usage:
    import provenance
    provenance.write_provenance(
        output_path=Path("public/water-cycle/ch0/provenance.json"),
        chapter_id="ch0",
        shot_id="hkh-flyover",
        duration_s=30,
        fps=30,
        scene_layers=[...],
        headline_numbers=[...],
        caption_text="...",
        bpy_script_hash="a8f3...",
        camera_keyframes=[...],
    )
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict


class SceneLayerSource(TypedDict, total=False):
    dataset: str        # required
    url: str           # required
    doi: str
    version: str
    year_keyframe: int
    filter: str
    n_features: int
    preprocessing: list[str]


class ThicknessModel(TypedDict, total=False):
    method: str         # required
    doi: str
    uncertainty_pct: float  # required


class SceneLayer(TypedDict, total=False):
    id: str             # required, unique within chapter
    type: str           # required, one of VALID_TYPES
    source: SceneLayerSource  # required
    render_geometry_id: str   # required
    color: str          # required, hex #RRGGBB
    thickness_model: ThicknessModel


class HeadlineNumber(TypedDict, total=False):
    value: str          # required
    label: str          # required
    citation: str       # required (doi: or url:)
    uncertainty: str


class CameraKeyframe(TypedDict):
    t: float
    lon: float
    lat: float
    alt_m: float
    pitch_deg: float
    yaw_deg: float


# Valid type values from the schema
VALID_TYPES = {
    "polygon-extrusion",
    "polygon-flat",
    "raster",
    "particle-system",
    "text-3d",
    "camera-marker",
    "station-pin",
}


def _validate(data: dict) -> None:
    """Raise ValueError if data doesn't satisfy the provenance schema."""
    errors: list[str] = []

    valid_chapter_ids = {"ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"}
    if data.get("chapter_id") not in valid_chapter_ids:
        errors.append(f"chapter_id must be one of {valid_chapter_ids}")
    if not data.get("shot_id"):
        errors.append("shot_id: required non-empty string")
    if not isinstance(data.get("duration_s"), (int, float)) or data["duration_s"] <= 0:
        errors.append("duration_s: required positive number")
    if not isinstance(data.get("frames"), int) or data["frames"] <= 0:
        errors.append("frames: required positive integer")
    if data.get("fps") != 30:
        errors.append("fps: must be exactly 30 (locked)")
    res = data.get("resolution", {})
    if res.get("w") != 1280 or res.get("h") != 720:
        errors.append("resolution: must be {w: 1280, h: 720} (locked)")

    # Camera path
    cp = data.get("camera_path", {})
    kfs = cp.get("keyframes", [])
    if not kfs:
        errors.append("camera_path.keyframes: required non-empty array")
    for i, kf in enumerate(kfs):
        for field in ("t", "lon", "lat", "alt_m", "pitch_deg", "yaw_deg"):
            if not isinstance(kf.get(field), (int, float)):
                errors.append(f"camera_path.keyframes[{i}].{field}: required number")

    # Scene layers
    layer_ids: set[str] = set()
    for i, layer in enumerate(data.get("scene_layers", [])):
        path = f"scene_layers[{i}]"
        if not layer.get("id"):
            errors.append(f"{path}.id: required non-empty string")
        elif layer["id"] in layer_ids:
            errors.append(f"scene_layers: duplicate id '{layer['id']}'")
        else:
            layer_ids.add(layer["id"])
        if layer.get("type") not in VALID_TYPES:
            errors.append(f"{path}.type: must be one of {VALID_TYPES}")
        src = layer.get("source", {})
        if not src.get("dataset"):
            errors.append(f"{path}.source.dataset: required non-empty string")
        if not src.get("url"):
            errors.append(f"{path}.source.url: required non-empty string")
        if not layer.get("render_geometry_id"):
            errors.append(f"{path}.render_geometry_id: required non-empty string")
        color = layer.get("color", "")
        import re
        if not re.match(r"^#[0-9a-fA-F]{6}$", color):
            errors.append(f"{path}.color: required hex color string (e.g. '#7DD3FC')")

    # Headline numbers
    for i, hn in enumerate(data.get("headline_numbers", [])):
        path = f"headline_numbers[{i}]"
        for field in ("value", "label", "citation"):
            if not hn.get(field):
                errors.append(f"{path}.{field}: required non-empty string")

    # Top-level required strings
    if not isinstance(data.get("caption_text"), str):
        errors.append("caption_text: required string")
    if not data.get("generated_at"):
        errors.append("generated_at: required ISO 8601 datetime string")
    if not data.get("blender_version"):
        errors.append("blender_version: required non-empty string")
    bsh = data.get("bpy_script_hash", "")
    if not isinstance(bsh, str) or not __import__("re").match(r"^[0-9a-f]{64}$", bsh):
        errors.append("bpy_script_hash: required SHA-256 hex string (64 lowercase hex chars)")

    if errors:
        raise ValueError("provenance.json validation failed:\n  " + "\n  ".join(errors))


def write_provenance(
    output_path: Path,
    chapter_id: str,
    shot_id: str,
    duration_s: float,
    fps: int,
    scene_layers: list[SceneLayer],
    headline_numbers: list[HeadlineNumber],
    caption_text: str,
    bpy_script_hash: str,
    camera_keyframes: list[tuple],
    blender_version: str = "5.1.1",
    used_real_dem: bool = True,
) -> None:
    """Validate and write provenance.json to output_path.

    camera_keyframes: list of (frame, lon, lat, alt_m, pitch_deg, yaw_deg[, focal_mm])
    """
    frames = int(round(duration_s * fps))

    # Convert camera keyframes to dict format
    kf_dicts = []
    for kf in camera_keyframes:
        kf_dict: CameraKeyframe = {
            "t": kf[0] / fps,  # frame → time in seconds
            "lon": kf[1],
            "lat": kf[2],
            "alt_m": kf[3],
            "pitch_deg": kf[4],
            "yaw_deg": kf[5],
        }
        kf_dicts.append(kf_dict)

    data = {
        "chapter_id": chapter_id,
        "shot_id": shot_id,
        "duration_s": duration_s,
        "frames": frames,
        "fps": fps,
        "resolution": {"w": 1280, "h": 720},
        "camera_path": {"keyframes": kf_dicts},
        "scene_layers": list(scene_layers),
        "headline_numbers": list(headline_numbers),
        "caption_text": caption_text,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "blender_version": blender_version,
        "bpy_script_hash": bpy_script_hash,
        # Extra metadata (not in schema, for auditability)
        "_used_real_dem": used_real_dem,
    }

    # Validate before writing
    _validate(data)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"[provenance] Written: {output_path}")
