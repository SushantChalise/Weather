#!/usr/bin/env tsx

/**
 * ICIMOD RDS Metadata Scraper & Downloader
 *
 * ICIMOD RDS is a SvelteKit SPA that acts as a metadata catalog.
 * Most datasets point to canonical external sources (WGMS, Copernicus, etc.)
 * and do NOT host files on ICIMOD servers.
 *
 * Datasets with enable_download:true use a login-gated download wizard at
 * /download/flow/{uuid} => POST /geoapi/datasets/{uuid}/download/direct/confirm/
 * Attempting those without --with-login records the DOI as a known entry point.
 *
 * Usage:
 *   npm run icimod:download                           # top 20 by score
 *   npm run icimod:download -- --ids 1972483,1972482  # specific datasets
 *   npm run icimod:download -- --dry-run              # print dataset list and exit
 *   npm run icimod:download -- --with-login           # enable authenticated download
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const WITH_LOGIN = args.includes("--with-login");
const idsFlag = args.find((a) => a.startsWith("--ids=") || a === "--ids");
let OVERRIDE_IDS: string[] | null = null;
if (idsFlag) {
  const raw =
    idsFlag === "--ids"
      ? args[args.indexOf("--ids") + 1]
      : idsFlag.slice("--ids=".length);
  if (raw) {
    OVERRIDE_IDS = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}

const CATALOG_CANDIDATES = [
  path.join(PROJECT_ROOT, "output", "icimod-rds-all.json"),
  path.join(PROJECT_ROOT, "scripts", "output", "icimod-rds-all.json"),
];
const DATA_ROOT = path.join(PROJECT_ROOT, "data", "icimod");
const MANIFEST_PATH = path.join(DATA_ROOT, "manifest.json");

const LANDING_BASE = "https://rds.icimod.org/Home/DataDetail?metadataId=";
const GEOAPI_BASE = "https://rds.icimod.org/geoapi";
const TOP_N_DEFAULT = 20;
const DELAY_MS = 2500;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface CatalogRecord {
  id: string;
  title: string;
  landingPage: string;
  ranking: { score: number; tier: string };
}

interface IcimodResource {
  url: string;
  protocol: string;
  name: string;
  description: string;
}

interface IcimodMetadata {
  uuid: string;
  title: string;
  abstract: string;
  purpose: string | null;
  citation: string | null;
  keywords: { theme: string[]; place: string[] };
  thumbnail: string | null;
  contact: { organization: string; individual: string; position: string; email: string };
  dates: { creation: string; publication: string };
  spatial: { west: string; east: string; south: string; north: string };
  license: string;
  language: string;
  link: string;
  resources: IcimodResource[];
  enable_download: boolean;
  error: string | null;
  doi: string | null;
}

interface DownloadEntry {
  url: string;
  filename: string;
  sizeBytes: number;
  sha256: string;
  downloadedAt: string;
}

interface ManifestEntry {
  metadataId: string;
  uuid: string;
  title: string;
  enableDownload: boolean;
  resources: IcimodResource[];
  downloads: DownloadEntry[];
  externalSources: { url: string; name: string }[];
  scrapedAt: string;
}

interface ManifestFile {
  [metadataId: string]: ManifestEntry;
}

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
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8")) as ManifestFile;
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

function findCatalogPath(): string {
  for (const candidate of CATALOG_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  console.error(
    "Catalog not found at any of:\n" +
      CATALOG_CANDIDATES.map((p) => `  ${p}`).join("\n") +
      "\nRun: node scripts/scrape-icimod-rds.mjs first.",
  );
  process.exit(1);
}

function loadTargetDatasets(): Array<{ id: string; title: string }> {
  const catalogPath = findCatalogPath();
  const raw = JSON.parse(fs.readFileSync(catalogPath, "utf-8")) as CatalogRecord[];

  if (OVERRIDE_IDS !== null) {
    const idSet = new Set(OVERRIDE_IDS);
    const found = raw.filter((r) => idSet.has(r.id));
    const missing = OVERRIDE_IDS.filter((id) => !raw.some((r) => r.id === id));
    for (const id of missing) {
      found.push({
        id,
        title: `Unknown dataset ${id}`,
        landingPage: `${LANDING_BASE}${id}`,
        ranking: { score: 0, tier: "unknown" },
      });
    }
    return found.map((r) => ({ id: r.id, title: r.title }));
  }

  return raw
    .sort((a, b) => b.ranking.score - a.ranking.score)
    .slice(0, TOP_N_DEFAULT)
    .map((r) => ({ id: r.id, title: r.title }));
}

/**
 * Fetches dataset metadata via the SvelteKit __data.json endpoint.
 *
 * The /Home/DataDetail?metadataId={N} page 302-redirects to /metadata/{uuid}.
 * SvelteKit exposes a __data.json endpoint on every route that returns the
 * hydration payload as structured JSON -- no HTML parsing, no browser needed.
 */
