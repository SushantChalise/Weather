#!/usr/bin/env node
/**
 * Uploads Himawari-9 tiles to the weather-data-mirror repo via commit-and-push.
 * Reads meta.json written by pipeline.py, encodes tiles to WebP, commits to the
 * data-mirror branch of SushantChalise/weather-data-mirror, then purges the
 * jsDelivr manifest cache.
 *
 * Env vars:
 *   WEATHER_DATA_MIRROR_TOKEN  — fine-grained PAT with push access to data-mirror repo
 *
 * Flags:
 *   --dry-run  — skip the actual git push and jsDelivr purge; useful for CI testing
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";

const DRY_RUN = process.argv.includes("--dry-run");
const OUTPUT_DIR = "./himawari-output";
const MIRROR_REPO = "https://github.com/SushantChalise/weather-data-mirror.git";
const MIRROR_BRANCH = "data-mirror";
const MIRROR_DEST = "himawari/latest";
const MAX_WRITES_PER_RUN = 200;
const JSDELIVR_PURGE =
  "https://purge.jsdelivr.net/gh/SushantChalise/weather-data-mirror@data-mirror/himawari/latest/manifest.json";

const meta = JSON.parse(readFileSync(`${OUTPUT_DIR}/meta.json`, "utf8"));
const { timestamp, capturedAt, processedAt } = meta;

function gitIn(cloneDir, args) {
  execFileSync("git", ["-C", cloneDir, ...args], { stdio: "inherit" });
}

function gitOutIn(cloneDir, args) {
  return execFileSync("git", ["-C", cloneDir, ...args], { encoding: "utf8" }).trim();
}

function* walkTiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walkTiles(full);
    else if (full.endsWith(".png")) yield full;
  }
}

async function convertToWebP(pngData) {
  const buf = Buffer.isBuffer(pngData) ? pngData : Buffer.from(pngData);
  try {
    const py = [
      "import sys, io",
      "from PIL import Image",
      "data = sys.stdin.buffer.read()",
      "img = Image.open(io.BytesIO(data))",
      "out = io.BytesIO()",
      "img.save(out, 'WEBP', quality=85)",
      "sys.stdout.buffer.write(out.getvalue())",
    ].join("\n");
    return execFileSync("python3", ["-c", py], {
      input: buf,
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch {
    // Fall back to raw PNG if python3/Pillow unavailable
    return buf;
  }
}

async function main() {
  const token = process.env.WEATHER_DATA_MIRROR_TOKEN;
  if (!token && !DRY_RUN) {
    console.error("[ERROR] WEATHER_DATA_MIRROR_TOKEN is not set");
    process.exit(1);
  }

  const tileDir = `${OUTPUT_DIR}/${timestamp}`;
  const tiles = [...walkTiles(tileDir)];
  console.log(`[INFO] Found ${tiles.length} PNG tiles for slot ${capturedAt}`);

  // Compute SHA-256 over all tile bytes to detect unchanged frames
  const hashInput = createHash("sha256");
  for (const p of tiles.sort()) {
    hashInput.update(readFileSync(p));
  }
  const frameSha = hashInput.digest("hex");
  console.log(`[INFO] Frame SHA-256: ${frameSha.slice(0, 16)}…`);

  // Build authenticated remote URL without logging the token
  const remoteUrl = token
    ? `https://x-access-token:${token}@github.com/SushantChalise/weather-data-mirror.git`
    : MIRROR_REPO;

  const cloneDir = join(tmpdir(), `data-mirror-${Date.now()}`);
  mkdirSync(cloneDir, { recursive: true });

  try {
    console.log("[INFO] Shallow-cloning data-mirror branch…");
    execFileSync(
      "git",
      ["clone", "--depth=1", "--branch", MIRROR_BRANCH, "--single-branch", remoteUrl, cloneDir],
      { stdio: "inherit" },
    );

    // Check previous manifest for dedup
    const manifestPath = join(cloneDir, MIRROR_DEST, "manifest.json");
    let previousManifestUrl = null;
    try {
      const prev = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (prev.frame_sha === frameSha) {
        console.log("[SKIP] Frame unchanged — identical SHA-256, skipping push");
        return;
      }
      if (prev.commit_sha) {
        previousManifestUrl = `https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@${prev.commit_sha}/himawari/latest/manifest.json`;
      }
    } catch {
      // No previous manifest on first run
    }

    // Remove old tiles, write new WebP tiles
    const destTilesDir = join(cloneDir, MIRROR_DEST, "tiles");
    try {
      rmSync(destTilesDir, { recursive: true, force: true });
    } catch {}
    mkdirSync(destTilesDir, { recursive: true });

    let writeCount = 0;
    const tilesSorted = tiles.sort();

    for (const tilePath of tilesSorted) {
      if (writeCount >= MAX_WRITES_PER_RUN) {
        console.error(`[ERROR] MAX_WRITES_PER_RUN (${MAX_WRITES_PER_RUN}) exceeded — aborting`);
        process.exit(1);
      }
      const rel = relative(tileDir, tilePath).replace(/\\/g, "/");
      const destRel = rel.replace(/\.png$/, ".webp");
      const destPath = join(destTilesDir, destRel);
      mkdirSync(join(destPath, ".."), { recursive: true });

      const pngData = readFileSync(tilePath);
      const webpData = await convertToWebP(pngData);
      if (webpData.length > 5 * 1024 * 1024) {
        console.warn(
          `[WARN] Tile ${destRel} is ${(webpData.length / 1024 / 1024).toFixed(1)} MiB — exceeds 5 MiB limit`,
        );
      }
      writeFileSync(destPath, webpData);
      writeCount++;
    }
    console.log(`[INFO] Wrote ${writeCount} WebP tiles`);

    // Write preview.webp from first tile
    if (tilesSorted.length > 0) {
      const previewData = await convertToWebP(readFileSync(tilesSorted[0]));
      writeFileSync(join(cloneDir, MIRROR_DEST, "preview.webp"), previewData);
    }

    gitIn(cloneDir, [
      "config",
      "user.email",
      "github-actions[bot]@users.noreply.github.com",
    ]);
    gitIn(cloneDir, ["config", "user.name", "github-actions[bot]"]);
    gitIn(cloneDir, ["add", join(MIRROR_DEST, "tiles"), join(MIRROR_DEST, "preview.webp")]);

    if (!DRY_RUN) {
      // Commit tiles first to obtain the SHA, then amend adding the manifest
      // which references that SHA for commit-pinned tile URLs.
      gitIn(cloneDir, [
        "commit",
        "--allow-empty",
        "-m",
        `feat(himawari): tiles ${capturedAt}`,
      ]);
      const commitSha = gitOutIn(cloneDir, ["rev-parse", "HEAD"]);

      const tileTemplate = `https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@${commitSha}/himawari/latest/tiles/{z}/{x}/{y}.webp`;
      const previewUrl = `https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@${commitSha}/himawari/latest/preview.webp`;
      const manifest = {
        frame_time_utc: capturedAt,
        commit_sha: commitSha,
        tile_template: tileTemplate,
        preview: previewUrl,
        generated_at: processedAt,
        source: "Himawari-9 B13",
        frame_sha: frameSha,
        previous_manifest: previousManifestUrl,
      };
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      gitIn(cloneDir, ["add", join(MIRROR_DEST, "manifest.json")]);
      gitIn(cloneDir, ["commit", "--amend", "--no-edit"]);

      console.log("[INFO] Pushing to data-mirror branch…");
      execFileSync("git", ["-C", cloneDir, "push", "origin", `HEAD:${MIRROR_BRANCH}`], {
        stdio: "inherit",
      });
      console.log(`[INFO] Pushed commit ${commitSha}`);

      console.log("[INFO] Purging jsDelivr manifest cache…");
      try {
        const purgeRes = await fetch(JSDELIVR_PURGE);
        console.log(`[INFO] jsDelivr purge status: ${purgeRes.status}`);
      } catch (e) {
        console.warn(`[WARN] jsDelivr purge failed: ${e.message} — will self-heal within 12h`);
      }
      console.log("=== Upload done ===");
    } else {
      const manifest = {
        frame_time_utc: capturedAt,
        commit_sha: "dry-run-placeholder",
        tile_template:
          "https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@dry-run-placeholder/himawari/latest/tiles/{z}/{x}/{y}.webp",
        preview:
          "https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@dry-run-placeholder/himawari/latest/preview.webp",
        generated_at: processedAt,
        source: "Himawari-9 B13",
        frame_sha: frameSha,
        previous_manifest: previousManifestUrl,
      };
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log("[DRY-RUN] Skipped git push and jsDelivr purge");
      console.log(
        "[DRY-RUN] Manifest would contain:",
        JSON.stringify({ ...manifest, commit_sha: "<real-sha-after-push>" }, null, 2),
      );
      console.log("=== Dry-run done ===");
    }
  } finally {
    try {
      rmSync(cloneDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((e) => {
  console.error("[FATAL]", e);
  process.exit(1);
});
