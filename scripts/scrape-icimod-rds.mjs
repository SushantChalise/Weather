#!/usr/bin/env node
/**
 * ICIMOD RDS Portal Scraper
 *
 * Fetches all dataset metadata from https://rds.icimod.org via the
 * GeoNetwork search API, ranks each dataset for relevance to the
 * Nepal Mountain Weather Decision Map product, and writes:
 *   - output/icimod-rds-all.json        (full metadata, ranked)
 *   - output/icimod-rds-ranked.csv      (flat table, ranked)
 *   - output/icimod-rds-summary.json    (stats + top picks)
 */

import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "output");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL =
  "https://rds.icimod.org/geonetwork/srv/eng/q?_content_type=json&fast=index";
const PAGE_SIZE = 100;
const DELAY_MS = 1500; // polite crawl delay between pages
const NEPAL_BBOX = { west: 80.0, south: 26.3, east: 88.2, north: 30.5 };

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers: { Accept: "application/json" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (d) => chunks.push(d));
      res.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(30_000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

async function fetchAllRecords() {
  console.log("Fetching page 1 to determine total count...");
  const firstPage = await fetchJSON(`${BASE_URL}&from=1&to=${PAGE_SIZE}`);

  const summary =
    firstPage?.summary || firstPage?.response?.summary || firstPage;
  const totalStr =
    summary?.["@count"] ??
    summary?.count ??
    firstPage?.["@count"] ??
    "0";
  const total = parseInt(String(totalStr), 10) || 0;
  console.log(`Total records reported by API: ${total}`);

  const rawRecords = extractRecords(firstPage);
  console.log(`  Page 1: got ${rawRecords.length} records`);

  const pages = Math.ceil(total / PAGE_SIZE);
  for (let page = 2; page <= pages; page++) {
    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);
    console.log(`Fetching page ${page}/${pages} (records ${from}–${to})...`);
    await sleep(DELAY_MS);
    try {
      const data = await fetchJSON(`${BASE_URL}&from=${from}&to=${to}`);
      const pageRecords = extractRecords(data);
      console.log(`  Page ${page}: got ${pageRecords.length} records`);
      rawRecords.push(...pageRecords);
    } catch (err) {
      console.error(`  Page ${page} FAILED: ${err.message}`);
    }
  }

  console.log(`\nTotal records fetched: ${rawRecords.length}`);
  return rawRecords;
}

function extractRecords(apiResponse) {
  // GeoNetwork nests records under metadata or response.metadata
  const meta =
    apiResponse?.metadata ||
    apiResponse?.response?.metadata ||
    apiResponse?.["geonet:response"]?.metadata ||
    [];
  if (Array.isArray(meta)) return meta;
  // Single record comes as an object, not array
  if (meta && typeof meta === "object" && meta.title) return [meta];
  return [];
}

// ---------------------------------------------------------------------------
// Normalize a raw GeoNetwork record into a clean object
// ---------------------------------------------------------------------------

function normalize(raw) {
  const info = raw["geonet:info"] || {};

  // Parse bounding box: "west|south|east|north" (pipe-delimited)
  let bbox = null;
  const geoBox = raw.geoBox || raw.geobox || "";
  if (geoBox) {
    const parts = String(geoBox).split("|").map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      bbox = { west: parts[0], south: parts[1], east: parts[2], north: parts[3] };
    }
  }

  // Keywords — can be string or array
  let keywords = [];
  const kw = raw.keyword || raw.keywords || [];
  if (typeof kw === "string") {
    keywords = kw.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(kw)) {
    keywords = kw.flatMap((k) =>
      typeof k === "string" ? k.split(",").map((s) => s.trim()) : []
    ).filter(Boolean);
  }

  // Legal constraints — string or array
  let license = "";
  const lc = raw.legalConstraints || "";
  if (Array.isArray(lc)) {
    license = lc.join(" | ");
  } else {
    license = String(lc);
  }

  // Responsible party — extract org name
  let publisher = "ICIMOD";
  const rp = raw.responsibleParty || [];
  const rpArr = Array.isArray(rp) ? rp : [rp];
  for (const entry of rpArr) {
    if (typeof entry === "string") {
      const parts = entry.split("|");
      if (parts[2]) publisher = parts[2].trim();
      break;
    }
  }

  return {
    id: info.id || raw.id || "",
    uuid: info.uuid || raw.uuid || "",
    title: raw.title || "",
    abstract: raw.abstract || "",
    type: raw.type || "dataset",
    keywords,
    bbox,
    publicationDate: raw.publicationDate || raw.creationDate || "",
    tempExtentBegin: raw.tempExtentBegin || "",
    tempExtentEnd: raw.tempExtentEnd || "",
    spatialType: raw.spatialRepresentationType_text || "",
    resolution: raw.resolution || raw.denominator || "",
    crs: raw.crs || "",
    license,
    publisher,
    status: raw.status_text || "",
    updateFrequency: raw.maintenanceAndUpdateFrequency_text || "",
    popularity: parseInt(raw.popularity || "0", 10),
    rating: parseInt(raw.rating || "0", 10),
    landingPage: `https://rds.icimod.org/Home/DataDetail?metadataId=${info.id || ""}`,
    metadataPage: `https://rds.icimod.org/geonetwork/srv/eng/catalog.search#/metadata/${info.uuid || ""}`,
  };
}

