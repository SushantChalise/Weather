import { sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CitationDataset } from "@/components/ui/citation-pill";
import { CitationPill } from "@/components/ui/citation-pill";
import { PLACE_REGISTRY } from "@/data/places";
import { db } from "@/db/client";
import { obsWeatherDaily, places } from "@/db/schema";

export const revalidate = 600;

const VALID_MONTHS = new Set([
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
]);

const MONTH_NAMES: Record<string, string> = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

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

type YearRow = {
  year: number;
  total_days: number;
  trek_days: number;
  pct: number;
};

async function fetchTrekDays(placeSlug: string, monthNum: number): Promise<YearRow[]> {
  const rows = await db.execute(sql`
    WITH pivot AS (
      SELECT
        DATE(${obsWeatherDaily.time}) AS day,
        EXTRACT(YEAR FROM ${obsWeatherDaily.time})::int AS year,
        MAX(CASE WHEN ${obsWeatherDaily.variable} = 'precip'       THEN ${obsWeatherDaily.value} END) AS precip,
        MAX(CASE WHEN ${obsWeatherDaily.variable} = 'wind_max_10m' THEN ${obsWeatherDaily.value} END) AS wind_max
      FROM ${obsWeatherDaily}
      JOIN ${places} ON ${places.id} = ${obsWeatherDaily.placeId}
      WHERE ${places.slug} = ${placeSlug}
        AND EXTRACT(MONTH FROM ${obsWeatherDaily.time}) = ${monthNum}
        AND EXTRACT(YEAR  FROM ${obsWeatherDaily.time}) BETWEEN 2020 AND 2024
        AND ${obsWeatherDaily.variable} IN ('precip', 'wind_max_10m')
      GROUP BY DATE(${obsWeatherDaily.time}), EXTRACT(YEAR FROM ${obsWeatherDaily.time})
    )
    SELECT
      year,
      COUNT(*)::int AS total_days,
      COUNT(*) FILTER (WHERE precip < 1.0 AND wind_max < 30.0)::int AS trek_days,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE precip < 1.0 AND wind_max < 30.0)
          / NULLIF(COUNT(*), 0),
        1
      )::float8 AS pct
    FROM pivot
    GROUP BY year
    ORDER BY year
  `);

  return (rows.rows as Array<Record<string, unknown>>).map((r) => ({
    year: Number(r.year),
    total_days: Number(r.total_days),
    trek_days: Number(r.trek_days),
    pct: Number(r.pct),
  }));
}

