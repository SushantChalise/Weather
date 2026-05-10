#!/usr/bin/env tsx

/**
 * ICIMOD RDS Authenticated Bulk Downloader
 *
 * Logs in to https://rds.icimod.org using ICIMOD_USERNAME + ICIMOD_PASSWORD
 * from the environment, then bulk-downloads the top-ranked datasets identified
 * by scripts/scrape-icimod-rds.mjs.
 *
 * Usage:
 *   npm run icimod:download                        # top 20 by score
 *   npm run icimod:download -- --ids 1972483,1972482
 *   npm run icimod:download -- --headed            # visible browser for debugging
 *   npm run icimod:download -- --dry-run           # print dataset list and exit
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

// ─── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const HEADED = args.includes("--headed");
const DRY_RUN = args.includes("--dry-run");
const idsFlag = args.find((a) => a.startsWith("--ids=") || a === "--ids");
let OVERRIDE_IDS: number[] | null = null;
if (idsFlag) {
  const raw =
    idsFlag === "--ids"
      ? args[args.indexOf("--ids") + 1]
      : idsFlag.slice("--ids=".length);
  if (raw) {
    OVERRIDE_IDS = raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const CATALOG_PATH = path.join(
  PROJECT_ROOT,
  "scripts",
  "output",
  "icimod-rds-all.json",
);
const DATA_ROOT = path.join(PROJECT_ROOT, "data", "icimod");
const STATE_DIR = path.join(DATA_ROOT, ".playwright-state");
const MANIFEST_PATH = path.join(DATA_ROOT, "manifest.json");

// ─── Constants ────────────────────────────────────────────────────────────────

const LOGIN_URL = "https://rds.icimod.org/Account/Login";
const LANDING_BASE = "https://rds.icimod.org/Home/DataDetail?metadataId=";
const PROTECTED_CHECK_URL = "https://rds.icimod.org/Account/UserInfo";
const TOP_N_DEFAULT = 20;
const DELAY_BETWEEN_DATASETS_MS = 4000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogRecord {
  id: string;
  title: string;
  landingPage: string;
  ranking: {
    score: number;
    tier: string;
  };
}

interface FileEntry {
  name: string;
  size: number;
  sha256: string;
  url: string;
  downloadedAt: string;
}

interface DatasetManifest {
  title: string;
  files: FileEntry[];
}

interface ManifestFile {
  [metadataId: string]: DatasetManifest;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function loadManifest(): ManifestFile {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      return JSON.parse(
        fs.readFileSync(MANIFEST_PATH, "utf-8"),
      ) as ManifestFile;
    } catch {
      return {};
    }
  }
  return {};
}

function saveManifest(manifest: ManifestFile): void {
  ensureDir(DATA_ROOT);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
}

async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/** Download a file using the session cookies extracted from the Playwright context. */
async function downloadWithCookies(
  url: string,
  destPath: string,
  cookies: Array<{ name: string; value: string; domain: string }>,
): Promise<number> {
  const cookieHeader = cookies
    .filter((c) => url.includes(c.domain.replace(/^\./, "")))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const response = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  if (!response.body) {
    throw new Error(`No response body for ${url}`);
  }

  ensureDir(path.dirname(destPath));
  const fileStream = fs.createWriteStream(destPath);
  await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);

  const stat = fs.statSync(destPath);
  return stat.size;
}

// ─── Catalog loader ───────────────────────────────────────────────────────────

