#!/usr/bin/env python3
"""Stage 4 — Load: upsert transformed ERA5-Land rows into Postgres.

Reads ./transformed/rows.ndjson, resolves place slugs to IDs,
and does a batched INSERT … ON CONFLICT DO UPDATE into obs_weather_daily.

Requires CDS_API_KEY to be set in the environment and dataset terms
accepted at https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land

Usage: python load.py
"""

import sys


def main() -> None:
    print(
        "[era5-land] not yet implemented — set CDS_API_KEY and accept dataset terms"
        " via https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land"
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