type PageProps = {
  params: Promise<{ place: string; month: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { place: placeSlug, month } = await params;
  const entry = PLACE_REGISTRY[placeSlug];
  if (!entry || !VALID_MONTHS.has(month)) {
    return { title: "Not Found — Himalayan Atlas" };
  }
  const monthName = MONTH_NAMES[month] ?? month;
  const title = `${entry.name} — ${monthName}: Trek Window Shift — Himalayan Atlas`;
  const description = `% of trekking-friendly days each year (2020–2024) for ${entry.name} in ${monthName}. Criteria: precip < 1 mm and wind < 30 km/h.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TrekWindowShiftPage({ params }: PageProps) {
  const { place: placeSlug, month } = await params;

  if (!VALID_MONTHS.has(month)) {
    notFound();
  }

  const entry = PLACE_REGISTRY[placeSlug];
  if (!entry) {
    notFound();
  }

  const monthName = MONTH_NAMES[month] ?? month;
  const monthNum = parseInt(month, 10);

  let rows: YearRow[] = [];
  try {
    rows = await fetchTrekDays(placeSlug, monthNum);
  } catch {
    // DB error treated as sparse data → empty state
  }

  // Align to full 2020-2024 span; fill missing years with null
  const byYear = new Map(rows.map((r) => [r.year, r]));
  const aligned = YEARS.map((y) => byYear.get(y) ?? null);
  const hasData = rows.length > 0;

  const first = byYear.get(2020);
  const last = byYear.get(2024);
  const delta = first != null && last != null ? (last.pct - first.pct).toFixed(1) : null;
  const deltaSign = delta !== null && parseFloat(delta) >= 0 ? "+" : "";

  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-16 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav
          className="text-xs text-neutral-400 mb-6 flex items-center gap-1.5"
          aria-label="Breadcrumb"
        >
          <a href="/charts" className="hover:text-neutral-700 transition-colors">
            Charts
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-neutral-600">Trek Window Shift</span>
        </nav>

        {/* Heading */}
        <h1 className="text-2xl md:text-4xl font-semibold text-neutral-900 mb-2 leading-tight">
          {entry.name} — <span className="text-neutral-500 font-normal">{monthName}:</span> trekking
          days by year
        </h1>

        {/* Subheader */}
        {hasData && first != null && last != null && delta !== null ? (
          <p className="text-base text-neutral-600 mt-3 mb-8">
            <span className="font-semibold text-neutral-900">{last.pct}%</span> in 2024 vs{" "}
            <span className="font-semibold text-neutral-900">{first.pct}%</span> in 2020{" "}
            <span
              className={`font-semibold ${parseFloat(delta) >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              ({deltaSign}
              {delta}&nbsp;pp)
            </span>
          </p>
        ) : (
          <p className="text-sm text-neutral-500 mt-2 mb-8">
            A trekking-friendly day requires precipitation&nbsp;&lt;&nbsp;1&nbsp;mm and
            wind&nbsp;&lt;&nbsp;30&nbsp;km/h. Data: 2020–2024.
          </p>
        )}

        {/* Definition note */}
        <div className="mb-8 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          <span className="font-medium text-neutral-800">Trekking-friendly day:</span> precipitation
          &lt; 1 mm AND maximum wind &lt; 30 km/h.
        </div>

        {/* Chart or empty state */}
        {hasData ? (
          <BarChart aligned={aligned} />
        ) : (
          <EmptyState placeName={entry.name} monthName={monthName} />
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

function BarChart({ aligned }: { aligned: (YearRow | null)[] }) {
  const maxPct = 100;
  const barCount = aligned.length;
  const slotW = CHART_W / barCount;
  const barW = Math.max(slotW * 0.55, 8);

  const yGridLines = [0, 25, 50, 75, 100];

  function xCenter(i: number) {
    return PAD_LEFT + slotW * i + slotW / 2;
  }

  function yForPct(pct: number) {
    return PAD_TOP + CHART_H - (pct / maxPct) * CHART_H;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-2 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Bar chart: trekking-friendly days per year"
        style={{ minWidth: "280px" }}
      >
        {/* Grid lines + Y-axis labels */}
        {yGridLines.map((pct) => {
          const y = yForPct(pct);
          return (
            <g key={pct}>
              <line
                x1={PAD_LEFT}
                y1={y}
                x2={W - PAD_RIGHT}
                y2={y}
                stroke={pct === 0 ? "#a3a3a3" : "#e5e5e5"}
                strokeWidth={pct === 0 ? 1 : 0.75}
              />
              <text x={PAD_LEFT - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#737373">
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {aligned.map((row, i) => {
          const cx = xCenter(i);
          const year = YEARS[i] ?? 2020 + i;

          if (row == null) {
            // No data for this year — empty slot
            return (
              <g key={year}>
                <rect
                  x={cx - barW / 2}
                  y={PAD_TOP}
                  width={barW}
                  height={CHART_H}
                  fill="#f5f5f5"
                  rx={3}
                />
                <text
                  x={cx}
                  y={PAD_TOP + CHART_H + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#a3a3a3"
                >
                  {year}
                </text>
              </g>
            );
          }

          const barH = (row.pct / maxPct) * CHART_H;
          const barY = yForPct(row.pct);
          const fill = row.pct >= 80 ? "#10b981" : row.pct >= 60 ? "#f59e0b" : "#ef4444";

          return (
            <g key={year}>
              <rect
                x={cx - barW / 2}
                y={barY}
                width={barW}
                height={barH}
                fill={fill}
                rx={3}
                opacity={0.85}
              />
              {/* % label above bar */}
              <text
                x={cx}
                y={barY - 5}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#404040"
              >
                {row.pct}%
              </text>
              {/* Year label below axis */}
              <text
                x={cx}
                y={PAD_TOP + CHART_H + 16}
                textAnchor="middle"
                fontSize="11"
                fill="#525252"
              >
                {year}
              </text>
            </g>
          );
        })}

        {/* Axis border */}
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP}
          x2={PAD_LEFT}
          y2={PAD_TOP + CHART_H}
          stroke="#a3a3a3"
          strokeWidth={1}
        />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500 opacity-85" />≥ 80%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-400 opacity-85" />
          60–79%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500 opacity-85" />
          &lt; 60%
        </span>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ placeName, monthName }: { placeName: string; monthName: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
      <p className="text-neutral-500 text-sm">
        No trekking-window data available for{" "}
        <span className="font-medium text-neutral-700">{placeName}</span> in{" "}
        <span className="font-medium text-neutral-700">{monthName}</span> (2020–2024).
      </p>
      <p className="mt-2 text-xs text-neutral-400">
        Data requires both <code className="font-mono">precip</code> and{" "}
        <code className="font-mono">wind_max_10m</code> observations in this period.
      </p>
    </div>
  );
}
