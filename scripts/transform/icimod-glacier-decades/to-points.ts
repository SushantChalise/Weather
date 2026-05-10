#!/usr/bin/env tsx

/**
 * HKH glacier polygons → Points-only sibling files.
 *
 * The full polygon files are 8.7 MB Brotli / 44 MB raw / 65k polygons.
 * MapLibre tessellation + GPU upload takes 10-30s on slower machines,
 * which makes /atlas/30-years feel broken on first paint.
 *
 * This script reads each public/glaciers/hkh/{year}.geojson.br, computes
 * polygon centroids, and writes a sibling {year}-points.geojson.br with
 * just Point features. Same per-feature properties as the polygon file
 * (id, area_km2, year, GLIMS_ID, Mt_Range, M_Basin) so the circle layer
 * reads the same data shape. Result: ~500 KB compressed per file, parses
 * + uploads in < 100 ms.
 *
 * Usage:
 *   npm run transform:icimod-glacier-decades-points
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, brotliDecompressSync, constants as zlibConstants } from "node:zlib";

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
  // For Polygon: coords is rings: [[ring1], [ring2hole], ...]
  // For MultiPolygon: coords is [[[ring1], [ring2]...], [[ring1]...]]
  // We want every coordinate pair to compute centroid.
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
    const outputPath = path.join(INPUT_DIR, `${year}-points.geojson.br`);
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
    const outBuf = brotliCompressSync(Buffer.from(outJson, "utf8"), {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
    });
    fs.writeFileSync(outputPath, outBuf);

    console.log(
      `[OK] ${year}: ${points.length} points (${dropped} dropped) — ` +
        `${(compressed.length / 1024 / 1024).toFixed(2)} MB poly → ` +
        `${(outBuf.length / 1024).toFixed(1)} KB points`,
    );
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
