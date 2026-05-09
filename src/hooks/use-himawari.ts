"use client";

import useSWR from "swr";
import type { HimawariManifest } from "@/app/api/himawari/route";

type HimawariResponse = {
  himawari: HimawariManifest;
  isStale: boolean;
  source: "himawari-9" | "modis-fallback";
};

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<HimawariResponse>);

const REFRESH_MS = 2 * 60 * 1000; // 2 min — matches route revalidate

export function useHimawari() {
  const { data, error } = useSWR<HimawariResponse>("/api/himawari", fetcher, {
    refreshInterval: REFRESH_MS,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });

  return {
    manifest: data?.himawari ?? null,
    isStale: data?.isStale ?? true,
    source: data?.source ?? "modis-fallback",
    isLive: !!data && !error,
  };
}
