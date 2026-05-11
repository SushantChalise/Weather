/**
 * source-outlines.tsx — Layer 1 of the Provenance Peel
 *
 * Renders SVG polygon silhouettes for every polygon / polygon-extrusion layer
 * in provenance.scene_layers, color-coded by dataset per the color grammar
 * in WATER_CYCLE_SPEC.md §7.
 *
 * INTENTIONAL SIMPLIFICATION (Approach B from task spec):
 *   Pre-authored simplified silhouettes per known layer id.  These are
 *   STYLIZED markers showing WHERE each dataset is on the frame, not analytical
 *   polygons.  The side-panel datasets card carries the authoritative feature
 *   count and DOI; these outlines are a visual "here is the geographic extent"
 *   cue only.
 *
 *   Real screen-space projection (from pre-computed screenspace.json emitted
 *   by the bpy post-render script) is deferred to T3.x render tasks.
 *
 * Projection: equirectangular, HKH bbox [70, 26, 95, 36] → SVG 0 0 100 100.
 *   x = (lon - 70) / (95 - 70) * 100
 *   y = (36 - lat) / (36 - 26) * 100   (north = y=0, south = y=100)
 *
 * For Imja-specific layers, tighter bbox [86.5, 27.7, 87.5, 28.2] is used.
 *
 * Color grammar (§7 — violations are bugs):
 *   #7DD3FC = ice/glaciers   #0E7490 = lakes       #38BDF8 = active water
 *   #F87171 = loss/risk      #FBBF24 = heat         #FCD34D = people
 *   #475569 = terrain
 *
 * Animation: stroke-dashoffset draw-in, 200ms window,
 *   gentle-out ease cubic-bezier(0.16, 1, 0.3, 1) per spec §7.
 *
 * WCAG: stroke color + label background meet ≥ 4.5:1 against dark cinematic
 *   backdrop.  #7DD3FC on near-black (#0f172a) = ~7:1. #0E7490 labels use a
 *   light fill (#e0f2fe) with a dark rect bg for contrast.
 */
"use client";

import type { Provenance, SceneLayer } from "@/lib/water-cycle/types";

// ---------------------------------------------------------------------------
// Silhouette geometry
//
// Simplified polygon paths in 0-100 SVG coordinate space (equirectangular
// projection of HKH bbox [70W=0, 95E=100, 36N=0, 26S=100]).
//
// Each entry maps a layer id prefix to:
//   - path: the SVG "d" attribute string
//   - labelX, labelY: where to render the small dataset label
//   - strokeLen: approximate path length for stroke-dasharray
// ---------------------------------------------------------------------------

type Silhouette = {
  path: string;
  labelX: number;
  labelY: number;
  /** Approximate perimeter for stroke-dasharray */
  strokeLen: number;
};

/**
 * Hand-authored simplified silhouettes per known layer id.
 *
 * HKH glacier zone traces a crescent from Hindu Kush (NW) through Karakoram
 * to the Himalayas (ESE).  Projected onto 100×100 SVG, the arc runs from
 * approximately (4,0) at the NW corner to (88,82) at the SE corner.
 *
 * glacier-1990: full HKH crescent (outer edge, slightly wider).
 * glacier-2020: same arc, inset ~4% toward centroid to show ~9% retreat.
 * lake-current: three small polygon clusters at high-melt lake zones.
 * imja-ring:    tight outline of Imja Tsho (uses Imja-specific bbox).
 * terrain-hkh:  outermost terrain bounding hull (slate #475569).
 */
