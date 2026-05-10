import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { pool } from "@/db/client";

export const metadata: Metadata = {
  title: "In Your Lifetime — Himalayan Atlas",
  description:
    "See how Nepal's climate has changed since you were born — temperature, precipitation, extreme heat days, and glacier mass balance.",
};

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

// ─── Types ────────────────────────────────────────────────────────────────────

type ClimateRow = {
  yr: string;
  avg_temp: number | null;
  avg_total_precip: number | null;
  hot_days_per_place: number | null;
};

type GlacierRow = {
  mb_start: number | null;
  mb_end: number | null;
  glacier_count: string;
};

type IndicatorData = {
  thenValue: number;
  nowValue: number;
  delta: number;
  thenYear: number;
  nowYear: number;
};

type Indicators = {
  temp: IndicatorData;
  precip: IndicatorData;
  heatDays: IndicatorData;
  glacier: IndicatorData | null;
};

// ─── Database queries ─────────────────────────────────────────────────────────

async function fetchClimateIndicators(birthYear: number): Promise<Indicators> {
  // Weather archive spans 2020–2024; clamp the start year.
  const startYear = Math.max(birthYear, 2020);
  const endYear = 2024;

  const climateResult = await pool.query<ClimateRow>(
    `
    SELECT
      EXTRACT(YEAR FROM o.time)::int AS yr,
      AVG(o.value) FILTER (WHERE o.variable = 'temp_2m_mean') AS avg_temp,
      SUM(o.value) FILTER (WHERE o.variable = 'precip')
        / NULLIF(COUNT(DISTINCT o.place_id) FILTER (WHERE o.variable = 'precip'), 0)
        AS avg_total_precip,
      COUNT(*) FILTER (WHERE o.variable = 'temp_2m_max' AND o.value >= 30)::numeric
        / NULLIF(COUNT(DISTINCT o.place_id) FILTER (WHERE o.variable = 'temp_2m_max'), 0)
        AS hot_days_per_place
    FROM obs_weather_daily o
    JOIN places p ON p.id = o.place_id
    WHERE p.country = 'Nepal'
      AND o.variable IN ('temp_2m_mean', 'precip', 'temp_2m_max')
      AND EXTRACT(YEAR FROM o.time) IN ($1, $2)
    GROUP BY EXTRACT(YEAR FROM o.time)
    ORDER BY yr
    `,
    [startYear, endYear],
  );

  const thenRow = climateResult.rows.find((r) => Number(r.yr) === startYear);
  const nowRow = climateResult.rows.find((r) => Number(r.yr) === endYear);

  if (!thenRow || !nowRow) {
    throw new Error("Climate data unavailable for requested year range.");
  }

  const temp: IndicatorData = {
    thenValue: thenRow.avg_temp ?? 0,
    nowValue: nowRow.avg_temp ?? 0,
    delta: (nowRow.avg_temp ?? 0) - (thenRow.avg_temp ?? 0),
    thenYear: startYear,
    nowYear: endYear,
  };

  const precip: IndicatorData = {
    thenValue: thenRow.avg_total_precip ?? 0,
    nowValue: nowRow.avg_total_precip ?? 0,
    delta: (nowRow.avg_total_precip ?? 0) - (thenRow.avg_total_precip ?? 0),
    thenYear: startYear,
    nowYear: endYear,
  };

  const heatDays: IndicatorData = {
    thenValue: Number(thenRow.hot_days_per_place ?? 0),
    nowValue: Number(nowRow.hot_days_per_place ?? 0),
    delta: Number(nowRow.hot_days_per_place ?? 0) - Number(thenRow.hot_days_per_place ?? 0),
    thenYear: startYear,
    nowYear: endYear,
  };

  // Glacier mass balance: available 2000–2019.
  let glacier: IndicatorData | null = null;
  if (birthYear >= 2000) {
    const glacierStartYear = Math.min(birthYear, 2019);
    const glacierEndYear = 2019;

    if (glacierStartYear < glacierEndYear) {
      const glacierResult = await pool.query<GlacierRow>(
        `
        SELECT
          SUM(value) FILTER (WHERE EXTRACT(YEAR FROM time) = $1) AS mb_start,
          SUM(value) FILTER (WHERE EXTRACT(YEAR FROM time) = $2) AS mb_end,
          COUNT(DISTINCT place_id)::text AS glacier_count
        FROM cryo_glacier_mass_balance
        WHERE EXTRACT(YEAR FROM time) IN ($1, $2)
        `,
        [glacierStartYear, glacierEndYear],
      );

      const gr = glacierResult.rows[0];
      if (gr && gr.mb_start !== null && gr.mb_end !== null) {
        glacier = {
          thenValue: gr.mb_start,
          nowValue: gr.mb_end,
          delta: gr.mb_end - gr.mb_start,
          thenYear: glacierStartYear,
          nowYear: glacierEndYear,
        };
      }
    }
  }

  return { temp, precip, heatDays, glacier };
}