async function fetchMetadata(metadataId: string): Promise<IcimodMetadata | null> {
  const landingResp = await fetch(`${LANDING_BASE}${metadataId}`, {
    headers: { "User-Agent": UA },
    redirect: "follow",
  });

  if (!landingResp.ok) {
    console.warn(`  [WARN] HTTP ${landingResp.status} for landing page ${metadataId}`);
    return null;
  }

  const finalUrl = landingResp.url;
  const base = finalUrl.replace(/\/$/, "");
  const dataUrl = `${base}/__data.json?x-sveltekit-invalidated=01`;

  const dataResp = await fetch(dataUrl, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });

  if (dataResp.ok) {
    let body: unknown;
    try {
      body = await dataResp.json();
    } catch {
      body = null;
    }
    if (body) {
      const meta = extractMetadataFromSvelteKitData(body);
      if (meta) return meta;
    }
  }

  console.warn(`  [WARN] __data.json failed for ${metadataId}; falling back to HTML parse`);
  const html = await landingResp.text().catch(() => "");
  return extractMetadataFromHtml(html, metadataId);
}

function extractMetadataFromSvelteKitData(body: unknown): IcimodMetadata | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  const nodes = obj["nodes"];
  if (!Array.isArray(nodes)) return null;

  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const n = node as Record<string, unknown>;
    if (n["type"] !== "data") continue;
    const data = n["data"];
    if (!Array.isArray(data)) continue;

    const firstItem = data[0];
    if (!firstItem || typeof firstItem !== "object") continue;
    const fi = firstItem as Record<string, unknown>;
    if (!("metadata" in fi)) continue;

    const metaIdx = fi["metadata"];
    if (typeof metaIdx !== "number") continue;

    const meta = data[metaIdx];
    if (!meta || typeof meta !== "object") continue;

    return resolveMetadata(data, meta as Record<string, number>);
  }
  return null;
}

function resolveRef<T>(data: unknown[], idx: unknown): T | null {
  if (typeof idx !== "number") return null;
  return (data[idx] ?? null) as T | null;
}

function resolveStringArr(data: unknown[], arrIdx: unknown): string[] {
  if (typeof arrIdx !== "number") return [];
  const arr = data[arrIdx];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((i: unknown) => (typeof i === "number" ? data[i] : i))
    .filter((v): v is string => typeof v === "string");
}

