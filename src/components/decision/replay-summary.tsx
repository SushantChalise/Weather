"use client";

import Image from "next/image";
import { useState } from "react";
import { ConfidenceLabel } from "@/components/ui/confidence-label";
import type { ReplaySummary } from "@/types/weather";

type Props = { data: ReplaySummary };

const SNAPSHOT_LABELS: Record<string, string> = {
  best: "Clear",
  worst: "Clouded",
  current: "Partial",
};

export function ReplaySummaryCard({ data }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-sm)] overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          ▶ Evidence from last 72h
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Summary text */}
          <div className="space-y-1">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {data.cloudBuildupPattern}.
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Best visibility: {data.bestVisibilityWindow}.
            </p>
            {data.rainEvents.map((e) => (
              <p
                key={`${e.intensity}-${e.segment ?? "general"}-${e.count}`}
                className="text-xs text-[var(--color-text-muted)]"
              >
                {e.intensity.charAt(0).toUpperCase() + e.intensity.slice(1)} rain
                {e.segment ? ` on ${e.segment}` : ""} ({e.count}×).
              </p>
            ))}
            <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-1">
              Trend: {data.trendForecast} — {data.trendReasoning}.
            </p>
          </div>

          {/* Evidence snapshots — placeholder cards in Step 2 */}
          <div className="grid grid-cols-3 gap-2">
            {data.evidenceSnapshots.map((snap) => (
              <div
                key={snap.quality}
                className="flex flex-col rounded border border-[var(--color-border)] overflow-hidden"
              >
                <div className="h-16 bg-[var(--color-surface-alt)] flex items-center justify-center text-2xl overflow-hidden">
                  {snap.thumbUrl ? (
                    <Image
                      src={snap.thumbUrl}
                      alt={snap.label}
                      width={256}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : snap.quality === "best" ? (
                    "🌄"
                  ) : snap.quality === "worst" ? (
                    "🌧"
                  ) : (
                    "⛅"
                  )}
                </div>
                <div className="px-1.5 py-1">
                  <p className="text-[10px] font-medium text-[var(--color-text-primary)]">
                    {SNAPSHOT_LABELS[snap.quality] ?? snap.quality}
                  </p>
                  <p className="text-[9px] text-[var(--color-text-muted)] truncate">{snap.label}</p>
                </div>
              </div>
            ))}
          </div>

          <ConfidenceLabel confidence="forecast" evidenceTier="forecast-model" />
        </div>
      )}
    </div>
  );
}