// ─── Indicator card component ─────────────────────────────────────────────────

type CardProps = {
  title: string;
  thenLabel: string;
  thenValue: string;
  nowValue: string;
  delta: string;
  deltaPositiveIsBad: boolean;
  deltaIsPositive: boolean;
  deltaIsZero: boolean;
  caption: string;
  unit: string;
};

function IndicatorCard({
  title,
  thenLabel,
  thenValue,
  nowValue,
  delta,
  deltaPositiveIsBad,
  deltaIsPositive,
  deltaIsZero,
  caption,
  unit,
}: CardProps) {
  let deltaColor: string;
  if (deltaIsZero) {
    deltaColor = "text-neutral-500";
  } else if (deltaPositiveIsBad) {
    deltaColor = deltaIsPositive ? "text-red-600" : "text-blue-600";
  } else {
    deltaColor = deltaIsPositive ? "text-blue-600" : "text-red-600";
  }

  const deltaPrefix = deltaIsPositive ? "+" : "";

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-3 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        {title}
      </p>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">{thenLabel}</p>
          <p className="text-xl font-semibold text-[var(--color-text-secondary)] tabular-nums">
            {thenValue}
            <span className="text-xs font-normal ml-0.5">{unit}</span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">2024</p>
          <p className="text-2xl font-semibold text-[var(--color-text-primary)] tabular-nums">
            {nowValue}
            <span className="text-xs font-normal ml-0.5">{unit}</span>
          </p>
        </div>
      </div>

      <div className={`text-sm font-semibold tabular-nums ${deltaColor}`}>
        {deltaPrefix}
        {delta}
        {unit !== "" && <span className="ml-0.5 text-xs font-normal">{unit}</span>}
      </div>

      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border-subtle)] pt-3 mt-auto">
        {caption}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InYourLifetimePage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = Array.isArray(params.birthYear) ? params.birthYear[0] : params.birthYear;
  const birthYearNum = raw !== undefined ? Number(raw) : null;

  const isValidYear =
    birthYearNum !== null &&
    Number.isInteger(birthYearNum) &&
    birthYearNum >= 1900 &&
    birthYearNum <= 2024;

  const hasInput = raw !== undefined;

  let indicators: Indicators | null = null;
  let fetchError: string | null = null;

  if (isValidYear && birthYearNum !== null) {
    try {
      indicators = await fetchClimateIndicators(birthYearNum);
    } catch {
      fetchError = "Could not load climate data. Please try again later.";
    }
  }

  // Determine if the weather comparison is clamped (birth year before 2020).
  const effectiveStartYear =
    isValidYear && birthYearNum !== null ? Math.max(birthYearNum, 2020) : 2020;
  const isClamped = isValidYear && birthYearNum !== null && birthYearNum < 2020;

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="px-4 py-12 md:py-20 max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mb-8"
        >
          ← Himalayan Atlas
        </Link>

        {/* Hero heading */}
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-[var(--color-text-primary)] tracking-tight mb-3`}
        >
          {isValidYear && birthYearNum !== null ? (
            <>
              Since <span className="text-[var(--color-accent)]">{birthYearNum}</span>
            </>
          ) : (
            "In Your Lifetime"
          )}
        </h1>

        <p className="text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-prose">
          {isValidYear && birthYearNum !== null
            ? `How Nepal's climate has shifted across our ${28} measured places — averaged from ${effectiveStartYear} to 2024.`
            : "Enter your birth year to see how Nepal's climate has changed across its mountains, valleys, and glaciers."}
        </p>

        {/* Form */}
        <form
          action="/in-your-lifetime"
          method="get"
          className="flex flex-wrap items-end gap-3 mb-10"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="birthYear"
              className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide"
            >
              Birth year
            </label>
            <input
              id="birthYear"
              name="birthYear"
              type="number"
              min={1900}
              max={2024}
              placeholder="1990"
              defaultValue={raw ?? ""}
              required
              className="w-32 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent tabular-nums"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Show my lifetime
          </button>
        </form>

        {/* Validation error */}
        {hasInput && !isValidYear && (
          <div className="mb-8 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            Please enter a year between 1900 and 2024.
          </div>
        )}

        {/* Fetch error */}
        {fetchError && (
          <div className="mb-8 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {fetchError}
          </div>
        )}

        {/* Coverage caveat banner */}
        {isClamped && indicators && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm leading-relaxed">
            <strong className="text-[var(--color-text-primary)]">Coverage note:</strong> You were
            born in {birthYearNum}, but our weather archive starts in 2020. The temperature,
            precipitation, and heat-day cards compare <strong>2020</strong> with 2024 — the earliest
            window we have.
          </div>
        )}

        {/* Indicator cards */}
        {indicators && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {/* Mean annual temperature */}
            <IndicatorCard
              title="Mean temperature"
              thenLabel={`${effectiveStartYear} avg`}
              thenValue={indicators.temp.thenValue.toFixed(1)}
              nowValue={indicators.temp.nowValue.toFixed(1)}
              delta={Math.abs(indicators.temp.delta).toFixed(2)}
              deltaPositiveIsBad={true}
              deltaIsPositive={indicators.temp.delta > 0}
              deltaIsZero={Math.abs(indicators.temp.delta) < 0.005}
              unit="°C"
              caption={`Average daily mean temperature across 28 Nepali places. A positive delta means warming.`}
            />

            {/* Total annual precipitation */}
            <IndicatorCard
              title="Annual precipitation"
              thenLabel={`${effectiveStartYear} total`}
              thenValue={Math.round(indicators.precip.thenValue).toLocaleString()}
              nowValue={Math.round(indicators.precip.nowValue).toLocaleString()}
              delta={Math.abs(Math.round(indicators.precip.delta)).toLocaleString()}
              deltaPositiveIsBad={false}
              deltaIsPositive={indicators.precip.delta > 0}
              deltaIsZero={Math.abs(indicators.precip.delta) < 1}
              unit="mm"
              caption="Average total annual precipitation per place. A negative delta means drier conditions."
            />

            {/* Extreme-heat days */}
            <IndicatorCard
              title="Extreme-heat days"
              thenLabel={`${effectiveStartYear} per place`}
              thenValue={indicators.heatDays.thenValue.toFixed(1)}
              nowValue={indicators.heatDays.nowValue.toFixed(1)}
              delta={Math.abs(indicators.heatDays.delta).toFixed(1)}
              deltaPositiveIsBad={true}
              deltaIsPositive={indicators.heatDays.delta > 0}
              deltaIsZero={Math.abs(indicators.heatDays.delta) < 0.05}
              unit="days"
              caption="Days per place per year where the maximum temperature reached 30 °C or above."
            />

            {/* Glacier mass balance */}
            {indicators.glacier ? (
              <IndicatorCard
                title="Glacier mass balance"
                thenLabel={`${indicators.glacier.thenYear} cumul.`}
                thenValue={indicators.glacier.thenValue.toFixed(3)}
                nowValue={indicators.glacier.nowValue.toFixed(3)}
                delta={Math.abs(indicators.glacier.delta).toFixed(3)}
                deltaPositiveIsBad={false}
                deltaIsPositive={indicators.glacier.delta > 0}
                deltaIsZero={Math.abs(indicators.glacier.delta) < 0.0005}
                unit="m w.e."
                caption={`Cumulative geodetic mass balance across Himalayan glaciers tracked by ICIMOD (${indicators.glacier.thenYear}–${indicators.glacier.nowYear}). More negative = more ice lost.`}
              />
            ) : (
              <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-3 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                  Glacier mass balance
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mt-auto">
                  Glacier data covers 2000–2019. Not available for birth years before 2000 or where
                  the birth year equals the last recorded year.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Citation footer */}
        {indicators && (
          <footer className="border-t border-[var(--color-border)] pt-6">
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-prose">
              <strong className="text-[var(--color-text-secondary)]">Data sources:</strong> Weather
              data from <span className="font-mono">openmeteo-historical</span> (Open-Meteo
              historical archive, ingested for 28 Nepali places, 2020–2024). Glacier mass balance
              from <span className="font-mono">icimod-mb-preliminary</span> (ICIMOD preliminary
              geodetic mass balance, 2000–2019). Values are averaged across all Nepali places in the
              Atlas database.
            </p>
          </footer>
        )}
      </div>
    </main>
  );
}
