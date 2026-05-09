#!/usr/bin/env python3
"""Stage 3 — Transform: clean raw CHIRPS data into rows ready for Postgres.

Reads from ./raw/, writes NDJSON rows to ./transformed/rows.ndjson.
Each row maps 1-to-1 to a Drizzle schema insert.

Usage: python transform.py
"""

import json
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw"
OUT_DIR = Path(__file__).parent / "transformed"

PLACE_SLUG_TO_ID: dict[str, int] = {}  # populated by load.py via DB lookup
DATASET_ID = 0  # populated by load.py


def transform() -> list[dict]:
    rows: list[dict] = []
    # TODO: read raw CHIRPS .tif / .nc files and produce rows matching obs_weather_daily schema:
    # {
    #   "time": "2020-01-01T00:00:00Z",
    #   "place_id": 1,
    #   "variable": "precip",
    #   "value": 3.2,
    #   "unit": "mm",
    #   "source_id": 1,
    #   "source_version": "v2.0",
    # }
    return rows


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    print("[chirps] not yet implemented — UCSB CHC HTTPS endpoint, no auth needed but registration recommended")


if __name__ == "__main__":
    main()
