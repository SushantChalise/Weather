#!/usr/bin/env python3
"""Stage 2 — Validate: check raw ERA5-Land files before any DB writes.

Runs checks and exits non-zero if any fail so the pipeline aborts
before bad data reaches Postgres.

Requires CDS_API_KEY to be set in the environment and dataset terms
accepted at https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land

Usage: python validate.py
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
