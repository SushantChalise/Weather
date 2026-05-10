#!/usr/bin/env tsx

/**
 * Hugonnet 2021 Glacier Mass Balance Ingestion — Real Geodetic Data
 *
 * Replaces the seeded-noise placeholder in `icimod-mb/run.ts` for the four
 * supported glaciers by ingesting real regional mass balance rates from:
 *
 *   Hugonnet et al. 2021, "Accelerated global glacier mass loss in the early
 *   twenty-first century", Nature 592, 726–731.
 *   DOI: 10.1038/s41586-021-03436-0
 *
 * Source file: data/hugonnet-2021/extended_data_tables/ED_table_1_2_data.csv
 *
 * The CSV contains regional-aggregate geodetic mass balance in 5-year periods
 * (2000–2005, 2005–2010, 2010–2015, 2015–2020) for all 21 RGI v6 regions.
 * The column `dmdtda` is the area-normalised specific mass balance in m w.e./yr,
 * which is what we store (unit: m_we_yr).
 *
 * Glacier → RGI region mapping (lat/lon verified against PLACE_REGISTRY):
 *   khumbu-glacier  → reg 15 (South Asia East, lat 27.97°N / lon 86.83°E)
 *   yala            → reg 15 (South Asia East, lat 28.23°N / lon 85.62°E)
 *   rikha-samba     → reg 15 (South Asia East, lat 28.82°N / lon 83.50°E)
 *   gangotri        → reg 14 (South Asia West, lat 30.93°N / lon 79.07°E)
 *
 * Annual rows 2000–2019 are emitted by holding each 5-year period rate constant
 * across the 5 years it covers — the most defensible interpolation when only
 * period means are available.
 *
 * Usage:
 *   npm run db:hugonnet-2021
 *
 * Requires DATABASE_URL in .env.local.
 */

import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { db } from "../../../src/db/client";

// ─── Constants ───────────────────────────────────────────────────────────────

const DATASET_SLUG = "hugonnet-2021";

const CSV_PATH = join(
  process.cwd(),
  "data",
  "hugonnet-2021",
  "extended_data_tables",
  "ED_table_1_2_data.csv",
);

/**
 * Each glacier slug mapped to its RGI v6 region number.
 * Khumbu, Yala, and Rikha Samba are all in Nepal (South Asia East = reg 15).
 * Gangotri is in Uttarakhand, India (South Asia West = reg 14).
 */
