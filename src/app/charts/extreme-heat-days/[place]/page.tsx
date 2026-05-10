import { sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CitationDataset } from "@/components/ui/citation-pill";
import { CitationPill } from "@/components/ui/citation-pill";
import { PLACE_REGISTRY } from "@/data/places";
import { db } from "@/db/client";
import { obsWeatherDaily, places } from "@/db/schema";

const HOT_THRESHOLD = 30;

const YEARS = [2020, 2021, 2022, 2023, 2024] as const;

const DATASET: CitationDataset = {
  slug: "openmeteo-historical",
  name: "Open-Meteo Historical Weather",
  license: "CC BY 4.0",
  citation: "Open-Meteo.com — Historical Weather API (blends ERA5 + CHIRPS + stations).",
  sourceUrl: "https://open-meteo.com/en/docs/historical-weather-api",
  description: "Daily climate aggregates blended from ERA5, CHIRPS, and ground stations.",
  spatialRes: "~9 km",
  temporalRes: "daily",
};

type YearHotDays = {
  year: number;
  hot_days: number;
};

async function fetchHotDays(placeSlug: string): Promise<YearHotDays[]> {
  const rows = await db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM ${obsWeatherDaily.time})::int AS year,
      COUNT(*) FILTER (WHERE ${obsWeatherDaily.value} >= ${HOT_THRESHOLD})::int AS hot_days
    FROM ${obsWeatherDaily}
    JOIN ${places} ON ${places.id} = ${obsWeatherDaily.placeId}
    WHERE ${places.slug} = ${placeSlug}
      AND ${obsWeatherDaily.variable} = 'temp_2m_max'
      AND EXTRACT(YEAR FROM ${obsWeatherDaily.time}) BETWEEN 2020 AND 2024
    GROUP BY EXTRACT(YEAR FROM ${obsWeatherDaily.time})
    ORDER BY year
  `);

  return (rows.rows as Array<Record<string, unknown>>).map((r) => ({
    year: Number(r.year),
    hot_days: Number(r.hot_days),
  }));
}

type PageProps = {
  params: Promise<{ place: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { place: placeSlug } = await params;
  const entry = PLACE_REGISTRY[placeSlug];
  if (!entry) {
    return { title: "Not Found — Himalayan Atlas" };
  }
  const title = `${entry.name} — extreme heat days (≥${HOT_THRESHOLD}°C max), 2020–2024 — Himalayan Atlas`;
  const description = `Number of days per year where the daily maximum temperature reached ≥${HOT_THRESHOLD}°C at ${entry.name}, 2020–2024.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ExtremeHeatDaysPage({ params }: PageProps) {
  const { place: placeSlug } = await params;

  const entry = PLACE_REGISTRY[placeSlug];
  if (!entry) {
    notFound();
  }

  let rows: YearHotDays[] = [];
  try {
    rows = await fetchHotDays(placeSlug);
  } catch {
    // DB error → treat as no data
  }

  const byYear = new Map(rows.map((r) => [r.year, r]));
  const aligned = YEARS.map((y) => byYear.get(y) ?? { year: y, hot_days: 0 });

  const allZero = aligned.every((r) => r.hot_days === 0);
  const highAltitude = entry.alt >= 4000;

  const count2020 = byYear.get(2020)?.hot_days ?? 0;
  const count2024 = byYear.get(2024)?.hot_days ?? 0;
  const delta = count2024 - count2020;
  const deltaSign = delta >= 0 ? "+" : "";

  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-16 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav
          className="text-xs text-neutral-400 mb-6 flex items-center gap-1.5"
          aria-label="Breadcrumb"
        >
          <Link href="/charts" className="hover:text-neutral-700 transition-colors">
            Charts
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-neutral-600">Extreme Heat Days</span>
        </nav>

        {/* Heading */}
        <h1 className="text-2xl md:text-4xl font-semibold text-neutral-900 mb-2 leading-tight">
          {entry.name} —{" "}
          <span className="text-neutral-500 font-normal">
            extreme heat days (≥{HOT_THRESHOLD}°C max), 2020–2024
          </span>
        </h1>

        {/* Subheader */}
        {!allZero ? (
          <p className="text-base text-neutral-600 mt-3 mb-8">
            <span className="font-semibold text-neutral-900">{count2024} days</span> in 2024 vs{" "}
            <span className="font-semibold text-neutral-900">{count2020}</span> in 2020{" "}
            <span className={`font-semibold ${delta >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
              ({deltaSign}
              {delta} days)
            </span>
          </p>
        ) : (
          <p className="text-base text-neutral-600 mt-3 mb-8">
            No extreme heat days recorded in the 2020–2024 period.
          </p>
        )}

        {/* Definition note */}
        <div className="mb-8 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          <span className="font-medium text-neutral-800">Extreme heat day:</span> daily maximum
          temperature at 2 m ≥ {HOT_THRESHOLD}°C. Source variable:{" "}
          <code className="font-mono text-xs">temp_2m_max</code>. Coverage: 2020-01-01 → 2024-12-31.
        </div>

        {/* Chart or high-altitude explainer */}
        {allZero && highAltitude ? (
          <HighAltitudeNote placeName={entry.name} altM={entry.alt} />
        ) : allZero ? (
          <AllZeroNote placeName={entry.name} />
        ) : (
          <HeatBarChart aligned={aligned} />
        )}

        {/* Citation */}
        <div className="mt-10 flex justify-end">
          <CitationPill dataset={DATASET} />
        </div>
      </div>
    </main>
  );
}

// ─── Bar chart (pure SVG) ────────────────────────────────────────────────────

const W = 600;
const H = 280;
const PAD_LEFT = 44;
const PAD_RIGHT = 16;
const PAD_TOP = 24;
const PAD_BOTTOM = 36;

const CHART_W = W - PAD_LEFT - PAD_RIGHT;
const CHART_H = H - PAD_TOP - PAD_BOTTOM;

function HeatBarChart({ aligned }: { aligned: YearHotDays[] }) {
  const maxDays = Math.max(...aligned.map((r) => r.hot_days), 1);
  const barCount = aligned.length;
  const slotW = CHART_W / barCount;
  const barW = Math.max(slotW * 0.55, 8);

  const yStepCount = 5;
  const rawStep = maxDays / yStepCount;
  const step = Math.max(Math.ceil(rawStep), 1);
  const yMax = step * yStepCount;
  const yGridLines = Array.from({ length: yStepCount + 1 }, (_, i) => i * step);

  function xCenter(i: number) {
    return PAD_LEFT + slotW * i + slotW / 2;
  }

  function yForCount(count: number) {
    return PAD_TOP + CHART_H - (count / yMax) * CHART_H;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-2 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Bar chart: extreme heat days per year"
        style={{ minWidth: "280px" }}
      >
        {/* Grid lines + Y-axis labels */}
        {yGridLines.map((count) => {
          const y = yForCount(count);
          return (
            <g key={count}>
              <line
                x1={PAD_LEFT}
                y1={y}
                x2={W - PAD_RIGHT}
                y2={y}
                stroke={count === 0 ? "#a3a3a3" : "#e5e5e5"}
                strokeWidth={count === 0 ? 1 : 0.75}
              />
              <text x={PAD_LEFT - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#737373">
                {count}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {aligned.map((row, i) => {
          const cx = xCenter(i);
          const barH = (row.hot_days / yMax) * CHART_H;
          const barY = yForCount(row.hot_days);

          return (
            <g key={row.year}>
              {row.hot_days > 0 ? (
                <>
                  <rect
                    x={cx - barW / 2}
                    y={barY}
                    width={barW}
                    height={barH}
                    fill="#f97316"
                    rx={3}
                    opacity={0.85}
                  />
                  <text
                    x={cx}
                    y={barY - 5}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#404040"
                  >
                    {row.hot_days}
                  </text>
                </>
              ) : (
                <text x={cx} y={yForCount(0) - 6} textAnchor="middle" fontSize="10" fill="#a3a3a3">
                  0
                </text>
              )}
              <text
                x={cx}
                y={PAD_TOP + CHART_H + 16}
                textAnchor="middle"
                fontSize="11"
                fill="#525252"
              >
                {row.year}
              </text>
            </g>
          );
        })}

        {/* Y-axis border */}
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP}
          x2={PAD_LEFT}
          y2={PAD_TOP + CHART_H}
          stroke="#a3a3a3"
          strokeWidth={1}
        />
      </svg>

      <p className="mt-2 px-1 text-xs text-neutral-400">
        Days per year with daily max temperature ≥ {HOT_THRESHOLD}°C
      </p>
    </div>
  );
}

// ─── High-altitude explainer ─────────────────────────────────────────────────

function HighAltitudeNote({ placeName, altM }: { placeName: string; altM: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
      <p className="text-neutral-700 text-sm leading-relaxed">
        <span className="font-medium">{placeName}</span> sits at{" "}
        <span className="font-medium">{altM.toLocaleString()} m</span>; daily highs there have not
        crossed {HOT_THRESHOLD}°C in our 5-year record (2020–2024). Temperatures at this elevation
        rarely approach heat-stress thresholds.
      </p>
    </div>
  );
}

// ─── All-zero (low altitude) fallback ────────────────────────────────────────

function AllZeroNote({ placeName }: { placeName: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
      <p className="text-neutral-500 text-sm">
        No days with maximum temperature ≥ {HOT_THRESHOLD}°C were recorded for{" "}
        <span className="font-medium text-neutral-700">{placeName}</span> in 2020–2024.
      </p>
    </div>
  );
}