// ---------------------------------------------------------------------------
// Ranking engine
// ---------------------------------------------------------------------------

// Nepal bounding box overlap test
function overlapsNepal(bbox) {
  if (!bbox) return false;
  return (
    bbox.west < NEPAL_BBOX.east &&
    bbox.east > NEPAL_BBOX.west &&
    bbox.south < NEPAL_BBOX.north &&
    bbox.north > NEPAL_BBOX.south
  );
}

// HKH region overlap (broader — includes HMA datasets that cover Nepal)
const HKH_BBOX = { west: 60, south: 15, east: 105, north: 40 };
function overlapsHKH(bbox) {
  if (!bbox) return false;
  return (
    bbox.west < HKH_BBOX.east &&
    bbox.east > HKH_BBOX.west &&
    bbox.south < HKH_BBOX.north &&
    bbox.north > HKH_BBOX.south
  );
}

const KEYWORD_SCORES = {
  // Weather / climate — direct product relevance
  weather: 15, climate: 12, precipitation: 15, rainfall: 14, temperature: 14,
  monsoon: 15, "climate change": 10, meteorological: 14, forecast: 15,
  atmosphere: 12, "weather station": 15, humidity: 12, wind: 12, pressure: 12,

  // Cryosphere — snowline, glacier, ice
  snow: 18, glacier: 16, "glacial lake": 18, glof: 18, ice: 14,
  cryosphere: 16, snowline: 20, "snow cover": 18, permafrost: 10,
  avalanche: 14, freezing: 14,

  // Hazards — route safety
  flood: 16, landslide: 16, disaster: 14, earthquake: 10, hazard: 14,
  "flood extent": 16, erosion: 8, drought: 8,

  // Hydrology — route impact
  hydrology: 12, river: 10, basin: 8, watershed: 8, "water extent": 14,
  hydrosar: 16, streamflow: 10,

  // Terrain / DEM
  elevation: 12, dem: 14, topography: 12, "land cover": 10, terrain: 12,
  srtm: 12, "digital elevation": 14,

  // Route context
  trail: 16, trek: 16, route: 14, road: 10, settlement: 12, lodge: 14,
  "national park": 10, tourism: 14, mountaineering: 16, camp: 12,

  // Nepal-specific
  nepal: 8, himalaya: 10, "hindu kush": 8, hkh: 8, everest: 14,
  annapurna: 14, khumbu: 14, sagarmatha: 14, langtang: 12, manaslu: 12,
  mustang: 12, pokhara: 12, chitwan: 8,

  // Imagery / remote sensing
  modis: 10, sentinel: 12, landsat: 8, "remote sensing": 6, satellite: 10,
  himawari: 14, "satellite imagery": 10,
};

const CATEGORY_MAP = {
  weather_climate: [
    "weather", "climate", "precipitation", "rainfall", "temperature",
    "monsoon", "meteorological", "forecast", "atmosphere", "humidity",
    "wind", "pressure", "weather station",
  ],
  cryosphere: [
    "snow", "glacier", "glacial lake", "glof", "ice", "cryosphere",
    "snowline", "snow cover", "permafrost", "avalanche", "freezing",
  ],
  hazard: [
    "flood", "landslide", "disaster", "earthquake", "hazard",
    "flood extent", "erosion", "drought",
  ],
  hydrology: [
    "hydrology", "river", "basin", "watershed", "water extent",
    "hydrosar", "streamflow",
  ],
  terrain_landcover: [
    "elevation", "dem", "topography", "land cover", "terrain",
    "srtm", "digital elevation",
  ],
  route_context: [
    "trail", "trek", "route", "road", "settlement", "lodge",
    "national park", "tourism", "mountaineering", "camp",
  ],
  remote_sensing: [
    "modis", "sentinel", "landsat", "remote sensing", "satellite",
    "himawari", "satellite imagery",
  ],
};

