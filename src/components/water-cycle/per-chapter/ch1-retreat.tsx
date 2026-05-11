/**
 * ch1-retreat.tsx — Chapter 1: "The retreat"
 *
 * 4-up grid cinematic: Khumbu, Yala, Annapurna I, Imja shrinking simultaneously.
 * Year ticker 1990→2020 (synchronized). Per-glacier % loss + km² lost.
 *
 * Video sources: public/water-cycle/ch1/
 *   cinematic.webm     — AV1, primary
 *   cinematic.mp4      — H.264, Safari fallback
 *   cinematic-scrub.webm — VP9 480p dense-keyframe scrub master
 *   poster.jpg         — static end-frame (2020 state, all 4 glaciers)
 *   provenance.json    — data source contract
 *
 * Color grammar (§7): ice = #7DD3FC, terrain = #475569
 *
 * Glacier areas (from ICIMOD HKH Inventory, cross-checked ±5%):
 *   Khumbu:       51.92 → 50.70 km² (-2.3%, -1.22 km²)
 *   Yala:         30.39 → 24.51 km² (-19.3%, -5.88 km²)
 *   Annapurna I:  72.52 → 59.73 km² (-17.6%, -12.79 km²)
 *   Imja:         20.48 → 17.95 km² (-12.4%, -2.53 km²)
 */
import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

type Props = {
  provenance: Provenance;
  onShowProvenance: () => void;
};

// Per-glacier data derived from ICIMOD inventory, stored in provenance.json headline_numbers.
// Fallback values shown when provenance.json is not yet loaded.
const GLACIER_FALLBACK = [
  { name: "Yala", loss: "-19.3%", km2: "-5.88 km²" },
  { name: "Annapurna I", loss: "-17.6%", km2: "-12.79 km²" },
  { name: "Imja", loss: "-12.4%", km2: "-2.53 km²" },
  { name: "Khumbu", loss: "-2.3%", km2: "-1.22 km²" },
] as const;

export function Ch1Overlay({ provenance, onShowProvenance }: Props) {
  // Pull per-glacier loss from provenance headline_numbers if available
  const glacierNumbers = provenance.headline_numbers.filter((n) =>
    ["Yala", "Annapurna", "Imja", "Khumbu"].some((name) => n.label.includes(name)),
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Chapter title — top-left */}
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

      {/* Show data button — top-right */}
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

      {/* Per-glacier loss summary — right side */}
      <div className="absolute top-1/3 right-8 max-w-xs pointer-events-auto text-right space-y-3">
        {glacierNumbers.length > 0
          ? glacierNumbers.map((n) => (
              <div key={n.label}>
                <p className="text-white/50 text-xs uppercase tracking-wider">
                  {n.label
                    .replace(" glacier area lost 1990–2020", "")
                    .replace(" glacier area lost 1990-2020", "")}
                </p>
                <p
                  className="text-white text-xl font-bold tabular-nums"
                  style={{ color: "#7DD3FC" }}
                  data-color-token="ice"
                >
                  {n.value}
                </p>
              </div>
            ))
          : GLACIER_FALLBACK.map((g) => (
              <div key={g.name}>
                <p className="text-white/50 text-xs uppercase tracking-wider">{g.name}</p>
                <p
                  className="text-white text-xl font-bold tabular-nums"
                  style={{ color: "#7DD3FC" }}
                  data-color-token="ice"
                  data-citable="true"
                  data-citation="doi:10.26066/rds.1972729"
                >
                  {g.loss}
                </p>
                <p className="text-white/60 text-xs">{g.km2} lost</p>
              </div>
            ))}
      </div>

      {/* Caption — bottom-left */}
      <div className="absolute bottom-16 left-8 max-w-sm pointer-events-auto">
        <p
          className="text-white/80 text-sm leading-relaxed"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}
        >
          Four glaciers. Same 30 years.
        </p>
      </div>

      {/* Citation chip — bottom-right */}
      <CitationChip
        sources={
          provenance.scene_layers.length > 0
            ? [...new Set(provenance.scene_layers.map((l) => l.source.dataset))]
            : ["ICIMOD HKH Glacier Inventory 2020", "Farinotti 2019"]
        }
        onShowAll={onShowProvenance}
      />
    </div>
  );
}
