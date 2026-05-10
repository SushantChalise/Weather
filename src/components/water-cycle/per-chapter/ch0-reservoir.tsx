/**
 * ch0-reservoir.tsx — Chapter 0: "The reservoir"
 *
 * Overlay for the HKH-arc oblique flyover cinematic.
 * Headlines: 9% / 516 km³ / ~0.5 trillion tonnes
 * Source: ICIMOD HKH Cryosphere Assessment 2026
 *
 * Color grammar (§7): ice = #7DD3FC (used for accent, not decorative)
 */
import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

type Props = {
  provenance: Provenance;
  onShowProvenance: () => void;
};

export function Ch0Overlay({ provenance, onShowProvenance }: Props) {
  const headlineMass = provenance.headline_numbers.find((n) =>
    n.label.includes("water-equivalent"),
  );
  const headlinePct = provenance.headline_numbers.find((n) => n.label.includes("HKH ice lost"));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Page title — top-left */}
      <div className="absolute top-8 left-8 max-w-md pointer-events-auto">
        <h2
          className="text-white text-4xl md:text-6xl font-serif font-bold leading-tight"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
        >
          The reservoir
        </h2>
        <p className="mt-2 text-white/70 text-base">Hindu Kush Himalaya · 1990 → 2020</p>
      </div>

      {/* Show data button — top-right of cinematic */}
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

      {/* Headline numbers — right side, mid */}
      <div className="absolute top-1/3 right-8 max-w-xs pointer-events-auto text-right">
        {headlineMass ? (
          <>
            <p className="text-white text-3xl tabular-nums font-bold" style={{ color: "#7DD3FC" }}>
              <span className="sr-only">{headlineMass.label}: </span>
              {headlineMass.value}
            </p>
            <p className="text-white/80 text-sm mt-1">of water lost since 1990</p>
          </>
        ) : (
          <>
            <p className="text-white text-3xl tabular-nums font-bold" style={{ color: "#7DD3FC" }}>
              516 km³
            </p>
            <p className="text-white/80 text-sm mt-1">of water lost since 1990</p>
          </>
        )}
        {headlinePct && (
          <p className="text-white/60 text-sm mt-2">{headlinePct.value} of all HKH ice</p>
        )}
        {!headlinePct && <p className="text-white/60 text-sm mt-2">~9% of all HKH ice</p>}
      </div>

      {/* Citation chip — bottom-right */}
      <CitationChip
        sources={
          provenance.scene_layers.length > 0
            ? provenance.scene_layers.map((l) => l.source.dataset)
            : ["ICIMOD 2026", "Farinotti 2019"]
        }
        onShowAll={onShowProvenance}
      />
    </div>
  );
}
