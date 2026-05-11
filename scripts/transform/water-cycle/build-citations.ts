/**
 * build-citations.ts — Aggregate all 7 chapter provenance.json files into a
 * single citations.json bibliography artifact.
 *
 * Output: public/water-cycle/citations.json
 *
 * Idempotent: if the output already exists with matching input hashes, skip rebuild.
 *
 * Run via: tsx scripts/transform/water-cycle/build-citations.ts
 *   or:    npm run build:water-cycle-citations
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const PUBLIC_DIR = path.join(ROOT, "public", "water-cycle");
const OUTPUT_FILE = path.join(PUBLIC_DIR, "citations.json");
const CHAPTERS = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"] as const;
type ChapterId = (typeof CHAPTERS)[number];

// ============================================================
// Types
// ============================================================

interface SceneLayerSource {
  dataset: string;
  url: string;
  doi?: string;
  version?: string;
  year_keyframe?: number;
  filter?: string;
  n_features?: number;
  preprocessing?: string[];
}

interface SceneLayer {
  id: string;
  type: string;
  source: SceneLayerSource;
  render_geometry_id: string;
  color: string;
}

interface HeadlineNumber {
  value: string;
  label: string;
  citation: string;
  uncertainty?: string;
}

interface Provenance {
  chapter_id: ChapterId;
  shot_id: string;
  duration_s: number;
  scene_layers: SceneLayer[];
  headline_numbers: HeadlineNumber[];
  caption_text: string;
  generated_at: string;
}

interface CitationsDataset {
  doi: string;
  name: string;
  url: string;
  license?: string;
  year?: number;
  cited_in_chapters: string[];
}

interface CitationsHeadline {
  value: string;
  label: string;
  citation: string;
  chapters: string[];
}

interface CitationsJson {
  generated_at: string;
  n_unique_datasets: number;
  n_headline_citations: number;
  _input_hash: string;
  datasets: CitationsDataset[];
  headlines: CitationsHeadline[];
}

// ============================================================
// License lookup — datasets we recognise by DOI prefix / URL pattern
// ============================================================

const LICENSE_MAP: Record<string, string> = {
  "10.26066/rds.": "CC-BY 4.0",
  "10.26066/icimod.": "CC-BY 4.0",
  "10.5194/tc-": "CC-BY 3.0",
  "10.5194/acp-": "CC-BY 3.0",
  "10.1038/": "All Rights Reserved",
  "10.1126/science.": "All Rights Reserved",
  "10.5067/": "Public Domain (NASA)",
  "10.6096/": "CC-BY 4.0",
  "10.3929/": "CC-BY 4.0",
  "10.3189/": "CC-BY 3.0",
  opentopography: "Public Domain (NASA/USGS)",
  worldpop: "CC-BY 4.0",
  openstreetmap: "ODbL",
  "docs.oggm.org": "Open",
  "evk2.isac.cnr.it": "Institutional",
  "rds.icimod.org": "CC-BY 4.0",
  "ipcc.ch": "Citations only",
};

function inferLicense(doi?: string, url?: string): string | undefined {
  const needle = doi ?? url ?? "";
  for (const [prefix, license] of Object.entries(LICENSE_MAP)) {
    if (needle.includes(prefix)) return license;
  }
  return undefined;
}

// ============================================================
// Year extraction — try doi / url for year hints, else undefined
// ============================================================

function inferYear(doi?: string, url?: string): number | undefined {
  // Look for 4-digit year in DOI / URL
  const candidates = [doi, url].filter(Boolean).join(" ");
  const match = candidates.match(/\b(19|20)\d{2}\b/);
  if (match) {
    const y = parseInt(match[0], 10);
    if (y >= 1970 && y <= 2030) return y;
  }
  return undefined;
}

// ============================================================
// Core aggregation logic
// ============================================================

interface AggregatedDataset extends CitationsDataset {
  _doi_key: string; // internal dedup key
}

function aggregateProvenance(chapters: Map<ChapterId, Provenance>): {
  datasets: CitationsDataset[];
  headlines: CitationsHeadline[];
} {
  // Dedup map: key = doi (preferred) or `name:${dataset}` fallback
  const byKey = new Map<string, AggregatedDataset>();
  // Headline dedup: key = citation+value pair
  const headlinesByKey = new Map<
    string,
    { value: string; label: string; citation: string; chapters: Set<ChapterId> }
  >();

  for (const [chId, prov] of chapters.entries()) {
    // ---- scene layers ----
    for (const layer of prov.scene_layers) {
      const { dataset, url, doi } = layer.source;
      const key = doi ? `doi:${doi}` : `name:${dataset}`;

      if (byKey.has(key)) {
        const existing = byKey.get(key)!;
        if (!existing.cited_in_chapters.includes(chId)) {
          existing.cited_in_chapters.push(chId);
        }
      } else {
        byKey.set(key, {
          _doi_key: key,
          doi: doi ?? "",
          name: dataset,
          url,
          license: inferLicense(doi, url),
          year: inferYear(doi, url),
          cited_in_chapters: [chId],
        });
      }
    }

    // ---- headline numbers ----
    for (const hn of prov.headline_numbers) {
      const key = `${hn.citation}|${hn.value}`;
      if (headlinesByKey.has(key)) {
        headlinesByKey.get(key)!.chapters.add(chId);
      } else {
        headlinesByKey.set(key, {
          value: hn.value,
          label: hn.label,
          citation: hn.citation,
          chapters: new Set([chId]),
        });
      }
    }
  }

  // Sort datasets: DOI entries first (alphabetical), then name-only
  const datasets = [...byKey.values()]
    .map(({ _doi_key: _k, ...rest }) => rest)
    .sort((a, b) => {
      const aDoi = a.doi ? 0 : 1;
      const bDoi = b.doi ? 0 : 1;
      if (aDoi !== bDoi) return aDoi - bDoi;
      return a.name.localeCompare(b.name);
    });

  const headlines = [...headlinesByKey.values()].map(({ chapters, ...rest }) => ({
    ...rest,
    chapters: [...chapters].sort(),
  }));

  return { datasets, headlines };
}

// ============================================================
// Hash helper — SHA-256 of all input provenance files combined
// ============================================================

function hashInputs(texts: string[]): string {
  return createHash("sha256").update(texts.join("\n")).digest("hex").slice(0, 16);
}

// ============================================================
// Main
// ============================================================

function main() {
  // 1. Read all provenance files
  const provenanceTexts: string[] = [];
  const chapters = new Map<ChapterId, Provenance>();

  for (const ch of CHAPTERS) {
    const filePath = path.join(PUBLIC_DIR, ch, "provenance.json");
    if (!existsSync(filePath)) {
      console.warn(`[build-citations] Missing ${filePath} — skipping chapter ${ch}`);
      continue;
    }
    const text = readFileSync(filePath, "utf-8");
    provenanceTexts.push(text);
    chapters.set(ch, JSON.parse(text) as Provenance);
  }

  if (chapters.size === 0) {
    console.warn("[build-citations] No provenance files found. Skipping output.");
    process.exit(0);
  }

  const inputHash = hashInputs(provenanceTexts);

  // 2. Idempotency check — if output exists with matching hash, skip
  if (existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8")) as CitationsJson;
      if (existing._input_hash === inputHash) {
        console.log(
          `[build-citations] Output is up to date (hash ${inputHash}). Skipping rebuild.`,
        );
        process.exit(0);
      }
    } catch {
      // Corrupt or wrong format — rebuild
    }
  }

  // 3. Aggregate
  const { datasets, headlines } = aggregateProvenance(chapters);

  // 4. Write output
  const output: CitationsJson = {
    generated_at: new Date().toISOString(),
    n_unique_datasets: datasets.length,
    n_headline_citations: headlines.length,
    _input_hash: inputHash,
    datasets,
    headlines,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");

  console.log(
    `[build-citations] Wrote ${datasets.length} unique datasets and ${headlines.length} headlines → ${OUTPUT_FILE}`,
  );
}

main();
