"use client";

import { useEffect, useState } from "react";
import { formatNPTTimeOnly, nowNPTIso } from "./format-npt";

export function useNPTClock(): string {
  const [display, setDisplay] = useState<string>(() => formatNPTTimeOnly(nowNPTIso()));

  useEffect(() => {
    const tick = () => setDisplay(formatNPTTimeOnly(nowNPTIso()));
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return display;
}
