# Open-Meteo Air Quality Ingestion

Pulls the last 30 days of hourly air quality data (PM2.5, PM10, NO2) from the [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) — sourced from the CAMS European atmospheric model at ~10 km resolution — aggregates it to daily means, and upserts into `obs_weather_daily` for 6 cities: Kathmandu, Pokhara, Lukla, Namche Bazaar, Jomsom, and Chitwan.

## Run

```bash
npm run db:openmeteo-aq
```

Requires `DATABASE_URL` in `.env.local`. No API key needed.

## Status

Working — rolling 30-day window (yesterday back 31 days), scheduled daily at 08:00 UTC.