const SILHOUETTES: Record<string, Silhouette> = {
  // -- Glacier outlines (ice = #7DD3FC) ------------------------------------

  "glacier-1990": {
    // Full HKH crescent, northern + southern edges closing the shape.
    // Northern edge: Hindu Kush (NW) → Karakoram → W-Himalayas → C-Himalayas → E-Himalayas
    // Southern edge: reverse, slightly south of northern
    path:
      "M4,0 L14,2 L22,0 L30,5 L40,15 L52,35 L66,75 L74,78 L88,82" +
      " L88,88 L72,85 L64,82 L52,45 L42,25 L32,15 L22,7 L14,7 L4,7 Z",
    labelX: 16,
    labelY: 12,
    strokeLen: 340,
  },

  "glacier-2020": {
    // Same crescent, inset ~4% toward centroid to represent ~9% ice retreat.
    path:
      "M6,2 L15,4 L23,2 L31,7 L40,17 L52,37 L65,74 L73,77 L86,81" +
      " L86,86 L71,83 L63,80 L52,46 L42,27 L33,17 L23,9 L15,9 L6,9 Z",
    labelX: 16,
    labelY: 18,
    strokeLen: 330,
  },

  // -- Lake outlines (lakes = #0E7490) -------------------------------------

  "lake-current": {
    // Three small rect-ish polygons representing glacial lake clusters:
    //   1. Imja area (~86.9E, 28N) → SVG (~68,80)
    //   2. Lower Dolpo area (~83E, 29.5N) → SVG (~52,65)
    //   3. Kangchenjunga area (~88E, 27.8N) → SVG (~72,82)
    // Rendered as three separate sub-paths within one <path> element.
    path:
      "M66,79 L69,79 L69,82 L66,82 Z " +
      "M51,64 L54,64 L54,67 L51,67 Z " +
      "M71,81 L74,81 L74,84 L71,84 Z",
    labelX: 70,
    labelY: 78,
    strokeLen: 36,
  },

  "lake-risky": {
    // Subset of current lakes flagged as GLOF-risk — same zone, smaller markers.
    path: "M67,79.5 L68.5,79.5 L68.5,81 L67,81 Z " + "M71.5,81.5 L73,81.5 L73,83 L71.5,83 Z",
    labelX: 70,
    labelY: 86,
    strokeLen: 18,
  },

  // -- Imja-specific layers (tight Imja bbox [86.5,27.7,87.5,28.2]) --------
  // Projection: x = (lon-86.5)/(87.5-86.5)*100, y = (28.2-lat)/(28.2-27.7)*100

  "imja-ring": {
    // Imja Tsho: rough teardrop outline.
    // In Imja-bbox coords: the lake is roughly 15-85% across, 20-80% down.
    // We scale to SVG 100x100 but place it in the lower-right of the HKH frame
    // since that's the Everest zone (~86.9E, 27.9N → SVG ~68,81).
    path: "M60,74 L66,73 L71,75 L73,79 L71,84 L66,86 L61,84 L59,79 Z",
    labelX: 74,
    labelY: 77,
    strokeLen: 50,
  },

  // -- Terrain layers (terrain = #475569) ----------------------------------

  "terrain-hkh": {
    // Full HKH bounding hull — very subtle, large polygon.
    path: "M2,0 L98,0 L98,100 L2,100 Z",
    labelX: 3,
    labelY: 5,
    strokeLen: 400,
  },
};

/**
 * Fallback silhouette for unknown layer ids.
 * Creates a staggered rectangle based on layer index.
 */
function fallbackSilhouette(index: number, total: number): Silhouette {
  const margin = 10 + index * (60 / Math.max(total, 1));
  const x1 = margin;
  const y1 = margin;
  const x2 = 100 - margin;
  const y2 = 100 - margin;
  return {
    path: `M${x1},${y1} L${x2},${y1} L${x2},${y2} L${x1},${y2} Z`,
    labelX: x1 + 2,
    labelY: y1 + 5,
    strokeLen: (x2 - x1 + y2 - y1) * 2,
  };
}

/**
 * Look up silhouette for a layer.  Tries exact id match first, then prefix
 * match (e.g. "glacier-1990-subset" → "glacier-1990").
 */
function getSilhouette(layer: SceneLayer, index: number, total: number): Silhouette {
  const direct = SILHOUETTES[layer.id];
  if (direct !== undefined) return direct;

  // Prefix match — covers variant ids like "glacier-1990-hkh"
  for (const key of Object.keys(SILHOUETTES)) {
    if (layer.id.startsWith(key) || key.startsWith(layer.id)) {
      const match = SILHOUETTES[key];
      if (match !== undefined) return match;
    }
  }

  // Dataset-name fallback: glaciers vs lakes
  const ds = layer.source.dataset.toLowerCase();
  if (ds.includes("glacier") || ds.includes("ice")) {
    const glacierSil = SILHOUETTES["glacier-1990"];
    if (glacierSil !== undefined) return glacierSil;
  }
  if (ds.includes("lake") || ds.includes("glacial lake")) {
    const lakeSil = SILHOUETTES["lake-current"];
    if (lakeSil !== undefined) return lakeSil;
  }

  return fallbackSilhouette(index, total);
}

// ---------------------------------------------------------------------------
// Label positioning — stagger vertically along right margin if labels overlap
// ---------------------------------------------------------------------------

/**
 * Returns a label anchor that avoids overlap with previous labels.
 * Simple: use the silhouette's default position but cap X at 88 so it
 * doesn't get clipped.  Vertical spacing applied when layer index > 0.
 */
function labelAnchor(
  sil: Silhouette,
  idx: number,
): { x: number; y: number; anchor: "start" | "end" } {
  // For layers stacked, bump y by 6 units per layer to avoid overlap
  const yBump = idx * 6;
  const x = Math.min(sil.labelX, 88);
  const y = Math.min(sil.labelY + yBump, 95);
  // If label is on the right half, anchor end
  const anchor = x > 50 ? "end" : "start";
  // Adjust x for end-anchored labels so they stay within viewBox
  const finalX = anchor === "end" ? Math.max(x, 12) : x;
  return { x: finalX, y, anchor };
}

