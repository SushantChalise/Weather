"use client";

import { CorridorCard } from "@/components/decision/corridor-card";
import { useCorridorCards } from "@/hooks/use-corridor-cards";
import type { CorridorCardData } from "@/types/weather";

export function LiveCorridorCards({ fallback }: { fallback: CorridorCardData[] }) {
  const { cards } = useCorridorCards(fallback);
  return (
    <>
      {cards.map((card) => (
        <CorridorCard key={card.corridorId} data={card} />
      ))}
    </>
  );
}
