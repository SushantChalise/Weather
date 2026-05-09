import { type NextRequest, NextResponse } from "next/server";
import { nowNPTIso } from "@/lib/npt/format-npt";
import { wmoInfo } from "@/lib/open-meteo";
import type { EvidenceSnapshot, ReplaySummary, TrendDirection } from "@/types/weather";

export const revalidate = 1800; // 30 min — daily satellite data doesn't change intra-day

// Scope → representative lat/lon for Open-Meteo fetch
const SCOPE_COORDS: Record<string, { lat: number; lon: number; tileX: number; tileY: number }> = {
  abc: { lat: 28.53, lon: 83.88, tileX: 93, tileY: 53 },
  ebc: { lat: 27.9, lon: 86.77, tileX: 94, tileY: 53 },
  pokhara: { lat: 28.21, lon: 83.99, tileX: 93, tileY: 53 },
  kathmandu: { lat: 27.7, lon: 85.32, tileX: 94, tileY: 53 },
  chitwan: { lat: 27.52, lon: 84.35, tileX: 94, tileY: 53 },
  jomsom: { lat: 28.78, lon: 83.74, tileX: 93, tileY: 52 },
  langtang: { lat: 28.21, lon: 85.51, tileX: 94, tileY: 53 },
  "poon-hill": { lat: 28.4, lon: 83.68, tileX: 93, tileY: 53 },
};

function gibsThumb(date: string, tileX: number, tileY: number): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/7/${tileY}/${tileX}.jpg`;
}

// UTC date string N days ago
function daysAgoUTC(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Derive a plain-language buildup pattern from hourly cloud data for a day
function buildupPattern(hours: number[], times: string[]): string {
  const dayHours = hours.filter((_, i) => {
    const h = parseInt((times[i] ?? "").slice(11, 13), 10);
    return h >= 5 && h <= 18;
  });
  if (dayHours.length === 0) return "No data";
  const avg = dayHours.reduce((a, b) => a + b, 0) / dayHours.length;
  if (avg < 25) return "Clear skies throughout";
  if (avg < 50) return "Mostly clear with afternoon clouds";
  if (avg > 80) return "Heavy cloud cover all day";
  return "Clouds building through the day";
}

// Find the AM hour (5–11) with the lowest cloud cover and return a label
function bestAMWindow(cloudHours: number[], times: string[], dateStr: string): string {
  let bestH = -1;
  let bestCloud = Infinity;
  for (let i = 0; i < times.length; i++) {
    const t = times[i] ?? "";
    if (!t.startsWith(dateStr)) continue;
    const h = parseInt(t.slice(11, 13), 10);
    if (h < 5 || h > 11) continue;
    const c = cloudHours[i] ?? 100;
    if (c < bestCloud) {
      bestCloud = c;
      bestH = h;
    }
  }
  if (bestH < 0) return "No clear window";
  const end = Math.min(bestH + 2, 11);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(bestH)}:00–${pad(end)}:00 NPT (${bestCloud.toFixed(0)}% cloud)`;
}

type DaySummary = {
  dateStr: string;
  avgCloud: number;
  amCloud: number;
  totalPrecip: number;
  peakWeatherCode: number;
  pattern: string;
};

