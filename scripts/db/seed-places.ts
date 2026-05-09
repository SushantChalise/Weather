#!/usr/bin/env tsx

/**
 * One-shot seed script: upserts 10 Tier-1 places into the `places` table.
 *
 * Uses Drizzle ORM with raw SQL for the PostGIS geometry column.
 * ON CONFLICT (slug) DO UPDATE makes the script idempotent.
 *
 * Usage:
 *   npm run db:seed-places
 *
 * Requires DATABASE_URL in .env.local.
 */

import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

// Import db AFTER dotenv so DATABASE_URL is already set when client.ts runs.
import { db } from "../../src/db/client";

interface PlaceSeed {
  slug: string;
  name: string;
  class: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  alt: number;
}

const PLACES: PlaceSeed[] = [
  // Cities
  { slug: "kathmandu", name: "Kathmandu",             class: "city",             country: "Nepal", region: "Bagmati",  lat: 27.7124, lon: 85.3113, alt: 1400 },
  { slug: "pokhara",   name: "Pokhara",               class: "city",             country: "Nepal", region: "Gandaki",  lat: 28.2095, lon: 83.9595, alt: 827  },
  // Trek destinations
  { slug: "ebc",       name: "Everest Base Camp",     class: "trek_destination", country: "Nepal", region: "Koshi",    lat: 28.0072, lon: 86.8594, alt: 5364 },
  { slug: "abc",       name: "Annapurna Base Camp",   class: "trek_destination", country: "Nepal", region: "Gandaki",  lat: 28.5319, lon: 83.8786, alt: 4130 },
  { slug: "poon-hill", name: "Poon Hill",             class: "trek_destination", country: "Nepal", region: "Gandaki",  lat: 28.3994, lon: 83.6908, alt: 3210 },
  { slug: "langtang",  name: "Langtang Village",      class: "trek_destination", country: "Nepal", region: "Bagmati",  lat: 28.2128, lon: 85.5150, alt: 3430 },
  { slug: "jomsom",    name: "Jomsom",                class: "trek_destination", country: "Nepal", region: "Gandaki",  lat: 28.7833, lon: 83.7333, alt: 2720 },
  { slug: "chitwan",   name: "Chitwan National Park", class: "trek_destination", country: "Nepal", region: "Bagmati",  lat: 27.5372, lon: 84.4479, alt: 150  },
  // Trail entry points
  { slug: "lukla",     name: "Lukla",                 class: "trek_destination", country: "Nepal", region: "Koshi",    lat: 27.6868, lon: 86.7294, alt: 2860 },
  { slug: "namche",    name: "Namche Bazaar",         class: "trek_destination", country: "Nepal", region: "Koshi",    lat: 27.8069, lon: 86.7140, alt: 3440 },
  // Glaciers
  { slug: "khumbu-glacier", name: "Khumbu Glacier",      class: "glacier", country: "Nepal", region: "Koshi",       lat: 27.9667, lon: 86.8333, alt: 4900 },
  { slug: "rikha-samba",    name: "Rikha Samba Glacier", class: "glacier", country: "Nepal", region: "Gandaki",     lat: 28.8167, lon: 83.5000, alt: 5400 },
  { slug: "yala",           name: "Yala Glacier",        class: "glacier", country: "Nepal", region: "Bagmati",     lat: 28.2333, lon: 85.6167, alt: 5200 },
  { slug: "gangotri",       name: "Gangotri Glacier",    class: "glacier", country: "India", region: "Uttarakhand", lat: 30.9333, lon: 79.0667, alt: 4000 },
];

async function main(): Promise<void> {
  console.log(`Seeding ${PLACES.length} Tier-1 places…\n`);

  for (const place of PLACES) {
    const wkt = `POINT(${place.lon} ${place.lat})`;
    await db.execute(
      sql`
        INSERT INTO places (slug, name, class, country, region, geom, altitude_m)
        VALUES (
          ${place.slug},
          ${place.name},
          ${place.class},
          ${place.country},
          ${place.region},
          ST_GeomFromText(${wkt}, 4326),
          ${place.alt}
        )
        ON CONFLICT (slug) DO UPDATE SET
          name       = EXCLUDED.name,
          class      = EXCLUDED.class,
          country    = EXCLUDED.country,
          region     = EXCLUDED.region,
          geom       = EXCLUDED.geom,
          altitude_m = EXCLUDED.altitude_m
      `,
    );
    console.log(`  ✓ ${place.slug}`);
  }

  console.log(`\nDone. ${PLACES.length} places upserted.`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
