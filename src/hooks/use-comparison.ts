"use client";

import useSWR from "swr";
import type { ComparisonDrawerData } from "@/types/weather";

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ComparisonDrawerData>);

export function useComparison(fallback: ComparisonDrawerData) {
  const { data } = useSWR<ComparisonDrawerData>("/api/comparison", fetcher, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
    fallbackData: fallback,
  });
  return { comparison: data ?? fallback };
}
