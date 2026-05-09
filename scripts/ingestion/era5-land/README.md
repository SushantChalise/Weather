# ERA5-Land Ingestion

Daily aggregates of ERA5-Land reanalysis (temperature, precipitation, snow depth, wind) for HKH places, loaded into `obs_weather_daily`.

## Setup

- Set `CDS_API_KEY` env var (see `CREDENTIALS_SETUP.md` at repo root)
- Accept dataset terms at https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land

## Run

Four stages, run in order:

```bash
python scrape.py --start 2020-01-01 --end 2020-12-31
python validate.py
python transform.py
python load.py
```

## Status

Stub — not yet implemented. Stages exit early. Unblocks Hours 5-6, 8-9, 25-32, 56-60 of BUILD_PLAN.md.
