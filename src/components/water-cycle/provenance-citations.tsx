/**
 * provenance-citations.tsx — Side-panel content for the Provenance Peel
 *
 * Renders the full citation list for a chapter's provenance.json:
 *   - Scene layer citations (dataset, DOI, license, filter, preprocessing)
 *   - Headline number citations
 *   - Render metadata (generated_at, blender_version, bpy_script_hash)
 *
 * This is a pure data-rendering component — no animations, no state.
 * The slide-in animation is owned by the parent <ProvenancePeel> aside element.
 *
 * Layout matches spec §06 side-panel wireframe.
 */
"use client";

import type { HeadlineNumber, Provenance, SceneLayer } from "@/lib/water-cycle/types";

// ---------------------------------------------------------------------------
// Color grammar labels for screen readers
// ---------------------------------------------------------------------------

const COLOR_LABELS: Record<string, string> = {
  "#7DD3FC": "ice / glaciers",
  "#0E7490": "lakes",
  "#38BDF8": "active water",
  "#F87171": "loss / risk",
  "#FBBF24": "heat",
  "#FCD34D": "people",
  "#475569": "terrain",
};

function colorLabel(hex: string): string {
  return COLOR_LABELS[hex.toUpperCase()] ?? hex;
}

// ---------------------------------------------------------------------------
// SceneLayerCitation
// ---------------------------------------------------------------------------

type SceneLayerCitationProps = {
  layer: SceneLayer;
};

function SceneLayerCitation({ layer }: SceneLayerCitationProps) {
  const { source, thickness_model, color } = layer;

  return (
    <article className="mb-5" aria-label={`Source: ${source.dataset}`}>
      {/* Colour swatch + dataset title */}
      <div className="flex items-start gap-2 mb-1">
        <span
          className="mt-0.5 flex-shrink-0 w-1 h-full min-h-[3rem] rounded-full"
          style={{ backgroundColor: color }}
          aria-label={`Colour: ${colorLabel(color)}`}
          role="img"
        />
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white leading-snug">{source.dataset}</h4>

          {/* DOI */}
          {source.doi && (
            <p className="text-xs text-slate-400 mt-0.5">
              doi:{" "}
              <a
                href={`https://doi.org/${source.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-slate-600 hover:decoration-sky-400 hover:text-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-400 rounded"
              >
                {source.doi}
              </a>
            </p>
          )}

          {/* Version */}
          {source.version && (
            <p className="text-xs text-slate-500 mt-0.5">Version: {source.version}</p>
          )}

          {/* Year keyframe */}
          {source.year_keyframe !== undefined && (
            <p className="text-xs text-slate-500 mt-0.5">Year: {source.year_keyframe}</p>
          )}

          {/* n_features */}
          {source.n_features !== undefined && (
            <p className="text-xs text-slate-500 mt-0.5">
              {source.n_features.toLocaleString()} features
            </p>
          )}

          {/* Filter */}
          {source.filter && (
            <p className="text-xs text-slate-500 mt-0.5">
              Filter: <span className="font-mono text-xs">{source.filter}</span>
            </p>
          )}

          {/* Preprocessing steps */}
          {source.preprocessing && source.preprocessing.length > 0 && (
            <div className="mt-1">
              <p className="text-xs text-slate-500">Preprocess:</p>
              <ul className="mt-0.5 space-y-0.5">
                {source.preprocessing.map((step) => (
                  <li
                    key={step}
                    className="font-mono text-xs text-slate-400 pl-2 border-l border-slate-700"
                  >
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Download link */}
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 underline decoration-sky-800 hover:decoration-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 rounded"
              aria-label={`Download ${source.dataset}`}
            >
              Download GeoJSON →
            </a>
          )}

          {/* Thickness model (if present) */}
          {thickness_model && (
            <div className="mt-2 pl-2 border-l-2 border-amber-800">
              <p className="text-xs text-slate-400 font-semibold">Ice thickness model</p>
              <p className="text-xs text-slate-400">{thickness_model.method}</p>
              {thickness_model.doi && (
                <p className="text-xs text-slate-500">
                  doi:{" "}
                  <a
                    href={`https://doi.org/${thickness_model.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-slate-600 hover:decoration-sky-400 hover:text-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-400 rounded"
                  >
                    {thickness_model.doi}
                  </a>
                </p>
              )}
              <p className="text-xs text-slate-500">
                Uncertainty: ±{thickness_model.uncertainty_pct}%
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// HeadlineCitations
// ---------------------------------------------------------------------------

type HeadlineCitationsProps = {
  numbers: readonly HeadlineNumber[];
};

export function HeadlineCitations({ numbers }: HeadlineCitationsProps) {
  if (numbers.length === 0) return null;

  return (
    <section aria-label="Headline numbers">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Headline numbers
      </h4>
      <ul className="space-y-3">
        {numbers.map((num) => {
          const href = num.citation.startsWith("doi:")
            ? `https://doi.org/${num.citation.slice(4)}`
            : num.citation.startsWith("url:")
              ? num.citation.slice(4)
              : undefined;

          return (
            <li key={`${num.value}-${num.label}`} className="flex gap-2">
              <span
                className="flex-shrink-0 mt-0.5 w-1 rounded-full bg-sky-400 self-stretch"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-bold text-white tabular-nums">{num.value}</p>
                <p className="text-xs text-slate-400">{num.label}</p>
                {num.uncertainty && <p className="text-xs text-slate-500">{num.uncertainty}</p>}
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 underline hover:text-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-400 rounded"
                  >
                    {num.citation}
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SceneLayerCitations (list of all layers)
// ---------------------------------------------------------------------------

type SceneLayerCitationsProps = {
  layers: readonly SceneLayer[];
};

export function SceneLayerCitations({ layers }: SceneLayerCitationsProps) {
  if (layers.length === 0) return null;

  return (
    <section aria-label="Dataset sources">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Datasets
      </h4>
      {layers.map((layer) => (
        <SceneLayerCitation key={layer.id} layer={layer} />
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// RenderMetadata
// ---------------------------------------------------------------------------

type RenderMetadataProps = {
  provenance: Provenance;
};

export function RenderMetadata({ provenance }: RenderMetadataProps) {
  const shortHash = provenance.bpy_script_hash.slice(0, 8);
  const formattedDate = new Date(provenance.generated_at).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <section aria-label="Render metadata">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        Render info
      </h4>
      <dl className="text-xs text-slate-500 space-y-1">
        <div className="flex gap-2">
          <dt className="text-slate-600">Generated</dt>
          <dd>
            <time dateTime={provenance.generated_at}>{formattedDate}</time>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-600">Blender</dt>
          <dd>{provenance.blender_version}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-600">Script hash</dt>
          <dd>
            <code className="font-mono" title={provenance.bpy_script_hash}>
              {shortHash}…
            </code>
          </dd>
        </div>
      </dl>
    </section>
  );
}
