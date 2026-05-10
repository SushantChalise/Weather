/**
 * provenance.ts — Build-time provenance loader
 *
 * Reads public/water-cycle/ch{N}/provenance.json at build time and bundles the
 * result into the page.  Per spec anti-patterns: do NOT fetch at runtime.
 *
 * Falls back to createEmptyProvenance() if a file is missing (expected during
 * early dev before Blender renders exist).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import type { Provenance } from "./types";

const CHAPTERS = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"] as const;
type ChapterId = (typeof CHAPTERS)[number];

/**
 * Returns an empty/minimal provenance stub for a chapter, used when the
 * provenance.json does not exist yet (pre-render placeholder state).
 */
function createEmptyProvenance(chapterId: string): Provenance {
  const id = chapterId as ChapterId;
  const durations: Record<ChapterId, number> = {
    ch0: 30,
    ch1: 25,
    ch2: 25,
    ch3: 15,
    ch4: 20,
    ch5: 20,
    ch6: 30,
  };
  const shotIds: Record<ChapterId, string> = {
    ch0: "hkh-flyover",
    ch1: "glacier-retreat-grid",
    ch2: "imja-lake-bloom",
    ch3: "moisture-sankey",
    ch4: "hydrological-clock",
    ch5: "impurity-transect",
    ch6: "ssp-split",
  };
  const captions: Record<ChapterId, string> = {
    ch0: "<p>Between 1990 and 2020, the Hindu Kush Himalaya lost <strong>9% of all glacier ice</strong> — 516 km³ of water-equivalent. This reservoir is draining.</p>",
    ch1: "<p>Four glaciers — Khumbu, Yala, Annapurna I, and Imja — simultaneously retreating. The year ticker drives home synchronized loss.</p>",
    ch2: "<p>Imja Tsho grew from 0.04 km² in 1962 to 1.4 km² in 2020 — a 35-fold expansion. As the glacier retreats, the lake fills.</p>",
    ch3: "<p>Where does glacier water go? A Sankey of moisture flux through the HKH system: precipitation → ice → melt → lakes → rivers → ocean.</p>",
    ch4: "<p>Glacier melt peaks weeks earlier than it did in 1990. Water arrives when farmers don’t need it — and is gone when they do.</p>",
    ch5: "<p>Black carbon and dust settle on snow, reducing albedo. Less reflection means more melt — a self-reinforcing loop.</p>",
    ch6: "<p>Two futures: SSP1-2.6 vs SSP5-8.5. The ghost glacier in the worst case is the volume of our indecision.</p>",
  };

  return {
    chapter_id: id,
    shot_id: shotIds[id],
    duration_s: durations[id],
    frames: durations[id] * 30,
    fps: 30,
    resolution: { w: 1280, h: 720 },
    camera_path: {
      keyframes: [
        { t: 0, lon: 86.9, lat: 27.9, alt_m: 12000, pitch_deg: -35, yaw_deg: 0 },
        {
          t: durations[id],
          lon: 86.93,
          lat: 27.98,
          alt_m: 4500,
          pitch_deg: -10,
          yaw_deg: 15,
        },
      ],
    },
    scene_layers: [],
    headline_numbers: [],
    caption_text: captions[id],
    generated_at: "2026-05-11T00:00:00Z",
    blender_version: "placeholder",
    bpy_script_hash: "0000000000000000000000000000000000000000000000000000000000000000",
  };
}

/**
 * Load all 7 chapter provenance files.
 * Called at build time from the server component page.tsx.
 *
 * Returns a Record keyed by chapter id ("ch0"–"ch6").
 */
export async function loadAllProvenance(): Promise<Record<ChapterId, Provenance>> {
  const result = {} as Record<ChapterId, Provenance>;

  for (const ch of CHAPTERS) {
    const filePath = path.join(process.cwd(), "public", "water-cycle", ch, "provenance.json");
    try {
      const text = await fs.readFile(filePath, "utf-8");
      result[ch] = JSON.parse(text) as Provenance;
    } catch {
      // During dev / pre-render, provenance may not exist yet — fall back to stub
      result[ch] = createEmptyProvenance(ch);
    }
  }

  return result;
}
