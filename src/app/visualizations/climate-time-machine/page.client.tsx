"use client";

import { useState } from "react";
import { PLACE_REGISTRY } from "@/data/places";

const VARIABLES = [
  { id: "temperature_2m_mean", label: "Temperature (mean)", unit: "°C" },
  { id: "precipitation_sum", label: "Precipitation", unit: "mm" },
  { id: "snow_depth", label: "Snow depth", unit: "cm" },
] as const;

type VariableId = (typeof VARIABLES)[number]["id"];

const DECADES = [1990, 2000, 2010, 2020] as const;

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

/** Deterministic mock climatology — Math.sin-based, varies by place + variable + decade */
function getMockClimatology(
  placeSlug: string,
  variable: string,
  decadeStart: number,
  month: number,
): number[] {
  const seed = placeSlug.charCodeAt(0) + variable.charCodeAt(0) + decadeStart + month;
  const drift = (decadeStart - 1990) / 10; // simulate climate change drift
  const days = 30;
  const out: number[] = [];
  for (let d = 0; d < days; d++) {
    const base = Math.sin((d / days) * Math.PI * 2 + seed) * 5;
    const value = base + drift * 1.5; // each decade warmer (or wetter) than the last
    out.push(Number(value.toFixed(2)));
  }
  return out;
}

export function ClimateTimeMachine() {
  const slugs = Object.keys(PLACE_REGISTRY);
  const [placeSlug, setPlaceSlug] = useState<string>("ebc");
  const [variable, setVariable] = useState<VariableId>("temperature_2m_mean");
  const [month, setMonth] = useState<number>(10);
  const [decade, setDecade] = useState<number>(2020);

  const data = getMockClimatology(placeSlug, variable, decade, month);
  const allDecades = DECADES.map((d) => getMockClimatology(placeSlug, variable, d, month));
  const place = PLACE_REGISTRY[placeSlug];
  const v = VARIABLES.find((item) => item.id === variable);

  // noUncheckedIndexedAccess: month is 1-based, guard access
  const monthLabel = MONTHS[month - 1] ?? "—";

  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-16 max-w-4xl mx-auto">
        {/* Mock-data banner */}
        <div className="mb-6 px-4 py-2 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Mock data — real ERA5 ingestion coming soon. Trends and shapes are illustrative only.
        </div>

        <h1 className="text-3xl md:text-5xl font-semibold text-neutral-900 mb-4">
          Climate Time Machine
        </h1>
        <p className="text-neutral-700 max-w-prose">
          Compare any place, any variable, any month, across decades. Move the decade slider to see
          how the climate has shifted.
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

        {/* Decade buttons */}
        <div className="mt-6">
          <span className="text-sm font-medium text-neutral-700">Decade</span>
          <div className="mt-2 flex gap-2">
            {DECADES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDecade(d)}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  decade === d
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Chart — pure SVG */}
        <div className="mt-8 p-4 rounded-lg border border-neutral-200 bg-neutral-50">
          <h2 className="text-lg font-medium text-neutral-900 mb-2">
            {v?.label ?? variable} — {place?.name ?? placeSlug}, {monthLabel} {decade}s
          </h2>
          <ChartSvg current={data} allDecades={allDecades} decades={DECADES} unit={v?.unit ?? ""} />
        </div>

        {/* TODO: replace with /api/climatology when ERA5 ingestion lands */}
      </div>
    </main>
  );
}

interface ChartSvgProps {
  current: number[];
  allDecades: number[][];
  decades: readonly number[];
  unit: string;
}

function ChartSvg({ current, allDecades, decades, unit }: ChartSvgProps) {
  const W = 720;
  const H = 280;
  const PAD = 32;

  const allValues = [...allDecades.flat(), ...current];
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
      {/* Decade overlays — light lines */}
      {allDecades.map((dec, i) => (
        <path key={decades[i] ?? i} d={toPath(dec)} fill="none" stroke="#d4d4d4" strokeWidth="1" />
      ))}
      {/* Current decade — bold line */}
      <path d={currentPath} fill="none" stroke="#0a0a0a" strokeWidth="2" />
    </svg>
  );
}
