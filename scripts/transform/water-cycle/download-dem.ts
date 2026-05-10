#!/usr/bin/env tsx
/**
 * download-dem.ts
 *
 * Downloads the SRTM 30m DEM for the Hindu Kush Himalaya (HKH) bounding box
 * via the OpenTopography Global DEM API (SRTMGL1_E dataset) and writes the
 * GeoTIFF to data/water-cycle/dem/srtm-hkh-30m.tif.
 *
 * Dataset: SRTMGL1_E (SRTM 1-arc-second elevation)
 * Bbox:    [70°E, 26°N, 95°E, 36°N] — covers the full HKH region
 * License: Public domain (NASA)
 * Source:  OpenTopography Global DEM API, https://portal.opentopography.org/
 *
 * Usage:
 *   npm run transform:water-cycle-dem
 *
 * Requires:
 *   OPENTOPO_API_KEY environment variable (obtain a free key at
 *   https://portal.opentopography.org/requestApiKey)
 *
 * Idempotent: if data/water-cycle/dem/srtm-hkh-30m.tif already exists and is
 * non-empty, the download is skipped.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * HKH bounding box: [west, south, east, north] in decimal degrees (WGS84)
 * Covers Hindu Kush Himalaya region per docs/water-cycle/02-data-sources.md
 */
const BBOX = {
  west: 70,
  south: 26,
  east: 95,
  north: 36,
} as const;

const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "data",
  "water-cycle",
  "dem",
  "srtm-hkh-30m.tif",
);

const API_BASE = "https://portal.opentopography.org/API/globaldem";

/**
 * GeoTIFF magic bytes: 0x49 0x49 (little-endian) or 0x4D 0x4D (big-endian)
 * followed by 0x2A 0x00 (LE) or 0x00 0x2A (BE).
 * See TIFF 6.0 spec §2.
 */