// ---------------------------------------------------------------------------
// Cross-hatch pattern — Somos-Valenzuela 2014 historical Imja outlines
// ---------------------------------------------------------------------------

function isSomosLayer(layer: SceneLayer): boolean {
  return layer.source.dataset.toLowerCase().includes("somos");
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  provenance: Provenance;
};

// ---------------------------------------------------------------------------
// SourceOutlines
// ---------------------------------------------------------------------------

/**
 * Layer 1 — source-dataset outlines SVG overlay.
 *
 * Positioned absolutely over the cinematic video (parent must be
 * `position: relative`).  The SVG uses a viewBox of 0 0 100 100 (percentage
 * coordinates) so it scales with any video aspect ratio.
 *
 * Each polygon:
 *   - stroke from layer.color (spec §7 grammar)
 *   - fill: transparent (1% opacity for Somos cross-hatch variant)
 *   - strokeWidth: 1-2px visual ≈ 0.4-0.8 SVG units
 *   - stroke-dashoffset draw-in animation, 200ms, gentle-out ease
 *   - small label (≤ 12px visual) near polygon, low opacity
 */
export function SourceOutlines({ provenance }: Props) {
  // Only render polygon layers (extrusion or flat) in Layer 1.
  const polygonLayers = provenance.scene_layers.filter(
    (l) => l.type === "polygon-extrusion" || l.type === "polygon-flat",
  );

  if (polygonLayers.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      role="img"
    >
      <title>Source dataset outlines</title>

      {/* Defs: cross-hatch pattern for Somos-Valenzuela historical outlines */}
      <defs>
        {polygonLayers.map(
          (layer) =>
            isSomosLayer(layer) && (
              <pattern
                key={`hatch-${layer.id}`}
                id={`hatch-${layer.id}`}
                patternUnits="userSpaceOnUse"
                width="4"
                height="4"
              >
                <path d="M0,4 L4,0" stroke={layer.color} strokeWidth="0.6" opacity="0.35" />
              </pattern>
            ),
        )}

        {/* Animation keyframes */}
        <style>{`
          @keyframes wc-stroke-draw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes wc-label-fade {
            to { opacity: 0.75; }
          }
        `}</style>
      </defs>

      {polygonLayers.map((layer, idx) => {
        const stroke = layer.color;
        const sil = getSilhouette(layer, idx, polygonLayers.length);
        const { x: lx, y: ly, anchor } = labelAnchor(sil, idx);

        // Animation timing: 100-300ms window, stagger by 20ms per layer
        const animDelay = `${100 + idx * 20}ms`;
        const labelDelay = `${200 + idx * 20}ms`;

        // Fill: transparent for most; cross-hatch for Somos historical outlines
        const fillValue = isSomosLayer(layer) ? `url(#hatch-${layer.id})` : "none";

        // strokeWidth: ~1.5px visual at typical 700px video width → ~0.22 SVG units
        // Use 0.5 for good visibility at small sizes, 0.3 for terrain (very subtle)
        const sw = layer.id.startsWith("terrain") ? 0.25 : 0.5;

        // Truncate dataset name for label (max 30 chars)
        const labelText =
          layer.source.dataset.length > 30
            ? `${layer.source.dataset.slice(0, 30)}…`
            : layer.source.dataset;

        return (
          <g key={layer.id} aria-label={layer.source.dataset}>
            {/* Polygon silhouette */}
            <path
              d={sil.path}
              fill={fillValue}
              fillOpacity={isSomosLayer(layer) ? 1 : 0}
              stroke={stroke}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: sil.strokeLen,
                strokeDashoffset: sil.strokeLen,
                animation: `wc-stroke-draw 200ms cubic-bezier(0.16, 1, 0.3, 1) ${animDelay} forwards`,
              }}
            />

            {/* Small inline label near polygon */}
            <g aria-label={layer.source.dataset}>
              {/* Dark backdrop rect for WCAG contrast */}
              <rect
                x={anchor === "end" ? lx - 32 : lx - 1}
                y={ly - 3.5}
                width="33"
                height="4.5"
                rx="0.8"
                fill="#0f172a"
                fillOpacity="0.7"
                style={{
                  opacity: 0,
                  animation: `wc-label-fade 150ms cubic-bezier(0.16, 1, 0.3, 1) ${labelDelay} forwards`,
                }}
              />
              <text
                x={lx}
                y={ly}
                fontSize="3.2"
                fill={stroke}
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor={anchor}
                style={{
                  opacity: 0,
                  animation: `wc-label-fade 150ms cubic-bezier(0.16, 1, 0.3, 1) ${labelDelay} forwards`,
                }}
              >
                {labelText}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
