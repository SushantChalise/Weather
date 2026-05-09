# task-0c — Seed 10 Tier-1 places into `places` table

## Branch name
feat/seed-tier1-places

## PR title
feat(db): seed 10 Tier-1 places with PostGIS geometries

## What to build

Create `scripts/db/seed-places.ts` — a one-shot TypeScript script that upserts
the 10 Tier-1 places into the `places` table using Drizzle ORM.

The `places` table schema (from src/db/schema.ts):
- id: serial PK
- slug: text UNIQUE NOT NULL
- name: text NOT NULL
- class: text NOT NULL (valid values: 'trek_destination' | 'glacier' | 'peak' | 'lake' | 'river_point' | 'city')
- country: text NOT NULL
- region: text (nullable)
- geom: geometry (insert as WKT point via raw SQL: ST_GeomFromText('POINT(lon lat)', 4326))
- altitude_m: integer (nullable)
- metadata: jsonb (nullable)

## Places to seed

```typescript
const PLACES = [
  // Cities
  { slug: "kathmandu",   name: "Kathmandu",              class: "city",             country: "Nepal", region: "Bagmati",    lat: 27.7124, lon: 85.3113, alt: 1400 },
  { slug: "pokhara",     name: "Pokhara",                class: "city",             country: "Nepal", region: "Gandaki",    lat: 28.2095, lon: 83.9595, alt: 827  },
  // Trek destinations
  { slug: "ebc",         name: "Everest Base Camp",      class: "trek_destination", country: "Nepal", region: "Koshi",      lat: 28.0072, lon: 86.8594, alt: 5364 },
  { slug: "abc",         name: "Annapurna Base Camp",    class: "trek_destination", country: "Nepal", region: "Gandaki",    lat: 28.5319, lon: 83.8786, alt: 4130 },
  { slug: "poon-hill",   name: "Poon Hill",              class: "trek_destination", country: "Nepal", region: "Gandaki",    lat: 28.3994, lon: 83.6908, alt: 3210 },
  { slug: "langtang",    name: "Langtang Village",       class: "trek_destination", country: "Nepal", region: "Bagmati",    lat: 28.2128, lon: 85.5150, alt: 3430 },
  { slug: "jomsom",      name: "Jomsom",                 class: "trek_destination", country: "Nepal", region: "Gandaki",    lat: 28.7833, lon: 83.7333, alt: 2720 },
  { slug: "chitwan",     name: "Chitwan National Park",  class: "trek_destination", country: "Nepal", region: "Bagmati",    lat: 27.5372, lon: 84.4479, alt: 150  },
  // Trail entry points (classified as trek_destination for now)
  { slug: "lukla",       name: "Lukla",                  class: "trek_destination", country: "Nepal", region: "Koshi",      lat: 27.6868, lon: 86.7294, alt: 2860 },
  { slug: "namche",      name: "Namche Bazaar",          class: "trek_destination", country: "Nepal", region: "Koshi",      lat: 27.8069, lon: 86.7140, alt: 3440 },
];
```

## Implementation notes

- Use `db.execute(sql`INSERT INTO places ... ON CONFLICT (slug) DO UPDATE SET ...`)` for upserts
- For the geometry column, use raw SQL: `ST_GeomFromText('POINT(${lon} ${lat})', 4326)`
- Import `db` from `src/db/client.ts` — but the script runs from `scripts/` so use relative path
- Load env with `config({ path: '.env.local' })` from dotenv (already in package.json)
- The script should print each inserted slug and a final count

## Script runner

Add to package.json scripts:
```json
"db:seed-places": "tsx scripts/db/seed-places.ts"
```

## Files to create/modify
- `scripts/db/seed-places.ts` (new)
- `package.json` (add db:seed-places script)

## DO NOT run the seed script in CI. It requires DATABASE_URL.

## Acceptance gate (verifiable by type check)
- `npx tsc --noEmit` passes with zero errors
- `scripts/db/seed-places.ts` exists and uses Drizzle correctly
- package.json has `db:seed-places` script
