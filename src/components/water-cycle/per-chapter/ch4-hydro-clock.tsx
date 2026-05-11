/**
 * ch4-hydro-clock.tsx — Chapter 4: "When it comes" — Hydrological Clock
 *
 * 2D circular Year-Clock UI (HTML/SVG, NOT 3D — Codex caveat: timing precision
 * needs axes/labels, WATER_CYCLE_SPEC.md §6 tooling lock).
 *
 * Two clock hands:
 *   1990 hand (static) — mid-June baseline peak meltwater, color #475569 (terrain neutral)
 *   2070 hand (animated) — mid-May SSP5-8.5 projected peak, color #F87171 (loss/risk)
 *
 * When scrolled into view, the 2070 hand ticks from the 1990 position to its 2070
 * position over 800ms with cubic-bezier(0.16, 1, 0.3, 1) (§7 gentle-out ease).
 *
 * Color grammar (§7):
 *   Ice / high-alt snow : #7DD3FC
 *   Active water        : #38BDF8
 *   Loss / risk         : #F87171
 *   Terrain neutral     : #475569
 *   Heat                : #FBBF24
 *
 * Props are exposed so future T1.4c data wiring can pass real per-glacier
 * seasonal peak day-of-year values from Rounce supplementary.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Convert a calendar day-of-year (1-365) to an SVG angle in degrees.
 *  Day 1 = Jan 1 at 12 o'clock (-90°). Increasing clockwise. */
function dayToAngleDeg(dayOfYear: number): number {
  return (dayOfYear / 365) * 360 - 90;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Cartesian end-point of a clock hand given (cx,cy), angle in degrees, and length. */
function handTip(
  cx: number,
  cy: number,
  angleDeg: number,
  length: number,
): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) };
}

// ---------------------------------------------------------------------------
// Season segment helper
// ---------------------------------------------------------------------------

/** Build an SVG arc path for a season ring segment between two day-of-year values.
 *  Draws a thick arc (annular sector) in the inner ring. */
function seasonArcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDay: number,
  endDay: number,
): string {
  const startAngle = degToRad(dayToAngleDeg(startDay));
  const endAngle = degToRad(dayToAngleDeg(endDay));

  const x1o = cx + rOuter * Math.cos(startAngle);
  const y1o = cy + rOuter * Math.sin(startAngle);
  const x2o = cx + rOuter * Math.cos(endAngle);
  const y2o = cy + rOuter * Math.sin(endAngle);

  const x1i = cx + rInner * Math.cos(endAngle);
  const y1i = cy + rInner * Math.sin(endAngle);
  const x2i = cx + rInner * Math.cos(startAngle);
  const y2i = cy + rInner * Math.sin(startAngle);

  const daySpan = endDay - startDay;
  const largeArc = daySpan > 182 ? 1 : 0;

  return [
    `M ${x1o} ${y1o}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2o} ${y2o}`,
    `L ${x1i} ${y1i}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x2i} ${y2i}`,
    "Z",
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Clock component props (exported for testing)
// ---------------------------------------------------------------------------

export type HydroClockProps = {
  /** Day-of-year for the 1990 baseline peak meltwater (default: 165 = mid-June) */
  baseline1990DayOfYear?: number;
  /** Day-of-year for the 2070 SSP5-8.5 projected peak meltwater (default: 135 = mid-May) */
  projected2070DayOfYear?: number;
};

// ---------------------------------------------------------------------------
// HydrologicalClock
// ---------------------------------------------------------------------------

export function HydrologicalClock({
  baseline1990DayOfYear = 165,
  projected2070DayOfYear = 135,
}: HydroClockProps) {
  const clockRef = useRef<SVGSVGElement>(null);
  const [animated, setAnimated] = useState(false);
  const [visible, setVisible] = useState(false);

  // IntersectionObserver — trigger animation when clock enters viewport
  useEffect(() => {
    const el = clockRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !animated) {
          setVisible(true);
          // Short delay so the 1990 hand is visible first, then 2070 ticks
          const timer = setTimeout(() => setAnimated(true), 300);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animated]);

  // SVG coordinate system
  const cx = 100;
  const cy = 100;
  const rOuter = 80; // outer clock ring
  const rSeasonOuter = 72; // season ring outer radius
  const rSeasonInner = 58; // season ring inner radius
  const handLength1990 = 60;
  const handLength2070 = 55; // slightly shorter so 2070 tip doesn't overlap 1990

  const angle1990 = dayToAngleDeg(baseline1990DayOfYear);
  const angle2070 = dayToAngleDeg(projected2070DayOfYear);

  // 2070 hand animates from the 1990 position to its real 2070 position
  const current2070Angle = animated ? angle2070 : angle1990;

  const tip1990 = handTip(cx, cy, angle1990, handLength1990);
  const tip2070 = handTip(cx, cy, current2070Angle, handLength2070);

  // Month tick marks + labels
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
  const rLabel = rOuter + 13;
  const rTick = rOuter - 2;
  const rTickInner = rOuter - 7;

  // Popover state for tab-focus on hands
  const [focusedHand, setFocusedHand] = useState<"1990" | "2070" | null>(null);

  const titleId = "hydro-clock-title";
  const descId = "hydro-clock-desc";

  return (
    <svg
      ref={clockRef}
      viewBox="0 0 200 200"
      className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      data-testid="hydro-clock-svg"
    >
      <title id={titleId}>Hydrological Year Clock — Peak Meltwater Timing</title>
      <desc id={descId}>
        {`A circular clock showing the shift in peak glacier meltwater timing. The grey hand marks mid-June (day ${baseline1990DayOfYear}, 1990 baseline). The red hand marks mid-May (day ${projected2070DayOfYear}, 2070 SSP5-8.5 projection). Peak water arrives ${Math.round((baseline1990DayOfYear - projected2070DayOfYear) / 7)} weeks earlier under high-emissions warming, when farmers do not need it.`}
      </desc>

      {/* ── Outer ring background ── */}
      <circle cx={cx} cy={cy} r={rOuter} fill="#0f172a" opacity="0.6" />
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#1e293b" strokeWidth="1.5" />

      {/* ── Season ring segments (inner ring) ── */}
      {/* Winter part 1: Jan 1 – Mar 20 */}
      <path
        d={seasonArcPath(cx, cy, rSeasonOuter, rSeasonInner, 1, 79)}
        fill="#7DD3FC"
        opacity="0.18"
      />
      {/* Winter part 2: Dec 21 – Dec 31 */}
      <path
        d={seasonArcPath(cx, cy, rSeasonOuter, rSeasonInner, 355, 365)}
        fill="#7DD3FC"
        opacity="0.18"
      />

      {/* Spring: Mar 21 – Jun 19 */}
      <path
        d={seasonArcPath(cx, cy, rSeasonOuter, rSeasonInner, 80, 171)}
        fill="#7DD3FC"
        opacity="0.26"
      />

      {/* Summer: Jun 20 – Sep 21 */}
      <path
        d={seasonArcPath(cx, cy, rSeasonOuter, rSeasonInner, 172, 264)}
        fill="#FBBF24"
        opacity="0.18"
      />

      {/* Monsoon: Jun 1 – Sep 30 (active water overlay on top of summer) */}
      <path
        d={seasonArcPath(cx, cy, rSeasonOuter - 4, rSeasonInner + 4, 152, 273)}
        fill="#38BDF8"
        opacity="0.22"
      />

      {/* Autumn: Sep 22 – Dec 20 */}
      <path
        d={seasonArcPath(cx, cy, rSeasonOuter, rSeasonInner, 265, 354)}
        fill="#475569"
        opacity="0.22"
      />

      {/* ── Season labels ── */}
      {(
        [
          { label: "Winter", dayMid: 15 },
          { label: "Spring", dayMid: 125 },
          { label: "Summer", dayMid: 218 },
          { label: "Autumn", dayMid: 309 },
        ] as const
      ).map(({ label, dayMid }) => {
        const rMid = (rSeasonOuter + rSeasonInner) / 2;
        const ang = degToRad(dayToAngleDeg(dayMid));
        return (
          <text
            key={label}
            x={cx + rMid * Math.cos(ang)}
            y={cy + rMid * Math.sin(ang)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="4.5"
            fill="#94a3b8"
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        );
      })}

      {/* ── Month tick marks ── */}
      {months.map((m, i) => {
        const tickDeg = (i / 12) * 360 - 90;
        const rad = degToRad(tickDeg);
        const x1 = cx + rTick * Math.cos(rad);
        const y1 = cy + rTick * Math.sin(rad);
        const x2 = cx + rTickInner * Math.cos(rad);
        const y2 = cy + rTickInner * Math.sin(rad);
        return (
          <line
            key={`tick-${m}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#334155"
            strokeWidth="1"
          />
        );
      })}

      {/* ── Month labels ── */}
      {months.map((m, i) => {
        const tickDeg = (i / 12) * 360 - 90;
        const rad = degToRad(tickDeg);
        const lx = cx + rLabel * Math.cos(rad);
        const ly = cy + rLabel * Math.sin(rad);
        return (
          <text
            key={m}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="6.5"
            fill="#64748b"
            fontFamily="system-ui, sans-serif"
          >
            {m}
          </text>
        );
      })}

      {/* ── 1990 baseline hand (static, terrain neutral #475569) ── */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG <g> requires tabIndex for keyboard nav — no semantic HTML alternative inside SVG */}
      <g
        tabIndex={0}
        aria-label={`1990 baseline peak meltwater: mid-June (day ${baseline1990DayOfYear})`}
        onFocus={() => setFocusedHand("1990")}
        onBlur={() => setFocusedHand(null)}
        style={{ outline: "none", cursor: "default" }}
      >
        <line
          x1={cx}
          y1={cy}
          x2={tip1990.x}
          y2={tip1990.y}
          stroke="#475569"
          strokeWidth="3"
          strokeLinecap="round"
          data-testid="hand-1990"
        />
        {/* Invisible wider hit area for keyboard focus */}
        <line
          x1={cx}
          y1={cy}
          x2={tip1990.x}
          y2={tip1990.y}
          stroke="transparent"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx={tip1990.x} cy={tip1990.y} r="5" fill="#475569" />
        {/* Focus ring */}
        {focusedHand === "1990" && (
          <circle
            cx={tip1990.x}
            cy={tip1990.y}
            r="8"
            fill="none"
            stroke="#7DD3FC"
            strokeWidth="1.5"
            opacity="0.8"
          />
        )}
      </g>

      {/* ── 2070 SSP5-8.5 hand (animated tick-back, loss/risk #F87171) ── */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG <g> requires tabIndex for keyboard nav — no semantic HTML alternative inside SVG */}
      <g
        tabIndex={0}
        aria-label={`2070 SSP5-8.5 projected peak meltwater: mid-May (day ${projected2070DayOfYear}) — ${Math.round((baseline1990DayOfYear - projected2070DayOfYear) / 7)} weeks earlier`}
        onFocus={() => setFocusedHand("2070")}
        onBlur={() => setFocusedHand(null)}
        style={{ outline: "none", cursor: "default" }}
      >
        <line
          x1={cx}
          y1={cy}
          x2={tip2070.x}
          y2={tip2070.y}
          stroke="#F87171"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            transition: animated
              ? "x2 800ms cubic-bezier(0.16, 1, 0.3, 1), y2 800ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
          }}
          data-testid="hand-2070"
          data-angle={current2070Angle}
        />
        {/* Invisible wider hit area */}
        <line
          x1={cx}
          y1={cy}
          x2={tip2070.x}
          y2={tip2070.y}
          stroke="transparent"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle
          cx={tip2070.x}
          cy={tip2070.y}
          r="5"
          fill="#F87171"
          style={{
            transition: animated
              ? "cx 800ms cubic-bezier(0.16, 1, 0.3, 1), cy 800ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
          }}
        />
        {/* Focus ring */}
        {focusedHand === "2070" && (
          <circle
            cx={tip2070.x}
            cy={tip2070.y}
            r="8"
            fill="none"
            stroke="#F87171"
            strokeWidth="1.5"
            opacity="0.8"
          />
        )}
      </g>

      {/* ── Center pivot ── */}
      <circle cx={cx} cy={cy} r="4" fill="#94a3b8" />
      <circle cx={cx} cy={cy} r="2" fill="#e2e8f0" />

      {/* ── Year labels near hand tips (shown once clock is visible) ── */}
      {visible && (
        <>
          <text
            x={tip1990.x + (tip1990.x > cx ? 7 : -7)}
            y={tip1990.y + (tip1990.y > cy ? 7 : -7)}
            textAnchor={tip1990.x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize="6"
            fill="#475569"
            fontFamily="system-ui, sans-serif"
          >
            1990
          </text>
          <text
            x={tip2070.x + (tip2070.x > cx ? 7 : -7)}
            y={tip2070.y + (tip2070.y > cy ? 7 : -7)}
            textAnchor={tip2070.x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize="6"
            fill="#F87171"
            fontFamily="system-ui, sans-serif"
          >
            2070
          </text>
        </>
      )}

      {/* ── Popover tooltips on focus ── */}
      {focusedHand === "1990" && (
        <g aria-live="polite">
          <rect x="20" y="155" width="160" height="26" rx="4" fill="#0f172a" opacity="0.95" />
          <text
            x="100"
            y="165"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="6.5"
            fill="#94a3b8"
            fontFamily="system-ui, sans-serif"
          >
            {`1990 baseline · mid-June (day ${baseline1990DayOfYear})`}
          </text>
          <text
            x="100"
            y="175"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="6"
            fill="#64748b"
            fontFamily="system-ui, sans-serif"
          >
            HKH canonical peak — Rounce 2023
          </text>
        </g>
      )}
      {focusedHand === "2070" && (
        <g aria-live="polite">
          <rect x="20" y="155" width="160" height="26" rx="4" fill="#0f172a" opacity="0.95" />
          <text
            x="100"
            y="165"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="6.5"
            fill="#F87171"
            fontFamily="system-ui, sans-serif"
          >
            {`2070 SSP5-8.5 · mid-May (day ${projected2070DayOfYear})`}
          </text>
          <text
            x="100"
            y="175"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="6"
            fill="#64748b"
            fontFamily="system-ui, sans-serif"
          >
            {`~${Math.round((baseline1990DayOfYear - projected2070DayOfYear) / 7)} weeks earlier · PyGEM HMA2_GGP`}
          </text>
        </g>
      )}

      {/* ── Legend (bottom-left inside the clock face) ── */}
      <g>
        <rect x="22" y="125" width="70" height="24" rx="3" fill="#0f172a" opacity="0.6" />
        <line
          x1="27"
          y1="133"
          x2="38"
          y2="133"
          stroke="#475569"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="41"
          y="133"
          dominantBaseline="central"
          fontSize="5.5"
          fill="#94a3b8"
          fontFamily="system-ui, sans-serif"
        >
          1990 baseline
        </text>
        <line
          x1="27"
          y1="143"
          x2="38"
          y2="143"
          stroke="#F87171"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="41"
          y="143"
          dominantBaseline="central"
          fontSize="5.5"
          fill="#94a3b8"
          fontFamily="system-ui, sans-serif"
        >
          2070 SSP5-8.5
        </text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Ch4Overlay — the full chapter 4 overlay component
// ---------------------------------------------------------------------------

type Props = {
  provenance: Provenance;
  onShowProvenance: () => void;
  /** Override baseline day-of-year (default: 165 = mid-June) */
  baseline1990DayOfYear?: number;
  /** Override projected day-of-year (default: 135 = mid-May) */
  projected2070DayOfYear?: number;
};

export function Ch4Overlay({
  provenance,
  onShowProvenance,
  baseline1990DayOfYear = 165,
  projected2070DayOfYear = 135,
}: Props) {
  // Build citation sources: prefer headline_numbers citations, fall back to scene layers
  const citationSources =
    provenance.headline_numbers.length > 0
      ? provenance.headline_numbers.map((n) => {
          const doi = n.citation.startsWith("doi:") ? n.citation.slice(4) : null;
          return doi ? `Rounce 2023 PyGEM (doi:${doi})` : n.label;
        })
      : provenance.scene_layers.length > 0
        ? provenance.scene_layers.map((l) => l.source.dataset)
        : ["Rounce et al. 2023 PyGEM HMA2_GGP", "doi:10.5067/P8BN9VO9N5C7"];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Chapter title — top-left */}
      <div className="absolute top-8 left-8 max-w-md pointer-events-auto">
        <h2
          className="text-white text-4xl md:text-6xl font-serif font-bold leading-tight"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}
        >
          When it comes
        </h2>
        <p className="mt-2 text-white/70 text-base">The shifting melt season</p>
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

      {/* 2D Clock — centred in the overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <div className="flex flex-col items-center gap-4 px-4">
          <HydrologicalClock
            baseline1990DayOfYear={baseline1990DayOfYear}
            projected2070DayOfYear={projected2070DayOfYear}
          />

          {/* Annotation — required per spec */}
          <p
            className="text-white/80 text-sm md:text-base text-center max-w-xs md:max-w-sm"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8)" }}
          >
            Glacier water hits the field weeks earlier — when farmers don&apos;t need it.
          </p>

          {/* SSP scenario label */}
          <p className="text-white/50 text-xs text-center">
            SSP5-8.5 high-emissions scenario · Rounce et al. 2023
          </p>

          {/* Citation chip — Rounce 2023 PyGEM */}
          <div className="text-center">
            <a
              href="https://doi.org/10.5067/P8BN9VO9N5C7"
              target="_blank"
              rel="noopener noreferrer"
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs",
                "bg-slate-900/70 border border-white/10 text-slate-400",
                "hover:text-white hover:border-sky-400/40",
                "focus:outline-none focus:ring-2 focus:ring-sky-400",
                "transition-all duration-150",
              ].join(" ")}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: "#F87171" }}
              />
              Rounce 2023 PyGEM HMA2_GGP · doi:10.5067/P8BN9VO9N5C7
            </a>
          </div>
        </div>
      </div>

      {/* Citation chip (persistent bottom-right) */}
      <CitationChip sources={citationSources} onShowAll={onShowProvenance} />
    </div>
  );
}
