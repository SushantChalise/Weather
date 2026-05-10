/**
 * Hand-rolled validator for provenance.json
 *
 * Zod is not installed in this project. This module exports a validate()
 * function that returns { ok: true } | { ok: false; errors: string[] }.
 *
 * Schema source: docs/water-cycle/01-architecture.md "Critical contract: provenance.json"
 * Keep in sync with src/lib/water-cycle/types.ts.
 */

import type { Provenance, SceneLayer, HeadlineNumber } from "../../../../src/lib/water-cycle/types";

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

// ---------------------------------------------------------------------------
// Sub-validators
// ---------------------------------------------------------------------------

const VALID_CHAPTER_IDS = new Set(["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"]);

const VALID_LAYER_TYPES = new Set([
  "polygon-extrusion",
  "polygon-flat",
  "raster",
  "particle-system",
  "text-3d",
  "camera-marker",
  "station-pin",
]);

function validateSource(src: unknown, path: string, errors: string[]): void {
  if (!isObject(src)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  if (!isString(src.dataset) || src.dataset.trim() === "") {
    errors.push(`${path}.dataset: required non-empty string`);
  }
  if (!isString(src.url) || src.url.trim() === "") {
    errors.push(`${path}.url: required non-empty string`);
  }
  if ("doi" in src && src.doi !== undefined && !isString(src.doi)) {
    errors.push(`${path}.doi: must be string when present`);
  }
  if ("version" in src && src.version !== undefined && !isString(src.version)) {
    errors.push(`${path}.version: must be string when present`);
  }
  if ("year_keyframe" in src && src.year_keyframe !== undefined && !isNumber(src.year_keyframe)) {
    errors.push(`${path}.year_keyframe: must be number when present`);
  }
  if ("filter" in src && src.filter !== undefined && !isString(src.filter)) {
    errors.push(`${path}.filter: must be string when present`);
  }
  if ("n_features" in src && src.n_features !== undefined && !isNumber(src.n_features)) {
    errors.push(`${path}.n_features: must be number when present`);
  }
  if ("preprocessing" in src && src.preprocessing !== undefined) {
    if (!isArray(src.preprocessing) || !src.preprocessing.every(isString)) {
      errors.push(`${path}.preprocessing: must be string[] when present`);
    }
  }
}

function validateThicknessModel(tm: unknown, path: string, errors: string[]): void {
  if (!isObject(tm)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  if (!isString(tm.method) || tm.method.trim() === "") {
    errors.push(`${path}.method: required non-empty string`);
  }
  if ("doi" in tm && tm.doi !== undefined && !isString(tm.doi)) {
    errors.push(`${path}.doi: must be string when present`);
  }
  if (!isNumber(tm.uncertainty_pct)) {
    errors.push(`${path}.uncertainty_pct: required number`);
  }
}

function validateSceneLayer(layer: unknown, index: number, errors: string[]): void {
  const path = `scene_layers[${index}]`;
  if (!isObject(layer)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  if (!isString(layer.id) || layer.id.trim() === "") {
    errors.push(`${path}.id: required non-empty string`);
  }
  if (!isString(layer.type) || !VALID_LAYER_TYPES.has(layer.type)) {
    errors.push(
      `${path}.type: must be one of ${[...VALID_LAYER_TYPES].join(", ")}`,
    );
  }
  validateSource(layer.source, `${path}.source`, errors);
  if (!isString(layer.render_geometry_id) || layer.render_geometry_id.trim() === "") {
    errors.push(`${path}.render_geometry_id: required non-empty string`);
  }
  if ("thickness_model" in layer && layer.thickness_model !== undefined) {
    validateThicknessModel(layer.thickness_model, `${path}.thickness_model`, errors);
  }
  if (!isString(layer.color) || !/^#[0-9a-fA-F]{6}$/.test(layer.color)) {
    errors.push(`${path}.color: required hex color string (e.g. "#7DD3FC")`);
  }
}

function validateHeadlineNumber(hn: unknown, index: number, errors: string[]): void {
  const path = `headline_numbers[${index}]`;
  if (!isObject(hn)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  if (!isString(hn.value) || hn.value.trim() === "") {
    errors.push(`${path}.value: required non-empty string`);
  }
  if (!isString(hn.label) || hn.label.trim() === "") {
    errors.push(`${path}.label: required non-empty string`);
  }
  if (!isString(hn.citation) || hn.citation.trim() === "") {
    errors.push(`${path}.citation: required non-empty string`);
  }
  if ("uncertainty" in hn && hn.uncertainty !== undefined && !isString(hn.uncertainty)) {
    errors.push(`${path}.uncertainty: must be string when present`);
  }
}

function validateCameraPath(cp: unknown, errors: string[]): void {
  const path = "camera_path";
  if (!isObject(cp)) {
    errors.push(`${path}: must be an object`);
    return;
  }
  if (!isArray(cp.keyframes) || cp.keyframes.length === 0) {
    errors.push(`${path}.keyframes: required non-empty array`);
    return;
  }
  for (let i = 0; i < cp.keyframes.length; i++) {
    const kf = cp.keyframes[i];
    const kpath = `${path}.keyframes[${i}]`;
    if (!isObject(kf)) {
      errors.push(`${kpath}: must be an object`);
      continue;
    }
    for (const field of ["t", "lon", "lat", "alt_m", "pitch_deg", "yaw_deg"] as const) {
      if (!isNumber(kf[field])) {
        errors.push(`${kpath}.${field}: required number`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Validate a raw parsed JSON value against the Provenance schema.
 * Returns { ok: true } on success, { ok: false; errors: string[] } on failure.
 */
export function validate(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(raw)) {
    return { ok: false, errors: ["root: must be a JSON object"] };
  }

  // chapter_id
  if (!isString(raw.chapter_id) || !VALID_CHAPTER_IDS.has(raw.chapter_id)) {
    errors.push(
      `chapter_id: must be one of ${[...VALID_CHAPTER_IDS].join(", ")}`,
    );
  }

  // shot_id
  if (!isString(raw.shot_id) || raw.shot_id.trim() === "") {
    errors.push("shot_id: required non-empty string");
  }

  // duration_s
  if (!isNumber(raw.duration_s) || raw.duration_s <= 0) {
    errors.push("duration_s: required positive number");
  }

  // frames
  if (!isNumber(raw.frames) || raw.frames <= 0 || !Number.isInteger(raw.frames)) {
    errors.push("frames: required positive integer");
  }

  // fps — locked at 30
  if (raw.fps !== 30) {
    errors.push("fps: must be exactly 30 (locked)");
  }

  // resolution — locked at 1280×720
  if (!isObject(raw.resolution)) {
    errors.push("resolution: must be an object");
  } else {
    if (raw.resolution.w !== 1280) {
      errors.push("resolution.w: must be exactly 1280 (locked)");
    }
    if (raw.resolution.h !== 720) {
      errors.push("resolution.h: must be exactly 720 (locked)");
    }
  }

  // camera_path
  validateCameraPath(raw.camera_path, errors);

  // scene_layers
  if (!isArray(raw.scene_layers)) {
    errors.push("scene_layers: required array");
  } else {
    for (let i = 0; i < raw.scene_layers.length; i++) {
      validateSceneLayer(raw.scene_layers[i], i, errors);
    }
    // Check uniqueness of layer ids
    const seen = new Set<string>();
    for (const layer of raw.scene_layers) {
      if (isObject(layer) && isString(layer.id)) {
        if (seen.has(layer.id)) {
          errors.push(`scene_layers: duplicate id "${layer.id}"`);
        }
        seen.add(layer.id);
      }
    }
  }

  // headline_numbers
  if (!isArray(raw.headline_numbers)) {
    errors.push("headline_numbers: required array");
  } else {
    for (let i = 0; i < raw.headline_numbers.length; i++) {
      validateHeadlineNumber(raw.headline_numbers[i], i, errors);
    }
  }

  // caption_text
  if (!isString(raw.caption_text)) {
    errors.push("caption_text: required string");
  }

  // generated_at — ISO 8601
  if (!isString(raw.generated_at) || isNaN(Date.parse(raw.generated_at))) {
    errors.push("generated_at: required ISO 8601 datetime string");
  }

  // blender_version
  if (!isString(raw.blender_version) || raw.blender_version.trim() === "") {
    errors.push("blender_version: required non-empty string");
  }

  // bpy_script_hash — sha256 hex (64 chars)
  if (!isString(raw.bpy_script_hash) || !/^[0-9a-f]{64}$/.test(raw.bpy_script_hash)) {
    errors.push(
      "bpy_script_hash: required SHA-256 hex string (64 lowercase hex characters)",
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

// Re-export types for consumers who import from this module
export type { Provenance, SceneLayer, HeadlineNumber };
