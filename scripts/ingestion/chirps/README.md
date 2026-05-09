# CHIRPS Ingestion

Daily gauge-blended precipitation (~0.05°) for HKH places, loaded into `obs_weather_daily`. Corrects ERA5 orographic bias in mountain regions.

## Setup

No auth required — direct HTTPS pull from UCSB CHC. Registration encouraged at https://chc.ucsb.edu/data/chirps.

## Run

```bash
python scrape.py --start 2020-01-01 --end 2020-12-31
python validate.py
python transform.py
python load.py
```

## Status

Stub — not yet implemented. Unblocks Hour 7 of BUILD_PLAN.md (precipitation backbone).
