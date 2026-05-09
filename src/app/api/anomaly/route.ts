import { NextResponse } from "next/server";

export const revalidate = 3600; // 1 hour

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ClimateApiResponse = {
  monthly: {
    time: string[]; // e.g. "1991-01", "1991-02", ...
    temperature_2m_mean: number[];
  };
};

type ForecastApiResponse = {
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");

  if (!latParam || !lonParam) {
    return NextResponse.json({ error: "Missing lat or lon query params" }, { status: 400 });
  }

  const lat = Number.parseFloat(latParam);
  const lon = Number.parseFloat(lonParam);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Invalid lat or lon values" }, { status: 400 });
  }

  const now = new Date();
  const currentMonthIndex = now.getUTCMonth(); // 0-based
  const monthName = MONTH_NAMES[currentMonthIndex] ?? "Unknown";

  try {
    // 1. Fetch current mean temperature from Open-Meteo forecast (today's hourly avg)
    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.searchParams.set("latitude", lat.toFixed(4));
    forecastUrl.searchParams.set("longitude", lon.toFixed(4));
    forecastUrl.searchParams.set("hourly", "temperature_2m");
    forecastUrl.searchParams.set("timezone", "UTC");
    forecastUrl.searchParams.set("forecast_days", "1");

    const forecastRes = await fetch(forecastUrl.toString(), { next: { revalidate: 3600 } });
    if (!forecastRes.ok) {
      throw new Error(`Forecast fetch failed: ${forecastRes.status}`);
    }
    const forecastData = (await forecastRes.json()) as ForecastApiResponse;

    const forecastTemps = forecastData.hourly.temperature_2m.filter(
      (v): v is number => typeof v === "number" && !Number.isNaN(v),
    );
    if (forecastTemps.length === 0) {
      throw new Error("No forecast temperature data returned");
    }
    const current = forecastTemps.reduce((sum, v) => sum + v, 0) / forecastTemps.length;

    // 2. Fetch 30-year climate normals from Open-Meteo climate API
    const climateUrl = new URL("https://climate-api.open-meteo.com/v1/climate");
    climateUrl.searchParams.set("latitude", lat.toFixed(4));
    climateUrl.searchParams.set("longitude", lon.toFixed(4));
    climateUrl.searchParams.set("start_date", "1991-01-01");
    climateUrl.searchParams.set("end_date", "2020-12-31");
    climateUrl.searchParams.set("monthly", "temperature_2m_mean");
    climateUrl.searchParams.set("models", "EC_Earth3P_HR");

    const climateRes = await fetch(climateUrl.toString(), { next: { revalidate: 3600 } });
    if (!climateRes.ok) {
      throw new Error(`Climate fetch failed: ${climateRes.status}`);
    }
    const climateData = (await climateRes.json()) as ClimateApiResponse;

    // Average values where the month matches current month (1-based in the time string "YYYY-MM")
    const targetMonth = String(currentMonthIndex + 1).padStart(2, "0"); // e.g. "05"
    const matchingTemps = climateData.monthly.time.flatMap((timeStr, i) => {
      const monthPart = timeStr.slice(5, 7); // "YYYY-MM" → "MM"
      const val = climateData.monthly.temperature_2m_mean[i];
      if (monthPart === targetMonth && typeof val === "number" && !Number.isNaN(val)) {
        return [val];
      }
      return [];
    });

    if (matchingTemps.length === 0) {
      throw new Error("No climate normal data for current month");
    }
    const normal = matchingTemps.reduce((sum, v) => sum + v, 0) / matchingTemps.length;

    const delta = parseFloat((current - normal).toFixed(2));

    return NextResponse.json({
      delta,
      normal: parseFloat(normal.toFixed(2)),
      current: parseFloat(current.toFixed(2)),
      month: monthName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Anomaly fetch failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
