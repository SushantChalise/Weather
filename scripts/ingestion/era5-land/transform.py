#!/usr/bin/env python3
"""Stage 3 — Transform: clean raw ERA5-Land data into rows ready for Postgres.

Reads from ./raw/, writes NDJSON rows to ./transformed/rows.ndjson.
Each row maps 1-to-1 to a Drizzle schema insert.

Requires CDS_API_KEY to be set in the environment and dataset terms
accepted at https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land

Usage: python transform.py
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
