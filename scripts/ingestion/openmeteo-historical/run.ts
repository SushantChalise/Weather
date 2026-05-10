#!/usr/bin/env tsx

/**
 * Open-Meteo Historical Weather Backfill
 *
 * Pulls 5 years (2020-01-01 → 2024-12-31) of daily aggregates from the
 * Open-Meteo free historical archive (blends ERA5, CHIRPS, and ground
 * stations) for all Tier-1 places and upserts into obs_weather_daily.
 *
 * Variables: temp_2m_mean, temp_2m_max, temp_2m_min, precip, wind_max_10m
 *
 * Usage:
 *   npm run db:openmeteo-historical
 *
 * Requires DATABASE_URL in .env.local. No API key needed.
 */

import { config } from "dotenv";

config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { PLACE_REGISTRY } from "../../../src/data/places";
// Import db AFTER dotenv so DATABASE_URL is set before client.ts executes.
import { db } from "../../../src/db/client";

// ─── Constants ───────────────────────────────────────────────────────────────

const DATASET_SLUG = "openmeteo-historical";
const START_DATE = "2020-01-01"; // 5-year backfill, manageable size
const END_DATE = "2024-12-31";
const BATCH_SIZE = 1000; // rows per INSERT statement

const VARIABLES = [
  "temperature_2m_mean",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "windspeed_10m_max",
] as const;

type OpenMeteoVariable = (typeof VARIABLES)[number];

/** Map Open-Meteo variable names → our internal schema names + units. */
const VARIABLE_MAP: Record<OpenMeteoVariable, { name: string; unit: string }> = {
  temperature_2m_mean: { name: "temp_2m_mean", unit: "degC" },
  temperature_2m_max: { name: "temp_2m_max", unit: "degC" },
  temperature_2m_min: { name: "temp_2m_min", unit: "degC" },
  precipitation_sum: { name: "precip", unit: "mm" },
  windspeed_10m_max: { name: "wind_max_10m", unit: "km/h" },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface OpenMeteoResponse {
  daily?: {
    time?: string[];
    temperature_2m_mean?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_sum?: (number | null)[];
    windspeed_10m_max?: (number | null)[];
  };
}

interface ObsRow {
  time: string;
  place_id: number;
  variable: string;
  value: number;
  unit: string;
  source_id: number;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Open-Meteo Historical Weather Backfill");
  console.log(`  Period : ${START_DATE} → ${END_DATE}`);
  console.log(`  Places : ${Object.keys(PLACE_REGISTRY).length}`);
  console.log(`  Vars   : ${VARIABLES.join(", ")}\n`);

  // 1. Ensure dataset row exists
  await db.execute(sql`
    INSERT INTO datasets (
      slug, name, license, citation, source_url,
      description, spatial_res, temporal_res
    ) VALUES (
      ${DATASET_SLUG},
      'Open-Meteo Historical Weather',
      'CC BY 4.0',
      'Open-Meteo.com — Historical Weather API (blends ERA5 + CHIRPS + stations).',
      'https://open-meteo.com/en/docs/historical-weather-api',
      'Daily climate aggregates blended from ERA5, CHIRPS, and ground stations.',
      '~9 km',
      'daily'
    )
    ON CONFLICT (slug) DO NOTHING
  `);

  // 2. Look up dataset_id
  const dsResult = await db.execute<{ id: number }>(
    sql`SELECT id FROM datasets WHERE slug = ${DATASET_SLUG}`,
  );
  const datasetRow = dsResult.rows[0];
  if (!datasetRow) {
    throw new Error(`Dataset row not found for slug "${DATASET_SLUG}"`);
  }
  const dataset_id = datasetRow.id;

  // 3. Build place_id lookup map
  const placesResult = await db.execute<{ id: number; slug: string }>(
    sql`SELECT id, slug FROM places`,
  );
  const placeIdBySlug = new Map(placesResult.rows.map((r) => [r.slug, r.id]));

  // 4. Fetch + load per place
  let totalRows = 0;
  let skippedPlaces = 0;

  for (const [slug, place] of Object.entries(PLACE_REGISTRY)) {
    const place_id = placeIdBySlug.get(slug);
    if (place_id === undefined) {
      console.warn(`  [SKIP] ${slug} — not found in places table`);
      skippedPlaces++;
      continue;
    }

    const url =
      `https://archive-api.open-meteo.com/v1/archive` +
      `?latitude=${place.lat}` +
      `&longitude=${place.lon}` +
      `&start_date=${START_DATE}` +
      `&end_date=${END_DATE}` +
      `&daily=${VARIABLES.join(",")}` +
      `&timezone=UTC`;

    process.stdout.write(`  ${slug.padEnd(24)} … `);

    let data: OpenMeteoResponse;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`HTTP ${response.status} — skipping`);
        skippedPlaces++;
        continue;
      }
      data = (await response.json()) as OpenMeteoResponse;
    } catch (err) {
      console.warn(`fetch error — ${String(err)}`);
      skippedPlaces++;
      continue;
    }

    const dates: string[] = data.daily?.time ?? [];
    if (dates.length === 0) {
      console.warn("no data — skipping");
      skippedPlaces++;
      continue;
    }

    // Build rows for batch insert
    const rows: ObsRow[] = [];
    for (const v of VARIABLES) {
      const rawValues = data.daily?.[v] ?? [];
      const mapped = VARIABLE_MAP[v];
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const val = rawValues[i];
        if (val === null || val === undefined || date === undefined) continue;
        rows.push({
          time: `${date}T00:00:00Z`,
          place_id,
          variable: mapped.name,
          value: val,
          unit: mapped.unit,
          source_id: dataset_id,
        });
      }
    }

    // Batch upsert in chunks of BATCH_SIZE
    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const slice = rows.slice(i, i + BATCH_SIZE);
        const valuesSql = sql.join(
          slice.map(
            (r) =>
              sql`(${r.time}::timestamptz, ${r.place_id}, ${r.variable}, ${r.value}, ${r.unit}, ${r.source_id})`,
          ),
          sql`, `,
        );
        await db.execute(sql`
          INSERT INTO obs_weather_daily
            (time, place_id, variable, value, unit, source_id)
          VALUES ${valuesSql}
          ON CONFLICT (time, place_id, variable, source_id)
          DO UPDATE SET
            value       = EXCLUDED.value,
            ingested_at = NOW()
        `);
      }
    }

    console.log(`${rows.length} rows`);
    totalRows += rows.length;

    // Open-Meteo's per-minute cap counts each year×variable combo as a "call",
    // so 5y × 5 vars hits the limit fast without a delay between places.
    await new Promise((resolve) => setTimeout(resolve, 7000));
  }

  console.log(`\nDone.`);
  console.log(
    `  ${totalRows} rows upserted across ${Object.keys(PLACE_REGISTRY).length - skippedPlaces} places.`,
  );
  if (skippedPlaces > 0) {
    console.log(`  ${skippedPlaces} places skipped (not in DB or fetch error).`);
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
