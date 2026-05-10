/**
 * source-outlines.tsx — Layer 1 of the Provenance Peel
 *
 * Renders SVG overlay outlines for every polygon / polygon-extrusion layer
 * in provenance.scene_layers, color-coded by dataset per the color grammar
 * in WATER_CYCLE_SPEC.md §7.
 *
 * Real screen-space projection (via pre-computed screenspace.json) is deferred
 * to the T3.x render tasks.  This PR ships placeholder shapes that correctly
 * wire the dataset colour grammar and label text so the peel UI is fully
 * functional visually.
 *
 * Color grammar (§7 — violations are bugs):
 *   #7DD3FC = ice/glaciers   #0E7490 = lakes       #38BDF8 = active water
 *   #F87171 = loss/risk      #FBBF24 = heat         #FCD34D = people
 *   #475569 = terrain
 */
"use client";

import type { Provenance, SceneLayer } from "@/lib/water-cycle/types";

// ---------------------------------------------------------------------------
// Animation timing (per spec §5 open animation table)
// 100-300ms window → 200ms stroke-dashoffset draw
// Implemented via CSS animation on each path.
// ---------------------------------------------------------------------------

/** Return the spec-correct stroke color for a layer based on its dataset name. */
function layerStrokeColor(layer: SceneLayer): string {
  // Use the color field from the provenance — it was validated against the
  // colour grammar by the schema validator.
  return layer.color;
}

/**
 * Placeholder polygon path for one layer.
 * Each polygon is a distinct staggered rectangle so multiple layers are
 * visually distinguishable before real screen-space coords land in T3.x.
 */
function placeholderPath(index: number, total: number): string {
  const step = 100 / Math.max(total, 1);
  const margin = 8 + index * 12;
  const x1 = margin;
  const y1 = margin;
  const x2 = 100 - margin;
  const y2 = 100 - margin;
  // Slight offset per layer so they don't fully overlap
  const off = index * step * 0.08;
  return `M${x1 + off},${y1 + off} L${x2 - off},${y1 + off} L${x2 - off},${y2 - off} L${x1 + off},${y2 - off} Z`;
}

type Props = {
  provenance: Provenance;
};

/**
 * Layer 1 — source-dataset outlines SVG overlay.
 *
 * Positioned absolutely over the cinematic video (parent must be
 * `position: relative`).  The SVG uses a viewBox of 0 0 100 100 (percentage
 * coordinates) so it scales with any video aspect ratio.
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
      // Layer 1 appears between 100-300ms; handled by parent CSS class
    >
      <title>Source dataset outlines</title>
      {polygonLayers.map((layer, idx) => {
        const stroke = layerStrokeColor(layer);
        const pathD = placeholderPath(idx, polygonLayers.length);
        // Stroke-dashoffset animation: draw-in over 200ms
        const animDelay = `${100 + idx * 20}ms`;

        // cross-hatch fill for Somos-Valenzuela 2014 per spec
        const fillValue = layer.source.dataset.toLowerCase().includes("somos")
          ? `url(#hatch-${layer.id})`
          : "none";
        return (
          <g key={layer.id} aria-label={layer.source.dataset}>
            <path
              d={pathD}
              fill={fillValue}
              stroke={stroke}
              strokeWidth="0.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                // Start invisible, animate stroke draw-in
                strokeDasharray: 200,
                strokeDashoffset: 200,
                animation: `wc-stroke-draw 200ms cubic-bezier(0.16, 1, 0.3, 1) ${animDelay} forwards`,
              }}
            />
            {/* Dataset label — small text near top-left of each shape */}
            <text
              x={8 + idx * 1.5}
              y={8 + idx * 1.5 + 3}
              fontSize="2.2"
              fill={stroke}
              fontFamily="system-ui, sans-serif"
              aria-label={layer.source.dataset}
              style={{
                opacity: 0,
                animation: `wc-fade-in 150ms cubic-bezier(0.16, 1, 0.3, 1) ${animDelay} forwards`,
              }}
            >
              {layer.source.dataset.length > 32
                ? `${layer.source.dataset.slice(0, 32)}…`
                : layer.source.dataset}
            </text>
          </g>
        );
      })}

      {/* Cross-hatch pattern defs for Somos-Valenzuela historical outlines */}
      <defs>
        {polygonLayers.map(
          (layer) =>
            layer.source.dataset.toLowerCase().includes("somos") && (
              <pattern
                key={`hatch-${layer.id}`}
                id={`hatch-${layer.id}`}
                patternUnits="userSpaceOnUse"
                width="3"
                height="3"
              >
                <path d="M0,3 L3,0" stroke={layer.color} strokeWidth="0.5" opacity="0.4" />
              </pattern>
            ),
        )}
      </defs>

      {/* Keyframe animation styles injected inline — no Framer Motion */}
      <style>{`
        @keyframes wc-stroke-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes wc-fade-in {
          to { opacity: 1; }
        }
      `}</style>
    </svg>
  );
}
