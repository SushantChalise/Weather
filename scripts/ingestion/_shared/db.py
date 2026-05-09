"""Shared Postgres helpers for ingestion scripts."""

import os
import sys

import psycopg2
import psycopg2.extras


def connect():
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL not set", file=sys.stderr)
        sys.exit(1)
    return psycopg2.connect(url)


def resolve_place_ids(cur, slugs: list[str]) -> dict[str, int]:
    """Return {slug: id} for the given place slugs. Fails if any are missing."""
    if not slugs:
        return {}
    cur.execute("SELECT slug, id FROM places WHERE slug = ANY(%s)", (slugs,))
    mapping = {row[0]: row[1] for row in cur.fetchall()}
    missing = set(slugs) - mapping.keys()
    if missing:
        print(f"Unknown place slugs: {missing}", file=sys.stderr)
        sys.exit(1)
    return mapping


def resolve_dataset_id(cur, slug: str) -> int:
    """Return dataset.id for slug. Fails if not seeded."""
    cur.execute("SELECT id FROM datasets WHERE slug = %s", (slug,))
    row = cur.fetchone()
    if not row:
        print(f"Dataset '{slug}' not found — run seed-datasets first", file=sys.stderr)
        sys.exit(1)
    return row[0]


def upsert_observations(cur, rows: list[dict], batch_size: int = 500) -> int:
    """Batch-upsert into obs_weather_daily. Returns row count."""
    sql = """
        INSERT INTO obs_weather_daily (time, place_id, variable, value, unit, source_id, source_version)
        VALUES %s
        ON CONFLICT (time, place_id, variable, source_id)
        DO UPDATE SET value = EXCLUDED.value, ingested_at = NOW()
    """
    vals = [
        (r["time"], r["place_id"], r["variable"], r["value"], r.get("unit"), r["source_id"], r.get("source_version"))
        for r in rows
    ]
    for i in range(0, len(vals), batch_size):
        psycopg2.extras.execute_values(cur, sql, vals[i : i + batch_size])
    return len(vals)
