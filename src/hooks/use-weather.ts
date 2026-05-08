"use client";

import useSWR from "swr";
import type { DestinationCondition } from "@/types/weather";

type WeatherApiResponse = {
  conditions: DestinationCondition[];
  fetchedAt: string;
  partial?: boolean;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const REFRESH_MS = 10 * 60 * 1000; // 10 min

export function useWeather() {
  const { data, error, isLoading } = useSWR<WeatherApiResponse>("/api/weather", fetcher, {
    refreshInterval: REFRESH_MS,
    revalidateOnFocus: false,
  });
  return {
    conditions: data?.conditions ?? null,
    fetchedAt: data?.fetchedAt ?? null,
    isLoading,
    isError: !!error,
    isPartial: data?.partial ?? false,
  };
}
