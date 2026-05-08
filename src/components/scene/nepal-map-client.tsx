"use client";

import dynamic from "next/dynamic";
import { StaticMapFallback } from "@/components/scene/static-map-fallback";
import { useWeather } from "@/hooks/use-weather";
import { useWorldStore } from "@/state/worldStore";

const NepalMapLibre = dynamic(() => import("./nepal-maplibre").then((m) => m.NepalMapLibre), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[var(--color-terrain-lowland)] animate-pulse" />,
});

export function NepalMapClient() {
  const { conditions } = useWeather();
  const lowBandwidthMode = useWorldStore((s) => s.lowBandwidthMode);

  if (lowBandwidthMode) return <StaticMapFallback />;
  return <NepalMapLibre liveConditions={conditions} />;
}
