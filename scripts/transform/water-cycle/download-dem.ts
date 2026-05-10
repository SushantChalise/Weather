#!/usr/bin/env tsx
/**
 * download-dem.ts
 *
 * Downloads the SRTM 30m DEM for the Hindu Kush Himalaya (HKH) bounding box
 * via the OpenTopography Global DEM API (SRTMGL1_E dataset).
 *
 * The HKH bbox [70°E, 26°N, 95°E, 36°N] is ~2,652,126 km², which exceeds the
 * OpenTopography API hard cap of 450,000 km² per request. This script splits
 * the bbox into a 3×3 grid of 9 sub-tiles, downloads each tile, then merges
 * them into a single GeoTIFF using Python + rasterio (GDAL 3.x).
 *
 * Grid layout (r=row 0..2 top→bottom, c=col 0..2 left→right):
 *
 *   Lon breaks: 70, 78.333, 86.667, 95
 *   Lat breaks: 36, 32.667, 29.333, 26  (north→south)
 *
 *   Each tile: ~8.33° × 3.33° ≈ ~833 km × ~370 km ≈ ~308,000 km² (< 450k cap)
 *
 * Tile files:  data/water-cycle/dem/tiles/srtm-hkh-tile-{r}-{c}.tif
 * Merged file: data/water-cycle/dem/srtm-hkh-30m.tif
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
 *   OPENTOPO_API_KEY environment variable (from .env.local via tsx --env-file)
 *   python3 with rasterio installed  (pip install rasterio)
 *   If rasterio is unavailable, the script blocks with install instructions.
 *
 * Idempotent per tile: if a tile already exists and has valid GeoTIFF magic
 * bytes, it is skipped. The merged file is (re-)built whenever any tile is
 * newly downloaded, or when the merged file is absent/empty.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * HKH bounding box grid definition.
 *
 * Longitude breaks: 3 columns → 3 lon spans each 8.333°
 *   [70, 78.333], [78.333, 86.667], [86.667, 95]
 *
 * Latitude breaks: 3 rows → 3 lat spans each 3.333°
 *   Row 0 (top):    [32.667, 36]
 *   Row 1 (middle): [29.333, 32.667]
 *   Row 2 (bottom): [26,     29.333]
 *
 * Each tile is ~308,000 km² — well under the 450,000 km² API cap.
 */
const LON_BREAKS: readonly number[] = [70, 78.333, 86.667, 95];
const LAT_BREAKS: readonly number[] = [36, 32.667, 29.333, 26]; // north → south

const TILES_DIR = path.join(
  PROJECT_ROOT,
  "data",
  "water-cycle",
  "dem",
  "tiles",
);

const MERGED_OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "data",
  "water-cycle",
  "dem",
  "srtm-hkh-30m.tif",
);

const API_BASE = "https://portal.opentopography.org/API/globaldem";

/**
 * GeoTIFF / BigTIFF magic bytes.
 * TIFF 6.0 spec §2: bytes 0-1 = byte order ("II" or "MM"), bytes 2-3 = magic
 *   - 42 (0x002A) for standard TIFF
 *   - 43 (0x002B) for BigTIFF (supports files > 4 GB, as used by the merged HKH DEM)
 */
const GEOTIFF_MAGIC_LE = Buffer.from([0x49, 0x49, 0x2a, 0x00]); // "II" + 42 LE
const GEOTIFF_MAGIC_BE = Buffer.from([0x4d, 0x4d, 0x00, 0x2a]); // "MM" + 42 BE
const BIGTIFF_MAGIC_LE = Buffer.from([0x49, 0x49, 0x2b, 0x00]); // "II" + 43 LE (BigTIFF)
const BIGTIFF_MAGIC_BE = Buffer.from([0x4d, 0x4d, 0x00, 0x2b]); // "MM" + 43 BE (BigTIFF)

