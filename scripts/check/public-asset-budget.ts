import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC_DIR = join(__dirname, "../../public");

const LIMITS = {
  fileSizeBytes: 20 * 1024 * 1024,   // 20 MiB per file
  totalBytes: 250 * 1024 * 1024,     // 250 MB total
  fileCount: 15_000,                  // max files
};
const WARN_RATIO = 0.8;

type FileEntry = { path: string; size: number };

function walk(dir: string, entries: FileEntry[] = []): FileEntry[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, entries);
    } else {
      entries.push({ path: full, size: st.size });
    }
  }
  return entries;
}

function fmt(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

const files = walk(PUBLIC_DIR);
const totalBytes = files.reduce((s, f) => s + f.size, 0);
const fileCount = files.length;

let failed = false;
const warnings: string[] = [];
const errors: string[] = [];

// Per-file size check
for (const f of files) {
  if (f.size > LIMITS.fileSizeBytes) {
    errors.push(`  FAIL  ${f.path.replace(PUBLIC_DIR, "public")} — ${fmt(f.size)} (limit 20 MiB)`);
    failed = true;
  } else if (f.size > LIMITS.fileSizeBytes * WARN_RATIO) {
    warnings.push(`  WARN  ${f.path.replace(PUBLIC_DIR, "public")} — ${fmt(f.size)} (>80% of 20 MiB)`);
  }
}

// Total bundle size check
if (totalBytes > LIMITS.totalBytes) {
  errors.push(`  FAIL  Total public/ size ${fmt(totalBytes)} exceeds 250 MB`);
  failed = true;
} else if (totalBytes > LIMITS.totalBytes * WARN_RATIO) {
  warnings.push(`  WARN  Total public/ size ${fmt(totalBytes)} is >80% of 250 MB`);
}

// File count check
if (fileCount > LIMITS.fileCount) {
  errors.push(`  FAIL  File count ${fileCount} exceeds 15,000`);
  failed = true;
} else if (fileCount > LIMITS.fileCount * WARN_RATIO) {
  warnings.push(`  WARN  File count ${fileCount} is >80% of 15,000`);
}

// Summary table
console.log("\n=== public/ asset budget ===");
console.log(`  Files      : ${fileCount} / 15,000`);
console.log(`  Total size : ${fmt(totalBytes)} / 250 MiB`);
console.log(`  Largest    : ${fmt(Math.max(0, ...files.map((f) => f.size)))} / 20 MiB per file`);

for (const w of warnings) console.warn(w);
for (const e of errors) console.error(e);

if (!failed && warnings.length === 0) {
  console.log("  OK — all thresholds pass\n");
} else if (!failed) {
  console.log("  WARN — within limits but approaching thresholds\n");
} else {
  console.error("  FAILED — budget exceeded. Reduce public/ assets before building.\n");
  process.exit(1);
}
