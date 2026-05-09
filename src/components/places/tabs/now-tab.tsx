"use client";

import useSWR from "swr";
import { CitationPill } from "@/components/ui/citation-pill";
import { OPEN_METEO } from "@/data/datasets";
import type { DestinationCondition, DestinationId } from "@/types/weather";

type WeatherApiResponse = {
  conditions: DestinationCondition[];
  fetchedAt: string;
  partial: boolean;
  failCount: number;
};

type NowTabProps = {
  destinationId: DestinationId;
  lat: number;
  lon: number;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<WeatherApiResponse>;
  });

function minutesAgo(isoString: string): number {
  return Math.round((Date.now() - new Date(isoString).getTime()) / 60_000);
}

function StatCard({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-neutral-900">
        {value}
        <span className="text-sm font-normal text-neutral-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 py-6 space-y-4 animate-pulse">
      <div className="h-10 bg-neutral-100 rounded-lg w-2/3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-neutral-100 rounded-lg" />
        <div className="h-16 bg-neutral-100 rounded-lg" />
        <div className="h-16 bg-neutral-100 rounded-lg" />
        <div className="h-16 bg-neutral-100 rounded-lg" />
      </div>
    </div>
  );
}

export function NowTab({ destinationId, lat: _lat, lon: _lon }: NowTabProps) {
  const { data, error, isLoading } = useSWR<WeatherApiResponse>(
    "/api/weather",
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }, // refresh every 5 min
  );

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm text-red-600">Weather data unavailable — please try again shortly.</p>
      </div>
    );
  }

  const condition = data.conditions.find((c) => c.destinationId === destinationId);

  if (!condition) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm text-neutral-500">No current data for this location.</p>
      </div>
    );
  }

  const age = minutesAgo(condition.timestamp);

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Condition headline */}
      <div className="flex items-center gap-3">
        <span className="text-4xl" role="img" aria-label={condition.conditionLabel}>
          {condition.conditionIcon}
        </span>
        <div>
          <p className="text-lg font-semibold text-neutral-900">{condition.conditionLabel}</p>
          <p className="text-xs text-neutral-400">
            Last updated: {age <= 1 ? "just now" : `${age} min ago`}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {condition.temperature !== null && (
          <StatCard label="Temperature" value={condition.temperature.toFixed(1)} unit="°C" />
        )}
        <StatCard label="Cloud cover" value={condition.cloud} unit="%" />
        <StatCard label="Precipitation" value={condition.precipitation.toFixed(1)} unit="mm/h" />
        <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3">
          <p className="text-xs text-neutral-500 mb-1">Confidence</p>
          <p className="text-sm font-medium text-neutral-700 capitalize">{condition.confidence}</p>
        </div>
      </div>

      {/* Plain summary */}
      <p className="text-sm text-neutral-600">{condition.plainSummary}</p>

      {/* Source attribution */}
      <div className="flex justify-end">
        <CitationPill dataset={OPEN_METEO} />
      </div>
    </div>
  );
}
