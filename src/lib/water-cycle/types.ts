/**
 * Water-Cycle Atlas — TypeScript types for provenance.json
 *
 * Schema source: docs/water-cycle/01-architecture.md "Critical contract: provenance.json"
 * Do NOT modify without updating scripts/render/water-cycle/shared/provenance-schema.ts
 * and all chapter bpy scripts in the same PR.
 */

export type SceneLayerType =
  | "polygon-extrusion"
  | "polygon-flat"
  | "raster"
  | "particle-system"
  | "text-3d"
  | "camera-marker"
  | "station-pin";

export type SceneLayer = {
  /** Unique within the chapter */
  id: string;
  type: SceneLayerType;
  source: {
    /** Human-readable dataset name */
    dataset: string;
    url: string;
    doi?: string;
    version?: string;
    year_keyframe?: number;
    filter?: string;
    n_features?: number;
    preprocessing?: string[];
  };
  /** bpy collection name — e.g. "blender-collection://glacier-1990" */
  render_geometry_id: string;
  thickness_model?: {
    method: string;
    doi?: string;
    uncertainty_pct: number;
  };
  /**
   * Hex color. MUST match color grammar from WATER_CYCLE_SPEC.md §7:
   *   #7DD3FC = ice/glaciers, #0E7490 = lakes, #38BDF8 = active water,
   *   #F87171 = loss/risk, #FBBF24 = heat, #FCD34D = people, #475569 = terrain
   */
  color: string;
};

export type HeadlineNumber = {
  value: string;
  label: string;
  /** doi:<DOI> or url:<URL> */
  citation: string;
  uncertainty?: string;
};

export type Provenance = {
  chapter_id: "ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";
  /** Human-readable shot name, e.g. "hkh-flyover" */
  shot_id: string;
  duration_s: number;
  frames: number;
  /** Locked at 30 fps */
  fps: 30;
  /** Locked at 1280×720 */
  resolution: { w: 1280; h: 720 };
  camera_path: {
    keyframes: {
      t: number;
      lon: number;
      lat: number;
      alt_m: number;
      pitch_deg: number;
      yaw_deg: number;
    }[];
  };
  scene_layers: SceneLayer[];
  headline_numbers: HeadlineNumber[];
  /** Server-rendered HTML caption for this chapter */
  caption_text: string;
  /** ISO 8601 timestamp of when this provenance was generated */
  generated_at: string;
  /** Blender version string, e.g. "5.1.1" */
  blender_version: string;
  /** SHA-256 hex digest of the bpy script that generated this render */
  bpy_script_hash: string;
};
