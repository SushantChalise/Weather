# Dataset Ingestion Template

Copy this directory to `scripts/ingestion/<dataset-slug>/` and fill in each stage.

## Stages

| Script | Writes | Description |
|--------|--------|-------------|
| `scrape.py` | `raw/` | Download from upstream source |
| `validate.py` | — | Assert schema, bounds, missing-data threshold |
| `transform.py` | `transformed/rows.ndjson` | Clean → Postgres-ready NDJSON |
| `load.py` | Postgres | Batched upsert into `obs_weather_daily` |

## Run locally

```bash
export DATABASE_URL="postgresql://..."
python scrape.py --start 2020-01-01 --end 2020-12-31
python validate.py
python transform.py
python load.py
```

## GitHub Actions

Add a workflow at `.github/workflows/ingest-<slug>.yml` that runs these stages
in order, with `DATABASE_URL` from GitHub Secrets. See
`.github/workflows/himawari.yml` for a worked example (tile variant).

## `manifest.json` fields

- `slug` — must match `datasets.slug` in Postgres (seed with `scripts/db/seed-datasets.ts`)
- `schedule` — cron expression for GitHub Actions
- `variables` — list of `variable` values written to `obs_weather_daily`
- `places` — list of place slugs this dataset covers
