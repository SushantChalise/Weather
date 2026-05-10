"use client";

import { useEffect, useState } from "react";
import { PLACE_REGISTRY } from "@/data/places";

const VARIABLES = [
  { id: "temp_2m_mean", label: "Temperature (mean)", unit: "°C" },
  { id: "precip", label: "Precipitation", unit: "mm" },
  { id: "temp_2m_max", label: "Temperature (max)", unit: "°C" },
  { id: "temp_2m_min", label: "Temperature (min)", unit: "°C" },
  { id: "wind_max_10m", label: "Wind speed (max)", unit: "m/s" },
] as const;

type VariableId = (typeof VARIABLES)[number]["id"];

const YEARS = [2020, 2021, 2022, 2023, 2024] as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type ClimateData = {
  years: number[];
  series: number[][];
};

async function fetchClimatology(
  place: string,
  variable: string,
  month: number,
): Promise<ClimateData> {
  const url = `/api/climatology?place=${encodeURIComponent(place)}&variable=${encodeURIComponent(variable)}&month=${month}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<ClimateData>;
}

export function ClimateTimeMachine() {
  const slugs = Object.keys(PLACE_REGISTRY);
  const [placeSlug, setPlaceSlug] = useState<string>("ebc");
  const [variable, setVariable] = useState<VariableId>("temp_2m_mean");
  const [month, setMonth] = useState<number>(10);
  const [year, setYear] = useState<number>(2024);

  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    fetchClimatology(placeSlug, variable, month)
      .then((data) => {
        if (!cancelled) {
          setClimateData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError("Could not load climate data. Please try again.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [placeSlug, variable, month]);

  const place = PLACE_REGISTRY[placeSlug];
  const v = VARIABLES.find((item) => item.id === variable);

  const monthLabel = MONTHS[month - 1] ?? "—";

  const yearIndex = YEARS.indexOf(year as (typeof YEARS)[number]);
  const current = climateData?.series[yearIndex] ?? [];
  const allYears = climateData?.series ?? [];

  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-16 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-semibold text-neutral-900 mb-4">
          Climate Time Machine
        </h1>
        <p className="text-neutral-700 max-w-prose">
          Compare any place, any variable, any month, across years. Select a year to highlight it
          against all others in our 2020–2024 archive.
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Place</span>
            <select
              value={placeSlug}
              onChange={(e) => setPlaceSlug(e.target.value)}
              className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2"
            >
              {slugs.map((s) => (
                <option key={s} value={s}>
                  {PLACE_REGISTRY[s]?.name ?? s}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Variable</span>
            <select
              value={variable}
              onChange={(e) => setVariable(e.target.value as VariableId)}
              className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2"
            >
              {VARIABLES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Month slider */}
        <div className="mt-6">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Month: {monthLabel}</span>
            <input
              type="range"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-1 block w-full"
            />
          </label>
        </div>

        {/* Year buttons */}
        <div className="mt-6">
          <span className="text-sm font-medium text-neutral-700">Year</span>
          <div className="mt-2 flex gap-2">
            {YEARS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  year === y
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Fetch error */}
        {fetchError && (
          <div className="mt-6 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-900">
            {fetchError}
          </div>
        )}

        {/* Chart — pure SVG */}
        <div className="mt-8 p-4 rounded-lg border border-neutral-200 bg-neutral-50">
          <h2 className="text-lg font-medium text-neutral-900 mb-2">
            {v?.label ?? variable} — {place?.name ?? placeSlug}, {monthLabel} {year}
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-neutral-500">
              Loading…
            </div>
          ) : current.length > 0 ? (
            <ChartSvg current={current} allYears={allYears} years={YEARS} unit={v?.unit ?? ""} />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-neutral-500">
              No data for this selection.
            </div>
          )}
        </div>

        {/* Citation */}
        <p className="mt-6 text-xs text-neutral-500 leading-relaxed max-w-prose">
          <strong className="text-neutral-600">Data source:</strong> Open-Meteo historical archive (
          <span className="font-mono">openmeteo-historical</span>), daily observations for{" "}
          {slugs.length} places, 2020–2024.
        </p>
      </div>
    </main>
  );
}

interface ChartSvgProps {
  current: number[];
  allYears: number[][];
  years: readonly number[];
  unit: string;
}

function ChartSvg({ current, allYears, years, unit }: ChartSvgProps) {
  const W = 720;
  const H = 280;
  const PAD = 32;

  const allValues = [...allYears.flat(), ...current];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const count = current.length;

  function xPos(i: number): number {
    return PAD + (i / Math.max(count - 1, 1)) * (W - 2 * PAD);
  }

  function yPos(value: number): number {
    return H - PAD - ((value - min) / range) * (H - 2 * PAD);
  }

  function toPath(values: number[]): string {
    return values.map((val, i) => `${i === 0 ? "M" : "L"} ${xPos(i)} ${yPos(val)}`).join(" ");
  }

  const currentPath = toPath(current);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Climate Time Machine chart"
    >
      {/* Y-axis labels */}
      <text x={4} y={PAD} fontSize="11" fill="#525252">
        {max.toFixed(1)} {unit}
      </text>
      <text x={4} y={H - PAD + 4} fontSize="11" fill="#525252">
        {min.toFixed(1)} {unit}
      </text>
      {/* Other years — light lines */}
      {allYears.map((yr, i) => (
        <path key={years[i] ?? i} d={toPath(yr)} fill="none" stroke="#d4d4d4" strokeWidth="1" />
      ))}
      {/* Selected year — bold line */}
      <path d={currentPath} fill="none" stroke="#0a0a0a" strokeWidth="2" />
    </svg>
  );
}
