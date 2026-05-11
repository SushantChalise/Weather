/**
 * citations-bibliography.test.ts
 *
 * Snapshot + unit tests for citations-bibliography logic using the
 * merged public/water-cycle/citations.json as fixture.
 *
 * Environment: node (no DOM — vitest.config.ts environment:"node").
 * Tests pure data logic: parsing, sorting, filtering, deduplication.
 *
 * T4.4 acceptance: citations.json aggregates all 7 chapters; deduplicated.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// ============================================================
// Types (mirroring public/water-cycle/citations.json schema)
// ============================================================

interface CitationsDataset {
  doi: string;
  name: string;
  url: string;
  license?: string;
  year?: number;
  cited_in_chapters: string[];
}

interface CitationsJson {
  generated_at: string;
  n_unique_datasets: number;
  n_headline_citations: number;
  _input_hash: string;
  datasets: CitationsDataset[];
  headlines: Array<{
    value: string;
    label: string;
    citation: string;
    chapters: string[];
  }>;
}

// ============================================================
// Load fixture (the generated citations.json)
// ============================================================

function loadCitations(): CitationsJson {
  // process.cwd() is the repo root (where vitest runs from)
  const p = join(process.cwd(), "public/water-cycle/citations.json");
  return JSON.parse(readFileSync(p, "utf-8")) as CitationsJson;
}

// ============================================================
// Pure helpers mirroring component logic (tested here directly)
// ============================================================

type SortKey = "doi" | "name" | "year";
type SortDir = "asc" | "desc";

function sortDatasets(
  datasets: CitationsDataset[],
  key: SortKey,
  dir: SortDir,
): CitationsDataset[] {
  return [...datasets].sort((a, b) => {
    let cmp = 0;
    if (key === "doi") {
      cmp = (a.doi || "zzz").localeCompare(b.doi || "zzz");
    } else if (key === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (key === "year") {
      const ay = a.year ?? 9999;
      const by = b.year ?? 9999;
      cmp = ay - by;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function filterDatasets(datasets: CitationsDataset[], query: string): CitationsDataset[] {
  const q = query.toLowerCase().trim();
  if (!q) return datasets;
  return datasets.filter(
    (d) => d.doi.toLowerCase().includes(q) || d.name.toLowerCase().includes(q),
  );
}

// ============================================================
// Tests — citations.json structure
// ============================================================

describe("citations.json — file structure", () => {
  it("loads without throwing", () => {
    expect(() => loadCitations()).not.toThrow();
  });

  it("has required top-level fields", () => {
    const c = loadCitations();
    expect(typeof c.generated_at).toBe("string");
    expect(typeof c.n_unique_datasets).toBe("number");
    expect(typeof c.n_headline_citations).toBe("number");
    expect(typeof c._input_hash).toBe("string");
    expect(Array.isArray(c.datasets)).toBe(true);
    expect(Array.isArray(c.headlines)).toBe(true);
  });

  it("generated_at is a valid ISO 8601 string", () => {
    const c = loadCitations();
    const date = new Date(c.generated_at);
    expect(Number.isNaN(date.getTime())).toBe(false);
  });

  it("n_unique_datasets matches actual datasets array length", () => {
    const c = loadCitations();
    expect(c.n_unique_datasets).toBe(c.datasets.length);
  });

  it("n_headline_citations matches actual headlines array length", () => {
    const c = loadCitations();
    expect(c.n_headline_citations).toBe(c.headlines.length);
  });

  it("has at least one dataset", () => {
    const c = loadCitations();
    expect(c.datasets.length).toBeGreaterThan(0);
  });

  it("has at least one headline", () => {
    const c = loadCitations();
    expect(c.headlines.length).toBeGreaterThan(0);
  });

  it("full structure snapshot", () => {
    const c = loadCitations();
    // Snapshot the shape, not generated_at (timestamps vary)
    expect({
      n_unique_datasets: c.n_unique_datasets,
      n_headline_citations: c.n_headline_citations,
      dataset_names: c.datasets.map((d) => d.name).sort(),
      headline_values: c.headlines.map((h) => h.value).sort(),
    }).toMatchSnapshot();
  });
});

// ============================================================
// Tests — dataset shape
// ============================================================

describe("citations.json — dataset entries", () => {
  it("every dataset has doi (string, possibly empty), name, url, cited_in_chapters", () => {
    const c = loadCitations();
    for (const d of c.datasets) {
      expect(typeof d.doi).toBe("string");
      expect(typeof d.name).toBe("string");
      expect(d.name.length).toBeGreaterThan(0);
      expect(typeof d.url).toBe("string");
      expect(d.url.length).toBeGreaterThan(0);
      expect(Array.isArray(d.cited_in_chapters)).toBe(true);
      expect(d.cited_in_chapters.length).toBeGreaterThan(0);
    }
  });

  it("every cited_in_chapters value is a valid chapter id (ch0–ch6)", () => {
    const valid = new Set(["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"]);
    const c = loadCitations();
    for (const d of c.datasets) {
      for (const ch of d.cited_in_chapters) {
        expect(valid.has(ch), `Dataset "${d.name}" has invalid chapter id "${ch}"`).toBe(true);
      }
    }
  });

  it("no duplicate doi keys among entries with non-empty doi", () => {
    const c = loadCitations();
    const dois = c.datasets.filter((d) => d.doi).map((d) => d.doi);
    const unique = new Set(dois);
    expect(unique.size).toBe(dois.length);
  });

  it("datasets snapshot (names + chapters)", () => {
    const c = loadCitations();
    const snap = c.datasets.map((d) => ({
      name: d.name,
      doi: d.doi,
      chapters: d.cited_in_chapters.sort(),
    }));
    expect(snap).toMatchSnapshot();
  });
});

// ============================================================
// Tests — headline shape
// ============================================================

describe("citations.json — headlines", () => {
  it("every headline has value, label, citation, chapters", () => {
    const c = loadCitations();
    for (const h of c.headlines) {
      expect(typeof h.value).toBe("string");
      expect(h.value.length).toBeGreaterThan(0);
      expect(typeof h.label).toBe("string");
      expect(h.label.length).toBeGreaterThan(0);
      expect(typeof h.citation).toBe("string");
      expect(h.citation.length).toBeGreaterThan(0);
      expect(Array.isArray(h.chapters)).toBe(true);
      expect(h.chapters.length).toBeGreaterThan(0);
    }
  });

  it("headlines snapshot", () => {
    const c = loadCitations();
    expect(c.headlines).toMatchSnapshot();
  });
});

// ============================================================
// Tests — sorting logic (mirrors component sort function)
// ============================================================

describe("CitationsBibliography — sort logic", () => {
  it("sort by name asc: first item alphabetically smallest", () => {
    const c = loadCitations();
    const sorted = sortDatasets(c.datasets, "name", "asc");
    expect(sorted.length).toBe(c.datasets.length);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].name.localeCompare(sorted[i].name)).toBeLessThanOrEqual(0);
    }
  });

  it("sort by name desc: reverse of asc", () => {
    const c = loadCitations();
    const asc = sortDatasets(c.datasets, "name", "asc");
    const desc = sortDatasets(c.datasets, "name", "desc");
    expect(desc[0].name).toBe(asc[asc.length - 1].name);
  });

  it("sort by doi asc: empty-doi entries sort last", () => {
    const c = loadCitations();
    const sorted = sortDatasets(c.datasets, "doi", "asc");
    const emptyDoiIndex = sorted.findIndex((d) => !d.doi);
    if (emptyDoiIndex !== -1) {
      // All entries before emptyDoiIndex should have non-empty doi
      for (let i = 0; i < emptyDoiIndex; i++) {
        expect(sorted[i].doi).toBeTruthy();
      }
    }
  });

  it("sort by year asc: entries with year sort before entries without", () => {
    const c = loadCitations();
    const sorted = sortDatasets(c.datasets, "year", "asc");
    const withYear = sorted.filter((d) => d.year !== undefined);
    const withoutYear = sorted.filter((d) => d.year === undefined);
    if (withYear.length > 0 && withoutYear.length > 0) {
      // Find last withYear index
      const lastWithYearIdx = sorted.map((d) => d.year !== undefined).lastIndexOf(true);
      // First withoutYear should appear after
      const firstWithoutIdx = sorted.findIndex((d) => d.year === undefined);
      expect(firstWithoutIdx).toBeGreaterThan(lastWithYearIdx);
    }
  });

  it("sort is stable (same key + dir = same result twice)", () => {
    const c = loadCitations();
    const a = sortDatasets(c.datasets, "name", "asc").map((d) => d.name);
    const b = sortDatasets(c.datasets, "name", "asc").map((d) => d.name);
    expect(a).toEqual(b);
  });

  it("sorted by name asc snapshot", () => {
    const c = loadCitations();
    const sorted = sortDatasets(c.datasets, "name", "asc").map((d) => d.name);
    expect(sorted).toMatchSnapshot();
  });
});

// ============================================================
// Tests — filter/search logic (mirrors component filter function)
// ============================================================

describe("CitationsBibliography — search/filter logic", () => {
  it("empty query returns all datasets", () => {
    const c = loadCitations();
    const result = filterDatasets(c.datasets, "");
    expect(result.length).toBe(c.datasets.length);
  });

  it("query matching no entry returns empty array", () => {
    const c = loadCitations();
    const result = filterDatasets(c.datasets, "zzznomatch99999");
    expect(result.length).toBe(0);
  });

  it("search by doi prefix returns matching entries", () => {
    const c = loadCitations();
    const doiEntry = c.datasets.find((d) => d.doi);
    if (!doiEntry) return; // Skip if no DOI entries
    const partial = doiEntry.doi.slice(0, 8);
    const result = filterDatasets(c.datasets, partial);
    expect(result.some((d) => d.doi === doiEntry.doi)).toBe(true);
  });

  it("search by name fragment returns matching entries", () => {
    const c = loadCitations();
    const entry = c.datasets[0];
    const fragment = entry.name.slice(0, 6).toLowerCase();
    const result = filterDatasets(c.datasets, fragment);
    expect(result.some((d) => d.name === entry.name)).toBe(true);
  });

  it("search is case-insensitive", () => {
    const c = loadCitations();
    const entry = c.datasets.find((d) => d.doi);
    if (!entry) return;
    const fragment = entry.doi.slice(0, 6);
    const lower = filterDatasets(c.datasets, fragment.toLowerCase());
    const upper = filterDatasets(c.datasets, fragment.toUpperCase());
    expect(lower.length).toBe(upper.length);
  });
});
