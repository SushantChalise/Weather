# Infrastructure & Storage Architecture

**Status:** active. Adopted 2026-05-10 after Vercel Hobby Blob "Advanced Operations" cap (2k/mo) tripped, blocking writes for both the existing Himawari pipeline and the new Round 16 glacier/lake transforms. The Forever Free path uses Cloudflare Pages + GitHub-as-data-layer + jsDelivr CDN. No payment method anywhere in the stack.

This document is canonical. If anything in `BUILD_PLAN.md` / `ARCHITECTURE.md` / `SETUP.md` conflicts with this file, this file wins; update the others to match.

---

## Stack at a glance

| Layer | Service | Free? | Card needed? | Hard limits we respect |
|---|---|---|---|---|
| Next.js hosting (Workers via OpenNext) | Cloudflare Pages | yes | no | 100k Functions requests/day; static asset requests are unmetered |
| Postgres | Neon free tier | yes | no | 0.5 GB; compute autoscales/sleeps |
| Slow static data (glacier/lake polygons, tiles, etc.) | `/public/` in **`Weather`** repo, Brotli-precompressed | yes | no | per-file ≤ 20 MiB (Pages cap is 25); ≤ 15k files; ≤ 250 MB total bundle |
| High-frequency data (Himawari frames) | **`weather-data-mirror`** separate public repo, written by GitHub Actions, served via jsDelivr | yes | no | per-file ≤ 5 MB; working tree ≤ 100 MB; tiles only (no monolithic PNGs); WebP not PNG |
| Cron writers | GitHub Actions (public repo, unlimited standard runners) | yes | no | standard workflow timeouts |

No vendor lock-in: every component has an obvious migration path (Pages → Netlify; jsDelivr → Statically/unpkg; GitHub → any Git host with raw-URL access).

---

## Why this stack

### Problem statement

The Himalayan Atlas is a public, read-heavy, open-data product. Storage providers (Vercel Blob, Cloudflare R2, AWS S3, Backblaze B2, Wasabi) all gate writes behind a payment method as anti-abuse, even when the free tier would cover usage. The project owner does not currently have a debit/credit card. Vercel Hobby Blob's 2k advanced-ops/month cap was hit by the Himawari pipeline within 19 hours of store creation.

### Insight

For *public* read-heavy data, paid object storage is not required. Open public CDNs (jsDelivr) backed by Git hosts (GitHub) provide free, edge-cached delivery at billions-of-requests-per-day scale with no payment method required. Pair this with Cloudflare Pages (free Next.js hosting, no card) and the entire infrastructure stack runs on $0 indefinitely.

### Trade-off accepted: latest mirror, not archive

This architecture serves the **latest publishable state** of high-frequency data plus a short rolling history. It is **not** a full historical archive. Anyone wanting Himawari frames from 6 months ago should fetch from JMA directly. Anyone wanting glacier outlines from the 1980s should fetch from the canonical source (ICIMOD RDS, GLIMS, RGI). The data mirror is for serving today's and yesterday's frames to today's users, not for cold-archive querying. Monthly orphan-rebases on the data branch keep its size bounded.

---

## Repo split

We use **two public GitHub repos**:

| Repo | Purpose | Cloudflare Pages subscribed? |
|---|---|---|
| `SushantChalise/Weather` | Next.js app source. Commits = code changes. | yes — every push to `main` triggers a deploy |
| `SushantChalise/weather-data-mirror` | Generated public data mirror. Commits = cron output. | **no** — Cloudflare does not watch this repo, so cron pushes don't burn build minutes |

This separation is the single most important guardrail. Without it, every 30-min Himawari cron would trigger a full Cloudflare Pages rebuild.

### `weather-data-mirror` layout

```
weather-data-mirror/
├── README.md                ← scope: "latest mirror, not archive"
├── LICENSE                  ← CC0 (mirroring public-domain sources)
├── .github/workflows/
│   └── compact.yml          ← monthly orphan-rebase to bound repo size
└── himawari/
    └── latest/
        ├── manifest.json
        ├── preview.webp
        ├── metadata.json
        └── tiles/
            └── {z}/{x}/{y}.webp
```

The `data-mirror` branch is the live branch. `main` on this repo stays minimal (just the README + LICENSE + workflows).

---

## High-frequency data flow (Himawari)

### Write path (every 30 min)

GitHub Actions cron in `Weather` repo (existing pipeline, modified):

1. Download Himawari-9 B13 source from JMA (free).
2. Render the WebP tile pyramid (Nepal bbox, z=0..2 = 21 tiles per frame).
3. Compute SHA-256 over the rendered bytes; if identical to the previous frame's SHA in the manifest, skip the push entirely.
4. Otherwise, clone the `data-mirror` branch of `weather-data-mirror`, write the new tiles + preview + metadata, update `manifest.json`, commit, and push.
5. Call jsDelivr's purge endpoint **for the manifest only**, not the tiles:
   ```
   GET https://purge.jsdelivr.net/gh/SushantChalise/weather-data-mirror@data-mirror/himawari/latest/manifest.json
   ```
