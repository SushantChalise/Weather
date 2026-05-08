"use client";

import { ClearWindowCard } from "@/components/decision/clear-window-card";
import { useClearWindow } from "@/hooks/use-clear-window";
import type { ClearWindow, DestinationId } from "@/types/weather";

type Props = {
  destId: DestinationId;
  fallback: ClearWindow;
};

export function LiveClearWindow({ destId, fallback }: Props) {
  const { clearWindow } = useClearWindow(destId, fallback);
  if (!clearWindow) return null;
  return <ClearWindowCard data={clearWindow} />;
}
