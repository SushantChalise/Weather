"use client";

import { useNPTClock } from "@/lib/npt/use-npt-clock";
import { useWorldStore } from "@/state/worldStore";
import type { TimeMode } from "@/types/weather";

const MODES: { id: TimeMode; label: string; aria: string }[] = [
  { id: "last_24h", label: "24h ago", aria: "Last 24 hours" },
  { id: "now", label: "Now", aria: "Current conditions" },
  { id: "tomorrow_am", label: "AM", aria: "Tomorrow morning" },
  { id: "afternoon", label: "PM", aria: "Tomorrow afternoon" },
];

// Each mode's thumb position on the track (%)
const MODE_POSITION: Record<TimeMode, number> = {
  last_24h: 0,
  now: 33,
  tomorrow_am: 67,
  afternoon: 100,
};

function positionToMode(pct: number): TimeMode {
  if (pct < 16) return "last_24h";
  if (pct < 50) return "now";
  if (pct < 83) return "tomorrow_am";
  return "afternoon";
}

export function TimeControl() {
  const now = useNPTClock();
  const { timeMode, set } = useWorldStore();

  const thumbPct = MODE_POSITION[timeMode];

  function handleTrackClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    set({ timeMode: positionToMode(pct) });
  }

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

      {/* Clickable track — thumb snaps to active mode position */}
      <div
        className="relative flex items-center h-5 cursor-pointer"
        onClick={handleTrackClick}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight")
            set({ timeMode: positionToMode(Math.min(100, thumbPct + 33)) });
          if (e.key === "ArrowLeft") set({ timeMode: positionToMode(Math.max(0, thumbPct - 33)) });
        }}
        role="slider"
        tabIndex={0}
        aria-valuenow={thumbPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Time window"
      >
        <div className="w-full h-1 bg-[var(--color-border)] rounded-full relative">
          {/* Fill from left to thumb */}
          <div
            className="absolute left-0 top-0 h-1 bg-[var(--color-text-secondary)] rounded-full transition-all duration-300"
            style={{ width: `${thumbPct}%` }}
          />
          {/* Sunrise marker at ~30% */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
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
        {/* Thumb — moves to active mode position */}
        <div
          className="absolute w-3 h-3 bg-[var(--color-text-primary)] rounded-full -translate-x-1/2 border-2 border-white shadow-sm transition-all duration-300 pointer-events-none"
          style={{ left: `${thumbPct}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[var(--color-text-muted)]">−24h</span>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{now}</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">+24h</span>
      </div>
    </div>
  );
}