function loadTargetDatasets(): Array<{ id: number; title: string; landingPage: string }> {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(
      `Catalog not found at ${CATALOG_PATH}.\n` +
        `Run: node scripts/scrape-icimod-rds.mjs first.`,
    );
    process.exit(1);
  }

  const raw = JSON.parse(
    fs.readFileSync(CATALOG_PATH, "utf-8"),
  ) as CatalogRecord[];

  if (OVERRIDE_IDS !== null) {
    const idSet = new Set(OVERRIDE_IDS);
    return raw
      .filter((r) => idSet.has(parseInt(r.id, 10)))
      .map((r) => ({
        id: parseInt(r.id, 10),
        title: r.title,
        landingPage: r.landingPage,
      }));
  }

  return raw
    .sort((a, b) => b.ranking.score - a.ranking.score)
    .slice(0, TOP_N_DEFAULT)
    .map((r) => ({
      id: parseInt(r.id, 10),
      title: r.title,
      landingPage: r.landingPage,
    }));
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

import type { BrowserContext } from "playwright";

async function isLoggedIn(context: BrowserContext): Promise<boolean> {
  const page = await context.newPage();
  try {
    await page.goto(PROTECTED_CHECK_URL, {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    const finalUrl = page.url();
    return !finalUrl.includes("/Account/Login");
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

async function login(
  context: BrowserContext,
  username: string,
  password: string,
): Promise<void> {
  const page = await context.newPage();
  try {
    console.log(`  Navigating to login page: ${LOGIN_URL}`);
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });

    const pageTitle = await page.title();
    console.log(`  Page title: ${pageTitle}`);

    // Check for captcha — log clearly and bail with helpful message
    const captchaFrame = page.frameLocator("iframe[src*='recaptcha']");
    const hasCaptcha = await captchaFrame
      .locator("body")
      .isVisible()
      .catch(() => false);
    if (hasCaptcha) {
      console.error(
        "\n  CAPTCHA DETECTED. Re-run with --headed to solve manually.\n" +
          "  The session will be cached after you solve it.\n",
      );
      if (!HEADED) {
        await page.close();
        process.exit(1);
      }
      console.log("  Waiting for you to solve the captcha (up to 2 min)...");
      await page.waitForURL((url) => !url.toString().includes("/Account/Login"), {
        timeout: 120_000,
      });
      return;
    }

    // Fill credentials — try common field name patterns
    const usernameSelectors = [
      'input[name="Username"]',
      'input[name="username"]',
      'input[name="Email"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[id="Username"]',
    ];
    const passwordSelectors = [
      'input[name="Password"]',
      'input[name="password"]',
      'input[type="password"]',
    ];

    let filledUsername = false;
    for (const sel of usernameSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.fill(username);
        filledUsername = true;
        console.log(`  Filled username via selector: ${sel}`);
        break;
      }
    }
    if (!filledUsername) {
      throw new Error(
        "Could not find username field. Run with --headed to inspect the page.",
      );
    }

    let filledPassword = false;
    for (const sel of passwordSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.fill(password);
        filledPassword = true;
        console.log(`  Filled password via selector: ${sel}`);
        break;
      }
    }
    if (!filledPassword) {
      throw new Error(
        "Could not find password field. Run with --headed to inspect the page.",
      );
    }

    // Submit
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
    ];
    let submitted = false;
    for (const sel of submitSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await Promise.all([
          page.waitForNavigation({ timeout: 30_000 }).catch(() => {}),
          el.click(),
        ]);
        submitted = true;
        console.log(`  Submitted via selector: ${sel}`);
        break;
      }
    }
    if (!submitted) {
      throw new Error(
        "Could not find submit button. Run with --headed to inspect the page.",
      );
    }

    const postLoginUrl = page.url();
    console.log(`  Post-login URL: ${postLoginUrl}`);

    if (postLoginUrl.includes("/Account/Login")) {
      throw new Error(
        "Still on login page after submit — credentials may be wrong, or " +
          "the login form structure is different. Run with --headed to debug.",
      );
    }

    console.log(`  Logged in successfully as: ${username}`);
  } finally {
    await page.close();
  }
}

// ─── Download link extraction ─────────────────────────────────────────────────

