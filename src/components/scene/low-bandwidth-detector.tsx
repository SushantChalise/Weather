"use client";

import { useEffect } from "react";
import { useWorldStore } from "@/state/worldStore";

// Network Information API type
type NetworkInfo = {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
};

export function LowBandwidthDetector() {
  const { set } = useWorldStore();

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: NetworkInfo };
    const conn = nav.connection;
    if (!conn) return;

    function check() {
      if (!conn) return;
      const isLow = conn.effectiveType === "2g" || conn.effectiveType === "slow-2g";
      if (isLow) set({ lowBandwidthMode: true });
    }

    check();
    if (conn && "addEventListener" in conn) {
      (conn as EventTarget).addEventListener("change", check);
      return () => (conn as EventTarget).removeEventListener("change", check);
    }
  }, [set]);

  return null;
}
