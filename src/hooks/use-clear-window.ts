"use client";

import useSWR from "swr";
import type { ClearWindow, DestinationId } from "@/types/weather";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const REFRESH_MS = 10 * 60 * 1000; // 10 min

export function useClearWindow(destId: DestinationId, fallback?: ClearWindow) {
  const { data, isLoading } = useSWR<ClearWindow>(`/api/clear-window/${destId}`, fetcher, {
    refreshInterval: REFRESH_MS,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });
  return { clearWindow: data ?? fallback ?? null, isLoading };
}
