#!/usr/bin/env tsx

/**
 * Open-Meteo Air Quality Ingestion
 *
 * Pulls the last 30 days of hourly air quality data from the Open-Meteo
 * Air Quality API (CAMS European model at ~10 km resolution), aggregates
 * it to daily means, and upserts into obs_weather_daily for 6 cities.
 *
 * Variables: pm25, pm10, no2
 *
 * Usage:
 *   npm run db:openmeteo-aq
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

const DATASET_SLUG = "openmeteo-aq";
const BATCH_SIZE = 1000; // rows per INSERT statement

const CITIES = [
  "kathmandu",
  "pokhara",
  "lukla",
  "namche",
  "jomsom",
  "chitwan",
] as const;

type CitySlug = (typeof CITIES)[number];

// Open-Meteo AQ API returns hourly data; we aggregate to daily means.
const VARIABLES = ["pm2_5", "pm10", "nitrogen_dioxide"] as const;

type AqVariable = (typeof VARIABLES)[number];

/** Map Open-Meteo AQ variable names → our internal schema names + units. */
const VARIABLE_MAP: Record<AqVariable, { name: string; unit: string }> = {
  pm2_5: { name: "pm25", unit: "μg/m³" },
  pm10: { name: "pm10", unit: "μg/m³" },
  nitrogen_dioxide: { name: "no2", unit: "μg/m³" },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface OpenMeteoAqResponse {
  hourly?: {
    time?: string[];
    pm2_5?: (number | null)[];
    pm10?: (number | null)[];
    nitrogen_dioxide?: (number | null)[];
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return YYYY-MM-DD string for a UTC date offset by `offsetDays` from today. */
function utcDateOffset(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Date range: yesterday back 30 days (AQ data can lag by 1 day)
  const endDate = utcDateOffset(-1);
  const startDate = utcDateOffset(-31);

  console.log("Open-Meteo Air Quality Ingestion");
  console.log(`  Period : ${startDate} → ${endDate}`);
  console.log(`  Cities : ${CITIES.join(", ")}`);
  console.log(`  Vars   : ${VARIABLES.join(", ")}\n`);

  // 1. Ensure dataset row exists
  await db.execute(sql`
    INSERT INTO datasets (
      slug, name, license, citation, source_url,
      description, spatial_res, temporal_res
    ) VALUES (
      ${DATASET_SLUG},
      'Open-Meteo Air Quality',
      'CC BY 4.0',
      'Open-Meteo.com — Air Quality API (CAMS European model).',
      'https://open-meteo.com/en/docs/air-quality-api',
      'Hourly + daily air quality aggregates from CAMS European model.',
      '~10 km',
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

  // 3. Build place_id lookup map (only for the 6 target cities)
  const citiesArray = [...CITIES];
  const slugList = sql.join(
    citiesArray.map((c) => sql`${c}`),
    sql`, `,
  );
  const placesResult = await db.execute<{ id: number; slug: string }>(
    sql`SELECT id, slug FROM places WHERE slug IN (${slugList})`,
  );
  const placeIdBySlug = new Map(placesResult.rows.map((r) => [r.slug, r.id]));

  // 4. Fetch + aggregate + load per city
  let totalRows = 0;
  let skippedCities = 0;

  for (const slug of CITIES) {
    const place = PLACE_REGISTRY[slug as CitySlug];
    const place_id = placeIdBySlug.get(slug);

    if (!place || place_id === undefined) {
      console.warn(`  [SKIP] ${slug} — not found in PLACE_REGISTRY or places table`);
      skippedCities++;
      continue;
    }

    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${place.lat}` +
      `&longitude=${place.lon}` +
      `&start_date=${startDate}` +
      `&end_date=${endDate}` +
      `&hourly=${VARIABLES.join(",")}` +
      `&timezone=UTC`;

    process.stdout.write(`  ${slug.padEnd(24)} … `);

    let data: OpenMeteoAqResponse;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`HTTP ${response.status} — skipping`);
        skippedCities++;
        continue;
      }
      data = (await response.json()) as OpenMeteoAqResponse;
    } catch (err) {
      console.warn(`fetch error — ${String(err)}`);
      skippedCities++;
      continue;
    }

    const times: string[] = data.hourly?.time ?? [];
    if (times.length === 0) {
      console.warn("no data — skipping");
      skippedCities++;
      continue;
    }

    // Aggregate hourly → daily mean per variable
    const rows: ObsRow[] = [];

    for (const v of VARIABLES) {
      const rawValues: (number | null)[] = data.hourly?.[v] ?? [];
      const mapped = VARIABLE_MAP[v];

      // Accumulate sum + count per calendar day
      const dailyAcc = new Map<string, { sum: number; count: number }>();
      for (let i = 0; i < times.length; i++) {
        const time = times[i];
        const val = rawValues[i];
        if (time === undefined || val === null || val === undefined) continue;
        const day = time.slice(0, 10);
        const acc = dailyAcc.get(day) ?? { sum: 0, count: 0 };
        acc.sum += val;
        acc.count += 1;
        dailyAcc.set(day, acc);
      }

      for (const [day, { sum, count }] of dailyAcc) {
        rows.push({
          time: `${day}T00:00:00Z`,
          place_id,
          variable: mapped.name,
          value: sum / count,
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
  }

  console.log(`\nDone.`);
  console.log(
    `  ${totalRows} rows upserted across ${CITIES.length - skippedCities} cities.`,
  );
  if (skippedCities > 0) {
    console.log(`  ${skippedCities} cities skipped (not in DB or fetch error).`);
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
