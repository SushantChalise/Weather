import type { OpenMeteoResponse } from "@/lib/open-meteo";
import { currentHourIndex } from "@/lib/open-meteo";
import type { EvidenceTier, ViewpointId } from "@/types/weather";

export type PeakVisibility = {
  peakId: string;
  name: string;
  status: "clear" | "partly" | "obscured";
};

export type VisibilityResult = {
  viewpointId: ViewpointId;
  score: number; // 0–100; > 70 = clear, < 30 = obscured
  label: string; // "Excellent", "Good", "Fair", "Poor"
  peaks: PeakVisibility[];
  bestTomorrowAMScore: number;
  evidenceTier: EvidenceTier;
};

// Human-readable peak names for the 8 target peaks referenced in viewpoints
const PEAK_NAMES: Record<string, string> = {
  "annapurna-i": "Annapurna I",
  "annapurna-ii": "Annapurna II",
  "annapurna-south": "Annapurna South",
  machhapuchhre: "Machhapuchhre",
  hiunchuli: "Hiunchuli",
  dhaulagiri: "Dhaulagiri",
  everest: "Mt. Everest",
  lhotse: "Lhotse",
  "ama-dablam": "Ama Dablam",
  nuptse: "Nuptse",
  pumori: "Pumori",
  thamserku: "Thamserku",
  "kongde-ri": "Kongde Ri",
};

function scoreFromCloud(cloud: number, precip: number, wind: number): number {
  let s = 100 - cloud;
  if (precip > 0.5) s *= 0.6;
  if (wind > 40) s *= 0.85;
  return Math.max(0, Math.min(100, Math.round(s)));
}

function visibilityLabel(score: number): string {
  if (score >= 70) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 30) return "Fair";
  return "Poor";
}

function peakStatus(score: number): "clear" | "partly" | "obscured" {
  if (score >= 65) return "clear";
  if (score >= 35) return "partly";
  return "obscured";
}

function tomorrowAMScore(hourly: OpenMeteoResponse["hourly"]): number {
  // Times are bare NPT strings — parse date/hour directly (no Date needed)
  const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
  const nowNPT = new Date(Date.now() + NPT_OFFSET_MS);
  const tomorrowNPT = new Date(nowNPT.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowDateStr = tomorrowNPT.toISOString().slice(0, 10);

  let total = 0;
  let count = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i] ?? "";
    const dateStr = t.slice(0, 10);
    const hour = parseInt(t.slice(11, 13), 10);
    if (dateStr === tomorrowDateStr && hour >= 5 && hour <= 9) {
      const cloud = hourly.cloud_cover[i] ?? 50;
      const precip = hourly.precipitation[i] ?? 0;
      const wind = hourly.wind_speed_10m[i] ?? 0;
      total += scoreFromCloud(cloud, precip, wind);
      count++;
    }
  }
  return count > 0 ? Math.round(total / count) : 50;
}

export function computeVisibility(
  viewpointId: ViewpointId,
  targetPeaks: string[],
  data: OpenMeteoResponse,
): VisibilityResult {
  const { hourly } = data;
  const idx = currentHourIndex(hourly.time);
  const cloud = hourly.cloud_cover[idx] ?? 50;
  const precip = hourly.precipitation[idx] ?? 0;
  const wind = hourly.wind_speed_10m[idx] ?? 0;

  const score = scoreFromCloud(cloud, precip, wind);
  const bestTomorrowAMScore = tomorrowAMScore(hourly);

  // All visible peaks share the viewpoint's obstruction level
  const status = peakStatus(score);
  const peaks: PeakVisibility[] = targetPeaks.map((id) => ({
    peakId: id,
    name: PEAK_NAMES[id] ?? id,
    status,
  }));

  return {
    viewpointId,
    score,
    label: visibilityLabel(score),
    peaks,
    bestTomorrowAMScore,
    evidenceTier: "forecast-model",
  };
}
