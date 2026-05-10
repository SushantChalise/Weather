#!/usr/bin/env tsx
/**
 * validate-provenance.ts
 *
 * Usage: tsx scripts/transform/water-cycle/validate-provenance.ts <chapter-id>
 * Example: tsx scripts/transform/water-cycle/validate-provenance.ts ch0
 *
 * Loads public/water-cycle/{chapter}/provenance.json and validates it against
 * the provenance schema. Exits 0 on success, 1 on failure.
 *
 * npm script: validate:water-cycle-provenance
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validate } from "../../render/water-cycle/shared/provenance-schema";

const chapterId = process.argv[2];

if (!chapterId) {
  console.error("Usage: tsx scripts/transform/water-cycle/validate-provenance.ts <chapter-id>");
  console.error("Example: ... ch0");
  process.exit(1);
}

const filePath = join(process.cwd(), "public", "water-cycle", chapterId, "provenance.json");

let raw: unknown;
try {
  const text = readFileSync(filePath, "utf-8");
  raw = JSON.parse(text);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[validate-provenance] Failed to load ${filePath}: ${msg}`);
  process.exit(1);
}

const result = validate(raw);

if (result.ok) {
  console.log(`[validate-provenance] ${filePath} — VALID`);
  process.exit(0);
} else {
  console.error(`[validate-provenance] ${filePath} — INVALID`);
  for (const error of result.errors) {
    console.error(`  • ${error}`);
  }
  process.exit(1);
}
