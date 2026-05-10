#!/usr/bin/env tsx
/**
 * validate-kaspari.ts
 *
 * Validates data/water-cycle/impurities/kaspari-2014-figure-data.json against
 * the locked Kaspari 2014 ranges from WATER_CYCLE_SPEC.md and
 * docs/water-cycle/02-data-sources.md.
 *
 * Locked ranges (from spec):
 *   BC albedo reduction:  6–10 %
 *   BC radiative forcing: 75–120 W/m²
 *   Dust forcing:         488–525 W/m²
 *
 * Usage: tsx scripts/transform/water-cycle/validate-kaspari.ts
 * npm script: transform:water-cycle-kaspari
 * Exits 0 on pass, 1 on failure.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Locked ranges from WATER_CYCLE_SPEC.md §4 (Ch 5) + 02-data-sources.md
// ---------------------------------------------------------------------------
const LOCKED = {
  bc_albedo_reduction_pct: { min: 6, max: 10 },
  bc_forcing_W_m2: { min: 75, max: 120 },
  dust_forcing_W_m2: { min: 488, max: 525 },
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Range {
  min: number;
  max: number;
  unit: string;
  note?: string;
}

interface KaspariData {
  source: {
    doi: string;
    license: string;
    site: string;
  };
  bc_albedo_reduction_pct: Range;
  bc_forcing_W_m2: Range;
  dust_forcing_W_m2: Range;
  key_finding: string;
}

// ---------------------------------------------------------------------------
// Load file
// ---------------------------------------------------------------------------
const filePath = join(
  process.cwd(),
  "data",
  "water-cycle",
  "impurities",
  "kaspari-2014-figure-data.json"
);

let data: KaspariData;
try {
  const raw = readFileSync(filePath, "utf-8");
  data = JSON.parse(raw) as KaspariData;
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[kaspari-validate] FAIL — could not load ${filePath}: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
const errors: string[] = [];

function requireField(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") {
      errors.push(`Missing field: ${path}`);
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur === undefined || cur === null) {
    errors.push(`Missing field: ${path}`);
  }
  return cur;
}

function checkRange(
  field: string,
  actual: Range | undefined,
  expected: { min: number; max: number }
): void {
  if (!actual) {
    errors.push(`${field}: field missing`);
    return;
  }
  if (typeof actual.min !== "number" || typeof actual.max !== "number") {
    errors.push(`${field}: min/max must be numbers`);
    return;
  }
  if (actual.min < expected.min || actual.min > actual.max) {
    errors.push(
      `${field}: min=${actual.min} is outside locked range [${expected.min}, ${expected.max}]`
    );
  }
  if (actual.max > expected.max || actual.max < actual.min) {
    errors.push(
      `${field}: max=${actual.max} is outside locked range [${expected.min}, ${expected.max}]`
    );
  }
}

// ---------------------------------------------------------------------------
// Run checks
// ---------------------------------------------------------------------------
console.log(`[kaspari-validate] Checking ${filePath} ...`);

// Required metadata
requireField(data, "source.doi");
requireField(data, "source.license");
requireField(data, "source.site");
requireField(data, "key_finding");

// Verify DOI
if (data.source?.doi !== "10.5194/acp-14-8089-2014") {
  errors.push(
    `source.doi mismatch: got "${data.source?.doi}", expected "10.5194/acp-14-8089-2014"`
  );
}

// Verify license is CC-BY (any version)
if (!data.source?.license?.startsWith("CC-BY")) {
  errors.push(`source.license must start with "CC-BY", got: "${data.source?.license}"`);
}

// Check locked ranges
checkRange("bc_albedo_reduction_pct", data.bc_albedo_reduction_pct, LOCKED.bc_albedo_reduction_pct);
checkRange("bc_forcing_W_m2", data.bc_forcing_W_m2, LOCKED.bc_forcing_W_m2);
checkRange("dust_forcing_W_m2", data.dust_forcing_W_m2, LOCKED.dust_forcing_W_m2);

// Dust must dominate over BC (sanity check on key finding)
if (data.bc_forcing_W_m2 && data.dust_forcing_W_m2) {
  const bcMax = data.bc_forcing_W_m2.max;
  const dustMin = data.dust_forcing_W_m2.min;
  if (dustMin <= bcMax) {
    errors.push(
      `dust_forcing_W_m2.min (${dustMin}) must exceed bc_forcing_W_m2.max (${bcMax}) — dust must dominate per Kaspari 2014`
    );
  }
}

// Report
if (errors.length === 0) {
  console.log("[kaspari-validate] PASS — all locked ranges verified");
  console.log(`  BC albedo reduction: ${data.bc_albedo_reduction_pct.min}–${data.bc_albedo_reduction_pct.max} %`);
  console.log(`  BC forcing:          ${data.bc_forcing_W_m2.min}–${data.bc_forcing_W_m2.max} W/m²`);
  console.log(`  Dust forcing:        ${data.dust_forcing_W_m2.min}–${data.dust_forcing_W_m2.max} W/m²`);
  console.log(`  DOI: ${data.source.doi}`);
  process.exit(0);
} else {
  console.error("[kaspari-validate] FAIL — validation errors:");
  for (const e of errors) {
    console.error(`  • ${e}`);
  }
  process.exit(1);
}
