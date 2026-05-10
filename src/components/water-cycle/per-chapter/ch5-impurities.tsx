/**
 * ch5-impurities.tsx — Chapter 5: "The feedback loop"
 *
 * Light-absorbing impurities (BC + dust + algae) — NOT BC-only per spec §4.
 * Dual-axis chart stub: BC concentration + dust optical depth.
 * Source: Kaspari 2014 — dust dominates in Solu-Khumbu.
 *
 * Color grammar (§7): heat = #FBBF24 (impurities/warming), loss = #F87171
 */
import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

type Props = {
  provenance: Provenance;
  onShowProvenance: () => void;
};

export function Ch5Overlay({ provenance, onShowProvenance }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-8 left-8 max-w-md pointer-events-auto">
        <h2
          className="text-white text-4xl md:text-6xl font-serif font-bold leading-tight"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
        >
          The feedback loop
        </h2>
        <p className="mt-2 text-white/70 text-base">
          Light-absorbing impurities · BC + dust + algae
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

      {/* Impurity breakdown */}
      <div className="absolute top-1/3 right-8 max-w-xs pointer-events-auto text-right space-y-3">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Black carbon</p>
          <p className="text-white text-lg font-bold tabular-nums" style={{ color: "#FBBF24" }}>
            6–10%
          </p>
          <p className="text-white/60 text-xs">albedo reduction</p>
        </div>
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Dust (dominant)</p>
          <p className="text-white text-lg font-bold tabular-nums" style={{ color: "#FBBF24" }}>
            Solu-Khumbu
          </p>
          <p className="text-white/60 text-xs">Kaspari 2014</p>
        </div>
      </div>

      {/* Loop description */}
      <div className="absolute bottom-20 left-8 max-w-sm pointer-events-auto">
        <p className="text-white/70 text-sm leading-relaxed">
          Dust and black carbon settle on snow, darkening the surface. Less sunlight is reflected →
          more absorbed → faster melt → less ice to reflect. A self-reinforcing loop.
        </p>
      </div>

      <CitationChip
        sources={
          provenance.scene_layers.length > 0
            ? provenance.scene_layers.map((l) => l.source.dataset)
            : ["Kaspari 2014", "ICIMOD HIMAP 2019"]
        }
        onShowAll={onShowProvenance}
      />
    </div>
  );
}