/**
 * Retry settings for HTTP requests.
 * OpenTopography may return 503 on rate limit; we back off and retry.
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 30_000; // 30 s, doubles each retry

/** Minimum expected merged file size: 1 GB (acceptance criterion). */
const MIN_MERGED_SIZE_BYTES = 1 * 1024 * 1024 * 1024;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tile {
  row: number;
  col: number;
  west: number;
  east: number;
  south: number;
  north: number;
  filePath: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function checkGeoTiffMagic(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return (
      buf.subarray(0, 4).equals(GEOTIFF_MAGIC_LE) ||
      buf.subarray(0, 4).equals(GEOTIFF_MAGIC_BE) ||
      buf.subarray(0, 4).equals(BIGTIFF_MAGIC_LE) ||
      buf.subarray(0, 4).equals(BIGTIFF_MAGIC_BE)
    );
  } catch {
    return false;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a shell command and return stdout/stderr as strings.
 * Rejects if the process exits with non-zero code.
 */
function runCommand(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    proc.stdout.on("data", (d: Buffer) => stdoutChunks.push(d));
    proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    proc.on("close", (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      if (code !== 0) {
        reject(
          new Error(
            `Command "${cmd} ${args.join(" ")}" exited with code ${code}.\n` +
              `stdout: ${stdout}\nstderr: ${stderr}`,
          ),
        );
      } else {
        resolve({ stdout, stderr });
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn "${cmd}": ${err.message}`));
    });
  });
}

/**
 * Verify that python3 + rasterio are available.
 * Returns the python3 executable path, or throws a blocking error with
 * clear install instructions.
 */
async function requirePython3WithRasterio(): Promise<string> {
  const pythonCandidates = ["python3", "python"];

  for (const py of pythonCandidates) {
    try {
      const { stdout } = await runCommand(py, [
        "-c",
        "import rasterio; print(rasterio.__version__)",
      ]);
      const version = stdout.trim();
      console.log(`  python3 + rasterio ${version} available (${py})`);
      return py;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    "\n" +
      "BLOCKED: python3 with rasterio is required to merge the 9 DEM tiles.\n" +
      "\n" +
      "Install rasterio (which bundles GDAL) via:\n" +
      "  pip install rasterio\n" +
      "Or if using conda:\n" +
      "  conda install -c conda-forge rasterio\n" +
      "Or install GDAL standalone and add it to PATH:\n" +
      "  winget install OSGeo.GDAL\n" +
      "\n" +
      "After installing, re-run:\n" +
      "  npm run transform:water-cycle-dem\n",
  );
}

// ─── Grid builder ─────────────────────────────────────────────────────────────

/**
 * Build the 3×3 grid of tiles.
 * Row 0 = northernmost, row 2 = southernmost.
 * Col 0 = westernmost, col 2 = easternmost.
 */
function buildTileGrid(): Tile[] {
  const tiles: Tile[] = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const west = LON_BREAKS[c] as number;
      const east = LON_BREAKS[c + 1] as number;
      const north = LAT_BREAKS[r] as number;
      const south = LAT_BREAKS[r + 1] as number;

      tiles.push({
        row: r,
        col: c,
        west,
        east,
        south,
        north,
        filePath: path.join(TILES_DIR, `srtm-hkh-tile-${r}-${c}.tif`),
      });
    }
  }

  return tiles;
}

// ─── Tile download ────────────────────────────────────────────────────────────

/**
 * Download a single tile from OpenTopography.
 * Idempotent: skips if file already exists with valid GeoTIFF magic bytes.
 * Retries up to MAX_RETRIES on HTTP error with exponential backoff.
 *
 * Returns true if a new download was performed, false if skipped.
 */
async function downloadTile(tile: Tile, apiKey: string): Promise<boolean> {
  const label = `tile-${tile.row}-${tile.col} [W${tile.west}°,S${tile.south}°→E${tile.east}°,N${tile.north}°]`;

  // ── Idempotency check ──────────────────────────────────────────────────────
  if (fs.existsSync(tile.filePath)) {
    const { size } = fs.statSync(tile.filePath);
    if (size > 0 && checkGeoTiffMagic(tile.filePath)) {
      console.log(`  SKIP ${label}: already on disk (${formatBytes(size)}) ✓`);
      return false; // no new download
    }
    // Partial or invalid — remove and re-download
    console.log(`  ${label}: existing file is invalid/empty — removing.`);
    fs.unlinkSync(tile.filePath);
  }

  const params = new URLSearchParams({
    demtype: "SRTMGL1_E",
    south: String(tile.south),
    north: String(tile.north),
    west: String(tile.west),
    east: String(tile.east),
    outputFormat: "GTiff",
    API_Key: apiKey,
  });

  const url = `${API_BASE}?${params.toString()}`;
  const tempPath = `${tile.filePath}.part`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      const delayMs = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 2);
      console.log(
        `  ${label}: retry ${attempt}/${MAX_RETRIES} after ${delayMs / 1000}s …`,
      );
      await sleep(delayMs);
    }

    let response: Response;
    try {
      response = await fetch(url);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `  ${label}: network error on attempt ${attempt}: ${lastError.message}`,
      );
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "(unreadable)");
      lastError = new Error(
        `HTTP ${response.status}: ${errorBody.substring(0, 200)}`,
      );
      console.error(
        `  ${label}: HTTP error on attempt ${attempt}: ${lastError.message}`,
      );
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (
      contentType.includes("text/xml") ||
      contentType.includes("application/xml") ||
      contentType.includes("text/html")
    ) {
      const body = await response.text();
      lastError = new Error(
        `API returned non-binary content (${contentType}): ${body.substring(0, 300)}`,
      );
      console.error(
        `  ${label}: attempt ${attempt}: ${lastError.message}`,
      );
      continue;
    }

    if (!response.body) {
      lastError = new Error("Response body is null");
      console.error(`  ${label}: attempt ${attempt}: ${lastError.message}`);
      continue;
    }

    // Stream to disk
    const contentLength = response.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;
    let downloaded = 0;
    let lastLogTime = Date.now();
    const PROGRESS_INTERVAL_MS = 10_000;

    const writeStream = fs.createWriteStream(tempPath);

    try {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
        writeStream.write(chunk);
        downloaded += chunk.length;

        const now = Date.now();
        if (now - lastLogTime >= PROGRESS_INTERVAL_MS) {
          const progress = totalBytes
            ? ` / ${formatBytes(totalBytes)} (${((downloaded / totalBytes) * 100).toFixed(1)}%)`
            : "";
          process.stdout.write(
            `\r    ${label}: ${formatBytes(downloaded)}${progress}  `,
          );
          lastLogTime = now;
        }
      }

      await new Promise<void>((resolve, reject) => {
        writeStream.end((err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (err) {
      writeStream.destroy();
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `\n  ${label}: stream error on attempt ${attempt}: ${lastError.message}`,
      );
      continue;
    }

    process.stdout.write("\n");

    // Validate
    const { size } = fs.statSync(tempPath);
    if (size === 0) {
      fs.unlinkSync(tempPath);
      lastError = new Error("Downloaded file is empty");
      console.error(
        `  ${label}: attempt ${attempt}: ${lastError.message}`,
      );
      continue;
    }

    if (!checkGeoTiffMagic(tempPath)) {
      // Dump first 200 bytes for diagnosis
      const debugFd = fs.openSync(tempPath, "r");
      const debugBuf = Buffer.alloc(200);
      const bytesRead = fs.readSync(debugFd, debugBuf, 0, 200, 0);
      fs.closeSync(debugFd);
      fs.unlinkSync(tempPath);
      lastError = new Error(
        `File does not start with GeoTIFF magic bytes.\n` +
          `  First ${bytesRead} bytes (hex): ${debugBuf
            .subarray(0, bytesRead)
            .toString("hex")}\n` +
          `  First ${bytesRead} bytes (ascii): ${debugBuf
            .subarray(0, bytesRead)
            .toString("ascii")
            .replace(/[^\x20-\x7e]/g, ".")}`,
      );
      console.error(`  ${label}: attempt ${attempt}: ${lastError.message}`);
      continue;
    }

    // Success — rename .part → final
    fs.renameSync(tempPath, tile.filePath);
    console.log(`  OK ${label}: ${formatBytes(size)} ✓`);
    return true; // new download
  }

  // All retries exhausted
  throw new Error(
    `Failed to download ${label} after ${MAX_RETRIES} attempts.\n` +
      `Last error: ${lastError?.message ?? "unknown"}`,
  );
}

// ─── Merge ────────────────────────────────────────────────────────────────────

/**
 * Merge all 9 tile GeoTIFFs into one using python3 + rasterio.
 * Uses rasterio.merge.merge() which calls GDAL under the hood and handles
 * CRS, nodata, and spatial alignment correctly.
 *
 * The merge is performed in a subprocess to keep multi-GB rasters out of the
 * Node.js process heap. Output is Deflate-compressed Cloud-Optimised GeoTIFF.
 */
async function mergeTiles(tiles: Tile[], pythonExe: string): Promise<void> {
  console.log("\nMerging 9 tiles into srtm-hkh-30m.tif via rasterio …");

  const tilePaths = tiles.map((t) => t.filePath);
  const allPresent = tilePaths.every(
    (p) => fs.existsSync(p) && checkGeoTiffMagic(p),
  );

  if (!allPresent) {
    const missing = tilePaths.filter(
      (p) => !fs.existsSync(p) || !checkGeoTiffMagic(p),
    );
    throw new Error(
      `Cannot merge: the following tiles are missing or invalid:\n  ${missing.join("\n  ")}`,
    );
  }

  // Python merge script — kept inline and written to a temp file to avoid
  // shell quoting issues on Windows (long -c strings break in some shells).
  const tilePathsJson = JSON.stringify(tilePaths);
  const outputPathJson = JSON.stringify(MERGED_OUTPUT_PATH);

  const mergeScript = `
import sys
import os
import shutil
import rasterio
from rasterio.merge import merge

tile_paths = ${tilePathsJson}
output_path = ${outputPathJson}
temp_path = output_path + ".part"

print(f"  Opening {len(tile_paths)} tile files ...", flush=True)
sources = [rasterio.open(p) for p in tile_paths]

print(f"  Merging (this may take several minutes for ~2 GB output) ...", flush=True)
mosaic, out_transform = merge(sources)

out_meta = sources[0].meta.copy()
out_meta.update({
    "driver": "GTiff",
    "height": mosaic.shape[1],
    "width": mosaic.shape[2],
    "transform": out_transform,
    "compress": "deflate",
    "tiled": True,
    "blockxsize": 512,
    "blockysize": 512,
    "BIGTIFF": "YES",
})

print(f"  Writing {out_meta['width']}x{out_meta['height']} px to {temp_path} ...", flush=True)
with rasterio.open(temp_path, "w", **out_meta) as dest:
    dest.write(mosaic)

for src in sources:
    src.close()

shutil.move(temp_path, output_path)
size = os.path.getsize(output_path)
print(f"  Merge complete: {output_path}", flush=True)
print(f"  Merged file size: {size / 1024**3:.2f} GB", flush=True)
`.trimStart();

  const scriptPath = path.join(TILES_DIR, "_merge_script.py");
  fs.writeFileSync(scriptPath, mergeScript, "utf8");

  try {
    console.log(`  Running: ${pythonExe} ${scriptPath}`);
    const { stdout, stderr } = await runCommand(pythonExe, [scriptPath]);
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } finally {
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const apiKey = process.env["OPENTOPO_API_KEY"];
  if (!apiKey) {
    console.error(
      "ERROR: OPENTOPO_API_KEY environment variable is not set.\n" +
        "Obtain a free API key at https://portal.opentopography.org/requestApiKey\n" +
        "Then re-run with the key in .env.local (the package.json script passes --env-file=.env.local).",
    );
    process.exit(1);
  }

  // ── Verify python3 + rasterio ──────────────────────────────────────────────
  console.log("Checking python3 + rasterio ...");
  let pythonExe: string;
  try {
    pythonExe = await requirePython3WithRasterio();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // ── Build tile grid ────────────────────────────────────────────────────────
  const tiles = buildTileGrid();

  console.log("\nSRTM 30m DEM — HKH chunked download");
  console.log(`  Full bbox   : [70E, 26N] -> [95E, 36N]`);
  console.log(`  Grid        : 3x3 = 9 tiles (~308,000 km2 each, under 450k km2 API cap)`);
  console.log(`  Tiles dir   : ${TILES_DIR}`);
  console.log(`  Merged file : ${MERGED_OUTPUT_PATH}`);
  console.log(`  API         : ${API_BASE}`);
  console.log("");

  // ── Short-circuit: merged file already valid ───────────────────────────────
  if (fs.existsSync(MERGED_OUTPUT_PATH)) {
    const { size } = fs.statSync(MERGED_OUTPUT_PATH);
    if (size >= MIN_MERGED_SIZE_BYTES && checkGeoTiffMagic(MERGED_OUTPUT_PATH)) {
      console.log(
        `Merged output already exists (${formatBytes(size)}): ${MERGED_OUTPUT_PATH}`,
      );
      console.log("Skipping all downloads and merge (idempotent).");
      console.log("Delete the merged file to force a full re-run.");
      return;
    }
    if (size > 0) {
      console.log(
        `WARNING: existing merged file is ${formatBytes(size)} (< ${formatBytes(
          MIN_MERGED_SIZE_BYTES,
        )} min) or has invalid magic. Removing and re-building.`,
      );
      fs.unlinkSync(MERGED_OUTPUT_PATH);
    }
  }

  // ── Ensure directories exist ───────────────────────────────────────────────
  fs.mkdirSync(TILES_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MERGED_OUTPUT_PATH), { recursive: true });

  // ── Download tiles ─────────────────────────────────────────────────────────
  console.log("Downloading 9 tiles ...");
  console.log("  Each tile is ~300-400 MB. Total download ~2-3 GB.");
  console.log("  Per-tile downloads are idempotent: already-complete tiles are skipped.");
  console.log("");

  let anyNewDownload = false;

  for (const tile of tiles) {
    const wasDownloaded = await downloadTile(tile, apiKey);
    if (wasDownloaded) anyNewDownload = true;
  }

  console.log("\nAll 9 tiles present.");

  // ── Merge ──────────────────────────────────────────────────────────────────
  const mergedExists =
    fs.existsSync(MERGED_OUTPUT_PATH) &&
    fs.statSync(MERGED_OUTPUT_PATH).size >= MIN_MERGED_SIZE_BYTES &&
    checkGeoTiffMagic(MERGED_OUTPUT_PATH);

  if (!anyNewDownload && mergedExists) {
    console.log("\nMerged file already up-to-date — skipping merge step.");
  } else {
    await mergeTiles(tiles, pythonExe);
  }

  // ── Final validation ───────────────────────────────────────────────────────
  const { size } = fs.statSync(MERGED_OUTPUT_PATH);

  if (!checkGeoTiffMagic(MERGED_OUTPUT_PATH)) {
    console.error(`\nERROR: merged file does not have valid GeoTIFF magic bytes.`);
    process.exit(1);
  }

  console.log(`\nsrtm-hkh-30m.tif`);
  console.log(`  Path : ${MERGED_OUTPUT_PATH}`);
  console.log(`  Size : ${formatBytes(size)}`);
  console.log(`  Magic: valid GeoTIFF`);

  if (size < MIN_MERGED_SIZE_BYTES) {
    console.error(
      `\nERROR: merged file is ${formatBytes(size)}, ` +
        `expected >= ${formatBytes(MIN_MERGED_SIZE_BYTES)} for the full HKH bbox.`,
    );
    console.error(
      `  Check that all 9 tiles downloaded successfully and that the merge completed without truncation.`,
    );
    process.exit(1);
  }

  console.log(`  Size check: OK (>= ${formatBytes(MIN_MERGED_SIZE_BYTES)})\n`);
  console.log("Done. Next step: run the Blender render pipeline.");
  console.log("  See scripts/render/water-cycle/");
}

main().catch((err: unknown) => {
  console.error(
    "\ndownload-dem failed:",
    err instanceof Error ? err.message : err,
  );
  process.exit(1);
});
