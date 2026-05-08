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

function bestTomorrowAMHour(hourly: OpenMeteoResponse["hourly"]): string | null {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  let bestCloud = 101;
  let bestSlot = "";

  for (let i = 0; i < hourly.time.length; i++) {
    const t = new Date(hourly.time[i] ?? "");
    const isTomorrow =
      t.getUTCDate() === tomorrow.getUTCDate() && t.getUTCMonth() === tomorrow.getUTCMonth();
    // Convert to NPT (UTC+5:45) — check NPT hour 5–10
    const nptMinutes = t.getUTCHours() * 60 + t.getUTCMinutes() + 345;
    const nptHour = (nptMinutes / 60) % 24;
    if (!isTomorrow || nptHour < 5 || nptHour > 10) continue;

    const cloud = hourly.cloud_cover[i] ?? 100;
    if (cloud < bestCloud) {
      bestCloud = cloud;
      // Format time slot as "6:15 AM"
      const h = Math.floor(nptHour);
      const m = Math.round((nptHour - h) * 60);
      const label = `${h}:${m.toString().padStart(2, "0")} AM`;
      bestSlot = label;
    }
  }

  return bestCloud < 55 ? bestSlot : null;
}

export function computeCorridorCard(dw: CorridorDestWeather): CorridorCardData {
  const { hourly, fetchedAt } = dw.data;
  const idx = currentHourIndex(hourly.time);
  const cloud = hourly.cloud_cover[idx] ?? 50;
  const precip = hourly.precipitation[idx] ?? 0;

  let conditionIcon: string;
  let conditionLabel: string;

  if (precip > 5) {
    conditionIcon = "🌧";
    conditionLabel = `Rain ${precip.toFixed(0)}mm/h`;
  } else if (precip > 0.5) {
    conditionIcon = "🌦";
    conditionLabel = "Light rain";
  } else if (cloud > 80) {
    conditionIcon = "☁";
    conditionLabel = "Heavy overcast";
  } else if (cloud > 50) {
    conditionIcon = "⛅";
    conditionLabel = `${cloud.toFixed(0)}% cloud`;
  } else if (cloud > 20) {
    conditionIcon = "🌤";
    conditionLabel = "Mostly clear";
  } else {
    conditionIcon = "☀";
    conditionLabel = "Clear skies";
  }

  const trend = trendDir(hourly, idx);
  const bestHour = bestTomorrowAMHour(hourly);
  const clearWindowSummary = bestHour
    ? `Best clear window: tomorrow ${bestHour}`
    : "No clear window in next 24h";

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
  };
}
