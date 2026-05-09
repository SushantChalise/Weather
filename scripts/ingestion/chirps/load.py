#!/usr/bin/env python3
"""Stage 4 — Load: upsert transformed CHIRPS rows into Postgres.

Reads ./transformed/rows.ndjson, resolves place slugs to IDs,
and does a batched INSERT … ON CONFLICT DO UPDATE into obs_weather_daily.

Usage: python load.py
"""

import json
import os
import sys
from pathlib import Path

TRANSFORMED = Path(__file__).parent / "transformed" / "rows.ndjson"
BATCH_SIZE = 500

DATASET_SLUG = "chirps"  # must match manifest.json + datasets table


def main() -> None:
    print("[chirps] not yet implemented — UCSB CHC HTTPS endpoint, no auth needed but registration recommended")


if __name__ == "__main__":
    main()
