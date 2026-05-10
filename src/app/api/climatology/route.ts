import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";

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
      const result = await db.execute<DailyRow>(
        sql`
        SELECT
          EXTRACT(DAY FROM o.time)::int AS day,
          o.value
        FROM obs_weather_daily o
        JOIN places p ON p.id = o.place_id
        WHERE p.slug = ${place}
          AND o.variable = ${variable}
          AND EXTRACT(YEAR FROM o.time) = ${year}
          AND EXTRACT(MONTH FROM o.time) = ${month}
        ORDER BY o.time
        `,
      );

      series.push(result.rows.map((r) => r.value ?? 0));
    }

    return NextResponse.json({ years: DATA_YEARS, series });
  } catch {
    return NextResponse.json({ error: "Database query failed" }, { status: 503 });
  }
}
