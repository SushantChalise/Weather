#!/usr/bin/env tsx
/**
 * download-farinotti.ts
 *
 * Stages the Farinotti et al. 2019 ice-thickness consensus estimate data for
 * Hindu Kush Himalaya (HKH) glaciers and writes a filtered CSV to:
 *   data/water-cycle/glaciers/farinotti-2019-hkh-thickness.csv
 *
 * Output columns: RGI_id, GLIMS_id, lon, lat, mean_thickness_m, area_km2
 *
 * Data sources:
 *   - Volume: OGGM G2TI consensus (derived from Farinotti et al. 2019)
 *     URL: https://cluster.klima.uni-bremen.de/~oggm/g2ti/rgi60_itmix_df.csv
 *     (CC-BY 4.0; see Farinotti et al. 2019 Nature Geoscience DOI 10.1038/s41561-019-0300-3)
 *     (Data DOI: 10.3929/ethz-b-000315707 ETH Research Collection)
 *   - Attributes (area, lon, lat, GLIMS_id): RGI 6.2 stats
 *     URL: https://cluster.klima.uni-bremen.de/~oggm/rgi/rgi62_stats.csv
 *
 * Method:
 *   mean_thickness_m = vol_itmix_m3 / (area_km2 * 1e6)
 *
 * HKH = RGI regions 13 (Central Asia) + 14 (South Asia West) + 15 (South Asia East)
 *
 * Cross-check: total HKH ice volume should be in 4,000–7,000 km³
 *              (ICIMOD 2026 benchmark: 5,735.79 km³)
 *
 * Usage:
 *   npm run transform:water-cycle-farinotti
 *
 * Idempotent: existing output is skipped unless you delete it.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * HKH RGI O1 region codes (RGI 6.0)
 *  13 = Central Asia
 *  14 = South Asia West
 *  15 = South Asia East
 */
const HKH_REGIONS = new Set(["13", "14", "15"]);

const G2TI_URL =
  "https://cluster.klima.uni-bremen.de/~oggm/g2ti/rgi60_itmix_df.csv";

const RGI_STATS_URL =
  "https://cluster.klima.uni-bremen.de/~oggm/rgi/rgi62_stats.csv";

const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "data",
  "water-cycle",
  "glaciers",
  "farinotti-2019-hkh-thickness.csv",
);

const CACHE_DIR = path.join(PROJECT_ROOT, "data", "water-cycle", ".cache");
const G2TI_CACHE = path.join(CACHE_DIR, "rgi60_itmix_df.csv");
const RGI_STATS_CACHE = path.join(CACHE_DIR, "rgi62_stats.csv");

// Volume cross-check bounds (km³)
const VOLUME_MIN_KM3 = 4_000;
const VOLUME_MAX_KM3 = 7_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * Download a URL to a local file, streaming with progress logs.
 * Idempotent: skips if file already exists and is non-empty.
 */
