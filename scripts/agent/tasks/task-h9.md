# task-h9 — "Now vs Normal" anomaly badge on corridor cards

## Branch name
feat/now-vs-normal-badge

## PR title
feat(ui): add Now vs Normal anomaly badge to corridor cards

## Context

The existing corridor cards (src/components/decision/corridor-card.tsx and
src/components/decision/live-corridor-cards.tsx) show current weather for each
trekking destination. We need to add a "now vs 30-year normal" anomaly badge.

## What to build

**`src/components/ui/anomaly-badge.tsx`** — a small badge showing temperature anomaly:

```typescript
type AnomalyBadgeProps = {
  delta: number;        // degrees difference from normal (positive = warmer, negative = cooler)
  unit?: string;        // default "°C"
  period?: string;      // default "30-yr avg"
  compact?: boolean;    // if true, just show "+2.3°" — if false, show "+2.3° above 30-yr avg"
};
```

Visual:
- Positive delta (warmer than normal): warm orange/amber text — use `#C45B4A` (anomaly colour from DESIGN.md)
- Negative delta (cooler): blue-500 text
- Near zero (|delta| < 0.5): neutral text
- Format: "+2.3°C above 30-yr avg" (full) or "+2.3°" (compact)
- Size: small (12px), inline, with an up/down arrow

**Anomaly data source:**
For now, use the Open-Meteo API's `temperature_2m_mean` for the current month
and compare to the `climate_weather_code` or use their historical endpoint.

Actually — simpler approach that works TODAY without ERA5:
Open-Meteo provides `temperature_2m_mean` and also has a `historical` endpoint.
Use their `/v1/climate` endpoint which provides 30-year normals for any location.

**`src/app/api/anomaly/route.ts`** — new API route:
```typescript
// GET /api/anomaly?lat=X&lon=Y
// Returns: { delta: number, normal: number, current: number, month: string }
```

Fetch from Open-Meteo:
1. Current month's temperature: use the existing /api/weather or Open-Meteo forecast
2. 30-year normal: Open-Meteo climate endpoint:
   `https://climate-api.open-meteo.com/v1/climate?latitude=X&longitude=Y&start_date=1991-01-01&end_date=2020-12-31&monthly=temperature_2m_mean&models=EC_Earth3P_HR`
   Then average the values for the current month (Jan=1, Feb=2, etc.)
3. delta = current - normal

Cache with `revalidate = 3600` (1 hour is fresh enough).

**Wire into corridor cards:**
Read `src/components/decision/corridor-card.tsx` to understand its data shape.
Add `anomaly?: { delta: number; normal: number }` to whatever type the card uses.

In `src/components/decision/live-corridor-cards.tsx`, call `/api/anomaly?lat=X&lon=Y` 
alongside the existing weather fetch (use Promise.allSettled so a failed anomaly doesn't 
break the card). Pass anomaly data down to each corridor card.

Render `<AnomalyBadge delta={anomaly.delta} />` below the temperature in the card.

## Files to create
- `src/components/ui/anomaly-badge.tsx`
- `src/app/api/anomaly/route.ts`

## Files to modify
- `src/components/decision/corridor-card.tsx` (accept + render anomaly)
- `src/components/decision/live-corridor-cards.tsx` (fetch + pass anomaly)

## Error handling
If the Open-Meteo climate API is slow or unavailable, the anomaly badge simply
doesn't render — use optional chaining and never throw for missing anomaly data.

## Acceptance gate
- `npx tsc --noEmit` passes
- `src/components/ui/anomaly-badge.tsx` exists with correct props type
- `src/app/api/anomaly/route.ts` exists
- No `any` types
- AnomalyBadge renders nothing (not an error) when delta is undefined