function summariseDay(
  dateStr: string,
  hourly: {
    time: string[];
    cloud_cover: number[];
    precipitation: number[];
    weather_code: number[];
  },
): DaySummary {
  const indices: number[] = [];
  for (let i = 0; i < hourly.time.length; i++) {
    if ((hourly.time[i] ?? "").startsWith(dateStr)) indices.push(i);
  }
  if (indices.length === 0) {
    return {
      dateStr,
      avgCloud: 80,
      amCloud: 80,
      totalPrecip: 0,
      peakWeatherCode: 3,
      pattern: "No data",
    };
  }

  const clouds = indices.map((i) => hourly.cloud_cover[i] ?? 80);
  const avgCloud = clouds.reduce((a, b) => a + b, 0) / clouds.length;

  const amIndices = indices.filter((i) => {
    const h = parseInt((hourly.time[i] ?? "").slice(11, 13), 10);
    return h >= 5 && h <= 11;
  });
  const amClouds = amIndices.map((i) => hourly.cloud_cover[i] ?? 80);
  const amCloud =
    amClouds.length > 0 ? amClouds.reduce((a, b) => a + b, 0) / amClouds.length : avgCloud;

  const totalPrecip = indices.reduce((sum, i) => sum + (hourly.precipitation[i] ?? 0), 0);
  const peakWeatherCode = indices.reduce((max, i) => Math.max(max, hourly.weather_code[i] ?? 0), 0);

  const pattern = buildupPattern(
    indices.map((i) => hourly.cloud_cover[i] ?? 80),
    indices.map((i) => hourly.time[i] ?? ""),
  );

  return { dateStr, avgCloud, amCloud, totalPrecip, peakWeatherCode, pattern };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ scopeId: string }> }) {
  const { scopeId } = await params;
  const scope = SCOPE_COORDS[scopeId] ?? SCOPE_COORDS.abc;
  if (!scope) return NextResponse.json({ error: "Unknown scope" }, { status: 404 });

  const dates = [daysAgoUTC(1), daysAgoUTC(2), daysAgoUTC(3)];
  const windowStart = dates[2] ?? daysAgoUTC(3);
  const windowEnd = dates[0] ?? daysAgoUTC(1);

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", scope.lat.toFixed(4));
    url.searchParams.set("longitude", scope.lon.toFixed(4));
    url.searchParams.set("hourly", "cloud_cover,precipitation,weather_code");
    url.searchParams.set("timezone", "Asia/Kathmandu");
    url.searchParams.set("past_days", "3");
    url.searchParams.set("forecast_days", "1");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = (await res.json()) as {
      hourly: {
        time: string[];
        cloud_cover: number[];
        precipitation: number[];
        weather_code: number[];
      };
    };

    const days = dates.map((d) => summariseDay(d, data.hourly));
    const sorted = [...days].sort((a, b) => a.amCloud - b.amCloud);
    const bestDay = sorted[0];
    const worstDay = sorted[sorted.length - 1];
    const currentDay = days[0]; // yesterday = most recent

    // Evidence snapshots: best, worst, current
    const snapshots: EvidenceSnapshot[] = [];

    const addSnap = (day: DaySummary | undefined, quality: EvidenceSnapshot["quality"]) => {
      if (!day) return;
      snapshots.push({
        timestamp: `${day.dateStr}T05:30:00+05:45`,
        thumbUrl: gibsThumb(day.dateStr, scope.tileX, scope.tileY),
        label: `${quality === "current" ? "Yesterday" : day.dateStr} · ${day.amCloud.toFixed(0)}% AM cloud`,
        quality,
      });
    };

    addSnap(bestDay, "best");
    addSnap(worstDay, "worst");
    // Only add current if it's not already best or worst
    if (
      currentDay &&
      currentDay.dateStr !== bestDay?.dateStr &&
      currentDay.dateStr !== worstDay?.dateStr
    ) {
      addSnap(currentDay, "current");
    } else {
      // Use 2-days-ago as the third snapshot
      const thirdDay = days.find(
        (d) => d.dateStr !== bestDay?.dateStr && d.dateStr !== worstDay?.dateStr,
      );
      addSnap(thirdDay ?? currentDay, "current");
    }

    // Trend: compare yesterday vs 2-days-ago AM cloud cover
    const yestCloud = days[0]?.amCloud ?? 80;
    const prevCloud = days[1]?.amCloud ?? 80;
    const diff = yestCloud - prevCloud;
    const trendForecast: TrendDirection =
      diff < -10 ? "improving" : diff > 10 ? "worsening" : "stable";
    const trendReasoning =
      trendForecast === "improving"
        ? `AM cloud dropped ${Math.abs(diff).toFixed(0)}% over last 2 days`
        : trendForecast === "worsening"
          ? `AM cloud increased ${diff.toFixed(0)}% over last 2 days`
          : "Conditions holding steady";

    // Rain events from peak weather codes
    const rainEvents: ReplaySummary["rainEvents"] = days
      .filter((d) => d.totalPrecip > 1)
      .map((d) => {
        const info = wmoInfo(d.peakWeatherCode);
        const intensity: "light" | "moderate" | "heavy" =
          d.totalPrecip > 15 ? "heavy" : d.totalPrecip > 5 ? "moderate" : "light";
        return { intensity, count: 1, segment: info.label };
      });

    // Best AM window across all 3 days
    const bestAMLabel = bestDay
      ? bestAMWindow(data.hourly.cloud_cover, data.hourly.time, bestDay.dateStr)
      : "No clear window in last 72h";

    const cloudPatternSummary = currentDay?.pattern ?? "Variable conditions";

    const summary: ReplaySummary = {
      scopeId,
      windowStart: `${windowStart}T00:00:00+05:45`,
      windowEnd: `${windowEnd}T23:59:59+05:45`,
      cloudBuildupPattern: cloudPatternSummary,
      bestVisibilityWindow: `${bestDay?.dateStr ?? windowEnd} · ${bestAMLabel}`,
      rainEvents,
      trendForecast,
      trendReasoning,
      evidenceSnapshots: snapshots,
    };

    return NextResponse.json({ summary, computedAt: nowNPTIso() });
  } catch {
    return NextResponse.json({ error: "Replay fetch failed" }, { status: 503 });
  }
}
