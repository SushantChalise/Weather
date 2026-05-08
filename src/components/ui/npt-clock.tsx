"use client";

import { useNPTClock } from "@/lib/npt/use-npt-clock";

export function NptClock() {
  const time = useNPTClock();
  return <span className="text-xs tabular-nums text-[var(--color-text-muted)]">{time}</span>;
}
