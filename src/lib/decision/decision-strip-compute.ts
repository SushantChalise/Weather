import { nowNPTIso } from "@/lib/npt/format-npt";
import type { OpenMeteoHourly, OpenMeteoResponse } from "@/lib/open-meteo";
import { currentHourIndex } from "@/lib/open-meteo";
import type {
  DecisionStripData,
  DecisionStripPill,
  DestinationId,
  TripIntent,
} from "@/types/weather";

type DestWeather = {
  id: DestinationId;
  name: string;
  tripIntent: TripIntent;
  data: OpenMeteoResponse;
};

type Score = {
  id: DestinationId;
  name: string;
  tripIntent: TripIntent;
  cloud: number;
  precip: number;
  wind: number;
  score: number; // 0 = best, higher = worse
  reason: string;
};

function scoreDestination(dw: DestWeather): Score {
  const { hourly } = dw.data;
  const idx = currentHourIndex(hourly.time);

  const cloud = hourly.cloud_cover[idx] ?? 50;
  const precip = hourly.precipitation[idx] ?? 0;
  const wind = hourly.wind_speed_10m[idx] ?? 0;

  // Next 3h average for stability check
  const nextHours = Math.min(3, hourly.cloud_cover.length - idx - 1);
  let cloudNext = cloud;
  for (let i = 1; i <= nextHours; i++) {
    cloudNext += hourly.cloud_cover[idx + i] ?? cloud;
  }
  cloudNext /= nextHours + 1;

  const score = cloud * 0.5 + cloudNext * 0.3 + precip * 10 + wind * 0.2;

  let reason = "";
  if (cloud < 20) reason = `Clear skies · ${cloud.toFixed(0)}% cloud`;
  else if (cloud < 40) reason = `Mostly clear · ${cloud.toFixed(0)}% cloud`;
  else if (precip > 5) reason = `Rain ${precip.toFixed(1)}mm · ${cloud.toFixed(0)}% cloud`;
  else reason = `${cloud.toFixed(0)}% cloud cover`;

  return {
    id: dw.id,
    name: dw.name,
    tripIntent: dw.tripIntent,
    cloud,
    precip,
    wind,
    score,
    reason,
  };
}

// Tomorrow morning (5–10 AM NPT) average cloud cover.
// Times are bare NPT strings — parse date/hour directly without going through Date.
function tomorrowAMCloud(hourly: OpenMeteoHourly): number {
  const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
  const nowNPT = new Date(Date.now() + NPT_OFFSET_MS);
  const tomorrowNPT = new Date(nowNPT.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowDateStr = tomorrowNPT.toISOString().slice(0, 10); // "YYYY-MM-DD"

  let total = 0;
  let count = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i] ?? "";
    const dateStr = t.slice(0, 10);
    const hour = parseInt(t.slice(11, 13), 10);
    if (dateStr === tomorrowDateStr && hour >= 5 && hour <= 10) {
      total += hourly.cloud_cover[i] ?? 50;
      count++;
    }
  }
  return count > 0 ? total / count : 50;
}

export function computeDecisionStrip(destinations: DestWeather[]): DecisionStripData {
  const scored = destinations.map(scoreDestination);

  const avoidThreshold = (s: Score) => s.precip > 25 || s.wind > 60;
  const bestNowThreshold = (s: Score) => s.cloud < 45 && s.precip < 0.5;

  // AVOID
  const avoidItems = scored.filter(avoidThreshold);

  // BEST NOW — or fallback to relative-best when all conditions are poor
  const qualifyingNow = scored
    .filter((s) => bestNowThreshold(s) && !avoidThreshold(s))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const isRelativeFallback = qualifyingNow.length === 0;
  const bestNowSelected = isRelativeFallback
    ? [...scored].sort((a, b) => a.score - b.score).slice(0, 2)
    : qualifyingNow;

  // BEST VIEW — tomorrow AM mountain views
  const bestViewItems = destinations
    .filter((d) => d.tripIntent === "mountain_views")
    .map((d) => ({ d, amCloud: tomorrowAMCloud(d.data.hourly) }))
    .filter((x) => x.amCloud < 55)
    .sort((a, b) => a.amCloud - b.amCloud)
    .slice(0, 3)
    .map((x) => ({
      destinationId: x.d.id,
      name: `${x.d.name} AM`,
      reason: `Clear window: tomorrow morning · ${x.amCloud.toFixed(0)}% cloud`,
    }));

  // Build usedIds now that all "above watch" items are known
  const usedIds = new Set([
    ...avoidItems.map((s) => s.id),
    ...bestNowSelected.map((s) => s.id),
    ...bestViewItems.map((x) => x.destinationId),
  ]);

  // WATCH — everything not already placed
  const watchItems = scored
    .filter((s) => !usedIds.has(s.id))
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  // Assemble pills
  const pills: DecisionStripPill[] = [];

  if (avoidItems.length > 0) {
    pills.push({
      category: "avoid",
      label: "AVOID",
      items: avoidItems.map((s) => ({
        destinationId: s.id,
        name: s.name,
        reason: s.wind > 60 ? `Gusts ${s.wind.toFixed(0)} km/h` : `${s.precip.toFixed(0)}mm/h rain`,
      })),
    });
  }

  pills.push({
    category: "best_now",
    label: isRelativeFallback ? "BEST AVAILABLE" : "BEST NOW",
    items: bestNowSelected.map((s) => ({
      destinationId: s.id,
      name: s.name,
      reason: isRelativeFallback ? `Relatively clearest · ${s.cloud.toFixed(0)}% cloud` : s.reason,
    })),
  });

  if (bestViewItems.length > 0) {
    pills.push({ category: "best_view", label: "BEST VIEW", items: bestViewItems });
  }

  if (watchItems.length > 0) {
    pills.push({
      category: "watch",
      label: "WATCH",
      items: watchItems.map((s) => ({ destinationId: s.id, name: s.name, reason: s.reason })),
    });
  }

  return { pills, computedAt: nowNPTIso() };
}
