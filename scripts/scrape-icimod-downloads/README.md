# ICIMOD RDS Authenticated Bulk Downloader

Downloads the top-ranked datasets from the [ICIMOD Regional Data Sharing portal](https://rds.icimod.org/) using a logged-in session managed by Playwright.

## Prerequisites

1. An ICIMOD RDS account (register free at https://rds.icimod.org/Account/Register)
2. The catalog must be generated first:
   ```
   node scripts/scrape-icimod-rds.mjs
   ```
   This writes `scripts/output/icimod-rds-all.json` which the downloader reads.

## Setting credentials

Add your credentials to `.env.local` in the project root:

```env
ICIMOD_USERNAME=your@email.com
ICIMOD_PASSWORD=yourpassword
```

**Finding saved passwords in Edge:**
Settings → Profiles → Passwords → search "icimod"

The `.env.local` file is gitignored — credentials will never be committed.

## Running

```bash
# Download the top 20 datasets by score (default)
npm run icimod:download

# Download specific datasets by metadata ID
npm run icimod:download -- --ids 1972483,1972482,1972480

# Preview the dataset list without downloading anything
npm run icimod:download -- --dry-run

# Open a visible browser window (useful for debugging or solving captchas)
npm run icimod:download -- --headed
```

## Where downloads land

All files are saved under `data/icimod/` in the project root:

```
data/icimod/
├── manifest.json              # maps metadataId → { title, files[] }
├── .playwright-state/         # Playwright session cookies (persists login)
├── 1972483/
│   └── dataset-file.zip
└── 1972482/
    └── another-file.tif
```

`data/` is gitignored — nothing here is committed.

## Resuming interrupted runs

The downloader is fully idempotent:
- It checks `manifest.json` before downloading each dataset.
- If a dataset already has entries in the manifest, it is skipped.
- If individual files already exist on disk, they are also skipped.
- Re-run the command at any time to pick up where it left off.

## Troubleshooting

### Session expired
The Playwright persistent context stores session cookies in `data/icimod/.playwright-state`. If the session expires, delete that directory and re-run — the downloader will log in fresh.

### Captcha on login page
```
CAPTCHA DETECTED. Re-run with --headed to solve manually.
```
Run with `--headed` to open a visible browser window. Solve the captcha manually, then the session is cached and subsequent headless runs work without a captcha.

### License-acceptance click-through
Many ICIMOD datasets show a terms-of-use modal before allowing download. The downloader automatically clicks standard "Accept" / "I Agree" buttons. If the modal uses an unusual layout, it logs a warning and skips that file — re-run with `--headed` to handle it manually.

### Unknown download link shape
If no download links are found for a dataset, the downloader logs a warning and records an empty `files: []` entry in the manifest. Inspect the landing page manually at:
```
https://rds.icimod.org/Home/DataDetail?metadataId=<ID>
```

### Wrong credentials
If login succeeds but you still land back on the login page, the portal rejected your credentials. Verify them at https://rds.icimod.org/Account/Login in a normal browser.
