/**
 * dem-grid.tsx — Layer 2 of the Provenance Peel
 *
 * Renders a sparse grid of "+" glyphs representing DEM sample points.
 * Per spec §06: ~30 grid points across the visible area with hover tooltip
 * showing elevation + source.
 *
 * Screen-space positioning from real DEM data is deferred to T3.x render
 * tasks.  This PR ships placeholder evenly-spaced grid dots.
 *
 * Per spec: Layer 2 is skipped on mobile (< 768px) to reduce visual noise.
 * The parent component (<ProvenancePeel>) handles the mobile guard — this
 * component can assume it is only mounted on desktop.
 *
 * Animation: fade-in, 100ms staggered across points (spec open-animation
 * table: 200-400ms window).
 */
"use client";

import { useState } from "react";
import type { Provenance } from "@/lib/water-cycle/types";

// ---------------------------------------------------------------------------
// Grid generation — 6×5 = 30 points (spec says ~30)
// ---------------------------------------------------------------------------
const COLS = 6;
const ROWS = 5;

type GridPoint = {
  id: string;
  cx: number; // SVG viewBox % coordinate (0-100)
  cy: number;
};

function buildGrid(): GridPoint[] {
  const points: GridPoint[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Distribute between 10-90% to avoid clipping at edges
      const cx = 10 + (c / (COLS - 1)) * 80;
      const cy = 10 + (r / (ROWS - 1)) * 80;
      points.push({ id: `dem-${r}-${c}`, cx, cy });
    }
  }
  return points;
}

const GRID_POINTS = buildGrid();

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

type TooltipState = {
  pointId: string;
  x: number;
  y: number;
} | null;

type Props = {
  provenance: Provenance;
};

export function DemGrid({ provenance: _provenance }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <title>DEM elevation sample points (SRTM 30m)</title>

      {GRID_POINTS.map((pt, idx) => {
        const animDelay = `${200 + idx * (200 / GRID_POINTS.length)}ms`;
        return (
          // biome-ignore lint/a11y/useSemanticElements: SVG <g> cannot be a <button>
          <g
            key={pt.id}
            role="button"
            className="pointer-events-auto cursor-crosshair"
            // hover handled via SVG events (no Framer Motion)
            onMouseEnter={(e) => {
              const svg = (e.currentTarget as SVGGElement).closest("svg");
              const rect = svg?.getBoundingClientRect();
              if (!rect) return;
              const vbX = ((e.clientX - rect.left) / rect.width) * 100;
              const vbY = ((e.clientY - rect.top) / rect.height) * 100;
              setTooltip({ pointId: pt.id, x: vbX, y: vbY });
            }}
            onMouseLeave={() => setTooltip(null)}
            onFocus={() => setTooltip({ pointId: pt.id, x: pt.cx, y: pt.cy })}
            onBlur={() => setTooltip(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setTooltip({ pointId: pt.id, x: pt.cx, y: pt.cy });
              }
            }}
            tabIndex={0}
            aria-label={`DEM sample point — elevation placeholder (SRTM 30m)`}
          >
            {/* "+" glyph */}
            <line
              x1={pt.cx - 1}
              y1={pt.cy}
              x2={pt.cx + 1}
              y2={pt.cy}
              stroke="#475569"
              strokeWidth="0.4"
              style={{
                opacity: 0,
                animation: `wc-dem-fade 100ms cubic-bezier(0.16, 1, 0.3, 1) ${animDelay} forwards`,
              }}
            />
            <line
              x1={pt.cx}
              y1={pt.cy - 1}
              x2={pt.cx}
              y2={pt.cy + 1}
              stroke="#475569"
              strokeWidth="0.4"
              style={{
                opacity: 0,
                animation: `wc-dem-fade 100ms cubic-bezier(0.16, 1, 0.3, 1) ${animDelay} forwards`,
              }}
            />
          </g>
        );
      })}

      {/* Tooltip */}
      {tooltip && (
        <g aria-live="polite" aria-label="Elevation tooltip">
          <rect
            x={Math.min(tooltip.x + 1, 70)}
            y={Math.min(tooltip.y - 8, 85)}
            width="28"
            height="7"
            rx="1"
            fill="#0f172a"
            fillOpacity="0.9"
          />
          <text
            x={Math.min(tooltip.x + 2.5, 71.5)}
            y={Math.min(tooltip.y - 3, 91)}
            fontSize="2.5"
            fill="#e2e8f0"
            fontFamily="system-ui, sans-serif"
          >
            SRTM 30m · elevation TBD
          </text>
        </g>
      )}

      <style>{`
        @keyframes wc-dem-fade {
          /* Layer 2 is intentionally subtle (0.3) — it should not dominate Layer 1 outlines */
          to { opacity: 0.3; }
        }
      `}</style>
    </svg>
  );
}
