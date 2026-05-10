import { NextResponse } from "next/server";
import { pool } from "@/db/client";

export const revalidate = 3600;

type DailyRow = {
  day: number;
  value: number | null;
};

const VALID_VARIABLES = new Set([
  "temp_2m_mean",
  "precip",
  "temp_2m_max",
  "temp_2m_min",
  "wind_max_10m",
]);

const DATA_YEARS = [2020, 2021, 2022, 2023, 2024] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const place = searchParams.get("place");
  const variable = searchParams.get("variable");
  const monthParam = searchParams.get("month");

  if (!place || !variable || !monthParam) {
    return NextResponse.json(
      { error: "Missing required params: place, variable, month" },
      { status: 400 },
    );
  }

  const month = Number(monthParam);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "month must be an integer 1–12" }, { status: 400 });
  }

  if (!VALID_VARIABLES.has(variable)) {
    return NextResponse.json({ error: "Unknown variable" }, { status: 400 });
  }

  try {
    const series: number[][] = [];

    for (const year of DATA_YEARS) {
      const result = await pool.query<DailyRow>(
        `
        SELECT
          EXTRACT(DAY FROM o.time)::int AS day,
          o.value
        FROM obs_weather_daily o
        JOIN places p ON p.id = o.place_id
        WHERE p.slug = $1
          AND o.variable = $2
          AND EXTRACT(YEAR FROM o.time) = $3
          AND EXTRACT(MONTH FROM o.time) = $4
        ORDER BY o.time
        `,
        [place, variable, year, month],
      );

      series.push(result.rows.map((r) => r.value ?? 0));
    }

    return NextResponse.json({ years: DATA_YEARS, series });
  } catch {
    return NextResponse.json({ error: "Database query failed" }, { status: 503 });
  }
}
