"use client";

import { currentSeasonalPattern } from "@/data/seasonal-patterns";

const SEASON_COLORS = {
  "pre-monsoon": {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
  },
  monsoon: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800" },
  "post-monsoon": {
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-800",
  },
  winter: { bg: "bg-cyan-50", border: "border-cyan-200", badge: "bg-cyan-100 text-cyan-800" },
} as const;

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className={["h-full rounded-full transition-all", color].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-[var(--color-text-muted)] w-8 text-right">{pct}%</span>
    </div>
  );
}

export function SeasonalPatternCard() {
  const pattern = currentSeasonalPattern();
  const colors = SEASON_COLORS[pattern.season];

  return (
    <div
      className={[
        "w-full border rounded-lg p-4 shadow-[var(--shadow-sm)]",
        colors.bg,
        colors.border,
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
            Nepal Himalaya
          </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Seasonal Context
          </span>
        </div>
        <span
          className={["text-[10px] font-semibold px-2 py-1 rounded-full", colors.badge].join(" ")}
        >
          {pattern.seasonLabel}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] mb-1">Morning clear chance</p>
          <Bar pct={pattern.morningClearChancePct} color="bg-amber-400" />
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] mb-1">Afternoon rain chance</p>
          <Bar pct={pattern.afternoonRainChancePct} color="bg-blue-400" />
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
        <p>
          <span className="font-medium text-[var(--color-text-primary)]">Best window: </span>
          {pattern.typicalClearHour}
        </p>
        <p>
          <span className="font-medium text-[var(--color-text-primary)]">Flight note: </span>
          {pattern.flightRiskNote}
        </p>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)] mt-3">
        Historical Nepal monsoon climatology · Not a day-of forecast
      </p>
    </div>
  );
}
