/**
 * ch6-choice.tsx — Chapter 6: "The choice"
 *
 * SSP1-2.6 vs SSP5-8.5 split cinematic (NOT RCP 4.5 per spec §11 decision log).
 * Closing line: "The glacier was your reservoir. We are draining it."
 * Source: Rounce et al. 2023 Science doi:10.1126/science.abo1324
 *
 * Color grammar (§7): ice = #7DD3FC (SSP1-2.6 hope), loss = #F87171 (SSP5-8.5 risk)
 */
import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

type Props = {
  provenance: Provenance;
  onShowProvenance: () => void;
};

export function Ch6Overlay({ provenance, onShowProvenance }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-8 left-8 max-w-md pointer-events-auto">
        <h2
          className="text-white text-4xl md:text-6xl font-serif font-bold leading-tight"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
        >
          The choice
        </h2>
        <p className="mt-2 text-white/70 text-base">SSP1-2.6 · SSP5-8.5 · by 2100</p>
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

      {/* Split comparison */}
      <div className="absolute top-1/3 left-8 right-8 pointer-events-auto flex gap-8 justify-center">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider" style={{ color: "#7DD3FC" }}>
            SSP1-2.6
          </p>
          <p
            className="text-white text-2xl font-bold tabular-nums mt-1"
            style={{ color: "#7DD3FC" }}
          >
            ~50%
          </p>
          <p className="text-white/60 text-xs mt-1">ice remaining 2100</p>
        </div>
        <div className="w-px bg-white/10 self-stretch" />
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider" style={{ color: "#F87171" }}>
            SSP5-8.5
          </p>
          <p
            className="text-white text-2xl font-bold tabular-nums mt-1"
            style={{ color: "#F87171" }}
          >
            ~25%
          </p>
          <p className="text-white/60 text-xs mt-1">ice remaining 2100</p>
        </div>
      </div>

      {/* Volume of indecision */}
      <div className="absolute bottom-32 left-8 max-w-sm pointer-events-auto">
        <p className="text-white/50 text-xs uppercase tracking-wider mb-1">The ghost glacier</p>
        <p className="text-white/80 text-sm">
          The ghost-glacier overlay in the worst case is the volume of our indecision.
        </p>
        <p className="text-slate-400 text-xs mt-1">
          Rounce et al. 2023 · doi:10.1126/science.abo1324
        </p>
      </div>

      <CitationChip
        sources={
          provenance.scene_layers.length > 0
            ? provenance.scene_layers.map((l) => l.source.dataset)
            : ["Rounce et al. 2023", "IPCC AR6"]
        }
        onShowAll={onShowProvenance}
      />
    </div>
  );
}
