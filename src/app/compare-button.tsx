"use client";

import { useSelectionStore } from "@/state/selectionStore";

export function CompareButton() {
  const set = useSelectionStore((s) => s.set);
  return (
    <button
      type="button"
      onClick={() => set({ comparisonDrawerOpen: true })}
      className="flex-1 text-xs py-2 px-2 rounded border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
    >
      Compare ▸
    </button>
  );
}
