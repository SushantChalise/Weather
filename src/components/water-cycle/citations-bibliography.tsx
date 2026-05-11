/**
 * citations-bibliography.tsx — Full bibliography at page bottom.
 *
 * Loads /water-cycle/citations.json at runtime (client-side fetch via Next.js static
 * serving), then renders a sortable + searchable table.
 *
 * Spec compliance:
 *   - §7 color grammar: terrain #475569 for graphical/SVG elements only. For text,
 *     we use text-slate-400 (#94a3b8, ~6.8:1 contrast on slate-950) per WCAG 2.1 AA.
 *     active-water #38BDF8 for active sort header.
 *   - WCAG 2.1 AA: keyboard nav (Tab), focus rings on sort headers + search + chips,
 *     aria-sort attribute on column headers, aria-label on buttons.
 *   - Sort: DOI / Name / Year with toggle asc/desc on header click.
 *   - Search: debounced 150 ms, filters by DOI or dataset name.
 *   - "Cited in" chips link to /atlas/water-cycle#ch{N}.
 *   - Anchor: id="bibliography" at section root for #bibliography deep-link.
 *
 * NOTE on §7 terrain color (#475569): the terrain token is defined for visual
 * map elements (SVG strokes, swatch fills). Using it for body text (#475569 on
 * #0f172a = 2.7:1 contrast) fails WCAG AA. Text uses slate-400 (#94a3b8) instead.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  datasets: CitationsDataset[];
  headlines: Array<{
    value: string;
    label: string;
    citation: string;
    chapters: string[];
  }>;
}

// ============================================================
// Chapter display helpers
// ============================================================

const CHAPTER_LABELS: Record<string, string> = {
  ch0: "Ch 0 — The reservoir",
  ch1: "Ch 1 — The retreat",
  ch2: "Ch 2 — The lake bloom",
  ch3: "Ch 3 — Where it went",
  ch4: "Ch 4 — When it comes",
  ch5: "Ch 5 — The feedback loop",
  ch6: "Ch 6 — The choice",
};

function chapterLabel(ch: string): string {
  return CHAPTER_LABELS[ch] ?? ch;
}

// ============================================================
// Sorting
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

// ============================================================
// Debounce hook
// ============================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ============================================================
// SortHeader sub-component
// ============================================================

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}

function SortHeader({ label, sortKey, currentKey, dir, onSort }: SortHeaderProps) {
  const isActive = currentKey === sortKey;
  const ariaSort = isActive ? (dir === "asc" ? "ascending" : "descending") : "none";

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className="text-left py-2 pr-4 font-semibold text-xs uppercase tracking-wider select-none"
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 rounded px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        style={{
          color: isActive ? "#38BDF8" : "#94a3b8",
        }}
        aria-label={`Sort by ${label}${isActive ? ` (${dir === "asc" ? "ascending" : "descending"})` : ""}`}
      >
        {label}
        <span aria-hidden="true" className="text-[10px] w-3 inline-block text-center">
          {isActive ? (dir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </button>
    </th>
  );
}

// ============================================================
// Main component
// ============================================================

export function CitationsBibliography() {
  const [data, setData] = useState<CitationsJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchRaw, setSearchRaw] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const search = useDebounce(searchRaw, 150);

  // Load citations.json at runtime (served as a Next.js static file)
  useEffect(() => {
    let cancelled = false;
    fetch("/water-cycle/citations.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CitationsJson>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load citations");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sort handler — toggle direction if same key, reset to asc for new key
  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  // Filtered + sorted datasets
  const visibleDatasets = useMemo<CitationsDataset[]>(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    const filtered = q
      ? data.datasets.filter(
          (d) => d.doi.toLowerCase().includes(q) || d.name.toLowerCase().includes(q),
        )
      : data.datasets;
    return sortDatasets(filtered, sortKey, sortDir);
  }, [data, search, sortKey, sortDir]);

  // ---- Render ----

  return (
    <section
      id="bibliography"
      aria-label="Full bibliography — all data sources used in this page"
      className="bg-slate-950 border-t border-white/10 px-4 sm:px-8 py-16"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h2 className="text-white text-2xl font-bold mb-2">Data sources</h2>
        <p className="text-sm mb-2 text-slate-400">
          Every visual claim in this page is traceable to a primary dataset. All figures have been
          cross-referenced against ICIMOD HKH Cryosphere Assessment 2026.
        </p>
        {data && (
          <p className="text-xs mb-6 text-slate-400">
            {data.n_unique_datasets} unique datasets · {data.n_headline_citations} headline
            citations · generated {new Date(data.generated_at).toLocaleDateString()}
          </p>
        )}

        {/* Error state */}
        {error && (
          <p className="text-red-400 text-sm mb-6" role="alert">
            Could not load bibliography: {error}
          </p>
        )}

        {/* Loading skeleton */}
        {!data && !error && (
          <div role="status" aria-label="Loading bibliography">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
                key={i}
                className="h-8 rounded mb-3 animate-pulse"
                style={{ backgroundColor: "rgba(71,85,105,0.3)" }}
              />
            ))}
          </div>
        )}

        {/* Search box */}
        {data && (
          <>
            <div className="mb-4">
              <label htmlFor="bib-search" className="sr-only">
                Search bibliography by DOI or dataset name
              </label>
              <input
                id="bib-search"
                ref={searchRef}
                type="search"
                placeholder="Search by DOI or dataset name…"
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
                className="w-full sm:w-96 rounded border px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                style={{
                  backgroundColor: "rgba(15,23,42,0.8)",
                  borderColor: "#334155",
                }}
                aria-controls="bib-table"
              />
              {search && visibleDatasets.length === 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  No datasets match &ldquo;{search}&rdquo;
                </p>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table
                id="bib-table"
                className="w-full text-sm border-collapse"
                aria-label="Bibliography table"
              >
                <thead>
                  <tr className="border-b border-white/10" style={{ backgroundColor: "#0f172a" }}>
                    <SortHeader
                      label="Dataset"
                      sortKey="name"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="DOI"
                      sortKey="doi"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Year"
                      sortKey="year"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <th
                      scope="col"
                      className="text-left py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-slate-400"
                    >
                      License
                    </th>
                    <th
                      scope="col"
                      className="text-left py-2 font-semibold text-xs uppercase tracking-wider text-slate-400"
                    >
                      Cited in
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDatasets.map((d, idx) => (
                    <tr
                      key={d.doi || d.name}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      style={{ backgroundColor: idx % 2 === 1 ? "rgba(15,23,42,0.4)" : undefined }}
                    >
                      {/* Dataset name */}
                      <td className="py-3 pr-4 align-top max-w-xs">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-sky-300 underline decoration-slate-600 hover:decoration-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded text-xs leading-snug"
                        >
                          {d.name}
                        </a>
                      </td>

                      {/* DOI */}
                      <td className="py-3 pr-4 align-top">
                        {d.doi ? (
                          <a
                            href={`https://doi.org/${d.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs underline hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded text-slate-400"
                          >
                            {d.doi}
                          </a>
                        ) : (
                          <span className="text-xs italic text-slate-500">No DOI</span>
                        )}
                      </td>

                      {/* Year */}
                      <td className="py-3 pr-4 align-top">
                        <span className="text-xs text-slate-400">{d.year ?? "—"}</span>
                      </td>

                      {/* License */}
                      <td className="py-3 pr-4 align-top">
                        <span className="text-xs text-slate-400">{d.license ?? "—"}</span>
                      </td>

                      {/* Cited in — chapter chips */}
                      <td className="py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {d.cited_in_chapters.map((ch) => (
                            <a
                              key={ch}
                              href={`/atlas/water-cycle#${ch}`}
                              className="inline-block rounded px-2 py-0.5 text-xs font-medium border transition-colors hover:text-sky-300 hover:border-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                              style={{
                                color: "#94a3b8",
                                borderColor: "#334155",
                                backgroundColor: "rgba(51,65,85,0.3)",
                              }}
                              title={chapterLabel(ch)}
                              aria-label={`Chapter: ${chapterLabel(ch)}`}
                            >
                              {ch.replace("ch", "Ch ")}
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Download link */}
            <p className="mt-4 text-xs text-slate-400">
              <a
                href="/water-cycle/citations.json"
                download="water-cycle-citations.json"
                className="underline hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded"
              >
                Download citations.json
              </a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
