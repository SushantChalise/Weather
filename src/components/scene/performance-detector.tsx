"use client";

import { useEffect } from "react";
import { useWorldStore } from "@/state/worldStore";

export function PerformanceDetector() {
  const { set } = useWorldStore();

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    // `deviceMemory` is not in all TypeScript lib versions
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

    let tier: "low" | "medium" | "high";
    if (cores <= 2 || mem <= 2) tier = "low";
    else if (cores <= 4 || mem <= 4) tier = "medium";
    else tier = "high";

    set({ performanceTier: tier });
  }, [set]);

  return null;
}
