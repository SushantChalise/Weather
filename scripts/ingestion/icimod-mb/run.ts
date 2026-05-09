#!/usr/bin/env tsx

/**
 * ICIMOD Glacier Mass Balance Ingestion — Preliminary Placeholder
 *
 * Generates annual mass balance time series (2000–2019) for 4 HKH glaciers
 * using mean rates from Hugonnet et al. 2021 with deterministic seeded noise
 * for plausible year-to-year variability.
 *
 * Real ICIMOD CSV ingestion is left for when the user manually downloads
 * the source files (the ICIMOD RDS portal does not expose a programmatic API).
 *
 * Usage:
 *   npm run db:icimod-mb
 *
 * Requires DATABASE_URL in .env.local.
 */

import { config } from "dotenv";

config({ path: ".env.local" });

import { sql } from "drizzle-orm";
// Import db AFTER dotenv so DATABASE_URL is set before client.ts executes.
import { db } from "../../../src/db/client";

// ─── Constants ───────────────────────────────────────────────────────────────

const DATASET_SLUG = "icimod-mb-preliminary";

/** Mean annual mass balance rates (m w.e./yr) from Hugonnet et al. 2021 + ICIMOD reports. */
const GLACIER_RATES: Record<string, number> = {
  "khumbu-glacier": -0.45,
  yala: -0.74,
  "rikha-samba": -0.39,
  gangotri: -0.35,
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface MbRow {
  time: string;
  place_id: number;
  value: number;
  method: string;
  source_id: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Deterministic noise based on slug + year — reproducible across runs.
 * Returns a value in [-scale, +scale].
 */
function seededNoise(slug: string, year: number, scale = 0.25): number {
  let h = 0;
  const key = `${slug}-${year}`;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  // Normalize to [-scale, +scale]
  const normalized = ((h % 10000) / 10000) * 2 - 1;
  return normalized * scale;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("ICIMOD Glacier Mass Balance Ingestion (Preliminary Placeholder)");
  console.log(`  Glaciers : ${Object.keys(GLACIER_RATES).join(", ")}`);
  console.log(`  Period   : 2000–2019\n`);

  // 1. Ensure dataset row exists
  await db.execute(sql`
    INSERT INTO datasets (slug, name, license, citation, source_url, description, spatial_res, temporal_res)
    VALUES (
      ${DATASET_SLUG},
      'ICIMOD/Hugonnet Preliminary Mass Balance (placeholder)',
      'CC BY 4.0 (Hugonnet 2021)',
      'Preliminary placeholder data based on Hugonnet et al. 2021 published rates. To be replaced with real ICIMOD time-series CSVs.',
      'https://doi.org/10.1038/s41586-021-03436-0',
      'Annual glacier mass balance (placeholder, 2000-2019). 4 HKH glaciers.',
      'per glacier',
      'annual'
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
  const glacierSlugs = Object.keys(GLACIER_RATES);
  const placesResult = await db.execute<{ id: number; slug: string }>(
    sql`SELECT id, slug FROM places WHERE slug = ANY(${glacierSlugs})`,
  );
  const placeIdBySlug = new Map(placesResult.rows.map((r) => [r.slug, r.id]));

  // 4. Build rows
  const rows: MbRow[] = [];

  for (const [slug, meanRate] of Object.entries(GLACIER_RATES)) {
    const place_id = placeIdBySlug.get(slug);
    if (place_id === undefined) {
      console.warn(`  [SKIP] ${slug} — not found in places table`);
      continue;
    }

    for (let year = 2000; year <= 2019; year++) {
      const value = meanRate + seededNoise(slug, year, 0.3);
      rows.push({
        time: `${year}-01-01T00:00:00Z`,
        place_id,
        value,
        method: "geodetic",
        source_id: dataset_id,
      });
    }
  }

  if (rows.length === 0) {
    console.log("No rows to insert (no matching glaciers found in places table).");
    process.exit(0);
  }

  // 5. Upsert all rows in one statement (80 rows max — no batching needed)
  const valuesSql = sql.join(
    rows.map(
      (r) =>
        sql`(${r.time}::timestamptz, ${r.place_id}, ${r.value}, ${r.method}, ${r.source_id})`,
    ),
    sql`, `,
  );
  await db.execute(sql`
    INSERT INTO cryo_glacier_mass_balance (time, place_id, value, method, source_id)
    VALUES ${valuesSql}
    ON CONFLICT (time, place_id, method, source_id)
    DO UPDATE SET value = EXCLUDED.value
  `);

  console.log(
    `Inserted ${rows.length} mass balance rows for ${placeIdBySlug.size} glaciers (2000–2019).`,
  );

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
