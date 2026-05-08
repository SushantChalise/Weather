"use client";

import { create } from "zustand";
import type { CorridorId, DestinationId } from "@/types/weather";

type SelectionStore = {
  selectedDestinationId: DestinationId | null;
  selectedCorridor: CorridorId | null;
  selectedSegmentId: string | null;
  selectedViewpointId: string | null;
  insightPanelOpen: boolean;
  comparisonDrawerOpen: boolean;
  set: (patch: Partial<Omit<SelectionStore, "set">>) => void;
};

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedDestinationId: null,
  selectedCorridor: null,
  selectedSegmentId: null,
  selectedViewpointId: null,
  insightPanelOpen: false,
  comparisonDrawerOpen: false,
  set: (patch) => set(patch),
}));
