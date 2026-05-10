/**
 * ch1-retreat.tsx — Chapter 1: "The retreat"
 *
 * 4-up grid: Khumbu, Yala, Annapurna I, Imja shrinking simultaneously.
 * Year ticker drives synchronized loss across glaciers.
 *
 * Color grammar (§7): ice = #7DD3FC
 */
import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

type Props = {
  provenance: Provenance;
  onShowProvenance: () => void;
};

export function Ch1Overlay({ provenance, onShowProvenance }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-8 left-8 max-w-md pointer-events-auto">
        <h2
          className="text-white text-4xl md:text-6xl font-serif font-bold leading-tight"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
        >
          The retreat
        </h2>
        <p className="mt-2 text-white/70 text-base">
          Khumbu · Yala · Annapurna I · Imja — 1990 → 2020
        </p>
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

      {/* Per-glacier loss summary */}
      <div className="absolute top-1/3 right-8 max-w-xs pointer-events-auto text-right space-y-3">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Imja Glacier</p>
          <p className="text-white text-lg font-bold tabular-nums" style={{ color: "#7DD3FC" }}>
            retreating
          </p>
          <p className="text-white/60 text-xs">1962 → 2020 (Somos-Valenzuela 2014)</p>
        </div>
      </div>

      <CitationChip
        sources={
          provenance.scene_layers.length > 0
            ? provenance.scene_layers.map((l) => l.source.dataset)
            : ["ICIMOD Glacier Inventory 2020", "Somos-Valenzuela 2014"]
        }
        onShowAll={onShowProvenance}
      />
    </div>
  );
}
