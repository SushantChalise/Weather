#!/usr/bin/env tsx

/**
 * ICIMOD Glacial Lakes Transform
 *
 * Reads two ICIMOD shapefile ZIPs and emits Brotli-compressed GeoJSON to
 * public/glacial-lakes/ for Cloudflare Pages edge serving:
 *
 *   data/icimod/1971946/Glacial lakes...zip
 *     → public/glacial-lakes/current.geojson.br  (~3k lakes, 3% simplification)
 *
 *   data/icimod/1971950/Potentially dangerous glacial lakes...zip
 *     → public/glacial-lakes/risky.geojson.br    (47 lakes, 3% simplification)
 *
 * Risk-tier bucketing (source column: `Rank`, Roman numerals):
 *   I   → "high"    (highest GLOF risk — visually-inspected, most dangerous)
 *   II  → "medium"
 *   III → "low"
 * This mapping is logged on each run. Roman I = most dangerous because the
 * ICIMOD hazard ranking follows a descending priority scheme where Priority I
 * lakes require immediate attention.
 *
 * Usage:
 *   npm run transform:icimod-glacial-lakes
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants as zlibConstants } from "node:zlib";

import turfAreaModule from "@turf/area";
import mapshaper from "mapshaper";
import * as shapefile from "shapefile";
import yauzl from "yauzl";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// @turf/area ships a CJS default export
const turfArea =
  typeof turfAreaModule === "function"
    ? turfAreaModule
    : (turfAreaModule as { default: typeof turfAreaModule }).default;

// ─── Risk-tier bucketing ──────────────────────────────────────────────────────

type RiskTier = "low" | "medium" | "high";

/**
 * Maps source Rank column (Roman numeral I/II/III) to low/medium/high.
 *
 * Bucket rule: Roman I = high (most dangerous, Priority I per ICIMOD hazard
 * ranking), Roman II = medium, Roman III = low. The source uses "PDL" in the
 * VS_inspect column for all 47 records, confirming these are all visually-
 * inspected potentially-dangerous lakes; the Rank differentiates urgency.
 */
function mapRiskTier(rankRaw: unknown): RiskTier {
  const rank = String(rankRaw ?? "")
    .trim()
    .toUpperCase();
  if (rank === "I") return "high";
  if (rank === "II") return "medium";
  if (rank === "III") return "low";
  // Unknown values default to medium so they still render on the map
  return "medium";
}

// ─── ZIP extraction ───────────────────────────────────────────────────────────

interface ExtractedPaths {
  shp: string;
  dbf: string;
}

function extractShapefile(zipPath: string, tmpDir: string): Promise<ExtractedPaths> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zf) => {
      if (err) return reject(err);

      const needed = [".shp", ".dbf", ".shx"];
      const writes: Promise<void>[] = [];
      const found: Record<string, string> = {};

      zf.readEntry();
      zf.on("entry", (entry: yauzl.Entry) => {
        const ext = path.extname(entry.fileName).toLowerCase();
        if (needed.includes(ext) && !entry.fileName.endsWith("/")) {
          const outName = path.basename(entry.fileName);
          const outPath = path.join(tmpDir, outName);
          found[ext] = outPath;

          zf.openReadStream(entry, (err2, stream) => {
            if (err2) return reject(err2);
            const ws = fs.createWriteStream(outPath);
            stream.pipe(ws);
            writes.push(
              new Promise<void>((res, rej) => {
                ws.on("finish", res);
                ws.on("error", rej);
              }),
            );
            zf.readEntry();
          });
        } else {
          zf.readEntry();
        }
      });

      zf.on("end", () => {
        Promise.all(writes)
          .then(() => {
            const shp = found[".shp"];
            const dbf = found[".dbf"];
            if (!shp || !dbf) return reject(new Error("ZIP missing .shp or .dbf"));
            resolve({ shp, dbf });
          })
          .catch(reject);
      });

      zf.on("error", reject);
    });
  });
}

// ─── ID generation ───────────────────────────────────────────────────────────

