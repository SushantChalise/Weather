#!/usr/bin/env node
/**
 * Uploads Himawari-9 tiles from ./himawari-output/ to Vercel Blob.
 * Uses @vercel/blob SDK so the REST API complexity is handled correctly.
 *
 * Reads meta.json written by himawari_pipeline.py, uploads each tile,
 * then writes manifest.json to blob with the public tile base URL.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { put } from "@vercel/blob";

const OUTPUT_DIR = "./himawari-output";
const meta = JSON.parse(readFileSync(`${OUTPUT_DIR}/meta.json`, "utf8"));
const { timestamp, capturedAt, processedAt, ageMinutes, tileTemplate, minZoom, maxZoom, bbox } =
  meta;

console.log(`Uploading tiles for slot ${capturedAt} …`);

// Walk the tile directory recursively
function* walkTiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walkTiles(full);
    else if (full.endsWith(".png")) yield full;
  }
}

const tileDir = `${OUTPUT_DIR}/${timestamp}`;
const tiles = [...walkTiles(tileDir)];
console.log(`  ${tiles.length} tiles to upload`);

let tileBaseUrl = null;
let uploaded = 0;

for (const tilePath of tiles) {
  // Convert local path to blob pathname: himawari/{ts}/{z}/{x}/{y}.png
  // path.relative() normalises both sides so the ./prefix discrepancy from
  // path.join stripping "./" never causes a missed replacement.
  const rel = relative(tileDir, tilePath).replace(/\\/g, "/");
  const blobPathname = `himawari/${timestamp}/${rel}`;

  const data = readFileSync(tilePath);
  const result = await put(blobPathname, data, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/png",
  });

  if (!tileBaseUrl) {
    // Extract base URL from first tile response
    // result.url = https://{storeId}.public.blob.vercel-storage.com/himawari/{ts}/{z}/{x}/{y}.png
    tileBaseUrl = result.url.replace(`/${rel}`, "");
  }

  uploaded++;
  if (uploaded % 20 === 0) process.stdout.write(`  ${uploaded}/${tiles.length}\r`);
}

console.log(`  ${uploaded} tiles uploaded`);

// Upload manifest.json
const manifest = {
  satellite: meta.satellite,
  band: meta.band,
  capturedAt,
  processedAt,
  ageMinutes,
  tileBaseUrl,
  tileTemplate,
  minZoom,
  maxZoom,
  bbox,
};

await put("himawari/manifest.json", JSON.stringify(manifest, null, 2), {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: "application/json",
});

console.log(`manifest.json → ${tileBaseUrl}`);
console.log("=== Upload done ===");
