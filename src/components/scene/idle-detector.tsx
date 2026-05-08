"use client";

import { useEffect } from "react";
import { useWorldStore } from "@/state/worldStore";

const IDLE_TIMEOUT_MS = 30_000;
const EVENTS = ["mousemove", "keydown", "touchstart", "click", "scroll"] as const;

export function IdleDetector() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function resetTimer() {
      useWorldStore.getState().set({ idle: false });
      clearTimeout(timer);
      timer = setTimeout(() => {
        useWorldStore.getState().set({ idle: true });
      }, IDLE_TIMEOUT_MS);
    }

    for (const e of EVENTS) {
      window.addEventListener(e, resetTimer, { passive: true });
    }
    resetTimer();

    return () => {
      clearTimeout(timer);
      for (const e of EVENTS) {
        window.removeEventListener(e, resetTimer);
      }
    };
  }, []);

  return null;
}
