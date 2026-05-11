#!/usr/bin/env tsx
/**
 * scripts/check/water-cycle-asset-budget.ts
 *
 * Asset budget check for the water-cycle cinematic assets.
 * Referenced in docs/water-cycle/08-acceptance-criteria.md "Asset budget script".
 *
 * Limits (from WATER_CYCLE_SPEC.md §7 hard constraints):
 *   - Each cinematic* file per chapter < 24 MiB (Workers 25 MiB cap minus safety margin)
 *   - Each poster.jpg per chapter < 500 KiB
 *   - Total public/water-cycle/ < 250 MiB
 *
 * Usage: tsx scripts/check/water-cycle-asset-budget.ts
 * Exit 0 = pass, Exit 1 = fail
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const WATER_CYCLE_DIR = join(process.cwd(), "public", "water-cycle");

// Hard limits from spec
const PER_FILE_CAP_MIB = 24;
const POSTER_CAP_KIB = 500;
const TOTAL_CAP_MIB = 250;

const PER_FILE_CAP_BYTES = PER_FILE_CAP_MIB * 1024 * 1024;
const POSTER_CAP_BYTES = POSTER_CAP_KIB * 1024;
const TOTAL_CAP_BYTES = TOTAL_CAP_MIB * 1024 * 1024;

const WARN_RATIO = 0.8;

function fmt(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

function walk(dir: string): { path: string; size: number }[] {
  const entries: { path: string; size: number }[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      entries.push(...walk(full));
    } else {
      entries.push({ path: full, size: st.size });
    }
  }
  return entries;
}

const CHAPTER_IDS = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"] as const;

let failed = false;
const warnings: string[] = [];
const errors: string[] = [];

console.log("\n=== water-cycle asset budget check ===\n");

if (!existsSync(WATER_CYCLE_DIR)) {
  console.warn("  [WARN] public/water-cycle/ does not exist yet — no renders to check");
  process.exit(0);
}

// Per-chapter file checks
for (const chapterId of CHAPTER_IDS) {
  const chapterDir = join(WATER_CYCLE_DIR, chapterId);

  if (!existsSync(chapterDir)) {
    console.log(`  [SKIP] ${chapterId}/ — directory not created yet (render task pending)`);
    continue;
  }

  const files = readdirSync(chapterDir);

  // Check cinematic* files
  const cinematicFiles = files.filter((f) => f.startsWith("cinematic"));
  if (cinematicFiles.length === 0) {
    console.log(`  [SKIP] ${chapterId}/cinematic* — no files yet (render task pending)`);
  }

  for (const file of cinematicFiles) {
    const full = join(chapterDir, file);
    const { size } = statSync(full);
    const rel = `public/water-cycle/${chapterId}/${file}`;

    if (size > PER_FILE_CAP_BYTES) {
      errors.push(`  FAIL  ${rel} — ${fmt(size)} (limit ${PER_FILE_CAP_MIB} MiB)`);
      failed = true;
    } else if (size > PER_FILE_CAP_BYTES * WARN_RATIO) {
      warnings.push(
        `  WARN  ${rel} — ${fmt(size)} (>80% of ${PER_FILE_CAP_MIB} MiB)`,
      );
    } else {
      console.log(`  OK    ${rel} — ${fmt(size)}`);
    }
  }

  // Check poster.jpg
  const posterPath = join(chapterDir, "poster.jpg");
  if (existsSync(posterPath)) {
    const { size } = statSync(posterPath);
    const rel = `public/water-cycle/${chapterId}/poster.jpg`;

    if (size > POSTER_CAP_BYTES) {
      errors.push(`  FAIL  ${rel} — ${fmt(size)} (limit ${POSTER_CAP_KIB} KiB)`);
      failed = true;
    } else if (size > POSTER_CAP_BYTES * WARN_RATIO) {
      warnings.push(`  WARN  ${rel} — ${fmt(size)} (>80% of ${POSTER_CAP_KIB} KiB)`);
    } else {
      console.log(`  OK    ${rel} — ${fmt(size)}`);
    }
  } else {
    console.log(`  [SKIP] public/water-cycle/${chapterId}/poster.jpg — not yet created`);
  }
}

// Total budget
const allFiles = walk(WATER_CYCLE_DIR);
const totalBytes = allFiles.reduce((s, f) => s + f.size, 0);

console.log(`\n  Total: ${fmt(totalBytes)} / ${TOTAL_CAP_MIB} MiB`);

if (totalBytes > TOTAL_CAP_BYTES) {
  errors.push(
    `  FAIL  Total public/water-cycle/ ${fmt(totalBytes)} exceeds ${TOTAL_CAP_MIB} MiB`,
  );
  failed = true;
} else if (totalBytes > TOTAL_CAP_BYTES * WARN_RATIO) {
  warnings.push(
    `  WARN  Total public/water-cycle/ ${fmt(totalBytes)} approaching ${TOTAL_CAP_MIB} MiB`,
  );
}

// Summary
console.log("\n");
for (const w of warnings) console.warn(w);
for (const e of errors) console.error(e);

if (!failed && warnings.length === 0) {
  console.log("  OK — all water-cycle asset budgets pass\n");
} else if (!failed) {
  console.log("  WARN — within limits but approaching thresholds\n");
} else {
  console.error("  FAILED — water-cycle asset budget exceeded\n");
  process.exit(1);
}
