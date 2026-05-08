"use client";

import useSWR from "swr";
import type { VisibilityResult } from "@/lib/decision/visibility-compute";
import type { ViewpointId } from "@/types/weather";

type Response = { result: VisibilityResult };

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<Response>);

export function useVisibility(viewpointId: ViewpointId) {
  const { data, isLoading } = useSWR<Response>(`/api/visibility/${viewpointId}`, fetcher, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
  });
  return { visibility: data?.result ?? null, isLoading };
}