async function extractDownloadLinks(
  context: BrowserContext,
  metadataId: number,
): Promise<string[]> {
  const landingUrl = `${LANDING_BASE}${metadataId}`;
  const page = await context.newPage();
  const links: string[] = [];

  try {
    await page.goto(landingUrl, { waitUntil: "networkidle", timeout: 30_000 });

    // Handle license/terms modal — click "Accept" if visible
    const acceptSelectors = [
      'button:has-text("Accept")',
      'button:has-text("I Accept")',
      'button:has-text("I agree")',
      'button:has-text("Agree")',
      'input[type="submit"][value*="Accept"]',
      'input[type="submit"][value*="agree"]',
      "a.btn:has-text('Accept')",
    ];
    for (const sel of acceptSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`    Clicking license acceptance: ${sel}`);
        await el.click();
        await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
        break;
      }
    }

    // Extract download links: prefer explicit "Download" anchors, then file-extension links
    const downloadLinkSelectors = [
      "a[href*='/download']",
      "a[href*='/Download']",
      "a[href*='download=true']",
      "a[href*='.zip']",
      "a[href*='.tif']",
      "a[href*='.tiff']",
      "a[href*='.nc']",
      "a[href*='.csv']",
      "a[href*='.shp']",
      "a[href*='.geojson']",
      "a[href*='.json']",
      "a[href*='/geonetwork/srv/']",
    ];

    const seen = new Set<string>();
    for (const sel of downloadLinkSelectors) {
      const anchors = await page.locator(sel).all();
      for (const anchor of anchors) {
        const href = await anchor.getAttribute("href").catch(() => null);
        if (!href) continue;
        const absoluteUrl = href.startsWith("http")
          ? href
          : `https://rds.icimod.org${href}`;
        if (!seen.has(absoluteUrl)) {
          seen.add(absoluteUrl);
          links.push(absoluteUrl);
        }
      }
    }

    // Also check GeoNetwork metadata link for associated resources
    const geonetworkLinks = await page
      .locator("a[href*='geonetwork']")
      .all();
    for (const anchor of geonetworkLinks) {
      const href = await anchor.getAttribute("href").catch(() => null);
      if (!href) continue;
      const absoluteUrl = href.startsWith("http")
        ? href
        : `https://rds.icimod.org${href}`;
      if (!seen.has(absoluteUrl)) {
        seen.add(absoluteUrl);
        links.push(absoluteUrl);
      }
    }
  } catch (err) {
    console.warn(`    Failed to extract links from ${landingUrl}: ${String(err)}`);
  } finally {
    await page.close();
  }

  return links;
}

// ─── Single dataset downloader ────────────────────────────────────────────────

