"use client";

import { useNPTClock } from "@/lib/npt/use-npt-clock";
import { useWorldStore } from "@/state/worldStore";
import type { TimeMode } from "@/types/weather";

const MODES: { id: TimeMode; label: string; aria: string }[] = [
  { id: "now", label: "Now", aria: "Current conditions" },
  { id: "tomorrow_am", label: "AM", aria: "Tomorrow morning" },
  { id: "afternoon", label: "PM", aria: "Tomorrow afternoon" },
  { id: "last_24h", label: "24h", aria: "Last 24 hours" },
];

export function TimeControl() {
  const now = useNPTClock();
  const { timeMode, set } = useWorldStore();

  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      {/* Mode pills */}
      <div className="flex gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={timeMode === m.id}
            aria-label={m.aria}
            onClick={() => set({ timeMode: m.id })}
            className={[
              "flex-1 text-[11px] py-0.5 rounded transition-colors",
              timeMode === m.id
                ? "bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] font-semibold"
                : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
            ].join(" ")}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Timeline track with sunrise marker */}
      <div className="relative flex items-center h-5">
        <div className="w-full h-1 bg-[var(--color-border)] rounded-full relative">
          <div className="absolute left-0 top-0 h-1 w-1/2 bg-[var(--color-text-secondary)] rounded-full" />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ left: "30%" }}
            role="img"
            aria-label="Sunrise"
          >
            <span
              className="text-[var(--color-sunrise)] leading-none"
              aria-hidden
              style={{ marginBottom: "-2px", fontSize: "10px" }}
            >
              ☀
            </span>
            <div className="w-px h-2.5 bg-[var(--color-sunrise)]" />
          </div>
        </div>
        <div
          className="absolute w-3 h-3 bg-[var(--color-text-primary)] rounded-full -translate-x-1/2 border-2 border-white shadow-sm"
          style={{ left: "50%" }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[var(--color-text-muted)]">Now</span>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{now}</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">+24h</span>
      </div>
    </div>
  );
}
