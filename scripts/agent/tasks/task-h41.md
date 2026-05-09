# task-h41 — Historical Event Archive scaffolding

## Branch name
feat/event-archive

## PR title
feat(events): Historical Event Archive page scaffolding

## What to build

The `events_historical` table already exists in the DB schema (src/db/schema.ts).
Build the UI scaffold for the Historical Event Archive.

### Routes to create

**`src/app/events/page.tsx`** — Event listing page
- Server Component
- For now: render a static list of 3 seeded events (hardcoded — DB query comes later)
- Layout: masonry or grid of EventCard components
- Each card links to `/events/[slug]`

**`src/app/events/[slug]/page.tsx`** — Event detail page
- Server Component
- For now: look up event from a static registry (same 3 events)
- `notFound()` if slug not found
- Render full event detail

### Components to create

**`src/components/events/event-card.tsx`**:
```typescript
type EventCardProps = {
  slug: string;
  name: string;
  eventClass: "avalanche" | "flood" | "drought" | "earthquake" | "fire" | "cyclone" | "other";
  timeStart: string;   // ISO date string
  timeEnd?: string;
  summary: string;     // 1-2 sentence summary
  affectedPlaces?: string[];  // place names
};
```
Visual:
- Event class shown as a coloured badge (avalanche=blue, flood=teal, drought=amber, earthquake=red)
- Date range formatted: "15–16 October 2014"
- Summary text (2 lines max, ellipsis overflow)
- Affected places as small tags

**`src/components/events/event-detail.tsx`**:
- Event header (name, class badge, date range)
- Affected places linked to their place pages
- Summary paragraph (full)
- Placeholder section: "Weather data on this date" (wireframe)
- Placeholder section: "ICIMOD hazard data" (wireframe)
- Source attribution section (list of source datasets with CitationPill)

### Static event data

Create `src/data/events.ts` with 3 hardcoded events:

```typescript
export const HISTORICAL_EVENTS = [
  {
    slug: "annapurna-blizzard-2014",
    name: "2014 Annapurna Blizzard",
    eventClass: "avalanche" as const,
    timeStart: "2014-10-14T00:00:00Z",
    timeEnd: "2014-10-16T00:00:00Z",
    affectedPlaces: ["abc", "poon-hill", "jomsom"],
    summary: "A sudden blizzard hit the Annapurna Circuit in mid-October 2014, killing at least 39 trekkers and guides — one of Nepal's deadliest trekking accidents.",
    evidence: { deaths: 39, source: "Nepal Red Cross" },
  },
  {
    slug: "gorkha-earthquake-weather-2015",
    name: "Post-Gorkha Earthquake — Monsoon Season 2015",
    eventClass: "earthquake" as const,
    timeStart: "2015-04-25T00:00:00Z",
    timeEnd: "2015-09-30T00:00:00Z",
    affectedPlaces: ["kathmandu", "langtang"],
    summary: "The April 25, 2015 Gorkha earthquake (Mw 7.8) triggered thousands of landslides. The subsequent 2015 monsoon season exacerbated damage to already-destabilised hillsides.",
    evidence: { magnitude: 7.8, source: "USGS" },
  },
  {
    slug: "melamchi-flood-2021",
    name: "2021 Melamchi Flood",
    eventClass: "flood" as const,
    timeStart: "2021-06-15T00:00:00Z",
    timeEnd: "2021-06-16T00:00:00Z",
    affectedPlaces: ["kathmandu"],
    summary: "A glacial lake outburst flood (GLOF) in the Melamchi River Valley on 15 June 2021 destroyed the Melamchi Water Supply Project intake and swept away homes.",
    evidence: { glof: true, source: "ICIMOD" },
  },
];
```

### Navigation

Add "Events" to the main navigation (same component edited in task-h3 if merged).
Link: `/events`

### Metadata

In `src/app/events/page.tsx`:
```typescript
export const metadata = {
  title: "Historical Climate Events — Himalayan Atlas",
  description: "Archive of significant weather and climate events in the Himalayas, with linked meteorological data.",
};
```

## Files to create
- `src/app/events/page.tsx`
- `src/app/events/[slug]/page.tsx`
- `src/components/events/event-card.tsx`
- `src/components/events/event-detail.tsx`
- `src/data/events.ts`

## Files to modify
- Navigation component (add Events link)

## Acceptance gate
- `npx tsc --noEmit` passes
- All 5 new files exist
- `src/data/events.ts` has 3 events with correct typing
- Event detail renders affectedPlaces as links to /places/[slug]
- No `any` types
