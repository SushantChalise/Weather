"use client";

import useSWR from "swr";
import type { SatelliteManifest } from "@/types/weather";

type SatelliteResponse = {
  manifest: SatelliteManifest;
};

async function fetcher(url: string): Promise<SatelliteResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Satellite API ${res.status}`);
  return res.json() as Promise<SatelliteResponse>;
}

export function useSatellite() {
  const { data, error } = useSWR<SatelliteResponse>("/api/satellite", fetcher, {
    refreshInterval: 30 * 60 * 1000, // 30 min — matches Himawari cadence
    revalidateOnFocus: false,
  });

  return {
    manifest: data?.manifest ?? null,
    isStale: data?.manifest.isStale ?? false,
    ageMinutes: data?.manifest.ageMinutes ?? 0,
    error: error as Error | undefined,
  };
}