function resolveMetadata(data: unknown[], meta: Record<string, number>): IcimodMetadata {
  const str = (key: string): string => {
    const v = resolveRef<unknown>(data, meta[key]);
    return typeof v === "string" ? v : "";
  };
  const bool = (key: string): boolean => resolveRef<unknown>(data, meta[key]) === true;
  const any = (key: string): unknown => resolveRef<unknown>(data, meta[key]);

  const keywordsObj = any("keywords") as Record<string, number> | null;
  const keywords = { theme: [] as string[], place: [] as string[] };
  if (keywordsObj && typeof keywordsObj === "object") {
    keywords.theme = resolveStringArr(data, keywordsObj["theme"]);
    keywords.place = resolveStringArr(data, keywordsObj["place"]);
  }

  const contactObj = any("contact") as Record<string, number> | null;
  const contact = {
    organization: contactObj ? (resolveRef<string>(data, contactObj["organization"]) ?? "") : "",
    individual: contactObj ? (resolveRef<string>(data, contactObj["individual"]) ?? "") : "",
    position: contactObj ? (resolveRef<string>(data, contactObj["position"]) ?? "") : "",
    email: contactObj ? (resolveRef<string>(data, contactObj["email"]) ?? "") : "",
  };

  const datesObj = any("dates") as Record<string, number> | null;
  const dates = {
    creation: datesObj ? (resolveRef<string>(data, datesObj["creation"]) ?? "") : "",
    publication: datesObj ? (resolveRef<string>(data, datesObj["publication"]) ?? "") : "",
  };

  const spatialObj = any("spatial") as Record<string, number> | null;
  const spatial = {
    west: spatialObj ? (resolveRef<string>(data, spatialObj["west"]) ?? "") : "",
    east: spatialObj ? (resolveRef<string>(data, spatialObj["east"]) ?? "") : "",
    south: spatialObj ? (resolveRef<string>(data, spatialObj["south"]) ?? "") : "",
    north: spatialObj ? (resolveRef<string>(data, spatialObj["north"]) ?? "") : "",
  };

  const resourcesRaw = any("resources");
  const resources: IcimodResource[] = [];
  const resArray = Array.isArray(resourcesRaw)
    ? resourcesRaw
    : typeof resourcesRaw === "number" && Array.isArray(data[resourcesRaw])
      ? (data[resourcesRaw] as unknown[])
      : [];

  for (const rRef of resArray) {
    const rObj =
      typeof rRef === "number"
        ? (data[rRef] as Record<string, number> | null)
        : (rRef as Record<string, number> | null);
    if (!rObj || typeof rObj !== "object") continue;
    resources.push({
      url: resolveRef<string>(data, rObj["url"]) ?? "",
      protocol: resolveRef<string>(data, rObj["protocol"]) ?? "",
      name: resolveRef<string>(data, rObj["name"]) ?? "",
      description: resolveRef<string>(data, rObj["description"]) ?? "",
    });
  }

  return {
    uuid: str("uuid"),
    title: str("title"),
    abstract: str("abstract"),
    purpose: str("purpose") || null,
    citation: str("citation") || null,
    keywords,
    thumbnail: str("thumbnail") || null,
    contact,
    dates,
    spatial,
    license: str("license"),
    language: str("language"),
    link: str("link"),
    resources,
    enable_download: bool("enable_download"),
    error: str("error") || null,
    doi: str("doi") || null,
  };
}

function extractMetadataFromHtml(html: string, metadataId: string): IcimodMetadata | null {
  const uuidMatch = /uuid:"([^"]+)"/.exec(html);
  if (!uuidMatch) {
    console.warn(`  [WARN] Could not parse HTML for ${metadataId}`);
    return null;
  }

  const titleMatch = /title:"([^"]+)"/.exec(html);
  const enableMatch = /enable_download:(true|false)/.exec(html);
  const doiMatch = /doi:"([^"]+)"/.exec(html);
  const emailMatch = /email:"([^"]+)"/.exec(html);

  const resources: IcimodResource[] = [];
  for (const m of html.matchAll(
    /url:"([^"]+)",protocol:"([^"]*)",name:"([^"]*)",description:"([^"]*)"/g,
  )) {
    resources.push({
      url: m[1] ?? "",
      protocol: m[2] ?? "",
      name: m[3] ?? "",
      description: m[4] ?? "",
    });
  }

  return {
    uuid: uuidMatch[1] ?? "",
    title: titleMatch ? (titleMatch[1] ?? `Dataset ${metadataId}`) : `Dataset ${metadataId}`,
    abstract: "",
    purpose: null,
    citation: null,
    keywords: { theme: [], place: [] },
    thumbnail: null,
    contact: {
      organization: "ICIMOD",
      individual: "",
      position: "",
      email: emailMatch ? (emailMatch[1] ?? "") : "",
    },
    dates: { creation: "", publication: "" },
    spatial: { west: "", east: "", south: "", north: "" },
    license: "",
    language: "eng",
    link: `https://rds.icimod.org/geonetwork/srv/eng/catalog.search#/metadata/${uuidMatch[1]}`,
    resources,
    enable_download: enableMatch ? enableMatch[1] === "true" : false,
    error: null,
    doi: doiMatch ? (doiMatch[1] ?? null) : null,
  };
}

async function downloadWithToken(
  uuid: string,
  token: string,
  datasetDir: string,
): Promise<DownloadEntry[]> {
  const contextResp = await fetch(
    `${GEOAPI_BASE}/datasets/${encodeURIComponent(uuid)}/download/context/`,
    { headers: { Authorization: token, Accept: "application/json" } },
  );
  if (!contextResp.ok) {
    console.warn(`  [WARN] download/context HTTP ${contextResp.status}`);
    return [];
  }

  const ctx = (await contextResp.json()) as Record<string, unknown>;
  const rawMode = ctx["download_mode"];
  const mode = String(rawMode ?? "").toLowerCase();

  if (mode === "direct") {
    return downloadDirect(uuid, token, datasetDir);
  }
  if (mode === "multi" || mode === "multi_file") {
    return downloadMulti(uuid, token, datasetDir);
  }
  console.warn(`  [WARN] Unknown download_mode "${String(rawMode)}"`);
  return [];
}

