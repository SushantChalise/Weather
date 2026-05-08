"use client";

import { useNPTClock } from "@/lib/npt/use-npt-clock";

export function TimeControl() {
  const now = useNPTClock();

  return (
    <div className="flex flex-col gap-1 min-w-[180px]">
      {/* Track with sunrise marker */}
      <div className="relative flex items-center h-6">
        {/* Track */}
        <div className="w-full h-1 bg-[var(--color-border)] rounded-full relative">
          {/* Fill to current time position (~50% = midday) */}
          <div className="absolute left-0 top-0 h-1 w-1/2 bg-[var(--color-text-secondary)] rounded-full" />
          {/* Sunrise marker at ~30% (~6 AM on 0–24h scale) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ left: "30%" }}
            role="img"
            aria-label="Sunrise"
          >
            <span
              className="text-[var(--color-sunrise)] text-xs leading-none mb-0.5"
              aria-hidden
              style={{ marginBottom: "-2px", fontSize: "10px" }}
            >
              ☀
            </span>
            <div className="w-px h-3 bg-[var(--color-sunrise)]" />
          </div>
        </div>
        {/* Thumb */}
        <div
          className="absolute w-3.5 h-3.5 bg-[var(--color-text-primary)] rounded-full -translate-x-1/2 border-2 border-white shadow-sm"
          style={{ left: "50%" }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-[var(--color-text-muted)]">Now</span>
        <span className="text-xs font-mono text-[var(--color-text-muted)]">{now}</span>
        <span className="text-xs text-[var(--color-text-muted)]">+24h</span>
      </div>
    </div>
  );
}
