/**
 * station-pins.tsx — Layer 3 of the Provenance Peel
 *
 * Renders monitoring station pins for layers with type "station-pin" in
 * provenance.scene_layers.  Each pin has a popover showing station name,
 * coordinates, measurement type, and source institution.
 *
 * Per spec §06 — Layer 3:
 *   - Ch 4: Imja Tsho monitoring station + Pyramid Lab (~5,000m)
 *   - Ch 5: albedo measurement stations from Kaspari 2014
 *   - Other chapters: no pins (component renders nothing)
 *
 * Screen-space coords are placeholders; real positions come in T3.x.
 *
 * Animation: "subtle bounce" on drop-in per spec (300-400ms window).
 * Implemented as CSS transform translate + scale — NO spring/bounce eases.
 * Two allowed eases: Material standard + gentle-out (spec §7).
 */
"use client";

import { useState } from "react";
import type { Provenance, SceneLayer } from "@/lib/water-cycle/types";

// ---------------------------------------------------------------------------
// Pin position — placeholder until real screen-space coords exist
// ---------------------------------------------------------------------------

function pinPlaceholderPosition(idx: number): { cx: number; cy: number } {
  // Spread pins horizontally across the middle third of the frame
  const cx = 30 + idx * 20;
  const cy = 45;
  return { cx, cy };
}

// ---------------------------------------------------------------------------
// Popover content
// ---------------------------------------------------------------------------

type PinPopoverProps = {
  layer: SceneLayer;
  cx: number;
  cy: number;
  onClose: () => void;
};

function PinPopover({ layer, cx, cy, onClose }: PinPopoverProps) {
  // Clamp popover so it stays within the SVG viewBox
  const px = Math.min(cx + 2, 60);
  const py = Math.max(cy - 20, 5);

  return (
    <g aria-label={`Station info: ${layer.source.dataset}`}>
      <rect
        x={px}
        y={py}
        width="38"
        height="18"
        rx="1.5"
        fill="#0f172a"
        fillOpacity="0.95"
        stroke="#334155"
        strokeWidth="0.3"
      />
      {/* Station name */}
      <text
        x={px + 2}
        y={py + 4}
        fontSize="2.4"
        fill="#f1f5f9"
        fontFamily="system-ui, sans-serif"
        fontWeight="bold"
      >
        {layer.source.dataset.length > 22
          ? `${layer.source.dataset.slice(0, 22)}…`
          : layer.source.dataset}
      </text>
      {/* Source institution */}
      {layer.source.url && (
        <text x={px + 2} y={py + 8} fontSize="2" fill="#94a3b8" fontFamily="system-ui, sans-serif">
          {layer.source.url.length > 28 ? `${layer.source.url.slice(0, 28)}…` : layer.source.url}
        </text>
      )}
      {/* Filter / measurement type */}
      {layer.source.filter && (
        <text
          x={px + 2}
          y={py + 11.5}
          fontSize="2"
          fill="#94a3b8"
          fontFamily="system-ui, sans-serif"
        >
          {layer.source.filter.length > 28
            ? `${layer.source.filter.slice(0, 28)}…`
            : layer.source.filter}
        </text>
      )}
      {/* Year keyframe */}
      {layer.source.year_keyframe !== undefined && (
        <text x={px + 2} y={py + 15} fontSize="2" fill="#64748b" fontFamily="system-ui, sans-serif">
          Year: {layer.source.year_keyframe}
        </text>
      )}
      {/* Close "×" — SVG context; <button> is invalid as SVG child */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG <g> with keyboard handlers is correct pattern here */}
      <g
        className="cursor-pointer"
        onClick={onClose}
        aria-label="Close station popover"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
      >
        <rect
          x={px + 33}
          y={py + 1}
          width="4"
          height="4"
          rx="0.5"
          fill="transparent"
          className="pointer-events-auto"
        />
        <text
          x={px + 34.5}
          y={py + 4.5}
          fontSize="3"
          fill="#94a3b8"
          fontFamily="system-ui, sans-serif"
        >
          ×
        </text>
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Props = {
  provenance: Provenance;
};

export function StationPins({ provenance }: Props) {
  const [openPinId, setOpenPinId] = useState<string | null>(null);

  // Only render station-pin layers
  const stationLayers = provenance.scene_layers.filter((l) => l.type === "station-pin");

  // No station pins for this chapter → render nothing (spec: only ch4, ch5)
  if (stationLayers.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden={stationLayers.length === 0}
    >
      <title>Monitoring station pins</title>

      {stationLayers.map((layer, idx) => {
        const { cx, cy } = pinPlaceholderPosition(idx);
        const isOpen = openPinId === layer.id;
        // Drop-in animation: 300-400ms window; gentle-out ease (spec §7)
        const animDelay = `${300 + idx * 30}ms`;

        return (
          <g key={layer.id}>
            {/* Pin marker */}
            {/* biome-ignore lint/a11y/useSemanticElements: SVG <g> cannot be replaced with <button> */}
            <g
              className="pointer-events-auto cursor-pointer"
              onClick={() => setOpenPinId(isOpen ? null : layer.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenPinId(isOpen ? null : layer.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Station: ${layer.source.dataset}. Press Enter for details.`}
              aria-expanded={isOpen}
              style={{
                opacity: 0,
                transform: `translateY(-4px)`,
                animation: `wc-pin-drop 200ms cubic-bezier(0.16, 1, 0.3, 1) ${animDelay} forwards`,
              }}
            >
              {/* Pin circle */}
              <circle
                cx={cx}
                cy={cy}
                r="1.8"
                fill={layer.color}
                fillOpacity="0.9"
                stroke="#0f172a"
                strokeWidth="0.3"
              />
              {/* Pin stem */}
              <line
                x1={cx}
                y1={cy + 1.8}
                x2={cx}
                y2={cy + 4}
                stroke={layer.color}
                strokeWidth="0.4"
              />
              {/* Label */}
              <text
                x={cx + 2.5}
                y={cy + 0.5}
                fontSize="2.2"
                fill={layer.color}
                fontFamily="system-ui, sans-serif"
              >
                {layer.id}
              </text>
            </g>

            {/* Popover (shown when pin is clicked) */}
            {isOpen && (
              <PinPopover layer={layer} cx={cx} cy={cy} onClose={() => setOpenPinId(null)} />
            )}
          </g>
        );
      })}

      <style>{`
        @keyframes wc-pin-drop {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </svg>
  );
}
