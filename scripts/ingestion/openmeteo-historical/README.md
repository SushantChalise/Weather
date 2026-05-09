# Open-Meteo Historical Weather Ingestion

Pulls five years of daily weather aggregates (2020-01-01 → 2024-12-31) from the [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) — a free, no-auth service that blends ERA5 reanalysis, CHIRPS precipitation, and ground station data at ~9 km resolution — and upserts them into `obs_weather_daily` for all 30 Tier-1 Himalayan Atlas places. Variables ingested: `temp_2m_mean`, `temp_2m_max`, `temp_2m_min`, `precip`, and `wind_max_10m`.

## Run

```bash
npm run db:openmeteo-historical
```

Requires `DATABASE_URL` in `.env.local`. No API key needed.

## Status

Working — 5-year backfill. Unblocks "Now vs Normal" anomaly calculations across all Tier-1 places.
