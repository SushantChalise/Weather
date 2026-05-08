"use client";

import { LiveClearWindow } from "@/components/decision/live-clear-window";
import { MOCK_CLEAR_WINDOWS } from "@/data/mock/clear-windows";
import { useSelectionStore } from "@/state/selectionStore";
import type { DestinationId } from "@/types/weather";

const CORRIDOR_TO_DEST: Record<string, DestinationId> = {
  abc: "abc",
  ebc: "ebc",
};

export function SelectionClearWindow() {
  const { selectedCorridor } = useSelectionStore();
  const destId: DestinationId =
    (selectedCorridor && CORRIDOR_TO_DEST[selectedCorridor]) || "abc";
  const fallback = MOCK_CLEAR_WINDOWS.find((w) => w.destinationId === destId);
  if (!fallback) return null;
  return <LiveClearWindow destId={destId} fallback={fallback} />;
}