function scoreDataset(record) {
  let score = 0;
  const reasons = [];
  const categories = new Set();

  // 1. Spatial relevance (most important filter)
  if (overlapsNepal(record.bbox)) {
    score += 25;
    reasons.push("Spatial extent overlaps Nepal");
  } else if (overlapsHKH(record.bbox)) {
    score += 10;
    reasons.push("Spatial extent overlaps HKH region");
  } else if (record.bbox) {
    score -= 15;
    reasons.push("Outside Nepal/HKH region");
  }

  // 2. Keyword matching
  const searchText = [
    record.title,
    record.abstract,
    ...record.keywords,
  ].join(" ").toLowerCase();

  for (const [keyword, pts] of Object.entries(KEYWORD_SCORES)) {
    if (searchText.includes(keyword.toLowerCase())) {
      score += pts;
      // Track category
      for (const [cat, terms] of Object.entries(CATEGORY_MAP)) {
        if (terms.includes(keyword)) categories.add(cat);
      }
    }
  }

  // 3. Nepal keyword bonus
  if (searchText.includes("nepal")) {
    score += 10;
    reasons.push("Explicitly mentions Nepal");
  }

  // 4. Temporal coverage bonus
  const beginYear = parseInt(record.tempExtentBegin, 10);
  const endYear = parseInt(record.tempExtentEnd, 10);
  if (!isNaN(endYear) && endYear >= 2020) {
    score += 8;
    reasons.push("Recent temporal coverage (≥2020)");
  }
  if (!isNaN(beginYear) && !isNaN(endYear) && endYear - beginYear >= 10) {
    score += 5;
    reasons.push("Long temporal baseline (≥10 years)");
  }

  // 5. Update frequency bonus
  const freq = (record.updateFrequency || "").toLowerCase();
  if (freq.includes("daily") || freq.includes("continual")) {
    score += 10;
    reasons.push("High update frequency");
  } else if (freq.includes("monthly") || freq.includes("quarterly")) {
    score += 5;
  }

  // 6. License bonus
  const lic = record.license.toLowerCase();
  if (lic.includes("cc by") || lic.includes("creative commons")) {
    score += 5;
    reasons.push("Open license (CC BY)");
  }

  // 7. Popularity signal
  if (record.popularity > 10000) {
    score += 5;
    reasons.push("High portal popularity");
  }

  // 8. Data type bonus for operational use
  const st = record.spatialType.toLowerCase();
  if (st.includes("grid") || st.includes("raster")) {
    score += 3;
  }

  // Determine primary use tier
  let tier;
  if (score >= 120) tier = "critical";
  else if (score >= 80) tier = "high";
  else if (score >= 50) tier = "medium";
  else if (score >= 25) tier = "low";
  else tier = "irrelevant";

  // Determine product use
  let productUse = "none";
  if (categories.has("weather_climate")) productUse = "real-time weather / forecast";
  else if (categories.has("cryosphere")) productUse = "snowline / glacier context";
  else if (categories.has("hazard")) productUse = "route hazard / safety";
  else if (categories.has("hydrology")) productUse = "flood / water context";
  else if (categories.has("terrain_landcover")) productUse = "terrain / base map";
  else if (categories.has("route_context")) productUse = "route / travel UX";
  else if (categories.has("remote_sensing")) productUse = "satellite validation";

  return {
    score,
    tier,
    categories: [...categories],
    productUse,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

function toCSVRow(fields) {
  return fields
    .map((f) => {
      const s = String(f ?? "").replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s}"`
        : s;
    })
    .join(",");
}

function generateCSV(records) {
  const header = [
    "rank", "score", "tier", "id", "uuid", "title", "product_use",
    "categories", "spatial_type", "resolution", "temporal_start",
    "temporal_end", "update_frequency", "license", "publisher",
    "publication_date", "popularity", "keywords", "bbox_west",
    "bbox_south", "bbox_east", "bbox_north", "overlaps_nepal",
    "landing_page", "reasons",
  ];
  const rows = [toCSVRow(header)];
  records.forEach((r, i) => {
    rows.push(
      toCSVRow([
        i + 1,
        r.ranking.score,
        r.ranking.tier,
        r.id,
        r.uuid,
        r.title,
        r.ranking.productUse,
        r.ranking.categories.join("; "),
        r.spatialType,
        r.resolution,
        r.tempExtentBegin,
        r.tempExtentEnd,
        r.updateFrequency,
        r.license.slice(0, 120),
        r.publisher,
        r.publicationDate,
        r.popularity,
        r.keywords.join("; "),
        r.bbox?.west ?? "",
        r.bbox?.south ?? "",
        r.bbox?.east ?? "",
        r.bbox?.north ?? "",
        r.bbox ? overlapsNepal(r.bbox) : "",
        r.landingPage,
        r.ranking.reasons.join("; "),
      ])
    );
  });
  return rows.join("\n");
}

function generateSummary(records) {
  const tiers = { critical: 0, high: 0, medium: 0, low: 0, irrelevant: 0 };
  const categoryCount = {};
  const nepalCount = records.filter((r) => r.bbox && overlapsNepal(r.bbox)).length;

  for (const r of records) {
    tiers[r.ranking.tier] = (tiers[r.ranking.tier] || 0) + 1;
    for (const c of r.ranking.categories) {
      categoryCount[c] = (categoryCount[c] || 0) + 1;
    }
  }

  const topCritical = records
    .filter((r) => r.ranking.tier === "critical")
    .slice(0, 30)
    .map((r) => ({
      rank: records.indexOf(r) + 1,
      score: r.ranking.score,
      title: r.title,
      productUse: r.ranking.productUse,
      categories: r.ranking.categories,
      landingPage: r.landingPage,
    }));

  const topHigh = records
    .filter((r) => r.ranking.tier === "high")
    .slice(0, 20)
    .map((r) => ({
      rank: records.indexOf(r) + 1,
      score: r.ranking.score,
      title: r.title,
      productUse: r.ranking.productUse,
      categories: r.ranking.categories,
      landingPage: r.landingPage,
    }));

  return {
    scrapeDate: new Date().toISOString(),
    totalRecords: records.length,
    nepalOverlapping: nepalCount,
    tierDistribution: tiers,
    categoryDistribution: categoryCount,
    topCritical,
    topHigh,
    productRecommendations: {
      weatherDecisionMap: {
        description:
          "Datasets directly supporting the Nepal Mountain Weather Decision Map product primitives",
        priorities: [
          {
            primitive: "Where is good now / tomorrow?",
            bestSources: "Weather stations, climate baselines, meteorological AWS data",
          },
          {
            primitive: "When is the next clear window?",
            bestSources: "MODIS snow/cloud, climate scenarios, station AWS",
          },
          {
            primitive: "What changed in 72h?",
            bestSources: "Snow cover 8-day/daily, HydroSAR flood extent, landslide events",
          },
          {
            primitive: "Which route segments are affected?",
            bestSources: "Trail networks, settlements, lodges, landslide inventory, flood layers",
          },
          {
            primitive: "How confident is this?",
            bestSources: "Station network density, glacier/lake inventories for calibration",
          },
        ],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== ICIMOD RDS Portal Scraper ===");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Fetch all records
  const rawRecords = await fetchAllRecords();
  if (rawRecords.length === 0) {
    console.error("No records fetched. Check network or API availability.");
    process.exit(1);
  }

  // 2. Normalize
  console.log("\nNormalizing records...");
  const normalized = rawRecords.map(normalize);

  // 3. Score and rank
  console.log("Scoring and ranking...");
  const scored = normalized.map((r) => ({
    ...r,
    ranking: scoreDataset(r),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.ranking.score - a.ranking.score);

  // 4. Write outputs
  const jsonPath = path.join(OUTPUT_DIR, "icimod-rds-all.json");
  fs.writeFileSync(jsonPath, JSON.stringify(scored, null, 2), "utf-8");
  console.log(`\nWrote ${scored.length} records to ${jsonPath}`);

  const csvPath = path.join(OUTPUT_DIR, "icimod-rds-ranked.csv");
  fs.writeFileSync(csvPath, generateCSV(scored), "utf-8");
  console.log(`Wrote ranked CSV to ${csvPath}`);

  const summary = generateSummary(scored);
  const summaryPath = path.join(OUTPUT_DIR, "icimod-rds-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`Wrote summary to ${summaryPath}`);

  // 5. Print summary to console
  console.log("\n=== SUMMARY ===");
  console.log(`Total records: ${summary.totalRecords}`);
  console.log(`Overlapping Nepal: ${summary.nepalOverlapping}`);
  console.log("\nTier distribution:");
  for (const [tier, count] of Object.entries(summary.tierDistribution)) {
    console.log(`  ${tier.padEnd(12)} ${count}`);
  }
  console.log("\nCategory distribution:");
  for (const [cat, count] of Object.entries(summary.categoryDistribution)) {
    console.log(`  ${cat.padEnd(20)} ${count}`);
  }
  console.log(`\nTop ${summary.topCritical.length} critical datasets:`);
  for (const d of summary.topCritical.slice(0, 15)) {
    console.log(`  #${d.rank} (${d.score}pts) ${d.title.slice(0, 80)}`);
  }

  console.log("\n=== DONE ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