function stableId(
  props: Record<string, unknown>,
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): string {
  // Prefer GL_ID if present (ICIMOD's own lake identifier)
  const glId = props["GL_ID"];
  if (typeof glId === "string" && glId.trim() !== "") {
    return glId.trim();
  }
  // Fall back to hash of geometry centroid
  const lat = typeof props["Latitude"] === "number" ? (props["Latitude"] as number) : 0;
  const lon = typeof props["Longitude"] === "number" ? (props["Longitude"] as number) : 0;
  const areaM2 = turfArea({ type: "Feature", properties: {}, geometry });
  const raw = `${lat.toFixed(6)}_${lon.toFixed(6)}_${areaM2.toFixed(2)}`;
  return `GL${crypto.createHash("sha1").update(raw).digest("hex").slice(0, 12).toUpperCase()}`;
}

// ─── GeoJSON types ───────────────────────────────────────────────────────────

interface LakeBaseProperties {
  id: string;
  area_km2: number;
  basin: string;
  sub_basin: string;
  elevation_m: number;
  lake_type: string;
  country: string;
}

interface CurrentLakeProperties extends LakeBaseProperties {
  kind: "current";
}

interface RiskyLakeProperties extends LakeBaseProperties {
  kind: "risky";
  risk_tier: RiskTier;
}

type LakeFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  CurrentLakeProperties | RiskyLakeProperties
>;

type LakeCollection = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  CurrentLakeProperties | RiskyLakeProperties
>;

// ─── Core processing ──────────────────────────────────────────────────────────