async function saveBlob(
  resp: Response,
  datasetDir: string,
  fallbackName: string,
): Promise<DownloadEntry | null> {
  const cd = resp.headers.get("Content-Disposition") ?? "";
  const nameMatch = /filename[^;=\n]*=["']?([^"';\n]+)/.exec(cd);
  const filename = nameMatch ? (nameMatch[1]?.trim() ?? fallbackName) : fallbackName;
  const destPath = path.join(datasetDir, filename);

  if (fs.existsSync(destPath)) {
    const sha256 = await sha256File(destPath);
    const sizeBytes = fs.statSync(destPath).size;
    console.log(`  [SKIP] ${filename} -- already on disk`);
    return { url: resp.url, filename, sizeBytes, sha256, downloadedAt: new Date().toISOString() };
  }

  if (!resp.body) return null;
  ensureDir(datasetDir);
  const fileStream = fs.createWriteStream(destPath);
  await pipeline(resp.body as unknown as NodeJS.ReadableStream, fileStream);
  const sizeBytes = fs.statSync(destPath).size;
  const sha256 = await sha256File(destPath);
  console.log(`  [OK] ${filename} (${(sizeBytes / 1024).toFixed(1)} KB, sha256: ${sha256.slice(0, 12)}...)`);
  return { url: resp.url, filename, sizeBytes, sha256, downloadedAt: new Date().toISOString() };
}

async function downloadDirect(
  uuid: string,
  token: string,
  datasetDir: string,
): Promise<DownloadEntry[]> {
  const resp = await fetch(
    `${GEOAPI_BASE}/datasets/${encodeURIComponent(uuid)}/download/direct/confirm/`,
    {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json", Accept: "*/*" },
      body: JSON.stringify({ purpose: "RESEARCH" }),
    },
  );
  if (!resp.ok) {
    const err = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    console.warn(`  [WARN] direct/confirm failed: ${String(err["detail"] ?? resp.status)}`);
    return [];
  }
  const entry = await saveBlob(resp, datasetDir, `${uuid}.bin`);
  return entry ? [entry] : [];
}

async function downloadMulti(
  uuid: string,
  token: string,
  datasetDir: string,
): Promise<DownloadEntry[]> {
  await fetch(
    `${GEOAPI_BASE}/datasets/${encodeURIComponent(uuid)}/download/multi/confirm/`,
    {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ purpose: "RESEARCH" }),
    },
  );

  const filesResp = await fetch(
    `${GEOAPI_BASE}/datasets/${encodeURIComponent(uuid)}/download/multi/files/`,
    { headers: { Authorization: token, Accept: "application/json" } },
  );
  if (!filesResp.ok) return [];

  const body = (await filesResp.json()) as {
    files?: Array<{ id: number; filename: string; file_available: boolean }>;
  };
  const files = body["files"] ?? [];
  const entries: DownloadEntry[] = [];

  for (const f of files) {
    if (!f.file_available) continue;
    const fileResp = await fetch(
      `${GEOAPI_BASE}/datasets/${encodeURIComponent(uuid)}/download/multi/file/${f.id}/`,
      { headers: { Authorization: token, Accept: "*/*" } },
    );
    if (!fileResp.ok) continue;
    const entry = await saveBlob(fileResp, datasetDir, f.filename || `file-${f.id}`);
    if (entry) entries.push(entry);
  }
  return entries;
}

async function loginAndGetToken(username: string, password: string): Promise<string | null> {
  const resp = await fetch(`${GEOAPI_BASE}/auth/login_public/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    console.error(`  [ERROR] Login failed (${resp.status}): ${body.slice(0, 200)}`);
    return null;
  }
  const data = (await resp.json()) as { token?: string; key?: string };
  const token = data["token"] ?? data["key"];
  return token ? `Token ${token}` : null;
}

async function processDataset(
  metadataId: string,
  catalogTitle: string,
  manifest: ManifestFile,
  authToken: string | null,
): Promise<void> {
  const meta = await fetchMetadata(metadataId);
  if (!meta) {
    console.warn(`  [WARN] Could not fetch metadata for ${metadataId}`);
    return;
  }

  const existingDownloads = manifest[metadataId]?.downloads ?? [];

  const externalSources = meta.resources
    .filter((r) => r.url && !r.url.includes("/geonetwork/srv/api/records"))
    .map((r) => ({ url: r.url, name: r.name || r.url }));

  if (!meta.enable_download) {
    console.log(`  [INFO] external-only -- ${meta.title.slice(0, 70)}`);
    for (const s of externalSources) {
      console.log(`         -> ${s.name}: ${s.url}`);
    }
    manifest[metadataId] = {
      metadataId,
      uuid: meta.uuid,
      title: meta.title || catalogTitle,
      enableDownload: false,
      resources: meta.resources,
      downloads: existingDownloads,
      externalSources,
      scrapedAt: new Date().toISOString(),
    };
    return;
  }

  let downloads: DownloadEntry[] = [...existingDownloads];

  if (authToken) {
    const datasetDir = path.join(DATA_ROOT, metadataId);
    const alreadyDownloaded = new Set(existingDownloads.map((d) => d.filename));
    console.log("  [INFO] enable_download:true -- attempting authenticated download");
    const newDownloads = await downloadWithToken(meta.uuid, authToken, datasetDir);
    for (const nd of newDownloads) {
      if (!alreadyDownloaded.has(nd.filename)) {
        downloads.push(nd);
      }
    }
  } else {
    const hint = meta.doi ?? `https://rds.icimod.org/download/flow/${meta.uuid}`;
    console.log("  [INFO] enable_download:true -- login required (re-run with --with-login)");
    console.log(`         Download entry point: ${hint}`);
  }

  manifest[metadataId] = {
    metadataId,
    uuid: meta.uuid,
    title: meta.title || catalogTitle,
    enableDownload: meta.enable_download,
    resources: meta.resources,
    downloads,
    externalSources,
    scrapedAt: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  console.log("=== ICIMOD RDS Metadata Scraper ===");
  console.log(`  Dry run    : ${DRY_RUN}`);
  console.log(`  With login : ${WITH_LOGIN}`);

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
    console.log("\nDry run -- exiting without scraping.");
    process.exit(0);
  }

  let authToken: string | null = null;
  if (WITH_LOGIN) {
    const username = process.env["ICIMOD_USERNAME"];
    const password = process.env["ICIMOD_PASSWORD"];
    if (!username || !password) {
      console.error(
        "Error: --with-login requires ICIMOD_USERNAME and ICIMOD_PASSWORD in the environment.\n" +
          "Add them to .env.local:\n" +
          "  ICIMOD_USERNAME=your@email.com\n" +
          "  ICIMOD_PASSWORD=yourpassword",
      );
      process.exit(1);
    }
    console.log(`\n  Logging in as: ${username}`);
    authToken = await loginAndGetToken(username, password);
    if (!authToken) {
      console.error("  Login failed -- continuing without download capability.");
    } else {
      console.log("  Login successful.");
    }
  }

  ensureDir(DATA_ROOT);
  const manifest = loadManifest();

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    if (!target) continue;

    console.log(`\n[${i + 1}/${targets.length}] ${target.id} -- ${target.title.slice(0, 60)}`);
    try {
      await processDataset(target.id, target.title, manifest, authToken);
      saveManifest(manifest);
    } catch (err) {
      console.error(`  [ERROR] Dataset ${target.id} failed: ${String(err)}`);
    }

    if (i < targets.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  saveManifest(manifest);
  console.log(`\n  Manifest written to: ${MANIFEST_PATH}`);

  const total = Object.keys(manifest).length;
  const withDownloads = Object.values(manifest).filter((e) => e.downloads.length > 0).length;
  const externalOnly = Object.values(manifest).filter((e) => !e.enableDownload).length;
  const loginRequired = Object.values(manifest).filter(
    (e) => e.enableDownload && e.downloads.length === 0,
  ).length;

  console.log("\n=== DONE ===");
  console.log(`  Datasets processed : ${total}`);
  console.log(`  With downloads     : ${withDownloads}`);
  console.log(`  External-only      : ${externalOnly}`);
  console.log(`  Login required     : ${loginRequired} (re-run with --with-login)`);

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
