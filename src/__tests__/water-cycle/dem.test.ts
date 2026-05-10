/**
 * dem.test.ts
 *
 * Verifies that data/water-cycle/dem/srtm-hkh-30m.tif:
 *   1. Exists and is non-empty (> 500 MB expected for HKH bbox)
 *   2. Starts with valid GeoTIFF magic bytes
 *
 * If the file does not exist (e.g. on CI where data/ is gitignored),
 * the test is skipped with a clear message.
 *
 * Run after `npm run transform:water-cycle-dem`:
 *   npm test -- dem.test.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const DEM_PATH = path.join(PROJECT_ROOT, "data", "water-cycle", "dem", "srtm-hkh-30m.tif");

/**
 * Valid TIFF/BigTIFF magic bytes.
 * Standard TIFF: magic number 42 (0x002A)
 * BigTIFF: magic number 43 (0x002B) — required for files > 4 GB (the merged HKH DEM is ~7 GB)
 */
const GEOTIFF_MAGIC_LE = Buffer.from([0x49, 0x49, 0x2a, 0x00]); // TIFF LE
const GEOTIFF_MAGIC_BE = Buffer.from([0x4d, 0x4d, 0x00, 0x2a]); // TIFF BE
const BIGTIFF_MAGIC_LE = Buffer.from([0x49, 0x49, 0x2b, 0x00]); // BigTIFF LE
const BIGTIFF_MAGIC_BE = Buffer.from([0x4d, 0x4d, 0x00, 0x2b]); // BigTIFF BE

describe("SRTM HKH DEM", () => {
  it("exists and is a valid GeoTIFF", () => {
    if (!fs.existsSync(DEM_PATH)) {
      console.warn(
        `SKIP: ${DEM_PATH} not found.\n` +
          "Run `npm run transform:water-cycle-dem` first.\n" +
          "Requires OPENTOPO_API_KEY in .env.local.",
      );
      // Skip gracefully — the file is gitignored and only present on dev machines
      return;
    }

    const { size } = fs.statSync(DEM_PATH);
    expect(size, "DEM file must be non-empty").toBeGreaterThan(0);

    // Read first 4 bytes to check TIFF magic
    const fd = fs.openSync(DEM_PATH, "r");
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);

    const isValidGeoTiff =
      buf.subarray(0, 4).equals(GEOTIFF_MAGIC_LE) ||
      buf.subarray(0, 4).equals(GEOTIFF_MAGIC_BE) ||
      buf.subarray(0, 4).equals(BIGTIFF_MAGIC_LE) ||
      buf.subarray(0, 4).equals(BIGTIFF_MAGIC_BE);

    expect(isValidGeoTiff, `${DEM_PATH} does not start with GeoTIFF or BigTIFF magic bytes`).toBe(
      true,
    );

    console.log(`DEM file: ${DEM_PATH}`);
    console.log(`Size: ${(size / 1024 / 1024 / 1024).toFixed(2)} GB`);
  });
});
