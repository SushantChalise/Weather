import { nowNPTIso } from "@/lib/npt/format-npt";
import type { OpenMeteoResponse } from "@/lib/open-meteo";
import { currentHourIndex } from "@/lib/open-meteo";
import type {
  ComparisonDrawerData,
  ComparisonGroup,
  ComparisonRecommendation,
  ComparisonRow,
  DestinationId,
  TripIntent,
} from "@/types/weather";

type DestWeather = {
  id: DestinationId;
  name: string;
  tripIntent: TripIntent;
  altitude: number;
  data: OpenMeteoResponse;
};

function tomorrowAMCloudPct(hourly: OpenMeteoResponse["hourly"]): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let total = 0;
  let count = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    const t = new Date(hourly.time[i] ?? "");
    const isTomorrow =
      t.getUTCDate() === tomorrow.getUTCDate() && t.getUTCMonth() === tomorrow.getUTCMonth();
    const nptHour = (t.getUTCHours() * 60 + t.getUTCMinutes() + 345) / 60; // UTC + 5h45m
    if (isTomorrow && nptHour >= 6 && nptHour <= 10) {
      total += hourly.cloud_cover[i] ?? 50;
      count++;
    }
  }
  return count > 0 ? total / count : 50;
}

function recommendation(cloud: number, precip: number, wind: number): ComparisonRecommendation {
  if (precip > 25 || wind > 60) return "avoid";
  if (cloud < 40 && precip < 0.5) return "best";
  if (cloud < 65 && precip < 2) return "good";
  return "watch";
}

function nowLabel(cloud: number, precip: number): string {
  if (precip > 5) return "Rain";
  if (precip > 0.5) return "Drizzle";
  if (cloud < 30) return "Clear";
  if (cloud < 60) return "Partly cloudy";
  return "Overcast";
}

function viewQualityLabel(amCloud: number): string {
  if (amCloud < 20) return "Excellent — peaks clear";
  if (amCloud < 45) return "Good — peaks partly visible";
  if (amCloud < 65) return "Fair — often obscured";
  return "Poor — likely hidden";
}

function trailConditionLabel(cloud: number, precip: number): string {
  if (precip > 5) return "Wet / muddy trail";
  if (precip > 0.5) return "Damp conditions";
  if (cloud > 70) return "Reduced visibility";
  return "Good conditions";
}

function snowConcernLabel(wind: number, altitude: number): string {
  if (altitude < 2000) return "None";
  if (wind > 40) return "Blowing snow risk";
  return "Minimal";
}

const RANK: Record<ComparisonRecommendation, number> = {
  best: 0,
  good: 1,
  watch: 2,
  avoid: 3,
};

const INTENT_LABEL: Record<TripIntent, string> = {
  mountain_views: "Mountain Views",
  trekking: "Trekking",
  lowland: "Lowland / Jungle",
};

const INTENT_ORDER: TripIntent[] = ["mountain_views", "trekking", "lowland"];

export function computeComparisonData(destinations: DestWeather[]): ComparisonDrawerData {
  const byIntent = new Map<TripIntent, DestWeather[]>();
  for (const d of destinations) {
    const arr = byIntent.get(d.tripIntent) ?? [];
    arr.push(d);
    byIntent.set(d.tripIntent, arr);
  }

  const groups: ComparisonGroup[] = [];

  for (const intent of INTENT_ORDER) {
    const dests = byIntent.get(intent);
    if (!dests || dests.length === 0) continue;

    const rows: ComparisonRow[] = dests
      .map((d): ComparisonRow => {
        const { hourly } = d.data;
        const idx = currentHourIndex(hourly.time);
        const cloud = hourly.cloud_cover[idx] ?? 50;
        const precip = hourly.precipitation[idx] ?? 0;
        const wind = hourly.wind_speed_10m[idx] ?? 0;
        const amCloud = tomorrowAMCloudPct(hourly);
        const rec = recommendation(cloud, precip, wind);

        const row: ComparisonRow = {
          destinationId: d.id,
          name: d.name,
          now: nowLabel(cloud, precip),
          tomorrowAM: `${amCloud.toFixed(0)}% cloud`,
          recommendation: rec,
        };

        if (intent === "mountain_views") {
          row.viewQuality = viewQualityLabel(amCloud);
        }
        if (intent === "trekking") {
          row.trailCondition = trailConditionLabel(cloud, precip);
          row.snowConcern = snowConcernLabel(wind, d.altitude);
        }

        return row;
      })
      .sort((a, b) => RANK[a.recommendation] - RANK[b.recommendation]);

    groups.push({ tripIntent: intent, label: INTENT_LABEL[intent], rows });
  }

  return { groups, computedAt: nowNPTIso() };
}