const GLACIER_REGION: Record<string, number> = {
  "khumbu-glacier": 15,
  yala: 15,
  "rikha-samba": 15,
  gangotri: 14,
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface RegionPeriod {
  reg: number;
  startYear: number;
  endYear: number;
  dmdtda: number;
}

interface MbRow {
  time: string;
  place_id: number;
  value: number;
  method: string;
  source_id: number;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

/**
 * Minimal CSV parser — handles only the ED_table_1_2_data.csv format:
 * a plain-text file with a header row and comma-separated numeric values.
 * No quoted fields, no embedded commas needed.
 */
function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split("\n");
  const header = lines[0]?.split(",") ?? [];
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;
    const values = line.split(",");
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      const key = header[j]?.trim();
      if (key) row[key] = values[j]?.trim() ?? "";
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Parse the `period` field "YYYY-MM-DD_YYYY-MM-DD" → { startYear, endYear }.
 * Returns null if the period string is the 20-year aggregate (2000–2020) so
 * we can skip it — we use the 5-year slices instead.
 */
function parsePeriod(period: string): { startYear: number; endYear: number } | null {
  const parts = period.split("_");
  if (parts.length !== 2) return null;
  const startYear = parseInt(parts[0]?.slice(0, 4) ?? "", 10);
  const endYear = parseInt(parts[1]?.slice(0, 4) ?? "", 10);
  if (isNaN(startYear) || isNaN(endYear)) return null;
  const span = endYear - startYear;
  if (span !== 5) return null;
  return { startYear, endYear };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Hugonnet 2021 Glacier Mass Balance Ingestion (Real Geodetic Data)");
  console.log(`  Source : ${CSV_PATH}`);
  console.log(`  Glaciers : ${Object.keys(GLACIER_REGION).join(", ")}`);
  console.log(`  Period   : 2000–2019 (annual rows from 5-year geodetic means)\n`);

  // 1. Parse CSV
  let raw: string;
  try {
    raw = readFileSync(CSV_PATH, "utf-8");
  } catch {
    throw new Error(
      `Cannot read CSV at ${CSV_PATH}. ` +
        `Run: cp -r C:/Users/ACER/Projects/Weather/data .`,
    );
  }

  const csvRows = parseCsv(raw);

  // 2. Extract region-period rates (5-year slices only; skip 20-year aggregate)
  const regionPeriods: RegionPeriod[] = [];
  for (const row of csvRows) {
    const parsed = parsePeriod(row.period ?? "");
    if (!parsed) continue;
    const reg = parseFloat(row.reg ?? "");
    const dmdtda = parseFloat(row.dmdtda ?? "");
    if (isNaN(reg) || isNaN(dmdtda)) continue;
    regionPeriods.push({ reg, startYear: parsed.startYear, endYear: parsed.endYear, dmdtda });
  }

  const uniqueRegions = [...new Set(regionPeriods.map((r) => r.reg))].sort((a, b) => a - b);
  console.log(
    `  Parsed ${regionPeriods.length} region-period rows covering regions: ${uniqueRegions.join(", ")}\n`,
  );

  // Build lookup: reg → (startYear → dmdtda)
  const lookup = new Map<number, Map<number, number>>();
  for (const rp of regionPeriods) {
    if (!lookup.has(rp.reg)) lookup.set(rp.reg, new Map());
    lookup.get(rp.reg)!.set(rp.startYear, rp.dmdtda);
  }

  // 3. Register dataset
  await db.execute(sql`
    INSERT INTO datasets (
      slug, name, license, citation, source_url,
      description, spatial_res, temporal_res
    ) VALUES (
      ${DATASET_SLUG},
      'Hugonnet et al. 2021 — Global Glacier Mass Balance',
      'CC BY 4.0',
      'Hugonnet, R. et al. (2021). Accelerated global glacier mass loss in the early twenty-first century. Nature, 592, 726–731. https://doi.org/10.1038/s41586-021-03436-0',
      'https://doi.org/10.1038/s41586-021-03436-0',
      'Regional geodetic mass balance (dmdtda, m w.e./yr) from Hugonnet et al. 2021. 5-year periods 2000–2020. Covers all 21 RGI v6 regions globally.',
      'per RGI region',
      'quinquennial'
    )
    ON CONFLICT (slug) DO NOTHING
  `);

  const dsResult = await db.execute<{ id: number }>(
    sql`SELECT id FROM datasets WHERE slug = ${DATASET_SLUG}`,
  );
  const datasetRow = dsResult.rows[0];
  if (!datasetRow) throw new Error(`Dataset row not found for slug "${DATASET_SLUG}"`);
  const dataset_id = datasetRow.id;
  console.log(`  Dataset registered (id=${dataset_id})\n`);

  // 4. Resolve place IDs
  const glacierSlugs = Object.keys(GLACIER_REGION);
  const slugList = sql.join(
    glacierSlugs.map((s) => sql`${s}`),
    sql`, `,
  );
  const placesResult = await db.execute<{ id: number; slug: string }>(
    sql`SELECT id, slug FROM places WHERE slug IN (${slugList})`,
  );
  const placeIdBySlug = new Map(placesResult.rows.map((r) => [r.slug, r.id]));

  // 5. Build annual rows
  //
  // Each 5-year period covers [startYear, endYear). For the Hugonnet table the
  // periods are 2000–2005, 2005–2010, 2010–2015, 2015–2020, so the years we
  // emit are 2000…2004, 2005…2009, 2010…2014, 2015…2019 (20 annual rows per
  // glacier). The 5-year period mean is the best single estimate we have for
  // any individual year within that window.
  const PERIOD_STARTS = [2000, 2005, 2010, 2015] as const;

  const rows: MbRow[] = [];
  const skipped: string[] = [];

  for (const [slug, reg] of Object.entries(GLACIER_REGION)) {
    const place_id = placeIdBySlug.get(slug);
    if (place_id === undefined) {
      console.warn(`  [SKIP] ${slug} — not found in places table`);
      skipped.push(slug);
      continue;
    }

    const periodMap = lookup.get(reg);
    if (!periodMap) {
      console.warn(`  [SKIP] ${slug} — region ${reg} not found in CSV`);
      skipped.push(slug);
      continue;
    }

    let coveredYears = 0;
    for (const periodStart of PERIOD_STARTS) {
      const dmdtda = periodMap.get(periodStart);
      if (dmdtda === undefined) {
        console.warn(`  [WARN] ${slug} reg=${reg} period ${periodStart} missing from CSV`);
        continue;
      }
      for (let year = periodStart; year < periodStart + 5; year++) {
        if (year >= 2020) continue;
        rows.push({
          time: `${year}-01-01T00:00:00Z`,
          place_id,
          value: dmdtda,
          method: "geodetic",
          source_id: dataset_id,
        });
        coveredYears++;
      }
    }
    console.log(`  ${slug.padEnd(20)} reg=${reg}  ${coveredYears} annual rows`);
  }

  if (rows.length === 0) {
    console.log("\nNo rows to insert.");
    process.exit(0);
  }

  // 6. Upsert — idempotent; coexists with icimod-mb-preliminary rows because
  //    source_id differs. The conflict key is (time, place_id, method, source_id).
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

  console.log(`\nDone. Upserted ${rows.length} rows for ${glacierSlugs.length - skipped.length} glaciers.`);
  if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.join(", ")}`);
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
