/**
 * ch3-sankey.tsx — Chapter 3: "Where it went"
 *
 * Moisture flux Sankey: precipitation → ice → melt → lakes → rivers → ocean.
 * 2D HTML/SVG legend (D3 charts come in later task; stub here).
 *
 * Color grammar (§7): active water = #38BDF8, ice = #7DD3FC, lakes = #0E7490
 */
import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

type Props = {
  provenance: Provenance;
  onShowProvenance: () => void;
};

/** Placeholder Sankey legend entry */
function SankeyLegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-sm flex-shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-white/70 text-xs">{label}</span>
      <span className="ml-auto text-white text-xs font-mono tabular-nums">{value}</span>
    </li>
  );
}

export function Ch3Overlay({ provenance, onShowProvenance }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-8 left-8 max-w-md pointer-events-auto">
        <h2
          className="text-white text-4xl md:text-6xl font-serif font-bold leading-tight"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
        >
          Where it went
        </h2>
        <p className="mt-2 text-white/70 text-base">Moisture flux through the HKH system</p>
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

      {/* Sankey legend / HTML overlay */}
      <div className="absolute bottom-20 right-8 max-w-xs pointer-events-auto">
        <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Flux (km³/yr)</p>
        <ul className="space-y-1.5">
          <SankeyLegendItem color="#7DD3FC" label="Precipitation → ice" value="~200" />
          <SankeyLegendItem color="#38BDF8" label="Meltwater runoff" value="~120" />
          <SankeyLegendItem color="#0E7490" label="Glacial lake storage" value="~8" />
          <SankeyLegendItem color="#38BDF8" label="River discharge" value="~112" />
        </ul>
        <p className="text-slate-400 text-xs mt-2">
          Source: ICIMOD HIMAP 2019 (placeholder values)
        </p>
      </div>

      <CitationChip
        sources={
          provenance.scene_layers.length > 0
            ? provenance.scene_layers.map((l) => l.source.dataset)
            : ["ICIMOD HIMAP 2019", "Miles et al. 2021"]
        }
        onShowAll={onShowProvenance}
      />
    </div>
  );
}
