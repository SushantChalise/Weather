/**
 * ch4-hydro-clock.tsx — Chapter 4: "When it comes"
 *
 * 2D circular Year-Clock UI (HTML/SVG, NOT 3D per spec anti-patterns).
 * Two clock hands: 1990 vs 2070 peak meltwater date.
 * Annotation: "Glacier water hits the field weeks earlier — when farmers don't need it."
 *
 * Color grammar (§7): active water = #38BDF8, loss/risk = #F87171 (future shift)
 * Ease: gentle-out cubic-bezier(0.16, 1, 0.3, 1) for clock hand animation
 */
"use client";

import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

type Props = {
  provenance: Provenance;
  onShowProvenance: () => void;
};

/** Simple SVG clock showing two peak dates */
function HydrologicalClock() {
  // 1990 peak: ~August (day 213 of 365) → ~210° from 12 o'clock
  // 2070 peak: ~June (day 152 of 365) → ~150° from 12 o'clock
  const toDeg = (dayOfYear: number) => (dayOfYear / 365) * 360 - 90;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const peak1990Deg = toDeg(213); // ~August
  const peak2070Deg = toDeg(152); // ~June

  const cx = 100;
  const cy = 100;
  const r = 75;

  const handEnd = (deg: number, length: number) => ({
    x: cx + length * Math.cos(toRad(deg)),
    y: cy + length * Math.sin(toRad(deg)),
  });

  const h1990 = handEnd(peak1990Deg, 65);
  const h2070 = handEnd(peak2070Deg, 65);

  // Month labels
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthDots = months.map((m, i) => {
    const deg = (i / 12) * 360 - 90;
    const rad = toRad(deg);
    const lx = cx + (r + 12) * Math.cos(rad);
    const ly = cy + (r + 12) * Math.sin(rad);
    return { m, lx, ly };
  });

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-48 h-48 md:w-56 md:h-56"
      aria-label="Hydrological clock showing peak meltwater shift from August (1990) to June (2070)"
      role="img"
    >
      {/* Clock face */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="1.5" />
      <circle
        cx={cx}
        cy={cy}
        r={r - 10}
        fill="none"
        stroke="#334155"
        strokeWidth="0.5"
        strokeDasharray="2 4"
      />

      {/* Month labels */}
      {monthDots.map(({ m, lx, ly }) => (
        <text
          key={m}
          x={lx}
          y={ly}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7"
          fill="#475569"
          fontFamily="system-ui, sans-serif"
        >
          {m}
        </text>
      ))}

      {/* 1990 hand — active water colour */}
      <line
        x1={cx}
        y1={cy}
        x2={h1990.x}
        y2={h1990.y}
        stroke="#38BDF8"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
      <circle cx={h1990.x} cy={h1990.y} r="4" fill="#38BDF8" />

      {/* 2070 hand — loss/risk colour (earlier peak = supply risk) */}
      <line
        x1={cx}
        y1={cy}
        x2={h2070.x}
        y2={h2070.y}
        stroke="#F87171"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
      <circle cx={h2070.x} cy={h2070.y} r="4" fill="#F87171" />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="3" fill="#94a3b8" />

      {/* Legend inside clock */}
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        fontSize="5"
        fill="#38BDF8"
        fontFamily="system-ui, sans-serif"
      >
        ● 1990 Aug peak
      </text>
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fontSize="5"
        fill="#F87171"
        fontFamily="system-ui, sans-serif"
      >
        ● 2070 Jun peak (projected)
      </text>
    </svg>
  );
}

export function Ch4Overlay({ provenance, onShowProvenance }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-8 left-8 max-w-md pointer-events-auto">
        <h2
          className="text-white text-4xl md:text-6xl font-serif font-bold leading-tight"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
        >
          When it comes
        </h2>
        <p className="mt-2 text-white/70 text-base">The shifting melt season</p>
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

      {/* 2D Clock — centred */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <div className="flex flex-col items-center gap-4">
          <HydrologicalClock />
          <p className="text-white/70 text-sm text-center max-w-xs px-4">
            Glacier water hits the field weeks earlier — when farmers don&apos;t need it.
          </p>
        </div>
      </div>

      <CitationChip
        sources={
          provenance.scene_layers.length > 0
            ? provenance.scene_layers.map((l) => l.source.dataset)
            : ["Rounce et al. 2023", "ICIMOD HIMAP 2019"]
        }
        onShowAll={onShowProvenance}
      />
    </div>
  );
}
