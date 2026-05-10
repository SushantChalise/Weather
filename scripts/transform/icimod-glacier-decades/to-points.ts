#!/usr/bin/env tsx

/**
 * HKH glacier polygons → Points-only sibling files (uncompressed).
 *
 * Stores plain .geojson (not .geojson.br). Cloudflare's edge auto-compresses
 * on the wire via Accept-Encoding negotiation. This sidesteps the
 * Content-Encoding handshake bug we hit when shipping pre-Brotli'd files
 * through OpenNext's static asset binding (browser received raw Brotli
 * bytes without the matching Content-Encoding header).
 *
 * Usage:
 *   npm run transform:icimod-glacier-decades-points
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const INPUT_DIR = path.join(PROJECT_ROOT, "public", "glaciers", "hkh");
const YEARS = [1990, 2000, 2010, 2020] as const;

interface Geometry {
  type: string;
  coordinates: unknown;
}

interface Feature {
  type: "Feature";
  geometry: Geometry;
  properties: Record<string, unknown>;
}

interface FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];
}

function flattenRings(coords: unknown): number[][] {
  const out: number[][] = [];
  function walk(node: unknown): void {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === "number" && typeof node[1] === "number") {
      out.push(node as number[]);
      return;
    }
    for (const child of node) walk(child);
  }
  walk(coords);
  return out;
}

function centroidOf(geom: Geometry): [number, number] | null {
  const points = flattenRings(geom.coordinates);
  if (points.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const [x, y] of points as [number, number][]) {
    sx += x;
    sy += y;
  }
  return [sx / points.length, sy / points.length];
}

async function main(): Promise<void> {
  for (const year of YEARS) {
    const inputPath = path.join(INPUT_DIR, `${year}.geojson.br`);
    const outputPath = path.join(INPUT_DIR, `${year}-points.geojson`);
    if (!fs.existsSync(inputPath)) {
      console.warn(`[SKIP] ${inputPath} — input file missing`);
      continue;
    }

    const compressed = fs.readFileSync(inputPath);
    const decompressed = brotliDecompressSync(compressed);
    const fc = JSON.parse(decompressed.toString("utf8")) as FeatureCollection;

    const points: Feature[] = [];
    let dropped = 0;
    for (const f of fc.features) {
      const c = centroidOf(f.geometry);
      if (!c) {
        dropped++;
        continue;
      }
      points.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: c },
        properties: f.properties,
      });
    }

    const out: FeatureCollection = { type: "FeatureCollection", features: points };
    const outJson = JSON.stringify(out);
    fs.writeFileSync(outputPath, outJson, "utf8");

    console.log(
      `[OK] ${year}: ${points.length} points (${dropped} dropped) — ` +
        `${(outJson.length / 1024 / 1024).toFixed(2)} MB raw .geojson`,
    );
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
