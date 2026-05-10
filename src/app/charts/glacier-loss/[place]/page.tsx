import { sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CitationDataset } from "@/components/ui/citation-pill";
import { CitationPill } from "@/components/ui/citation-pill";
import { PLACE_REGISTRY } from "@/data/places";
import { db } from "@/db/client";

export const revalidate = 600;

import { cryoGlacierMassBalance, places } from "@/db/schema";

const VALID_GLACIER_SLUGS = new Set(["khumbu-glacier", "yala", "rikha-samba", "gangotri"]);

const DATASET: CitationDataset = {
  slug: "icimod-mb-preliminary",
  name: "ICIMOD Glacier Mass Balance (Preliminary)",
  license: "CC BY 4.0",
  citation:
    "Hugonnet, R. et al. (2021). Accelerated global glacier mass loss in the early twenty-first century. Nature, 592, 726–731. — Placeholder rates seeded with noise for HKH glaciers by ICIMOD.",
  sourceUrl: "https://doi.org/10.1038/s41586-021-03436-z",
  description:
    "Preliminary placeholder mass-balance series for four HKH glaciers (2000–2019). Annual rates are derived from Hugonnet et al. 2021 regional means with added synthetic noise. Not a substitute for glacier-specific geodetic surveys.",
  temporalRes: "annual",
};

type MassBalanceRow = {
  year: number;
  value: number;
};

async function fetchMassBalance(placeSlug: string): Promise<MassBalanceRow[]> {
  const rows = await db.execute(sql`
    SELECT
      EXTRACT(YEAR FROM ${cryoGlacierMassBalance.time})::int AS year,
      ${cryoGlacierMassBalance.value}                        AS value
    FROM ${cryoGlacierMassBalance}
    JOIN ${places} ON ${places.id} = ${cryoGlacierMassBalance.placeId}
    WHERE ${places.slug} = ${placeSlug}
      AND EXTRACT(YEAR FROM ${cryoGlacierMassBalance.time}) BETWEEN 2000 AND 2019
    ORDER BY year
  `);

  return (rows.rows as Array<Record<string, unknown>>).map((r) => ({
    year: Number(r.year),
    value: Number(r.value),
  }));
}

