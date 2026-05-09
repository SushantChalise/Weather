"use client";

import { DataAgeBadge } from "@/components/ui/data-age-badge";
import { NptBadge } from "@/components/ui/npt-badge";
import { formatNPTTimeOnly } from "@/lib/npt/format-npt";
import { useSelectionStore } from "@/state/selectionStore";
import { useWorldStore } from "@/state/worldStore";
import type { CorridorCardData, CorridorId, DestinationId } from "@/types/weather";

const TREND_COLORS: Record<string, string> = {
  improving: "text-green-600",
  stable: "text-gray-500",
  worsening: "text-red-500",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  observed: "Observed",
  forecast: "Forecast",
  estimated: "Estimated",
  low: "Low confidence",
  stale: "Stale",
};

function amIcon(cloud: number): string {
  if (cloud < 25) return "☀";
  if (cloud < 50) return "🌤";
  if (cloud < 70) return "⛅";
  return "☁";
}

type Props = { data: CorridorCardData };

export function CorridorCard({ data }: Props) {
  const { set } = useSelectionStore();
  const timeMode = useWorldStore((s) => s.timeMode);

  const showAM = timeMode === "tomorrow_am" || timeMode === "afternoon";
  const displayIcon = showAM ? amIcon(data.tomorrowAMCloud) : data.conditionIcon;
  const displayLabel = showAM ? `Tomorrow AM: ${data.tomorrowAMCloud}% cloud` : data.conditionLabel;
  const displayClear = showAM
    ? data.tomorrowAMCloud < 55
      ? `Clear morning expected · ${data.tomorrowAMCloud}% cloud`
      : `Overcast tomorrow AM · ${data.tomorrowAMCloud}% cloud`
    : data.clearWindowSummary;

  function handleClick() {
    if (data.corridorId === "abc" || data.corridorId === "ebc") {
      set({
        selectedCorridor: data.corridorId as CorridorId,
        selectedDestinationId: data.corridorId as DestinationId,
        insightPanelOpen: true,
      });
    } else {
      set({
        selectedDestinationId: data.corridorId as DestinationId,
        selectedCorridor: null,
        insightPanelOpen: true,
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "w-full text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4",
        "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        "transition-all duration-200 cursor-pointer",
      ].join(" ")}
    >
      {/* Title row */}
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none" aria-hidden>
          {displayIcon}
        </span>
        <span className="text-base font-semibold text-[var(--color-text-primary)]">
          {data.title}
        </span>
        {showAM && (
          <span className="ml-auto text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
            TOMORROW AM
          </span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--color-text-muted)]">
        {!showAM && (
          <>
            <span className={TREND_COLORS[data.trend] ?? "text-gray-500"}>{data.trendLabel}</span>
            <span>·</span>
          </>
        )}
        <span>{formatNPTTimeOnly(data.timestamp)}</span>
        <NptBadge />
        <span>·</span>
        <DataAgeBadge timestamp={data.timestamp} />
      </div>

      {/* Condition */}
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{displayLabel}</p>

      {/* Clear window / AM summary */}
      <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{displayClear}</p>

      {/* Confidence */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-muted)]">
          {CONFIDENCE_LABELS[data.confidence] ?? data.confidence}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">·</span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {data.evidenceTier === "no-field-report"
            ? "No field report"
            : data.evidenceTier.replace(/-/g, " ")}
        </span>
      </div>
    </button>
  );
}
