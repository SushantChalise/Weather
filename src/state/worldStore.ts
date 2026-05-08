"use client";

import { create } from "zustand";
import type { CameraMode, LayerId, TimeMode } from "@/types/weather";

type WorldStore = {
  cameraMode: CameraMode;
  timeMode: TimeMode;
  activeLayer: LayerId;
  idle: boolean;
  lowBandwidthMode: boolean;
  performanceTier: "low" | "medium" | "high";
  set: (patch: Partial<Omit<WorldStore, "set">>) => void;
};

export const useWorldStore = create<WorldStore>((set) => ({
  cameraMode: "topdown",
  timeMode: "now",
  activeLayer: "clouds",
  idle: false,
  lowBandwidthMode: false,
  performanceTier: "medium",
  set: (patch) => set(patch),
}));
