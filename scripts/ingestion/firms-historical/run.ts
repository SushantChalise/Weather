#!/usr/bin/env tsx

/**
 * NASA FIRMS Historical Fire Hotspot Ingestion
 *
 * Pulls the last 365 days of MODIS + VIIRS-SNPP + VIIRS-NOAA20 hotspots
 * over Nepal (80.0–88.2°E, 26.3–30.5°N) from the FIRMS Area API and
 * upserts into the `fires` table.
 *
 * - Sources: MODIS_SP/NRT, VIIRS_SNPP_SP/NRT, VIIRS_NOAA20_SP/NRT.
 *   SP (Standard Processing) covers data older than ~10 days.
 *   NRT (Near-Real-Time) covers the most recent ≤5 days.
 * - Chunks: 5-day windows (API max per request).
 * - Deduplication: ON CONFLICT (time, latitude, longitude, source_label) DO NOTHING.
 * - Throttle: 1500ms between HTTP requests.
 *
 * Citation: NASA FIRMS — MODIS / VIIRS active fire data,
 *   https://firms.modaps.eosdis.nasa.gov/api/
 *
 * Usage:
 *   npm run db:firms-historical
 *
 * Requires FIRMS_MAP_KEY and DATABASE_URL in .env.local.
 */

import { config } from "dotenv";

config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { db } from "../../../src/db/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const DATASET_SLUG = "firms-historical";
const NEPAL_BBOX = "80.0,26.3,88.2,30.5";
const CHUNK_DAYS = 5;
const LOOKBACK_DAYS = 365;
const THROTTLE_MS = 1500;

// FIRMS data is split: NRT covers recent data (~last 10 days), SP covers older.
// We use SP for the bulk of the backfill and NRT for the most recent days.
const NRT_THRESHOLD_DAYS = 10;

const SOURCES_SP = ["MODIS_SP", "VIIRS_SNPP_SP", "VIIRS_NOAA20_SP"] as const;
const SOURCES_NRT = ["MODIS_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"] as const;
type FirmsSourceSP = (typeof SOURCES_SP)[number];
type FirmsSourceNRT = (typeof SOURCES_NRT)[number];
type FirmsSource = FirmsSourceSP | FirmsSourceNRT;