const GEOTIFF_MAGIC_LE = Buffer.from([0x49, 0x49, 0x2a, 0x00]); // TIFF LE
const GEOTIFF_MAGIC_BE = Buffer.from([0x4d, 0x4d, 0x00, 0x2a]); // TIFF BE

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkGeoTiffMagic(filePath: string): boolean {
  const fd = fs.openSync(filePath, "r");
  const buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  return (
    buf.subarray(0, 4).equals(GEOTIFF_MAGIC_LE) ||
    buf.subarray(0, 4).equals(GEOTIFF_MAGIC_BE)
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const apiKey = process.env["OPENTOPO_API_KEY"];
  if (!apiKey) {
    console.error(
      "ERROR: OPENTOPO_API_KEY environment variable is not set.\n" +
        "Obtain a free API key at https://portal.opentopography.org/requestApiKey\n" +
        "Then re-run:  OPENTOPO_API_KEY=<key> npm run transform:water-cycle-dem",
    );
    process.exit(1);
  }

  // ── Idempotency check ────────────────────────────────────────────────────

  if (fs.existsSync(OUTPUT_PATH)) {
    const { size } = fs.statSync(OUTPUT_PATH);
    if (size > 0) {
      console.log(
        `✓ Output already exists (${formatBytes(size)}): ${OUTPUT_PATH}`,
      );
      console.log("  Skipping download (idempotent). Delete the file to re-download.");

      // Still validate magic bytes on existing file
      if (checkGeoTiffMagic(OUTPUT_PATH)) {
        console.log("  GeoTIFF magic bytes: valid ✓");
      } else {
        console.error("  WARNING: existing file does not start with GeoTIFF magic bytes.");
        console.error("  Delete and re-run to download a fresh copy.");
        process.exit(1);
      }
      return;
    }
    console.log("  Found empty output file — removing and re-downloading.");
    fs.unlinkSync(OUTPUT_PATH);
  }

  // ── Build API URL ─────────────────────────────────────────────────────────

  const params = new URLSearchParams({
    demtype: "SRTMGL1_E",
    south: String(BBOX.south),
    north: String(BBOX.north),
    west: String(BBOX.west),
    east: String(BBOX.east),
    outputFormat: "GTiff",
    API_Key: apiKey,
  });

  const url = `${API_BASE}?${params.toString()}`;

  console.log("SRTM 30m DEM — HKH bbox download");
  console.log(`  Dataset  : SRTMGL1_E (NASA SRTM 1-arc-second elevation)`);
  console.log(`  Bbox     : [${BBOX.west}°E, ${BBOX.south}°N] → [${BBOX.east}°E, ${BBOX.north}°N]`);
  console.log(`  Output   : ${OUTPUT_PATH}`);
  console.log(`  API      : ${API_BASE}`);
  console.log("");
  console.log("Starting download (this file is ~1-2 GB — may take several minutes) …");

  // ── Ensure output directory exists ───────────────────────────────────────

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  // ── Streaming download ────────────────────────────────────────────────────

  const response = await fetch(url);

  if (!response.ok) {
    // Read error body (XML from OpenTopography)
    const errorBody = await response.text();
    console.error(`HTTP ${response.status}: ${response.statusText}`);
    console.error(`API error: ${errorBody}`);
    process.exit(1);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/xml") || contentType.includes("application/xml")) {
    // OpenTopography returns 200 with XML body on some errors (e.g., rate limit)
    const body = await response.text();
    console.error(`API returned XML instead of binary — possible error:`);
    console.error(body);
    process.exit(1);
  }

  // Stream response body to disk
  const tempPath = `${OUTPUT_PATH}.part`;
  const writeStream = fs.createWriteStream(tempPath);

  if (!response.body) {
    console.error("Response body is null — cannot download.");
    process.exit(1);
  }

  const contentLength = response.headers.get("content-length");
  const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

  let downloaded = 0;
  let lastLogTime = Date.now();
  const PROGRESS_INTERVAL_MS = 5_000; // log every 5 seconds

  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    writeStream.write(chunk);
    downloaded += chunk.length;

    const now = Date.now();
    if (now - lastLogTime >= PROGRESS_INTERVAL_MS) {
      if (totalBytes) {
        const pct = ((downloaded / totalBytes) * 100).toFixed(1);
        process.stdout.write(
          `\r  Downloaded: ${formatBytes(downloaded)} / ${formatBytes(totalBytes)} (${pct}%)  `,
        );
      } else {
        process.stdout.write(`\r  Downloaded: ${formatBytes(downloaded)}  `);
      }
      lastLogTime = now;
    }
  }

  await new Promise<void>((resolve, reject) => {
    writeStream.end((err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });

  process.stdout.write("\n");

  // ── Validate and rename ───────────────────────────────────────────────────

  const { size } = fs.statSync(tempPath);
  console.log(`  Download complete: ${formatBytes(size)}`);

  if (size === 0) {
    fs.unlinkSync(tempPath);
    console.error("Downloaded file is empty. Aborting.");
    process.exit(1);
  }

  // Check GeoTIFF magic bytes
  const fd = fs.openSync(tempPath, "r");
  const magicBuf = Buffer.alloc(4);
  fs.readSync(fd, magicBuf, 0, 4, 0);
  fs.closeSync(fd);

  const isValidGeoTiff =
    magicBuf.subarray(0, 4).equals(GEOTIFF_MAGIC_LE) ||
    magicBuf.subarray(0, 4).equals(GEOTIFF_MAGIC_BE);

  if (!isValidGeoTiff) {
    // Dump first 512 bytes for debugging
    const debugBuf = Buffer.alloc(512);
    const debugFd = fs.openSync(tempPath, "r");
    const bytesRead = fs.readSync(debugFd, debugBuf, 0, 512, 0);
    fs.closeSync(debugFd);
    console.error("Downloaded file does not start with GeoTIFF magic bytes.");
    console.error(`First ${bytesRead} bytes (hex):`);
    console.error(debugBuf.subarray(0, bytesRead).toString("hex"));
    console.error(`First ${bytesRead} bytes (ascii):`);
    console.error(debugBuf.subarray(0, bytesRead).toString("ascii").replace(/[^\x20-\x7E]/g, "."));
    fs.unlinkSync(tempPath);
    process.exit(1);
  }

  // Rename .part → final path (atomic on most systems)
  fs.renameSync(tempPath, OUTPUT_PATH);

  console.log(`  GeoTIFF magic bytes: valid ✓`);
  console.log(`  File size: ${formatBytes(size)}`);
  console.log(`  Output: ${OUTPUT_PATH}`);

  if (size < 500 * 1024 * 1024) {
    console.warn(
      `  WARNING: file is ${formatBytes(size)}, expected ~1-2 GB for HKH bbox.`,
    );
    console.warn(`  The download may be incomplete or the region was downsampled.`);
  } else {
    console.log(`  Size check: ✓ (> 500 MB, likely complete)`);
  }

  console.log("\n✓ DEM staged successfully.");
  console.log(`  Next step: run the Blender render pipeline (see scripts/render/water-cycle/)`);
}

main().catch((err: unknown) => {
  console.error("download-dem failed:", err);
  process.exit(1);
});
