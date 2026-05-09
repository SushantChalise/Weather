#!/usr/bin/env python3
"""Stage 1 — Scrape: download raw ERA5-Land data from the Copernicus CDS API.

Writes raw files to ./raw/. Does not transform or validate;
validate.py will catch any format surprises.

Requires CDS_API_KEY to be set in the environment and dataset terms
accepted at https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land

Usage: python scrape.py [--start YYYY-MM-DD] [--end YYYY-MM-DD]
"""

import argparse
import sys


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2020-01-01")
    ap.add_argument("--end", default="2020-12-31")
    ap.parse_args()
    print(
        "[era5-land] not yet implemented — set CDS_API_KEY and accept dataset terms"
        " via https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land"
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
