"use client";

import { useState } from "react";
import { useHimawari } from "@/hooks/use-himawari";

export function StaleSatelliteBanner() {
  const state = useHimawari();
  const [dismissed, setDismissed] = useState(false);

  if (state.status !== "stale" || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-2 px-3 py-1 bg-black/40 text-white/80 text-[11px] rounded-full backdrop-blur-sm"
    >
      <span>frame from {state.staleMins} min ago</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="ml-1 leading-none opacity-60 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}