async function downloadDataset(
  context: BrowserContext,
  metadataId: number,
  title: string,
  manifest: ManifestFile,
): Promise<void> {
  const key = String(metadataId);
  const datasetDir = path.join(DATA_ROOT, key);

  // Skip if already fully downloaded
  if (manifest[key] !== undefined && manifest[key].files.length > 0) {
    console.log(`  [SKIP] ${metadataId} — already in manifest (${manifest[key].files.length} file(s))`);
    return;
  }

  console.log(`\n  Processing: ${metadataId} — ${title.slice(0, 70)}`);

  const downloadLinks = await extractDownloadLinks(context, metadataId);
  if (downloadLinks.length === 0) {
    console.warn(`  [WARN] No download links found for ${metadataId}`);
    manifest[key] = { title, files: [] };
    return;
  }

  console.log(`  Found ${downloadLinks.length} download link(s)`);

  // Collect cookies for fetch-based download
  const cookies = await context.cookies();

  const fileEntries: FileEntry[] = [];

  for (const url of downloadLinks) {
    const rawName = url.split("/").pop()?.split("?")[0] ?? `file-${Date.now()}`;
    const safeName = rawName.replace(/[^\w.\-]/g, "_");
    const destPath = path.join(datasetDir, safeName);

    // Skip if file already exists
    if (fs.existsSync(destPath)) {
      console.log(`    [SKIP] ${safeName} — already on disk`);
      const size = fs.statSync(destPath).size;
      const sha256 = await sha256File(destPath);
      fileEntries.push({
        name: safeName,
        size,
        sha256,
        url,
        downloadedAt: new Date().toISOString(),
      });
      continue;
    }

    try {
      console.log(`    Downloading: ${safeName}`);
      const size = await downloadWithCookies(url, destPath, cookies);
      const sha256 = await sha256File(destPath);
      console.log(`    Done: ${safeName} (${(size / 1024).toFixed(1)} KB, sha256: ${sha256.slice(0, 12)}…)`);
      fileEntries.push({
        name: safeName,
        size,
        sha256,
        url,
        downloadedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`    [ERROR] Failed to download ${safeName}: ${String(err)}`);
    }
  }

  manifest[key] = { title, files: fileEntries };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. Validate credentials
  const username = process.env["ICIMOD_USERNAME"];
  const password = process.env["ICIMOD_PASSWORD"];

  if (!username || !password) {
    console.error(
      "Error: ICIMOD_USERNAME and ICIMOD_PASSWORD must be set in the environment.\n" +
        "Add them to .env.local:\n" +
        "  ICIMOD_USERNAME=your@email.com\n" +
        "  ICIMOD_PASSWORD=yourpassword\n" +
        "Then run: npm run icimod:download",
    );
    process.exit(1);
  }

  console.log("=== ICIMOD RDS Authenticated Downloader ===");
  console.log(`  Username : ${username}`);
  console.log(`  Headless : ${!HEADED}`);
  console.log(`  Dry run  : ${DRY_RUN}`);

  // 2. Load target datasets from catalog
  const targets = loadTargetDatasets();
  if (targets.length === 0) {
    console.error("No target datasets found. Check catalog or --ids flag.");
    process.exit(1);
  }

  console.log(`\n  Target datasets (${targets.length}):`);
  for (const t of targets) {
    console.log(`    [${t.id}] ${t.title.slice(0, 70)}`);
  }

  if (DRY_RUN) {
    console.log("\nDry run — exiting without downloading.");
    process.exit(0);
  }

  // 3. Ensure data directory structure
  ensureDir(DATA_ROOT);
  ensureDir(STATE_DIR);

  // 4. Launch persistent Chromium context (reuses session cookies across runs)
  console.log("\n  Launching browser...");
  const context = await chromium.launchPersistentContext(STATE_DIR, {
    headless: !HEADED,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });

  try {
    // 5. Check existing session; log in only when needed
    console.log("  Checking session state...");
    const alreadyLoggedIn = await isLoggedIn(context);
    if (alreadyLoggedIn) {
      console.log("  Session active — skipping login.");
    } else {
      console.log("  No active session — logging in...");
      await login(context, username, password);
    }

    // 6. Load manifest (idempotency state)
    const manifest = loadManifest();

    // 7. Download each dataset
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target) continue;

      try {
        await downloadDataset(context, target.id, target.title, manifest);
        saveManifest(manifest);
      } catch (err) {
        console.error(`  [ERROR] Dataset ${target.id} failed: ${String(err)}`);
      }

      if (i < targets.length - 1) {
        console.log(`  Waiting ${DELAY_BETWEEN_DATASETS_MS / 1000}s before next dataset...`);
        await sleep(DELAY_BETWEEN_DATASETS_MS);
      }
    }

    // 8. Final manifest write
    saveManifest(manifest);
    console.log(`\n  Manifest written to: ${MANIFEST_PATH}`);

    const totalFiles = Object.values(manifest).reduce(
      (sum, d) => sum + d.files.length,
      0,
    );
    console.log(`\n=== DONE ===`);
    console.log(`  Datasets processed : ${targets.length}`);
    console.log(`  Total files        : ${totalFiles}`);
  } finally {
    await context.close();
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
