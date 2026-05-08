"use client";

import { useWorldStore } from "@/state/worldStore";

export function LowBandwidthToggle() {
  const { lowBandwidthMode, set } = useWorldStore();

  return (
    <button
      type="button"
      onClick={() => set({ lowBandwidthMode: !lowBandwidthMode })}
      className={`text-xs px-3 py-1 rounded border transition-colors ${
        lowBandwidthMode
          ? "bg-orange-100 text-orange-800 border-orange-300"
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      }`}
      aria-pressed={lowBandwidthMode}
      aria-label="Toggle low-bandwidth mode"
    >
      {lowBandwidthMode ? "⚡ Low-BW ON" : "⚡ Low-BW"}
    </button>
  );
}
