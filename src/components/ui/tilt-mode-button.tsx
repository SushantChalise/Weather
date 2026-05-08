"use client";

import { useWorldStore } from "@/state/worldStore";

export function TiltModeButton() {
  const { cameraMode, set } = useWorldStore();
  const isTilt = cameraMode === "tilt";

  return (
    <button
      type="button"
      onClick={() => set({ cameraMode: isTilt ? "topdown" : "tilt" })}
      className={`text-xs px-3 py-1 rounded border transition-colors ${
        isTilt
          ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      }`}
      aria-pressed={isTilt}
      aria-label="Toggle 3D tilt view"
    >
      {isTilt ? "▣ Top-Down" : "◈ 3D Tilt"}
    </button>
  );
}
