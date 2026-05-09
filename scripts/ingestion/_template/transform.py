#!/usr/bin/env python3
"""Stage 3 — Transform: clean raw data into rows ready for Postgres.

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
    # TODO: read raw files and produce rows matching obs_weather_daily schema:
    # {
    #   "time": "2020-01-01T00:00:00Z",
    #   "place_id": 1,
    #   "variable": "temp_2m",
    #   "value": 2.5,
    #   "unit": "degC",
    #   "source_id": 1,
    #   "source_version": "1.0",
    # }
    return rows


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    rows = transform()
    out_path = OUT_DIR / "rows.ndjson"
    with open(out_path, "w") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")
    print(f"Transformed {len(rows)} rows → {out_path}")


if __name__ == "__main__":
    main()
