"use client";

import { ReplaySummaryCard } from "@/components/decision/replay-summary";
import { useReplay } from "@/hooks/use-replay";
import type { ReplaySummary } from "@/types/weather";

type Props = { scopeId: string; fallback: ReplaySummary };

export function LiveReplaySummaryCard({ scopeId, fallback }: Props) {
  const { summary } = useReplay(scopeId, fallback);
  return <ReplaySummaryCard data={summary} />;
}
