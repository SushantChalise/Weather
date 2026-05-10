#!/usr/bin/env tsx

/**
 * HKH Glacier Decades Transform
 *
 * Reads four ICIMOD shapefile ZIPs (1990/2000/2010/2020), extracts and
 * reprojects from HKH Albers Equal Area Conic → WGS84, simplifies at 5%
 * Visvalingam tolerance, and uploads gzipped GeoJSON to Vercel Blob under
 * glaciers/hkh/{year}.geojson.gz
 *
 * Usage:
 *   npm run transform:icimod-glacier-decades
 *
 * Requires BLOB_READ_WRITE_TOKEN in .env.local.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import { createGzip } from "node:zlib";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { put } from "@vercel/blob";
import turfAreaModule from "@turf/area";
import proj4 from "proj4";
import * as shapefile from "shapefile";
import yauzl from "yauzl";
import mapshaper from "mapshaper";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// @turf/area ships a CJS default export
const turfArea =
  typeof turfAreaModule === "function"
    ? turfAreaModule
    : (turfAreaModule as { default: typeof turfAreaModule }).default;

// ─── Projection ───────────────────────────────────────────────────────────────

// HKH North Albers Equal Area Conic (per .prj embedded in each ZIP)
const HKH_ALBERS =
  "+proj=aea +lat_0=15 +lon_0=83 +lat_1=20 +lat_2=43 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs";
const WGS84 = "EPSG:4326";

function reprojectCoord(xy: number[]): number[] {
  if (xy.length < 2 || xy[0] === undefined || xy[1] === undefined) return xy;
  return proj4(HKH_ALBERS, WGS84, [xy[0], xy[1]]);
}

type GeoCoord = number[];
type GeoRing = GeoCoord[];

function reprojectRing(ring: GeoRing): GeoRing {
  return ring.map(reprojectCoord);
}

function reprojectPolygon(coords: GeoRing[]): GeoRing[] {
  return coords.map(reprojectRing);
}

function reprojectMultiPolygon(coords: GeoRing[][]): GeoRing[][] {
  return coords.map(reprojectPolygon);
}

function reprojectGeometry(
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  if (geom.type === "Polygon") {
    return { type: "Polygon", coordinates: reprojectPolygon(geom.coordinates) };
  }
  return {
    type: "MultiPolygon",
    coordinates: reprojectMultiPolygon(geom.coordinates),
  };
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
            writes.push(new Promise<void>((res, rej) => {
              ws.on("finish", res);
              ws.on("error", rej);
            }));
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
  year: number,
): string {
  // Prefer GLIMS_ID if present, otherwise derive from centroid+area hash
  const glimsId = props["GLIMS_ID"];
  if (typeof glimsId === "string" && glimsId.trim() !== "") {
    return `${glimsId}_${year}`;
  }
  const area = turfArea({ type: "Feature", properties: {}, geometry });
  const lat = typeof props["Latitude"] === "number" ? props["Latitude"] : 0;
  const lon = typeof props["Longitude"] === "number" ? props["Longitude"] : 0;
  const raw = `${lat.toFixed(6)}_${lon.toFixed(6)}_${area.toFixed(2)}_${year}`;
  return `GH${crypto.createHash("sha1").update(raw).digest("hex").slice(0, 12).toUpperCase()}_${year}`;
}

// ─── GeoJSON types ───────────────────────────────────────────────────────────

interface GlacierProperties {
  id: string;
  area_km2: number;
  year: number;
  GLIMS_ID: string;
  Mt_Range: string;
  M_Basin: string;
}

type GlacierFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  GlacierProperties
>;

type GlacierCollection = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  GlacierProperties
>;

// ─── Per-year processing ──────────────────────────────────────────────────────

async function processYear(year: number): Promise<{
  blobUrl: string;
  countIn: number;
  countOut: number;
  bytesIn: number;
  bytesOut: number;
}> {
  const zipPath = path.join(
    PROJECT_ROOT,
    "data",
    "icimod",
    "1973447",
    `HKH Glacier ${year}.zip`,
  );
  if (!fs.existsSync(zipPath)) throw new Error(`ZIP not found: ${zipPath}`);

  const bytesIn = fs.statSync(zipPath).size;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `glacier-${year}-`));

  try {
    // 1. Extract shapefile components
    process.stdout.write(`  [${year}] Extracting ZIP … `);
    const { shp, dbf } = await extractShapefile(zipPath, tmpDir);
    console.log("done");

    // 2. Parse shapefile → reproject to WGS84
    process.stdout.write(`  [${year}] Parsing + reprojecting … `);
    const source = await shapefile.open(shp, dbf, { encoding: "utf-8" });
    const features: GlacierFeature[] = [];

    let result = await source.read();
    while (!result.done) {
      const feat = result.value;
      if (
        feat &&
        feat.geometry &&
        (feat.geometry.type === "Polygon" || feat.geometry.type === "MultiPolygon")
      ) {
        const geomWgs84 = reprojectGeometry(feat.geometry);
        const props = (feat.properties ?? {}) as Record<string, unknown>;
        const areaM2 = turfArea({ type: "Feature", properties: {}, geometry: geomWgs84 });

        features.push({
          type: "Feature",
          id: stableId(props, geomWgs84, year),
          properties: {
            id: stableId(props, geomWgs84, year),
            area_km2: Math.round((areaM2 / 1e6) * 1000) / 1000,
            year,
            GLIMS_ID: typeof props["GLIMS_ID"] === "string" ? props["GLIMS_ID"] : "",
            Mt_Range: typeof props["Mt_Range"] === "string" ? props["Mt_Range"] : "",
            M_Basin: typeof props["M_Basin"] === "string" ? props["M_Basin"] : "",
          },
          geometry: geomWgs84,
        });
      }
      result = await source.read();
    }

    const countIn = features.length;
    console.log(`${countIn} features`);

    // 3. Simplify with mapshaper (keep-shapes preserves small glaciers)
    process.stdout.write(`  [${year}] Simplifying at 5% … `);
    const inputGeoJson = JSON.stringify({
      type: "FeatureCollection",
      features,
    } satisfies GlacierCollection);

    const simplified = await mapshaper.applyCommands(
      `-i glacier.geojson -simplify visvalingam 5% keep-shapes -o out.geojson`,
      { "glacier.geojson": inputGeoJson },
    );

    const outBuf = simplified["out.geojson"];
    if (!outBuf) throw new Error("mapshaper produced no output");

    const outGeoJson = JSON.parse(outBuf.toString()) as GlacierCollection;
    const countOut = outGeoJson.features.length;
    console.log(`${countOut} features`);

    // 4. Gzip and upload to Vercel Blob
    process.stdout.write(`  [${year}] Gzipping + uploading … `);

    const gzipped = await new Promise<Buffer>((resolve, reject) => {
      const gzip = createGzip({ level: 9 });
      const chunks: Buffer[] = [];
      gzip.on("data", (c: Buffer) => chunks.push(c));
      gzip.on("end", () => resolve(Buffer.concat(chunks)));
      gzip.on("error", reject);
      gzip.write(outBuf);
      gzip.end();
    });

    const token = process.env["BLOB_READ_WRITE_TOKEN"];
    if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is not set");

    const blob = await put(`glaciers/hkh/${year}.geojson.gz`, gzipped, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      token,
    });

    const bytesOut = gzipped.length;
    console.log(`${(bytesOut / 1024).toFixed(1)} KB compressed`);

    return { blobUrl: blob.url, countIn, countOut, bytesIn, bytesOut };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("HKH Glacier Decades → Vercel Blob");
  console.log(`  Input  : data/icimod/1973447/HKH Glacier {year}.zip`);
  console.log(`  Output : glaciers/hkh/{year}.geojson.gz\n`);

  const years = [1990, 2000, 2010, 2020] as const;
  const results: Array<{
    year: number;
    blobUrl: string;
    countIn: number;
    countOut: number;
    bytesIn: number;
    bytesOut: number;
  }> = [];

  for (const year of years) {
    console.log(`\n── ${year} ──`);
    const r = await processYear(year);
    results.push({ year, ...r });
    console.log(`  Blob URL: ${r.blobUrl}`);
  }

  console.log("\n=== Summary ===");
  for (const r of results) {
    const ratio = ((r.bytesOut / r.bytesIn) * 100).toFixed(1);
    const pct = (((r.countIn - r.countOut) / r.countIn) * 100).toFixed(1);
    console.log(
      `  ${r.year}: ${r.countIn} → ${r.countOut} features (${pct}% removed), ` +
        `${(r.bytesOut / 1024 / 1024).toFixed(1)} MB gz (${ratio}% of source), ` +
        `${r.blobUrl}`,
    );
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Transform failed:", err);
  process.exit(1);
});
