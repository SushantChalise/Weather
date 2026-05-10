/**
 * ch2-lake-bloom.tsx — Chapter 2: "The lake bloom"
 *
 * Imja basin: glacier retreats → lake fills → camera follows outflow.
 * Headline: 0.04 km² → 1.4 km² = 35× growth (NOT "doubled").
 *
 * Color grammar (§7): lakes = #0E7490, active water = #38BDF8
 */
import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

type Props = {
  provenance: Provenance;
  onShowProvenance: () => void;
};

export function Ch2Overlay({ provenance, onShowProvenance }: Props) {
  const lakeArea = provenance.headline_numbers.find((n) => n.label.toLowerCase().includes("lake"));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-8 left-8 max-w-md pointer-events-auto">
        <h2
          className="text-white text-4xl md:text-6xl font-serif font-bold leading-tight"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
        >
          The lake bloom
        </h2>
        <p className="mt-2 text-white/70 text-base">Imja Tsho · 1962 → 2020</p>
      </div>

      <div className="absolute top-8 right-8 pointer-events-auto">
        <button
          type="button"
          onClick={onShowProvenance}
          aria-label="Show data sources for this chapter"
          className={[
            "flex items-center gap-2 px-3 py-1.5 rounded",
            "bg-slate-900/60 backdrop-blur-sm border border-white/10 text-xs text-slate-300",
            "hover:text-white hover:border-sky-400/50 hover:bg-slate-800/60",
            "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-slate-950",
            "transition-all duration-150",
          ].join(" ")}
        >
          Show data
        </button>
      </div>

      <div className="absolute top-1/3 right-8 max-w-xs pointer-events-auto text-right">
        {lakeArea ? (
          <>
            <p className="text-white text-3xl tabular-nums font-bold" style={{ color: "#0E7490" }}>
              {lakeArea.value}
            </p>
            <p className="text-white/80 text-sm mt-1">{lakeArea.label}</p>
          </>
        ) : (
          <>
            <p className="text-white text-3xl tabular-nums font-bold" style={{ color: "#0E7490" }}>
              1.4 km²
            </p>
            <p className="text-white/80 text-sm mt-1">today — from 0.04 km² in 1962</p>
            <p className="text-white/60 text-sm mt-1">35× growth · 60 m deep</p>
          </>
        )}
      </div>

      <CitationChip
        sources={
          provenance.scene_layers.length > 0
            ? provenance.scene_layers.map((l) => l.source.dataset)
            : ["Somos-Valenzuela 2014", "ICIMOD Lake Inventory 2024"]
        }
        onShowAll={onShowProvenance}
      />
    </div>
  );
}
