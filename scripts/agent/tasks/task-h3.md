# task-h3 — First place page /places/[slug]

## Branch name
feat/place-page-template

## PR title
feat(places): add /places/[slug] page with 4-tab template

## What to build

A Next.js App Router dynamic route at `src/app/places/[slug]/page.tsx` that renders
a place detail page with 4 tabs: Now / Now vs Normal / Last 30 Years / Future.

Start with EBC (slug: "ebc") as the reference. The route must work for any slug.

## Architecture

### Route
`src/app/places/[slug]/page.tsx` — Server Component
- Read `slug` from params
- Look up place from DESTINATIONS array (src/data/destinations.ts) — for now, no DB query
- If slug not found: `notFound()`
- Render `PlacePage` with place data

### Layout
`src/app/places/[slug]/layout.tsx` (optional, for metadata)
- Set `<title>` and `<meta description>` using place name

### Components to create

**`src/components/places/place-header.tsx`** — Server Component
- Place name (large, Source Serif 4 display)
- Altitude badge  
- Country/region breadcrumb: Nepal › Koshi › Everest Base Camp
- Coordinates in small text

**`src/components/places/place-tabs.tsx`** — Client Component (`use client`)
- 4 tabs: Now | Now vs Normal | Last 30 Years | Future
- Uses useState for active tab
- Tab panels rendered below

**`src/components/places/tabs/now-tab.tsx`** — Client Component
- Fetches current weather from `/api/weather?lat=X&lon=Y` (the existing API route)
- Shows: temperature, weather condition, wind
- Shows "Last updated: X minutes ago"
- Loading skeleton while fetching
- Error state if fetch fails

**`src/components/places/tabs/now-vs-normal-tab.tsx`** — Server Component (placeholder)
- Static message: "Historical baseline data coming soon — we're ingesting 30 years of ERA5 data."
- Show a wireframe of what the chart will look like (CSS border-dashed box with label)

**`src/components/places/tabs/last-30-years-tab.tsx`** — Server Component (placeholder)
- Static message with wireframe

**`src/components/places/tabs/future-tab.tsx`** — Server Component (placeholder)  
- Static message with wireframe

## Design requirements (from DESIGN.md)

- Mobile-first layout
- Tab bar: horizontal scroll on mobile, fixed on desktop
- Active tab: underline, not background fill
- Font: Inter for UI, no display font needed here
- Colour: neutral palette (no strong colours in chrome)
- Every data number must have a unit
- No orphaned numbers — always labelled

## API route check

The existing `/api/weather` route at `src/app/api/weather/route.ts` accepts `?lat=&lon=` — 
read that file to understand the response shape before building `now-tab.tsx`.

## Navigation

Add a "Places" link to the main navigation if one exists. Read `src/app/layout.tsx` 
and `src/components/` to find the nav component. Add link: `/places/ebc` → "Everest Base Camp" 
as a placeholder until a full places listing exists.

## Files to create
- `src/app/places/[slug]/page.tsx`
- `src/components/places/place-header.tsx`
- `src/components/places/place-tabs.tsx`
- `src/components/places/tabs/now-tab.tsx`
- `src/components/places/tabs/now-vs-normal-tab.tsx`
- `src/components/places/tabs/last-30-years-tab.tsx`
- `src/components/places/tabs/future-tab.tsx`

## Files to modify
- Navigation component (add Places link)

## Acceptance gate
- `npx tsc --noEmit` passes
- `src/app/places/[slug]/page.tsx` exists
- All 4 tab components exist
- No `any` types
