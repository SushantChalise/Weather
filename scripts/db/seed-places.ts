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
  // Peaks
  { slug: "everest",        name: "Mount Everest",       class: "peak", country: "Nepal",    region: "Koshi",      lat: 27.9881, lon: 86.9250, alt: 8848 },
  { slug: "k2",             name: "K2",                  class: "peak", country: "Pakistan", region: "Karakoram",  lat: 35.8825, lon: 76.5133, alt: 8611 },
  { slug: "annapurna-i",   name: "Annapurna I",         class: "peak", country: "Nepal",    region: "Gandaki",    lat: 28.5961, lon: 83.8203, alt: 8091 },
  { slug: "kanchenjunga",  name: "Kanchenjunga",        class: "peak", country: "Nepal",    region: "Mechi",      lat: 27.7025, lon: 88.1475, alt: 8586 },
  { slug: "manaslu",       name: "Manaslu",             class: "peak", country: "Nepal",    region: "Gandaki",    lat: 28.5497, lon: 84.5597, alt: 8163 },
  { slug: "dhaulagiri",    name: "Dhaulagiri",          class: "peak", country: "Nepal",    region: "Gandaki",    lat: 28.6967, lon: 83.4875, alt: 8167 },
  { slug: "lhotse",        name: "Lhotse",              class: "peak", country: "Nepal",    region: "Koshi",      lat: 27.9617, lon: 86.9333, alt: 8516 },
  { slug: "cho-oyu",       name: "Cho Oyu",             class: "peak", country: "Nepal",    region: "Koshi",      lat: 28.0942, lon: 86.6608, alt: 8201 },
  // Lakes
  { slug: "tilicho",       name: "Tilicho Lake",        class: "lake", country: "Nepal",    region: "Gandaki",    lat: 28.6814, lon: 83.8536, alt: 4919 },
  { slug: "phoksundo",     name: "Phoksundo Lake",      class: "lake", country: "Nepal",    region: "Karnali",    lat: 29.1908, lon: 82.9447, alt: 3611 },
  { slug: "rara",          name: "Rara Lake",           class: "lake", country: "Nepal",    region: "Karnali",    lat: 29.5275, lon: 82.0914, alt: 2990 },
  { slug: "gokyo",         name: "Gokyo Lakes",         class: "lake", country: "Nepal",    region: "Koshi",      lat: 27.9528, lon: 86.6928, alt: 4750 },
  { slug: "imja-tsho",     name: "Imja Tsho",           class: "lake", country: "Nepal",    region: "Koshi",      lat: 27.8983, lon: 86.9233, alt: 5010 },
  // River points
  { slug: "koshi-chatara",     name: "Koshi at Chatara",     class: "river_point", country: "Nepal", region: "Koshi",   lat: 26.8214, lon: 87.1639, alt: 140 },
  { slug: "karnali-chisapani", name: "Karnali at Chisapani", class: "river_point", country: "Nepal", region: "Karnali", lat: 28.6450, lon: 81.2711, alt: 200 },
  { slug: "narayani-devghat",  name: "Narayani at Devghat",  class: "river_point", country: "Nepal", region: "Bagmati", lat: 27.7100, lon: 84.4286, alt: 180 },
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
