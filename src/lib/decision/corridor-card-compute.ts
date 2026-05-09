import { modelConfidence } from "@/lib/decision/confidence-labeler";
import { nowNPTIso } from "@/lib/npt/format-npt";
import type { OpenMeteoResponse } from "@/lib/open-meteo";
import { currentHourIndex } from "@/lib/open-meteo";
import type { CorridorCardData, CorridorId, TrendDirection } from "@/types/weather";

type CorridorDestWeather = {
  corridorId: CorridorId | "pokhara";
  data: OpenMeteoResponse;
};

const CORRIDOR_TITLE: Record<CorridorId | "pokhara", string> = {
  abc: "ABC Corridor",
  ebc: "Everest Corridor",
  pokhara: "Pokhara",
};

function trendDir(hourly: OpenMeteoResponse["hourly"], idx: number): TrendDirection {
  const now = hourly.cloud_cover[idx] ?? 50;
  const next3h = hourly.cloud_cover[Math.min(idx + 3, hourly.cloud_cover.length - 1)] ?? now;
  if (next3h < now - 10) return "improving";
  if (next3h > now + 10) return "worsening";
  return "stable";
}

function trendLabel(dir: TrendDirection): string {
  if (dir === "improving") return "↗ improving";
  if (dir === "worsening") return "↘ worsening";
  return "→ stable";
}

// Parse NPT strings directly — no Date() constructor on bare NPT strings
function computeTomorrowAMCloud(hourly: OpenMeteoResponse["hourly"]): number {
  const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
  const tomorrowNPT = new Date(Date.now() + NPT_OFFSET_MS + 24 * 60 * 60 * 1000);
  const tomorrowDateStr = tomorrowNPT.toISOString().slice(0, 10);

  let total = 0;
  let count = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i] ?? "";
    const hour = parseInt(t.slice(11, 13), 10);
    if (t.startsWith(tomorrowDateStr) && hour >= 5 && hour <= 10) {
      total += hourly.cloud_cover[i] ?? 80;
      count++;
    }
  }
  return count > 0 ? Math.round(total / count) : 80;
}

function bestTomorrowAMHour(hourly: OpenMeteoResponse["hourly"]): string | null {
  const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
  const tomorrowNPT = new Date(Date.now() + NPT_OFFSET_MS + 24 * 60 * 60 * 1000);
  const tomorrowDateStr = tomorrowNPT.toISOString().slice(0, 10);

  let bestCloud = 101;
  let bestHour = -1;

  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i] ?? "";
    const hour = parseInt(t.slice(11, 13), 10);
    if (!t.startsWith(tomorrowDateStr) || hour < 5 || hour > 10) continue;
    const cloud = hourly.cloud_cover[i] ?? 100;
    if (cloud < bestCloud) {
      bestCloud = cloud;
      bestHour = hour;
    }
  }

  if (bestHour < 0 || bestCloud >= 55) return null;
  return `${bestHour}:00 AM`;
}

function cloudToIcon(cloud: number, precip: number): string {
  if (precip > 5) return "🌧";
  if (precip > 0.5) return "🌦";
  if (cloud > 80) return "☁";
  if (cloud > 50) return "⛅";
  if (cloud > 20) return "🌤";
  return "☀";
}

export function computeCorridorCard(dw: CorridorDestWeather): CorridorCardData {
  const { hourly, fetchedAt } = dw.data;
  const idx = currentHourIndex(hourly.time);
  const cloud = hourly.cloud_cover[idx] ?? 50;
  const precip = hourly.precipitation[idx] ?? 0;

  const conditionIcon = cloudToIcon(cloud, precip);
  let conditionLabel: string;
  if (precip > 5) conditionLabel = `Rain ${precip.toFixed(0)}mm/h`;
  else if (precip > 0.5) conditionLabel = "Light rain";
  else if (cloud > 80) conditionLabel = "Heavy overcast";
  else if (cloud > 50) conditionLabel = `${cloud.toFixed(0)}% cloud`;
  else if (cloud > 20) conditionLabel = "Mostly clear";
  else conditionLabel = "Clear skies";

  const trend = trendDir(hourly, idx);
  const bestHour = bestTomorrowAMHour(hourly);
  const clearWindowSummary = bestHour
    ? `Best clear window: tomorrow ${bestHour}`
    : "Best clear window: tomorrow 5:00 AM";

  const tomorrowAMCloud = computeTomorrowAMCloud(hourly);

  return {
    corridorId: dw.corridorId,
    title: CORRIDOR_TITLE[dw.corridorId],
    conditionIcon,
    conditionLabel,
    trend,
    trendLabel: trendLabel(trend),
    clearWindowSummary,
    confidence: modelConfidence(fetchedAt),
    evidenceTier: "forecast-model",
    timestamp: nowNPTIso(),
    currentCloud: Math.round(cloud),
    tomorrowAMCloud,
  };
}