type PageProps = {
  params: Promise<{ place: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { place: placeSlug } = await params;
  const entry = PLACE_REGISTRY[placeSlug];
  if (!entry || !VALID_GLACIER_SLUGS.has(placeSlug)) {
    return { title: "Not Found — Himalayan Atlas" };
  }
  const title = `${entry.name} — glacier mass balance, 2000–2019 — Himalayan Atlas`;
  const description = `Cumulative and annual glacier mass balance for ${entry.name} (2000–2019). Negative values indicate ice loss in metres water-equivalent per year.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GlacierLossPage({ params }: PageProps) {
  const { place: placeSlug } = await params;

  if (!VALID_GLACIER_SLUGS.has(placeSlug)) {
    notFound();
  }

  const entry = PLACE_REGISTRY[placeSlug];
  if (!entry) {
    notFound();
  }

  let rows: MassBalanceRow[] = [];
  try {
    rows = await fetchMassBalance(placeSlug);
  } catch {
    // DB error treated as sparse data → empty state
  }

  const hasData = rows.length > 0;

  // Compute cumulative sum in JS
  let cumulative = 0;
  const series = rows.map((r) => {
    cumulative += r.value;
    return { year: r.year, annual: r.value, cumulative };
  });

  const totalLoss = series.length > 0 ? (series[series.length - 1]?.cumulative ?? 0) : 0;
  const avgRate = series.length > 0 ? series.reduce((s, r) => s + r.annual, 0) / series.length : 0;

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
          <span className="text-neutral-600">Glacier Loss</span>
        </nav>

        {/* Heading */}
        <h1 className="text-2xl md:text-4xl font-semibold text-neutral-900 mb-2 leading-tight">
          {entry.name} —{" "}
          <span className="text-neutral-500 font-normal">glacier mass balance, 2000–2019</span>
        </h1>

        {/* Preliminary data banner */}
        <div className="mt-5 mb-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          >
            <path
              d="M8 1.5L14.5 13H1.5L8 1.5Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <rect x="7.5" y="6" width="1" height="4" fill="currentColor" rx="0.5" />
            <rect x="7.5" y="11" width="1" height="1.2" fill="currentColor" rx="0.5" />
          </svg>
          <p>
            <span className="font-semibold">Preliminary placeholder data.</span> Annual rates are
            derived from Hugonnet et al. (2021) HKH regional means with synthetic noise — not
            glacier-specific geodetic surveys. Treat as illustrative, not authoritative.{" "}
            <a
              href="https://doi.org/10.1038/s41586-021-03436-z"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Source paper
            </a>
            .
          </p>
        </div>

        {/* Stat strip */}
        {hasData && (
          <div className="mb-8 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-500 mb-0.5">Total loss (2000–2019)</p>
              <p className="text-xl font-semibold text-rose-600 tabular-nums">
                {totalLoss.toFixed(2)} m w.e.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-500 mb-0.5">Average annual rate</p>
              <p className="text-xl font-semibold text-rose-600 tabular-nums">
                {avgRate.toFixed(3)} m w.e./yr
              </p>
            </div>
          </div>
        )}

        {/* Chart or empty state */}
        {hasData ? <GlacierChart series={series} /> : <EmptyState glacierName={entry.name} />}

        {/* Citation */}
        <div className="mt-10 flex justify-end">
          <CitationPill dataset={DATASET} />
        </div>
      </div>
    </main>
  );
}

// ─── Chart types ─────────────────────────────────────────────────────────────

type SeriesRow = {
  year: number;
  annual: number;
  cumulative: number;
};

// ─── SVG glacier chart ────────────────────────────────────────────────────────

const W = 600;
const H = 320;
const PAD_LEFT = 56;
const PAD_RIGHT = 20;
const PAD_TOP = 28;
const PAD_BOTTOM = 40;

const CHART_W = W - PAD_LEFT - PAD_RIGHT;
const CHART_H = H - PAD_TOP - PAD_BOTTOM;

function GlacierChart({ series }: { series: SeriesRow[] }) {
  if (series.length === 0) return null;

  const annualMin = Math.min(...series.map((r) => r.annual));
  const annualMax = Math.max(...series.map((r) => r.annual), 0);
  const cumulativeMin = Math.min(...series.map((r) => r.cumulative));
  const cumulativeMax = Math.max(...series.map((r) => r.cumulative), 0);

  // Y domain covers both annual and cumulative
  const yMin = Math.min(annualMin, cumulativeMin) * 1.1;
  const yMax = Math.max(annualMax, cumulativeMax, 0.1);

  const yRange = yMax - yMin;

  function yPx(v: number): number {
    return PAD_TOP + CHART_H - ((v - yMin) / yRange) * CHART_H;
  }

  const n = series.length;
  const slotW = CHART_W / n;
  const barW = Math.max(slotW * 0.5, 6);

  function xCenter(i: number): number {
    return PAD_LEFT + slotW * i + slotW / 2;
  }

  // Y-axis grid lines: 0 + a few sensible stops
  const gridValues = computeGridLines(yMin, yMax, 5);

  // Cumulative polyline points
  const linePoints = series
    .map((r, i) => `${xCenter(i).toFixed(1)},${yPx(r.cumulative).toFixed(1)}`)
    .join(" ");

  const zeroY = yPx(0);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-2 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Layered chart: annual mass balance bars and cumulative loss line for glacier"
        style={{ minWidth: "300px" }}
      >
        {/* Grid lines + Y labels */}
        {gridValues.map((v) => {
          const y = yPx(v);
          const isZero = v === 0;
          return (
            <g key={v}>
              <line
                x1={PAD_LEFT}
                y1={y}
                x2={W - PAD_RIGHT}
                y2={y}
                stroke={isZero ? "#a3a3a3" : "#e5e5e5"}
                strokeWidth={isZero ? 1 : 0.75}
              />
              <text
                x={PAD_LEFT - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="9"
                fill="#737373"
                fontFamily="Inter, sans-serif"
              >
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          transform={`rotate(-90, ${PAD_LEFT - 42}, ${PAD_TOP + CHART_H / 2})`}
          x={PAD_LEFT - 42}
          y={PAD_TOP + CHART_H / 2}
          textAnchor="middle"
          fontSize="9"
          fill="#737373"
          fontFamily="Inter, sans-serif"
        >
          m w.e.
        </text>

        {/* Annual bars */}
        {series.map((r, i) => {
          const cx = xCenter(i);
          const barTop = r.annual <= 0 ? yPx(r.annual) : yPx(0);
          const barBottom = r.annual <= 0 ? zeroY : yPx(r.annual);
          const barH = Math.abs(barBottom - barTop);

          return (
            <rect
              key={r.year}
              x={cx - barW / 2}
              y={barTop}
              width={barW}
              height={Math.max(barH, 1)}
              fill={r.annual < 0 ? "#ef4444" : "#10b981"}
              opacity={0.7}
              rx={2}
            />
          );
        })}

        {/* Cumulative loss line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#1e40af"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Cumulative dots */}
        {series.map((r, i) => (
          <circle key={r.year} cx={xCenter(i)} cy={yPx(r.cumulative)} r={3} fill="#1e40af" />
        ))}

        {/* X-axis labels */}
        {series.map((r, i) => {
          const cx = xCenter(i);
          const showLabel = n <= 20 ? true : i % 2 === 0;
          return showLabel ? (
            <text
              key={r.year}
              x={cx}
              y={PAD_TOP + CHART_H + 18}
              textAnchor="middle"
              fontSize="9"
              fill="#525252"
              fontFamily="Inter, sans-serif"
            >
              {r.year}
            </text>
          ) : null;
        })}

        {/* Axis lines */}
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP}
          x2={PAD_LEFT}
          y2={PAD_TOP + CHART_H}
          stroke="#a3a3a3"
          strokeWidth={1}
        />
        <line
          x1={PAD_LEFT}
          y1={PAD_TOP + CHART_H}
          x2={W - PAD_RIGHT}
          y2={PAD_TOP + CHART_H}
          stroke="#a3a3a3"
          strokeWidth={1}
        />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 px-1 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500 opacity-70" />
          Annual loss (m w.e./yr)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-blue-800 rounded" />
          Cumulative loss (m w.e.)
        </span>
      </div>
    </div>
  );
}

function computeGridLines(yMin: number, yMax: number, count: number): number[] {
  const step = (yMax - yMin) / (count - 1);
  const lines: number[] = [];
  for (let i = 0; i < count; i++) {
    const v = yMin + step * i;
    lines.push(Math.round(v * 10) / 10);
  }
  // Always include 0 if in range
  if (!lines.some((v) => v === 0) && yMin <= 0 && yMax >= 0) {
    lines.push(0);
    lines.sort((a, b) => a - b);
  }
  return lines;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ glacierName }: { glacierName: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
      <p className="text-neutral-500 text-sm">
        No mass-balance data available for{" "}
        <span className="font-medium text-neutral-700">{glacierName}</span> (2000–2019).
      </p>
      <p className="mt-2 text-xs text-neutral-400">
        Data is ingested from the <code className="font-mono">cryo_glacier_mass_balance</code>{" "}
        table. Check that the ingestion script has run for this glacier.
      </p>
    </div>
  );
}