6. Tiles are commit-pinned and cached forever; only the manifest needs invalidation.

### Manifest contract

Canonical shape (frontend depends on this):

```json
{
  "frame_time_utc": "2026-05-10T06:00:00Z",
  "commit_sha": "abc123...",
  "tile_template": "https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@abc123/himawari/latest/tiles/{z}/{x}/{y}.webp",
  "preview": "https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@abc123/himawari/latest/preview.webp",
  "generated_at": "2026-05-10T06:18:00Z",
  "source": "Himawari-9 B13",
  "previous_manifest": "https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@<previous_sha>/himawari/latest/manifest.json"
}
```

`commit_sha` powers the commit-pinned `tile_template`. `previous_manifest` is the fallback the frontend uses if a fresh fetch fails.

### Read path (frontend)

`MapHimawariOverlay` follows this protocol:

1. Fetch the manifest at the **branch alias** with `Cache-Control: no-store` and a 5-second timeout:
   ```
   https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@data-mirror/himawari/latest/manifest.json
   ```
2. On success: render tiles from `tile_template` (commit-pinned, cached forever). Stash the manifest in `sessionStorage`.
3. On failure (network, 5xx, propagation lag): fall back to the last successful manifest from `sessionStorage`. Show a faint "frame from N min ago" pill.
4. On full failure (no manifest available): hide the cloud overlay. Do not render a broken layer.

### Honest freshness claim

> Cloud overlay is usually live within ~1–2 min of the cron run; falls back to the previous frame if jsDelivr propagation lags.

Not "guaranteed 5-min TTL". jsDelivr's branch alias caching can be up to 12 h without a purge call, so we always purge the manifest on push. Tiles are immutable per commit so they never need invalidation.

---

## Slow static data flow (glacier/lake polygons)

Glacier and glacial-lake GeoJSON are decadal/quasi-static. They live in `/public/` of the `Weather` repo as Brotli-precompressed assets:

```
public/glaciers/hkh/1990.geojson.br
public/glaciers/hkh/2000.geojson.br
public/glaciers/hkh/2010.geojson.br
public/glaciers/hkh/2020.geojson.br
public/glacial-lakes/current.geojson.br
public/glacial-lakes/risky.geojson.br
```

Cloudflare Pages serves them from its edge with no per-request quota. They ship with each app deploy.

### Build-time guardrails

`scripts/check/public-asset-budget.ts`, wired into `npm run prebuild`:

```
fail if any file in /public exceeds 20 MiB
fail if total /public bundle exceeds 250 MB
fail if total /public file count exceeds 15,000
warn at 80% of any threshold
```

If a file approaches 20 MiB, the response is to **simplify further**, **split by region**, or **switch to PMTiles** — not to bypass the check.

---

## Cloudflare Pages quota discipline

Pages **static asset** requests are unmetered on the free plan; **Functions** (= Workers invocations behind dynamic routes) count against the Workers free quota of **100k requests/day**.

To stay well under that:

- **Marketing pages** (`/`, `/about`, `/methodology`, `/glossary`) — fully static. No Functions.
- **`/places/[slug]`, `/charts/*`** — SSR with `export const revalidate = 600` (10 min) so each route is rebuilt at most every 10 min and the edge serves repeats. With ~30 places × 6 = 180 server invocations per hour = ~4,300/day. Safe.
- **Chatty `/api/*` routes** — bumped `s-maxage` to ≥ 300s so Cloudflare's edge handles repeat reads.
- **Always-dynamic `/api/*` routes** — keep fast and short. None of them do unbounded queries; all have explicit upstream timeouts.

Dynamic page audit happens during the migration; the actual static/dynamic split is reported in the migration PR description.

---

## Database driver swap (one-time, part of migration)

Workers run on V8 isolates, not Node. The `pg` driver uses TCP sockets and won't load. The migration swaps:

```diff
- import { drizzle } from "drizzle-orm/node-postgres";
- import { Pool } from "pg";
+ import { drizzle } from "drizzle-orm/neon-http";
+ import { neon } from "@neondatabase/serverless";

- export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
- export const db = drizzle(pool, { schema });
+ export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
```

Drizzle's query API is identical. Every existing route that imports `db` keeps working without edits.

`scripts/db/migrate.ts` keeps `pg` — it runs locally in Node, never on Workers, and the bare-metal driver is fine for one-off migrations.

`scripts/ingestion/*` are GitHub Actions Node workloads — also fine on `pg`. The new Himawari uploader does not need DB access.

---

## Edge-runtime cleanup

