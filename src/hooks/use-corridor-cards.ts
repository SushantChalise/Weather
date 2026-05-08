"use client";

import useSWR from "swr";
import type { CorridorCardData } from "@/types/weather";

type CorridorCardsResponse = { cards: CorridorCardData[] };

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<CorridorCardsResponse>);

export function useCorridorCards(fallback: CorridorCardData[]) {
  const { data } = useSWR<CorridorCardsResponse>("/api/corridor-cards", fetcher, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });
  return { cards: data?.cards ?? fallback };
}
