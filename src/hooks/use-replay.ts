"use client";

import useSWR from "swr";
import type { ReplaySummary } from "@/types/weather";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<{ summary: ReplaySummary }>);

const REFRESH_MS = 30 * 60 * 1000; // 30 min — daily satellite data

export function useReplay(scopeId: string, fallback: ReplaySummary) {
  const { data, error } = useSWR(`/api/replay/${scopeId}`, fetcher, {
    refreshInterval: REFRESH_MS,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });
  return {
    summary: data?.summary ?? fallback,
    isLive: !!data && !error,
  };
}
