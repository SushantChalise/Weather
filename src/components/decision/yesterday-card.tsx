"use client";

import useSWR from "swr";
import type { DestinationId, YesterdayActual } from "@/types/weather";

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<YesterdayActual>);

type Props = { destId: DestinationId; destName: string };

export function YesterdayCard({ destId, destName }: Props) {
  const { data, isLoading } = useSWR<YesterdayActual>(`/api/yesterday/${destId}`, fetcher, {
    refreshInterval: 60 * 60 * 1000, // refresh once per hour
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });

  if (isLoading) {
    return (
      <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
        <p className="text-xs text-[var(--color-text-muted)]">Loading yesterday's conditions…</p>
      </div>
    );
  }
  if (!data || "error" in data) return null;

  const clearLabel =
    data.clearHoursAM === 0
      ? "No clear AM hours"
      : data.clearHoursAM >= 5
        ? "Clear all morning"
        : `${data.clearHoursAM}h clear AM`;

  return (
    <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">
            {destName} · Yesterday
          </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            What Actually Happened
          </span>
        </div>
        <span className="text-xl">{data.peakConditionIcon}</span>
      </div>

      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
        {data.peakConditionLabel}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[var(--color-surface-alt)] rounded p-2">
          <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Temperature</p>
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            {data.minTempC}° – {data.maxTempC}°C
          </p>
        </div>
        <div className="bg-[var(--color-surface-alt)] rounded p-2">
          <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Precipitation</p>
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            {data.maxPrecipMm === 0 ? "None" : `${data.maxPrecipMm} mm`}
          </p>
        </div>
        <div className="bg-[var(--color-surface-alt)] rounded p-2">
          <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Max Wind</p>
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            {data.maxWindKmh.toFixed(0)} km/h
          </p>
        </div>
        <div className="bg-[var(--color-surface-alt)] rounded p-2">
          <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Morning Clear</p>
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">{clearLabel}</p>
        </div>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)]">
        Open-Meteo reanalysis · {data.date}
      </p>
    </div>
  );
}