async function processZip(
  zipPath: string,
  label: string,
  buildProps: (
    props: Record<string, unknown>,
    area_km2: number,
    id: string,
  ) => CurrentLakeProperties | RiskyLakeProperties,
  simplifyPct: string,
): Promise<{
  outBuf: Buffer;
  countIn: number;
  countOut: number;
  bytesZip: number;
}> {
  const bytesZip = fs.statSync(zipPath).size;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `lake-${label}-`));

  try {
    process.stdout.write(`  [${label}] Extracting ZIP … `);
    const { shp, dbf } = await extractShapefile(zipPath, tmpDir);
    console.log("done");

    process.stdout.write(`  [${label}] Inspecting columns … `);
    const source = await shapefile.open(shp, dbf, { encoding: "utf-8" });
    const features: LakeFeature[] = [];

    // Sample first 5 features to log column names and values
    let sampleCount = 0;
    let result = await source.read();
    while (!result.done) {
      const feat = result.value;
      if (
        feat &&
        feat.geometry &&
        (feat.geometry.type === "Polygon" || feat.geometry.type === "MultiPolygon")
      ) {
        const props = (feat.properties ?? {}) as Record<string, unknown>;

        if (sampleCount === 0) {
          console.log("\n    Columns: " + Object.keys(props).join(", "));
        }
        if (sampleCount < 5) {
          console.log(`    Sample ${sampleCount + 1}: ${JSON.stringify(props)}`);
          sampleCount++;
        }

        const areaM2 = turfArea({ type: "Feature", properties: {}, geometry: feat.geometry });
        const area_km2 = Math.round((areaM2 / 1e6) * 1000) / 1000;
        const id = stableId(props, feat.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon);

        features.push({
          type: "Feature",
          id,
          properties: buildProps(props, area_km2, id),
          geometry: feat.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        });
      }
      result = await source.read();
    }

    const countIn = features.length;
    process.stdout.write(`  [${label}] Simplifying at ${simplifyPct} … `);

    const inputGeoJson = JSON.stringify({
      type: "FeatureCollection",
      features,
    } satisfies LakeCollection);

    const simplified = await mapshaper.applyCommands(
      `-i lake.geojson -simplify visvalingam ${simplifyPct} keep-shapes -o out.geojson`,
      { "lake.geojson": inputGeoJson },
    );

    const outBuf = simplified["out.geojson"];
    if (!outBuf) throw new Error("mapshaper produced no output");

    const outGeoJson = JSON.parse(outBuf.toString()) as LakeCollection;
    const countOut = outGeoJson.features.length;
    console.log(`${countIn} in → ${countOut} out`);

    return { outBuf, countIn, countOut, bytesZip };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("ICIMOD Glacial Lakes → public/glacial-lakes/");
  console.log(`  Input  : data/icimod/1971946/ (current) + data/icimod/1971950/ (dangerous)`);
  console.log(`  Output : public/glacial-lakes/{current,risky}.geojson.br\n`);

  const outDir = path.join(PROJECT_ROOT, "public", "glacial-lakes");
  fs.mkdirSync(outDir, { recursive: true });

  // ── 1. Current lakes (GL_3basins_2015) ──────────────────────────────────
  console.log("\n── Current Glacial Lakes ──");
  const currentZip = path.join(
    PROJECT_ROOT,
    "data",
    "icimod",
    "1971946",
    "Glacial lakes in the Koshi, Gandaki, and Karnali river basins of Nepal, the Tibet Autonomous Region of China, and India.zip",
  );
  if (!fs.existsSync(currentZip)) throw new Error(`ZIP not found: ${currentZip}`);

  const currentResult = await processZip(
    currentZip,
    "current",
    (props, area_km2, id): CurrentLakeProperties => ({
      id,
      area_km2,
      kind: "current",
      basin: typeof props["Basin"] === "string" ? props["Basin"] : "",
      sub_basin: typeof props["Sub_Basin"] === "string" ? props["Sub_Basin"] : "",
      elevation_m: typeof props["Elevation"] === "number" ? (props["Elevation"] as number) : 0,
      lake_type: typeof props["Type"] === "string" ? props["Type"] : "",
      country: typeof props["Country"] === "string" ? props["Country"] : "",
    }),
    "3%",
  );

  process.stdout.write(`  [current] Brotli-compressing (quality 11) … `);
  const currentCompressed = brotliCompressSync(currentResult.outBuf, {
    params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
  });
  const currentOutPath = path.join(outDir, "current.geojson.br");
  fs.writeFileSync(currentOutPath, currentCompressed);
  console.log(`${(currentCompressed.length / 1024 / 1024).toFixed(2)} MB → ${currentOutPath}`);

  // ── 2. Dangerous lakes (PDGLs) ───────────────────────────────────────────
  console.log("\n── Potentially Dangerous Glacial Lakes ──");
  console.log("  Risk-tier bucketing: Rank I → high, Rank II → medium, Rank III → low");

  const riskyZip = path.join(
    PROJECT_ROOT,
    "data",
    "icimod",
    "1971950",
    "Potentially dangerous glacial lakes in the Koshi, Gandaki, and Karnali river basins of Nepal, the Tibet Autonomous Region of China, and India.zip",
  );
  if (!fs.existsSync(riskyZip)) throw new Error(`ZIP not found: ${riskyZip}`);

  const tierCounts: Record<RiskTier, number> = { high: 0, medium: 0, low: 0 };

  const riskyResult = await processZip(
    riskyZip,
    "risky",
    (props, area_km2, id): RiskyLakeProperties => {
      const tier = mapRiskTier(props["Rank"]);
      tierCounts[tier]++;
      return {
        id,
        area_km2,
        kind: "risky",
        risk_tier: tier,
        basin: typeof props["Basin"] === "string" ? props["Basin"] : "",
        sub_basin: typeof props["Sub_Basin"] === "string" ? props["Sub_Basin"] : "",
        elevation_m: typeof props["Elevation"] === "number" ? (props["Elevation"] as number) : 0,
        lake_type: typeof props["Type"] === "string" ? props["Type"] : "",
        country: typeof props["Country"] === "string" ? props["Country"] : "",
      };
    },
    "3%",
  );

  process.stdout.write(`  [risky] Brotli-compressing (quality 11) … `);
  const riskyCompressed = brotliCompressSync(riskyResult.outBuf, {
    params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
  });
  const riskyOutPath = path.join(outDir, "risky.geojson.br");
  fs.writeFileSync(riskyOutPath, riskyCompressed);
  console.log(`${(riskyCompressed.length / 1024 / 1024).toFixed(2)} MB → ${riskyOutPath}`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n=== Summary ===");
  console.log(
    `  current : ${currentResult.countIn} → ${currentResult.countOut} features, ` +
      `${(currentCompressed.length / 1024 / 1024).toFixed(2)} MB Brotli`,
  );
  console.log(
    `  risky   : ${riskyResult.countIn} → ${riskyResult.countOut} features, ` +
      `${(riskyCompressed.length / 1024 / 1024).toFixed(2)} MB Brotli`,
  );
  console.log(
    `  Risk tier distribution (risky): ` +
      `high=${tierCounts.high}, medium=${tierCounts.medium}, low=${tierCounts.low}`,
  );

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Transform failed:", err);
  process.exit(1);
});
