---
schema: v1
last_updated: "2026-05-09T00:00:00Z"
---

## Open PR

open_pr: 5
open_pr_branch: feat/ingestion-template
open_pr_task: task-0d-0e

## Completed Tasks

- task-0a (Neon Postgres provisioned, DATABASE_URL set)
- task-0b (Drizzle schema migrated: 12 tables, PostGIS, TimescaleDB — PR #4)
- task-0d-0e (ingestion template + Himawari reorg — PR #5, pending merge)

## Task Queue (work through in order)

- [ ] task-0c    Seed 10 Tier-1 places into `places` table
- [ ] task-h3    First place page /places/[slug] — 4-tab template wired to Open-Meteo
- [ ] task-h4    Source attribution component (CitationPill → modal)
- [ ] task-h9    "Now vs Normal" anomaly badge on every corridor card
- [ ] task-h13   Glacier place class + Khumbu scaffold page
- [ ] task-h41   Historical Event Archive (/events + /events/[slug])

## Failures

{}

## Blocked Tasks

[]

## Session Log

- 2026-05-09: PR #4 merged — feat(db): drizzle setup + initial schema
- 2026-05-09: PR #5 created — feat(ingestion): 4-stage template + Himawari reorg