const SOURCE_LABEL: Record<FirmsSource, string> = {
  MODIS_SP: "MODIS",
  VIIRS_SNPP_SP: "VIIRS_SNPP",
  VIIRS_NOAA20_SP: "VIIRS_NOAA20",
  MODIS_NRT: "MODIS",
  VIIRS_SNPP_NRT: "VIIRS_SNPP",
  VIIRS_NOAA20_NRT: "VIIRS_NOAA20",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface FireRow {
  time: string;
  latitude: number;
  longitude: number;
  confidence: string;
  frp: number | null;
  sourceLabel: string;
  daynight: string;
  sourceId: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(mapKey: string, source: FirmsSource, startDate: string, nDays: number): string {
  return (
    `https://firms.modaps.eosdis.nasa.gov/api/area/csv` +
    `/${mapKey}/${source}/${NEPAL_BBOX}/${nDays}/${startDate}`
  );
}

function parseCsv(csv: string, sourceLabel: string, sourceId: number): FireRow[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const rows: FireRow[] = [];
  for (const line of lines.slice(1)) {
    const p = line.split(",");
    if (p.length < 14) continue;

    const lat = Number(p[0]);
    const lon = Number(p[1]);
    const acqDate = (p[5] ?? "").trim();
    const acqTime = (p[6] ?? "").trim();
    const confidence = (p[9] ?? "").trim();
    const frpRaw = Number(p[12]);
    const daynightRaw = (p[13] ?? "").trim();

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || acqDate.length < 10) continue;

    const hh = acqTime.padStart(4, "0").slice(0, 2);
    const mm = acqTime.padStart(4, "0").slice(2, 4);
    const time = `${acqDate}T${hh}:${mm}:00Z`;

    rows.push({
      time,
      latitude: lat,
      longitude: lon,
      confidence,
      frp: Number.isFinite(frpRaw) ? frpRaw : null,
      sourceLabel,
      daynight: daynightRaw === "N" ? "N" : "D",
      sourceId,
    });
  }
  return rows;
}

async function fetchCsv(url: string): Promise<string | null> {
  let resp: Response;
  try {
    resp = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  } catch (err) {
    console.warn(`    fetch error: ${String(err)}`);
    return null;
  }
  const body = await resp.text();
  if (!resp.ok || body.startsWith("Invalid")) {
    console.warn(`    HTTP ${resp.status}: ${body.substring(0, 80)}`);
    return null;
  }
  return body;
}

async function upsertBatch(rows: FireRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const valuesSql = sql.join(
      slice.map(
        (r) =>
          sql`(
            ${r.time}::timestamptz,
            ${r.latitude}::real,
            ${r.longitude}::real,
            ${r.confidence},
            ${r.frp}::real,
            ${r.sourceLabel},
            ${r.daynight},
            ${r.sourceId}
          )`,
      ),
      sql`, `,
    );
    const result = await db.execute(sql`
      INSERT INTO fires (time, latitude, longitude, confidence, frp, source_label, daynight, source_id)
      VALUES ${valuesSql}
      ON CONFLICT (time, latitude, longitude, source_label) DO NOTHING
    `);
    inserted += result.rowCount ?? 0;
  }
  return inserted;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) {
    console.error("FIRMS_MAP_KEY is not set. Add it to .env.local.");
    process.exit(1);
  }

  console.log("NASA FIRMS Historical Fire Hotspot Ingestion");
  console.log(`  Lookback : ${LOOKBACK_DAYS} days`);
  console.log(`  Bbox     : ${NEPAL_BBOX} (Nepal)`);
  console.log(`  Chunk    : ${CHUNK_DAYS} days (API max per request)`);
  console.log(
    `  Sources  : MODIS, VIIRS_SNPP, VIIRS_NOAA20 (SP for archive, NRT for last ${NRT_THRESHOLD_DAYS}d)\n`,
  );

  // 1. Ensure dataset row exists
  await db.execute(sql`
    INSERT INTO datasets (
      slug, name, license, citation, source_url,
      description, spatial_res, temporal_res
    ) VALUES (
      ${DATASET_SLUG},
      'NASA FIRMS Historical Fire Hotspots',
      'Public Domain',
      'NASA FIRMS — MODIS / VIIRS active fire data, https://firms.modaps.eosdis.nasa.gov/api/',
      'https://firms.modaps.eosdis.nasa.gov/api/',
      'MODIS and VIIRS active fire hotspots over Nepal for the last 365 days.',
      '~375m–1km',
      'sub-daily'
    )
    ON CONFLICT (slug) DO NOTHING
  `);

  const dsResult = await db.execute<{ id: number }>(
    sql`SELECT id FROM datasets WHERE slug = ${DATASET_SLUG}`,
  );
  const datasetRow = dsResult.rows[0];
  if (!datasetRow) throw new Error(`Dataset row not found for slug "${DATASET_SLUG}"`);
  const sourceId = datasetRow.id;

  // 2. Build 5-day chunks from today back 365 days (oldest → newest for clarity)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const chunks: Array<{ startDate: string; nDays: number; daysAgo: number }> = [];
  let remaining = LOOKBACK_DAYS;
  let cursor = new Date(today);

  while (remaining > 0) {
    const nDays = Math.min(remaining, CHUNK_DAYS);
    cursor.setUTCDate(cursor.getUTCDate() - nDays);
    const daysAgo = Math.round((today.getTime() - cursor.getTime()) / 86_400_000);
    chunks.push({ startDate: formatDate(cursor), nDays, daysAgo });
    remaining -= nDays;
  }

  console.log(`  Chunks   : ${chunks.length} (${CHUNK_DAYS}-day windows, oldest first)\n`);

  let totalInserted = 0;
  let requestCount = 0;

  for (const chunk of chunks) {
    const chunkRows: FireRow[] = [];
    // SP covers data older than ~10 days; NRT covers recent data.
    const useNrt = chunk.daysAgo <= NRT_THRESHOLD_DAYS;
    const sourceTriple: [FirmsSource, FirmsSource, FirmsSource] = useNrt
      ? ["MODIS_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"]
      : ["MODIS_SP", "VIIRS_SNPP_SP", "VIIRS_NOAA20_SP"];

    for (const source of sourceTriple) {
      if (requestCount > 0) await sleep(THROTTLE_MS);

      const url = buildUrl(mapKey, source, chunk.startDate, chunk.nDays);
      process.stdout.write(
        `  ${chunk.startDate} +${String(chunk.nDays).padStart(2)}d  ${source.padEnd(20)} … `,
      );

      const csv = await fetchCsv(url);
      requestCount++;

      if (!csv) {
        console.log("skipped");
        continue;
      }

      const rows = parseCsv(csv, SOURCE_LABEL[source], sourceId);
      console.log(`${rows.length} rows`);
      chunkRows.push(...rows);
    }

    // Deduplicate within the chunk before upserting
    const seen = new Set<string>();
    const deduped: FireRow[] = [];
    for (const r of chunkRows) {
      const key = `${r.time}|${r.latitude}|${r.longitude}|${r.sourceLabel}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }

    const inserted = await upsertBatch(deduped);
    totalInserted += inserted;
    console.log(
      `    chunk: ${deduped.length} unique → ${inserted} new rows inserted\n`,
    );
  }

  console.log(`Done.`);
  console.log(`  ${totalInserted} new rows inserted across ${chunks.length} chunks.`);

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
