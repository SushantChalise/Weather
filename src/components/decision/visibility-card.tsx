"use client";

import { useVisibility } from "@/hooks/use-visibility";
import type { ViewpointId } from "@/types/weather";

const STATUS_ICON = { clear: "◉", partly: "◎", obscured: "○" } as const;
const STATUS_COLOR = {
  clear: "text-amber-600",
  partly: "text-green-700",
  obscured: "text-gray-400",
} as const;
const SCORE_COLOR = (score: number) =>
  score >= 70
    ? "bg-amber-500"
    : score >= 50
      ? "bg-green-500"
      : score >= 30
        ? "bg-amber-300"
        : "bg-gray-300";

type Props = {
  viewpointId: ViewpointId;
  viewpointName: string;
};

export function VisibilityCard({ viewpointId, viewpointName }: Props) {
  const { visibility, isLoading } = useVisibility(viewpointId);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] p-3 bg-[var(--color-surface)]">
        <p className="text-xs text-[var(--color-text-muted)]">Loading visibility…</p>
      </div>
    );
  }
  if (!visibility) return null;

  const barWidth = `${visibility.score}%`;

  return (
    <div className="rounded-lg border border-[var(--color-border)] p-3 bg-[var(--color-surface)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[var(--color-text-primary)]">
          {viewpointName} — Visibility
        </p>
        <span className="text-xs font-bold text-[var(--color-text-primary)]">
          {visibility.label} ({visibility.score}/100)
        </span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 bg-[var(--color-border)] rounded-full mb-2 overflow-hidden">
        <meter
          value={visibility.score}
          min={0}
          max={100}
          className={`block h-full rounded-full ${SCORE_COLOR(visibility.score)}`}
          style={{ width: barWidth, WebkitAppearance: "none", appearance: "none" }}
          aria-label={`Visibility score: ${visibility.score} out of 100`}
        />
      </div>

      {/* Peak list */}
      <div className="flex flex-col gap-0.5">
        {visibility.peaks.map((peak) => (
          <div key={peak.peakId} className="flex items-center gap-1.5 text-xs">
            <span className={STATUS_COLOR[peak.status]} aria-hidden="true">
              {STATUS_ICON[peak.status]}
            </span>
            <span className="text-[var(--color-text-muted)]">{peak.name}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--color-text-muted)] mt-2">
        Tomorrow AM forecast: {visibility.bestTomorrowAMScore}/100
      </p>
    </div>
  );
}
