#!/usr/bin/env python3
"""Stage 4 — Load: upsert transformed rows into Postgres.

Reads ./transformed/rows.ndjson, resolves place slugs to IDs,
and does a batched INSERT … ON CONFLICT DO UPDATE into obs_weather_daily.

Usage: python load.py
"""

import json
import os
import sys
from pathlib import Path

import psycopg2
import psycopg2.extras

TRANSFORMED = Path(__file__).parent / "transformed" / "rows.ndjson"
BATCH_SIZE = 500

DATASET_SLUG = "DATASET_SLUG"  # must match manifest.json + datasets table


def main() -> None:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not set", file=sys.stderr)
        sys.exit(1)

    rows = [json.loads(l) for l in TRANSFORMED.read_text().splitlines() if l.strip()]
    if not rows:
        print("Nothing to load.")
        return

    with psycopg2.connect(db_url) as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM datasets WHERE slug = %s", (DATASET_SLUG,))
        row = cur.fetchone()
        if not row:
            print(f"Dataset '{DATASET_SLUG}' not found in datasets table. Seed it first.", file=sys.stderr)
            sys.exit(1)
        source_id = row[0]

        for r in rows:
            r["source_id"] = source_id

        insert_sql = """
            INSERT INTO obs_weather_daily (time, place_id, variable, value, unit, source_id, source_version)
            VALUES %s
            ON CONFLICT (time, place_id, variable, source_id)
            DO UPDATE SET value = EXCLUDED.value, ingested_at = NOW()
        """
        vals = [
            (r["time"], r["place_id"], r["variable"], r["value"], r.get("unit"), r["source_id"], r.get("source_version"))
            for r in rows
        ]
        for i in range(0, len(vals), BATCH_SIZE):
            psycopg2.extras.execute_values(cur, insert_sql, vals[i : i + BATCH_SIZE])
        conn.commit()

    print(f"Loaded {len(rows)} rows for dataset '{DATASET_SLUG}'.")


if __name__ == "__main__":
    main()
