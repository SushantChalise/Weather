# ICIMOD RDS Metadata Scraper

Scrapes metadata from the [ICIMOD Regional Database System](https://rds.icimod.org/) and builds a local catalog with `enableDownload` status and external source links for each dataset.

## Key insight: ICIMOD is a catalog, not a CDN

ICIMOD RDS is a SvelteKit SPA that mirrors a GeoNetwork 4 catalog.
Most datasets have `enable_download: false` and point to external canonical sources:

| Dataset | metadataId | enableDownload | Canonical source |
|---------|-----------|----------------|-----------------|
| Glacier mass balance — Rikha Samba | 1972483 | false | [WGMS](https://wgms.ch/data_databaseversions/) |
| Yala glacier mass balance | 1972482 | false | [WGMS](https://wgms.ch/data_databaseversions/) |
| GLOF database of High Mountain Asia | 1973283 | true | ICIMOD-hosted, login required |
| Status of Glaciers in HKH | 9359 | true | ICIMOD-hosted, login required |
| Micromet station: Yala 1 | 1972412 | true | ICIMOD-hosted, login required |

Across the top-20 datasets: 14 have `enableDownload: true` (ICIMOD-hosted, need login),
and 6 have `enableDownload: false` (external-only, links in `externalSources`).

Datasets with `enable_download: true` use a login-gated download wizard:
`/download/flow/{uuid}` -> `POST /geoapi/datasets/{uuid}/download/direct/confirm/`.
The actual file is served from the `geoapi` backend with a JWT token from `localStorage`,
so anonymous fetch cannot retrieve it. Use `--with-login` to authenticate.

## Prerequisites

1. Catalog must be generated first:
   ```
   node scripts/scrape-icimod-rds.mjs
   ```
   This writes `output/icimod-rds-all.json` which the scraper reads.
   The scraper also checks `scripts/output/icimod-rds-all.json` as a fallback.

2. (Optional) For ICIMOD-hosted downloads only: an ICIMOD RDS account.

## Running

```bash
# Scrape metadata for the top 20 datasets (default)
npm run icimod:download

# Scrape specific datasets by metadata ID
npm run icimod:download -- --ids 1972483,1972482,1973283

# Preview the dataset list without making any network calls
npm run icimod:download -- --dry-run

# Authenticate and attempt actual file downloads where available
npm run icimod:download -- --with-login
```

## Credentials (only needed for --with-login)

Add to `.env.local` in the project root:

```env
ICIMOD_USERNAME=your@email.com
ICIMOD_PASSWORD=yourpassword
```

The `.env.local` file is gitignored.

## Output

All files are saved under `data/icimod/` in the project root:

```
data/icimod/
|-- manifest.json              # full catalog with metadata, resources, download status
|-- 1973283/
|   `-- glof-database.zip      # only for enable_download:true datasets with --with-login
`-- 9359/
    `-- glaciers-hkh.zip
```

`data/` is gitignored -- nothing here is committed.

### Manifest shape

```json
{
  "1972483": {
    "metadataId": "1972483",
    "uuid": "c12cb336-f9c0-4096-8852-ba810e95e417",
    "title": "Glacier mass balance data from Rikha Samba, Nepal",
    "enableDownload": false,
    "resources": [
      { "url": "https://wgms.ch/data_databaseversions/", "protocol": "WWW:LINK", "name": "World Glacier Monitoring Service", "description": "..." }
    ],
    "downloads": [],
    "externalSources": [
      { "url": "https://wgms.ch/data_databaseversions/", "name": "World Glacier Monitoring Service" }
    ],
    "scrapedAt": "2026-05-10T..."
  }
}
```

## How metadata is fetched (no Playwright)

The scraper uses plain `fetch` only:

1. `GET /Home/DataDetail?metadataId={N}` -- follows the 302 redirect to `/metadata/{uuid}`
2. `GET /metadata/{uuid}/__data.json?x-sveltekit-invalidated=01` -- returns the SvelteKit
   server-side rendering payload as clean JSON (no HTML parsing needed)
3. Parses the de-duplicated reference array in the payload to reconstruct the metadata object

This works because SvelteKit exposes `__data.json` on every SSR route.
No headless browser is needed for catalog scraping.

## Playwright removed

Playwright is **not** used by this scraper. The `playwright` devDependency is retained
for `npm run test:e2e` but has no role here.

## Idempotency

Re-running is safe:
- The manifest is read before processing each dataset.
- Files that already match the manifest sha256 are skipped.
- `externalSources` and metadata are refreshed on every run.
