#!/usr/bin/env tsx

/**
 * USGS Earthquakes Historical Ingestion
 *
 * Pulls 5 years (2021-01-01 → 2025-12-31) of M ≥ 4.5 earthquakes from the
 * USGS FDSN event web service for a Nepal-centred bounding box
 * (26–31 °N, 80–89 °E) and upserts into the `earthquakes` table.
 *
 * Source: USGS Earthquake Hazards Program — public, https://earthquake.usgs.gov/
 *
 * Usage:
 *   npm run db:usgs-earthquakes
 *
 * Requires DATABASE_URL in .env.local. No API key needed.
 */

import { config } from "dotenv";

config({ path: ".env.local" });

import { sql } from "drizzle-orm";
// Import db AFTER dotenv so DATABASE_URL is set before client.ts executes.
import { db } from "../../../src/db/client";

// ─── Constants ───────────────────────────────────────────────────────────────

const DATASET_SLUG = "usgs-earthquakes";

// Nepal-centred bounding box (matches the live proxy in /api/earthquakes)
const BBOX = {
  minLatitude: 26,
  maxLatitude: 31,
  minLongitude: 80,
  maxLongitude: 89,
} as const;

const MIN_MAGNITUDE = 4.5;

// 5-year historical window
const START_DATE = "2021-01-01";
const END_DATE = "2025-12-31";

const USGS_BASE = "https://earthquake.usgs.gov/fdsnws/event/1/query";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UsgsProperties {
  mag: number | null;
  place: string | null;
  time: number | null;
  depth?: number | null;
}

interface UsgsFeature {
  id: string;
  properties: UsgsProperties;
  geometry: {
    coordinates: [number, number, number];
  };
}

interface UsgsGeoJson {
  features?: UsgsFeature[];
  metadata?: {
    count?: number;
  };
}

interface EqRow {
  id: string;
  time: string;
  magnitude: number;
  latitude: number;
  longitude: number;
  depth_km: number | null;
  place_label: string | null;
  source_id: number;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("USGS Earthquakes Historical Ingestion");
  console.log(`  Period : ${START_DATE} → ${END_DATE}`);
  console.log(`  Min mag: ${MIN_MAGNITUDE}`);
  console.log(
    `  BBox   : lat ${BBOX.minLatitude}–${BBOX.maxLatitude}, lon ${BBOX.minLongitude}–${BBOX.maxLongitude}\n`,
  );

  // 1. Ensure dataset row exists
  await db.execute(sql`
    INSERT INTO datasets (
      slug, name, license, citation, source_url,
      description, temporal_res
    ) VALUES (
      ${DATASET_SLUG},
      'USGS Earthquake Hazards Program',
      'Public Domain (U.S. Government)',
      'USGS Earthquake Hazards Program — public, https://earthquake.usgs.gov/',
      'https://earthquake.usgs.gov/fdsnws/event/1/',
      'Historical M ≥ 4.5 earthquakes for the Nepal region (26–31°N, 80–89°E), 5-year window.',
      'event'
    )
    ON CONFLICT (slug) DO NOTHING
  `);

  // 2. Look up dataset id
  const dsResult = await db.execute<{ id: number }>(
    sql`SELECT id FROM datasets WHERE slug = ${DATASET_SLUG}`,
  );
  const datasetRow = dsResult.rows[0];
  if (!datasetRow) {
    throw new Error(`Dataset row not found for slug "${DATASET_SLUG}"`);
  }
  const dataset_id = datasetRow.id;

  // 3. Fetch GeoJSON from USGS (single request — M ≥ 4.5 over 5 years in this
  //    bbox yields a few hundred events, well under the 20,000-record cap)
  const url =
    `${USGS_BASE}` +
    `?format=geojson` +
    `&starttime=${START_DATE}` +
    `&endtime=${END_DATE}` +
    `&minmagnitude=${MIN_MAGNITUDE}` +
    `&minlatitude=${BBOX.minLatitude}` +
    `&maxlatitude=${BBOX.maxLatitude}` +
    `&minlongitude=${BBOX.minLongitude}` +
    `&maxlongitude=${BBOX.maxLongitude}`;

  console.log(`  Fetching: ${url}\n`);

  let geojson: UsgsGeoJson;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) {
      throw new Error(`USGS returned HTTP ${response.status}`);
    }
    geojson = (await response.json()) as UsgsGeoJson;
  } catch (err) {
    console.error("Fetch failed:", err);
    process.exit(1);
  }

  const features = geojson.features ?? [];
  console.log(`  USGS reported ${geojson.metadata?.count ?? features.length} events`);
  console.log(`  Features received: ${features.length}\n`);

  if (features.length === 0) {
    console.log("No events to ingest. Exiting.");
    process.exit(0);
  }

  // 4. Parse into rows, skipping any that are missing required fields
  const rows: EqRow[] = [];
  let skipped = 0;

  for (const feature of features) {
    const { id, properties, geometry } = feature;
    const [lon, lat, depth] = geometry.coordinates;
    const mag = properties.mag;
    const timeMs = properties.time;

    if (!id || mag === null || mag === undefined || timeMs === null || timeMs === undefined) {
      skipped++;
      continue;
    }

    rows.push({
      id,
      time: new Date(timeMs).toISOString(),
      magnitude: mag,
      latitude: lat,
      longitude: lon,
      depth_km: depth !== undefined && depth !== null ? depth : null,
      place_label: properties.place ?? null,
      source_id: dataset_id,
    });
  }

  if (skipped > 0) {
    console.log(`  Skipped ${skipped} features with missing required fields.`);
  }

  // 5. Upsert all rows (ON CONFLICT on PK `id`)
  const BATCH_SIZE = 500;
  let upserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const slice = rows.slice(i, i + BATCH_SIZE);
    const valuesSql = sql.join(
      slice.map(
        (r) => sql`(
          ${r.id},
          ${r.time}::timestamptz,
          ${r.magnitude}::real,
          ${r.latitude}::real,
          ${r.longitude}::real,
          ${r.depth_km}::real,
          ${r.place_label},
          ${r.source_id}
        )`,
      ),
      sql`, `,
    );

    await db.execute(sql`
      INSERT INTO earthquakes
        (id, time, magnitude, latitude, longitude, depth_km, place_label, source_id)
      VALUES ${valuesSql}
      ON CONFLICT (id) DO UPDATE SET
        magnitude   = EXCLUDED.magnitude,
        latitude    = EXCLUDED.latitude,
        longitude   = EXCLUDED.longitude,
        depth_km    = EXCLUDED.depth_km,
        place_label = EXCLUDED.place_label,
        ingested_at = NOW()
    `);

    upserted += slice.length;
    process.stdout.write(`  Upserted ${upserted}/${rows.length} rows\r`);
  }

  console.log(`\n\nDone.`);
  console.log(`  ${upserted} rows upserted into earthquakes table.`);

  // 6. Spot-check: show 5 sample rows
  const sample = await db.execute<{
    id: string;
    time: string;
    magnitude: number;
    place_label: string | null;
  }>(sql`
    SELECT id, time, magnitude, place_label
    FROM earthquakes
    ORDER BY magnitude DESC
    LIMIT 5
  `);

  console.log("\n  Top 5 by magnitude:");
  for (const row of sample.rows) {
    console.log(
      `    ${row.id}  M${row.magnitude.toFixed(1)}  ${String(row.time).slice(0, 10)}  ${row.place_label ?? ""}`,
    );
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
