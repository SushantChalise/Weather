import { type NextRequest, NextResponse } from "next/server";
import { DESTINATIONS } from "@/data/destinations";
import { wmoInfo } from "@/lib/open-meteo";
import type { DestinationId, YesterdayActual } from "@/types/weather";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dest = DESTINATIONS.find((d) => d.id === id);
  if (!dest) return NextResponse.json({ error: "Unknown destination" }, { status: 404 });

  try {
    // Open-Meteo supports past_days to get historical hourly data
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", dest.lat.toFixed(4));
    url.searchParams.set("longitude", dest.lon.toFixed(4));
    url.searchParams.set(
      "hourly",
      ["cloud_cover_low", "precipitation", "wind_speed_10m", "temperature_2m", "weather_code"].join(
        ",",
      ),
    );
    url.searchParams.set("timezone", "Asia/Kathmandu");
    url.searchParams.set("past_days", "1");
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("models", "best_match");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = (await res.json()) as {
      hourly: {
        time: string[];
        cloud_cover_low: number[];
        precipitation: number[];
        wind_speed_10m: number[];
        temperature_2m: number[];
        weather_code: number[];
      };
    };

    const { hourly } = data;

    // Extract yesterday's hours (first 24)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().slice(0, 10);

    const yIndices: number[] = [];
    for (let i = 0; i < hourly.time.length; i++) {
      const t = hourly.time[i];
      if (t?.startsWith(yesterdayDate)) yIndices.push(i);
    }

    if (yIndices.length === 0) {
      return NextResponse.json(
        {
          error: "No yesterday data",
          debug: {
            yesterdayDate,
            firstTime: hourly.time[0],
            lastTime: hourly.time[hourly.time.length - 1],
            total: hourly.time.length,
          },
        },
        { status: 404 },
      );
    }

    // Find peak condition (most severe weather_code)
    let peakCodeIdx = yIndices[0] ?? 0;
    let maxCode = hourly.weather_code[peakCodeIdx] ?? 0;
    for (const i of yIndices) {
      const c = hourly.weather_code[i] ?? 0;
      if (c > maxCode) {
        maxCode = c;
        peakCodeIdx = i;
      }
    }

    const peakInfo = wmoInfo(maxCode);
    const maxPrecip = Math.max(...yIndices.map((i) => hourly.precipitation[i] ?? 0));
    const maxWind = Math.max(...yIndices.map((i) => hourly.wind_speed_10m[i] ?? 0));
    const temps = yIndices.map((i) => hourly.temperature_2m[i] ?? 0);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);

    // AM clear hours (05:00–11:00 NPT, cloud_cover_low < 30%)
    const amIndices = yIndices.filter((i) => {
      const t = hourly.time[i];
      if (!t) return false;
      const h = new Date(t).getHours();
      return h >= 5 && h <= 11;
    });
    const clearAM = amIndices.filter((i) => (hourly.cloud_cover_low[i] ?? 100) < 30).length;

    const result: YesterdayActual = {
      destinationId: dest.id as DestinationId,
      date: yesterdayDate,
      peakConditionLabel: peakInfo.label,
      peakConditionIcon: peakInfo.icon,
      maxPrecipMm: parseFloat(maxPrecip.toFixed(1)),
      maxWindKmh: parseFloat(maxWind.toFixed(0)),
      minTempC: parseFloat(minTemp.toFixed(0)),
      maxTempC: parseFloat(maxTemp.toFixed(0)),
      clearHoursAM: clearAM,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Yesterday fetch failed" }, { status: 503 });
  }
}
