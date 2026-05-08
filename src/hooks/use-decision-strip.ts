"use client";

import useSWR from "swr";
import type { DecisionStripData } from "@/types/weather";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const REFRESH_MS = 10 * 60 * 1000; // 10 min

export function useDecisionStrip(fallback: DecisionStripData) {
  const { data, error } = useSWR<DecisionStripData>("/api/decision-strip", fetcher, {
    refreshInterval: REFRESH_MS,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });
  return {
    strip: data ?? fallback,
    isLive: !!data && !error,
  };
}
