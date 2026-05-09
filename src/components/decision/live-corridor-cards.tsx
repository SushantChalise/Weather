"use client";

import { useEffect, useState } from "react";
import { CorridorCard } from "@/components/decision/corridor-card";
import { useCorridorCards } from "@/hooks/use-corridor-cards";
import type { CorridorCardData } from "@/types/weather";

// Representative lat/lon for each corridorId — matches CORRIDOR_REPS in api/corridor-cards
const CORRIDOR_COORDS: Record<string, { lat: number; lon: number }> = {
  abc: { lat: 28.5319, lon: 83.8786 },
  ebc: { lat: 28.0072, lon: 86.8594 },
  pokhara: { lat: 28.2095, lon: 83.9595 },
};

type AnomalyData = { delta: number; normal: number };

type AnomalyResponse = { delta: number; normal: number; current: number; month: string };

async function fetchAnomaly(
  corridorId: string,
): Promise<{ corridorId: string; anomaly: AnomalyData }> {
  const coords = CORRIDOR_COORDS[corridorId];
  if (!coords) throw new Error(`No coords for corridor ${corridorId}`);

  const url = `/api/anomaly?lat=${coords.lat}&lon=${coords.lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Anomaly fetch failed for ${corridorId}: ${res.status}`);

  const data = (await res.json()) as AnomalyResponse;
  return { corridorId, anomaly: { delta: data.delta, normal: data.normal } };
}

export function LiveCorridorCards({ fallback }: { fallback: CorridorCardData[] }) {
  const { cards } = useCorridorCards(fallback);
  const [anomalies, setAnomalies] = useState<Record<string, AnomalyData>>({});

  useEffect(() => {
    const corridorIds = cards.map((c) => c.corridorId);
    Promise.allSettled(corridorIds.map(fetchAnomaly)).then((results) => {
      const map: Record<string, AnomalyData> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          map[result.value.corridorId] = result.value.anomaly;
        }
      }
      setAnomalies(map);
    });
  }, [cards]);

  return (
    <>
      {cards.map((card) => (
        <CorridorCard key={card.corridorId} data={card} anomaly={anomalies[card.corridorId]} />
      ))}
    </>
  );
}