async function downloadToFile(url: string, dest: string): Promise<void> {
  if (fs.existsSync(dest)) {
    const { size } = fs.statSync(dest);
    if (size > 0) {
      console.log(`  Cache hit (${formatBytes(size)}): ${path.basename(dest)}`);
      return;
    }
    fs.unlinkSync(dest);
  }

  console.log(`  Downloading: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${url}`);
  }
  if (!response.body) throw new Error(`Empty response body: ${url}`);

  const contentLength = response.headers.get("content-length");
  const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

  const tempPath = `${dest}.part`;
  const writeStream = fs.createWriteStream(tempPath);

  let downloaded = 0;
  let lastLogTime = Date.now();
  const LOG_INTERVAL_MS = 5_000;

  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    writeStream.write(chunk);
    downloaded += chunk.length;
    const now = Date.now();
    if (now - lastLogTime >= LOG_INTERVAL_MS) {
      if (totalBytes) {
        const pct = ((downloaded / totalBytes) * 100).toFixed(1);
        process.stdout.write(
          `\r    ${formatBytes(downloaded)} / ${formatBytes(totalBytes)} (${pct}%)  `,
        );
      } else {
        process.stdout.write(`\r    ${formatBytes(downloaded)}  `);
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
  fs.renameSync(tempPath, dest);
  const { size } = fs.statSync(dest);
  console.log(`  Saved: ${path.basename(dest)} (${formatBytes(size)})`);
}

/**
 * Parse a CSV string into an array of objects.
 * Handles quoted fields and CRLF/LF line endings.
 */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(",");
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const values = line.split(",");
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface OutputRow {
  RGI_id: string;
  GLIMS_id: string;
  lon: string;
  lat: string;
  mean_thickness_m: string;
  area_km2: string;
}

async function main(): Promise<void> {
  console.log("Farinotti et al. 2019 — HKH ice-thickness staging");
  console.log("  Regions: RGI 13 (Central Asia), 14 (South Asia West), 15 (South Asia East)");
  console.log(`  Output : ${OUTPUT_PATH}`);
  console.log("");

  // ── Idempotency check ──────────────────────────────────────────────────────
  if (fs.existsSync(OUTPUT_PATH)) {
    const { size } = fs.statSync(OUTPUT_PATH);
    if (size > 0) {
      // Count rows to verify
      const content = fs.readFileSync(OUTPUT_PATH, "utf8");
      const rowCount = content.split("\n").filter((l) => l.trim()).length - 1; // subtract header
      console.log(
        `✓ Output already exists (${formatBytes(size)}, ${rowCount.toLocaleString()} rows): ${OUTPUT_PATH}`,
      );
      console.log("  Delete the file to re-run.");
      return;
    }
    fs.unlinkSync(OUTPUT_PATH);
  }

  // ── Ensure directories ─────────────────────────────────────────────────────
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // ── Step 1: Download source files ─────────────────────────────────────────
  console.log("Step 1/4: Downloading source files …");
  await downloadToFile(G2TI_URL, G2TI_CACHE);
  await downloadToFile(RGI_STATS_URL, RGI_STATS_CACHE);

  // ── Step 2: Parse and index volume data ───────────────────────────────────
  console.log("\nStep 2/4: Parsing G2TI volume data …");
  const g2tiText = fs.readFileSync(G2TI_CACHE, "utf8");
  const g2tiRows = parseCsv(g2tiText);
  console.log(`  Total glaciers in G2TI: ${g2tiRows.length.toLocaleString()}`);

  // Build RGI_id → vol_itmix_m3 map (keep only HKH regions for speed)
  const volumeMap = new Map<string, number>();
  for (const row of g2tiRows) {
    const rgiId = row["RGIId"];
    if (!rgiId) continue;
    // RGI IDs look like "RGI60-13.00001"; extract region from second segment
    const regionMatch = rgiId.match(/^RGI60-(\d+)\./);
    if (!regionMatch) continue;
    const region = regionMatch[1];
    if (!region || !HKH_REGIONS.has(region)) continue;
    const vol = parseFloat(row["vol_itmix_m3"] ?? "");
    if (!isNaN(vol)) volumeMap.set(rgiId, vol);
  }
  console.log(
    `  HKH glaciers in G2TI (regions 13+14+15): ${volumeMap.size.toLocaleString()}`,
  );

  // ── Step 3: Parse RGI stats and join ──────────────────────────────────────
  console.log("\nStep 3/4: Parsing RGI stats and joining …");
  const rgiText = fs.readFileSync(RGI_STATS_CACHE, "utf8");
  const rgiRows = parseCsv(rgiText);
  console.log(`  Total glaciers in RGI stats: ${rgiRows.length.toLocaleString()}`);

  const outputRows: OutputRow[] = [];
  let skippedNoVolume = 0;
  let skippedZeroArea = 0;

  for (const rgiRow of rgiRows) {
    const rgiId = rgiRow["RGIId"];
    if (!rgiId) continue;

    // Filter to HKH only via O1Region field
    const o1Region = rgiRow["O1Region"]?.trim();
    if (!o1Region || !HKH_REGIONS.has(o1Region)) continue;

    // Look up volume
    const volM3 = volumeMap.get(rgiId);
    if (volM3 === undefined) {
      skippedNoVolume++;
      continue;
    }

    const areaKm2 = parseFloat(rgiRow["Area"] ?? "");
    if (isNaN(areaKm2) || areaKm2 <= 0) {
      skippedZeroArea++;
      continue;
    }

    // Mean thickness (m) = volume (m³) / area (m²)
    //   area_km2 → area_m2 = area_km2 * 1e6
    const areaM2 = areaKm2 * 1e6;
    const meanThicknessM = volM3 / areaM2;

    const glimsId = rgiRow["GLIMSId"]?.trim() ?? "";
    const lon = rgiRow["CenLon"]?.trim() ?? "";
    const lat = rgiRow["CenLat"]?.trim() ?? "";

    outputRows.push({
      RGI_id: rgiId,
      GLIMS_id: glimsId,
      lon,
      lat,
      mean_thickness_m: meanThicknessM.toFixed(2),
      area_km2: areaKm2.toFixed(6),
    });
  }

  console.log(
    `  Output rows: ${outputRows.length.toLocaleString()}`,
  );
  if (skippedNoVolume > 0)
    console.log(
      `  Skipped (no G2TI volume entry): ${skippedNoVolume.toLocaleString()}`,
    );
  if (skippedZeroArea > 0)
    console.log(`  Skipped (zero/invalid area): ${skippedZeroArea.toLocaleString()}`);

  // ── Step 4: Cross-check total volume ──────────────────────────────────────
  console.log("\nStep 4/4: Cross-check total ice volume …");
  let totalVolM3 = 0;
  for (const row of outputRows) {
    const thickM = parseFloat(row.mean_thickness_m);
    const areaKm2 = parseFloat(row.area_km2);
    const areaM2 = areaKm2 * 1e6;
    totalVolM3 += thickM * areaM2;
  }
  const totalVolKm3 = totalVolM3 / 1e9;
  console.log(
    `  Total HKH ice volume: ${totalVolKm3.toFixed(1)} km³`,
  );
  console.log(
    `  Expected range:       ${VOLUME_MIN_KM3}–${VOLUME_MAX_KM3} km³ (ICIMOD 2026: 5,735.79 km³)`,
  );

  if (totalVolKm3 < VOLUME_MIN_KM3 || totalVolKm3 > VOLUME_MAX_KM3) {
    console.warn(
      `\n  WARNING: Total volume ${totalVolKm3.toFixed(1)} km³ is outside expected range ` +
        `${VOLUME_MIN_KM3}–${VOLUME_MAX_KM3} km³.`,
    );
    console.warn(
      `  This may indicate a join mismatch or unit error. Investigate before using data.`,
    );
  } else {
    console.log(`  Volume check: ✓ within expected 4,000–7,000 km³ range`);
  }

  // ── Write output CSV ───────────────────────────────────────────────────────
  const header = "RGI_id,GLIMS_id,lon,lat,mean_thickness_m,area_km2\n";
  const csvLines = outputRows
    .map(
      (r) =>
        `${r.RGI_id},${r.GLIMS_id},${r.lon},${r.lat},${r.mean_thickness_m},${r.area_km2}`,
    )
    .join("\n");

  fs.writeFileSync(OUTPUT_PATH, header + csvLines + "\n", "utf8");

  const { size } = fs.statSync(OUTPUT_PATH);
  console.log(`\n✓ Output written: ${OUTPUT_PATH}`);
  console.log(`  Rows   : ${outputRows.length.toLocaleString()}`);
  console.log(`  Size   : ${formatBytes(size)}`);
  console.log(`  Volume : ${totalVolKm3.toFixed(1)} km³`);

  // ── Acceptance criteria check ──────────────────────────────────────────────
  console.log("\nAcceptance criteria:");
  const rowsOk = outputRows.length >= 50_000;
  const volumeOk =
    totalVolKm3 >= VOLUME_MIN_KM3 && totalVolKm3 <= VOLUME_MAX_KM3;
  console.log(
    `  ≥ 50,000 rows: ${rowsOk ? "✓ PASS" : "✗ FAIL"} (${outputRows.length.toLocaleString()} rows)`,
  );
  console.log(
    `  Volume in 4,000–7,000 km³: ${volumeOk ? "✓ PASS" : "✗ FAIL"} (${totalVolKm3.toFixed(1)} km³)`,
  );

  if (!rowsOk || !volumeOk) {
    console.error("\nERROR: one or more acceptance criteria failed.");
    process.exit(1);
  }

  console.log("\n✓ All acceptance criteria passed.");
  console.log(
    "  Next step: render scripts will use this CSV for volumetric glacier extrusion.",
  );
  console.log(
    "  Source: Farinotti et al. 2019 Nature Geoscience, DOI 10.1038/s41561-019-0300-3",
  );
  console.log(
    "  Data DOI: 10.3929/ethz-b-000315707 (ETH Research Collection, CC-BY 4.0)",
  );
}

main().catch((err: unknown) => {
  console.error("download-farinotti failed:", err);
  process.exit(1);
});
