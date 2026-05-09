# task-h13 — Glacier place class + Khumbu page scaffold

## Branch name
feat/glacier-place-class

## PR title
feat(places): glacier place class, Khumbu seed, glacier page template

## What to build

Three things in one PR:

### 1. Update PlaceClass type

In `src/db/schema.ts`, the `PlaceClass` type already includes 'glacier':
```typescript
export type PlaceClass = "trek_destination" | "glacier" | "peak" | "lake" | "river_point" | "city";
```
This is already correct. No change needed.

### 2. Add Khumbu Glacier to the seed script

In `scripts/db/seed-places.ts` (created in task-0c), add Khumbu Glacier:
```typescript
{ slug: "khumbu-glacier", name: "Khumbu Glacier", class: "glacier", country: "Nepal", region: "Koshi", lat: 27.9667, lon: 86.8333, alt: 4900 },
```
Also add these 3 key HKH glaciers for future work:
```typescript
{ slug: "rikha-samba",   name: "Rikha Samba Glacier",  class: "glacier", country: "Nepal",  region: "Gandaki", lat: 28.8167, lon: 83.5000, alt: 5400 },
{ slug: "yala",          name: "Yala Glacier",          class: "glacier", country: "Nepal",  region: "Bagmati", lat: 28.2333, lon: 85.6167, alt: 5200 },
{ slug: "gangotri",      name: "Gangotri Glacier",      class: "glacier", country: "India",  region: "Uttarakhand", lat: 30.9333, lon: 79.0667, alt: 4000 },
```

### 3. Glacier page template

The place page at `src/app/places/[slug]/page.tsx` (from task-h3) renders a 4-tab layout.
For glacier places, the tabs have different labels and content:

Extend the place page to support a `variant` based on `place.class`:
- `trek_destination` / `city` → tabs: Now | Now vs Normal | Last 30 Years | Future
- `glacier` → tabs: Now | Mass Balance | Area Change | Future

**`src/components/places/tabs/mass-balance-tab.tsx`** — placeholder:
```
Glacier mass balance data is being ingested from ICIMOD and Hugonnet et al. 2021.
Check back soon — Khumbu's 20-year balance record will appear here.
[Wireframe: descending bar chart, label "Cumulative mass balance (m w.e.)"]
```

**`src/components/places/tabs/area-change-tab.tsx`** — placeholder:
```
Glacier outline data from Randolph Glacier Inventory v7 is being processed.
[Wireframe: map outline overlay]
```

**Update `src/app/places/[slug]/page.tsx`:**
- Detect if place class is 'glacier'  
- Pass variant="glacier" to PlaceTabs
- PlaceTabs renders glacier tabs when variant="glacier"

**`src/data/places.ts`** — create a static registry for the app to use before the DB is fully live:
```typescript
// Maps slugs to display data for SSG/SSR fallback
// The DB is the truth; this is a fast fallback for the app layer
export const PLACE_REGISTRY: Record<string, { name: string; class: PlaceClass; lat: number; lon: number; alt: number; country: string; region?: string }> = {
  "khumbu-glacier": { name: "Khumbu Glacier", class: "glacier", lat: 27.9667, lon: 86.8333, alt: 4900, country: "Nepal", region: "Koshi" },
  "rikha-samba": { ... },
  "yala": { ... },
  // All 10 original places + 4 glaciers added above
};
```

## Files to create
- `src/components/places/tabs/mass-balance-tab.tsx`
- `src/components/places/tabs/area-change-tab.tsx`
- `src/data/places.ts` (place registry)

## Files to modify
- `scripts/db/seed-places.ts` (add 4 glacier entries)
- `src/app/places/[slug]/page.tsx` (glacier variant detection)
- `src/components/places/place-tabs.tsx` (glacier tab set)

## Acceptance gate
- `npx tsc --noEmit` passes
- `src/data/places.ts` exists with PLACE_REGISTRY
- `src/app/places/[slug]/page.tsx` handles glacier variant
- `mass-balance-tab.tsx` and `area-change-tab.tsx` exist
- No `any` types