`src/app/og/route.tsx` currently exports `runtime = "edge"`. OpenNext for Cloudflare doesn't support edge-runtime routes in the same bundle as Node-runtime routes. Solution: drop the line. `next/og`'s `ImageResponse` works fine on the Node runtime; first request is ~50 ms slower, fine for an OG image route.

No other route uses the edge runtime.

---

## Mode A vs Mode B (explicit decision)

| | Mode A (adopted) | Mode B (rejected) |
|---|---|---|
| Scope | Latest mirror + ~24–48 frames rolling | Every frame retained forever |
| Repo growth | Bounded by monthly orphan-rebase | Unbounded; eventually >5 GB |
| Reproducibility | Last 24–48 frames + canonical sources | Full git-history archive |
| Cost | $0 | $0 today, requires real archive storage in <12 months |
| Right tool? | yes for current scope | no — would need real object/archive store |

Adopted: **Mode A**. Reflected in the data-repo README and any external citations of the data.

---

## What this means for active work

### Round 16 (HKH Cryosphere Atlas)

- Glacier + lake transforms write to `/public/glaciers/...` and `/public/glacial-lakes/...`, not Vercel Blob.
- `/atlas/30-years` fetches from those `/public` paths.
- The pipeline scripts run as one-off `npm run transform:*` commands locally; output is committed to the `Weather` repo as part of a normal PR.
- Round 16 can ship without R2.

### Existing Himawari pipeline

- Migrated from Vercel Blob to the new commit-and-purge flow.
- The main project's `HIMAWARI_STORE_ID` and `BLOB_READ_WRITE_TOKEN` env vars are dropped from `.env.local`, Cloudflare Pages env, and GitHub Actions secrets.
- The `weather-data-mirror` repo gets a `WEATHER_DATA_MIRROR_TOKEN` (a fine-grained PAT scoped to push to that repo only), set as a GitHub Actions secret on the `Weather` repo so the cron can push.

### Cloudflare Pages project

- `wrangler.jsonc` + `open-next.config.ts` checked into `Weather`.
- Project is created via `wrangler pages project create himalayan-atlas`.
- Env vars set via `wrangler pages secret put` for: `DATABASE_URL`, `FIRMS_MAP_KEY`, `CDS_API_KEY`, `CDS_API_URL`, `ICIMOD_USERNAME`, `ICIMOD_PASSWORD`. (`HIMAWARI_STORE_ID` and `BLOB_*` are no longer needed.)
- DNS: project ships at `himalayan-atlas.pages.dev` initially. Custom domain follows when ready.

### Vercel project

Stays connected during the migration as a fallback. After the Cloudflare deploy is verified working end-to-end, the Vercel project gets archived (not deleted) as a safety net for ~30 days, then removed.

---

## Risks and what we'd do about each

| Risk | Likelihood | Mitigation |
|---|---|---|
| jsDelivr CDN outage | low | frontend manifest fallback to last `sessionStorage` value |
| GitHub raw rate-limit hit | very low (jsDelivr is the actual end-user CDN) | if jsDelivr falls back to GitHub raw mid-incident, frontend keeps showing last frame |
| Cloudflare Pages outage | low | static export to GitHub Pages as DR plan (not currently set up) |
| Cron push to `data-mirror` fails (stuck PAT, push conflict) | medium | workflow alerts + manual purge; previous frame keeps serving |
| jsDelivr enforces tighter limits on us | low | switch to Statically.io (same model, different host) |
| Data mirror repo grows past jsDelivr's 150 MB recommendation | low if Mode A | monthly orphan-rebase is already in the workflow |
| Cloudflare Workers free quota exhaustion (100k Functions/day) | low at current traffic | every dynamic route has revalidate ≥ 5 min; chatty endpoints have edge-cache headers |
| Future need for sub-minute live data | not now | introduce a Worker that streams from upstream APIs directly; bypasses the data mirror |

---

## Migration sequence (currently in progress)

Tracked in issue [TBD — will be created when this doc is committed]. PRs:

1. **`Weather`** — single PR doing: add `wrangler.jsonc` + `open-next.config.ts`, drop edge runtime from `og`, swap `pg` → `@neondatabase/serverless`, add `scripts/check/public-asset-budget.ts`, replace Himawari uploader with commit-and-purge, add `MapHimawariOverlay` fallback logic, add Cloudflare Pages-specific build/deploy scripts.
2. **`weather-data-mirror`** — bootstrap via `gh repo create` + initial scaffold (README, LICENSE, `.github/workflows/compact.yml`, empty `himawari/latest/`).
3. **Cloudflare Pages project** — created via `wrangler pages project create`, env vars set via CLI.
4. **GitHub Actions secrets** — `WEATHER_DATA_MIRROR_TOKEN` (scoped PAT) added via `gh secret set`.
5. **DNS** — kept on Vercel until Cloudflare Pages deploy is verified live.

Once the migration PRs land and the Cloudflare deploy is green, this doc gets a "live" timestamp and the `BLOB_*` env vars are cleared.
