"use client";

import { ConfidenceLabel } from "@/components/ui/confidence-label";
import { NptBadge } from "@/components/ui/npt-badge";
import { formatNPTTimeOnly } from "@/lib/npt/format-npt";
import type { ClearWindow, ClearWindowQuality } from "@/types/weather";

const DEST_NAMES: Record<string, string> = {
  abc: "ABC Corridor",
  ebc: "Everest Corridor",
  pokhara: "Pokhara",
  "poon-hill": "Poon Hill",
  jomsom: "Jomsom",
  chitwan: "Chitwan",
  kathmandu: "Kathmandu",
  langtang: "Langtang",
};

const QUALITY_COLORS: Record<ClearWindowQuality, string> = {
  best: "bg-amber-400",
  good: "bg-green-400",
  watch: "bg-yellow-300",
  cloudy: "bg-gray-300",
  poor: "bg-gray-400",
};

const QUALITY_LABELS: Record<ClearWindowQuality, string> = {
  best: "Best",
  good: "Good",
  watch: "Watch",
  cloudy: "Cloudy",
  poor: "Poor",
};

const HOUR_LABELS = ["5A", "6A", "7A", "8A", "9A", "10A", "11A", "12P", "1P", "2P", "3P", "4P"];

type Props = { data: ClearWindow };

export function ClearWindowCard({ data }: Props) {
  return (
    <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
            {DEST_NAMES[data.destinationId] ?? data.destinationId}
          </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Clear Window</span>
        </div>
        <NptBadge />
      </div>

      {/* Next window headline */}
      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
        {data.next
          ? `Next clear window: ${formatNPTTimeOnly(data.next.from)}–${formatNPTTimeOnly(data.next.to)}`
          : "No clear window in next 24h"}
      </p>

      {/* 12-hour timeline */}
      <div className="mb-2">
        <div className="flex gap-0.5 h-5">
          {data.hourlyTimeline.map((h, i) => (
            <div
              key={h.hour}
              className={["flex-1 rounded-sm relative", QUALITY_COLORS[h.quality]].join(" ")}
              title={`${HOUR_LABELS[i] ?? ""}: ${QUALITY_LABELS[h.quality]}`}
            >
              {h.isSunrise && (
                <span
                  role="img"
                  aria-label="Sunrise"
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-[var(--color-sunrise)]"
                >
                  ☀
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[var(--color-text-muted)]">5 AM</span>
          <span className="text-[10px] text-[var(--color-text-muted)]">4 PM</span>
        </div>
      </div>

      {/* Legend row */}
      <div className="flex gap-2 flex-wrap mb-3">
        {(["best", "good", "watch", "cloudy"] as ClearWindowQuality[]).map((q) => (
          <span
            key={q}
            className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]"
          >
            <span
              className={["inline-block w-2.5 h-2.5 rounded-sm", QUALITY_COLORS[q]].join(" ")}
            />
            {QUALITY_LABELS[q]}
          </span>
        ))}
      </div>

      {/* Pattern */}
      <p className="text-xs text-[var(--color-text-secondary)] mb-1">{data.pattern}</p>
      {data.bestOfLast7Days && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Best of last 7 days: {data.bestOfLast7Days.day} {data.bestOfLast7Days.window}
        </p>
      )}

      <div className="mt-3">
        <ConfidenceLabel confidence={data.confidence} evidenceTier={data.evidenceTier} />
      </div>
    </div>
  );
}
