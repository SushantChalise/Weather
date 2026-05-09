import SunCalc from "suncalc";
import { modelConfidence } from "@/lib/decision/confidence-labeler";
import type { OpenMeteoResponse } from "@/lib/open-meteo";
import { currentHourIndex } from "@/lib/open-meteo";
import type {
  ClearWindow,
  ClearWindowHour,
  ClearWindowQuality,
  DestinationId,
} from "@/types/weather";

// Map cloud cover % → quality bucket
function cloudToQuality(cloudPct: number, precipMm: number): ClearWindowQuality {
  if (precipMm > 1) return "poor";
  if (cloudPct < 20) return "best";
  if (cloudPct < 45) return "good";
  if (cloudPct < 70) return "watch";
  if (cloudPct < 90) return "cloudy";
  return "poor";
}

// Detect pattern from the hourly quality sequence
function detectPattern(hours: ClearWindowHour[]): string {
  // Find when quality first drops to cloudy/poor
  const buildupIdx = hours.findIndex(
    (h) => h.isDaylight && (h.quality === "cloudy" || h.quality === "poor"),
  );
  if (buildupIdx === -1) return "Stays clear through the day";
  const buildupHour = new Date(hours[buildupIdx]?.hour ?? "").toLocaleString("en-GB", {
    timeZone: "Asia/Kathmandu",
    hour: "2-digit",
    minute: "2-digit",
  });
  const clearAtStart = hours[0]?.quality === "best" || hours[0]?.quality === "good";
  if (clearAtStart) return `Clouds build after ${buildupHour} NPT`;
  return "Cloud throughout the day";
}

// Find the next clear window (longest contiguous good/best daylight run)
function findNextWindow(
  hours: ClearWindowHour[],
  preDawnValue: boolean,
): { from: string; to: string; quality: "good" | "best" } | null {
  let bestRun: ClearWindowHour[] = [];
  let currentRun: ClearWindowHour[] = [];

  for (const h of hours) {
    const usable = preDawnValue ? true : h.isDaylight;
    if (usable && (h.quality === "best" || h.quality === "good")) {
      currentRun.push(h);
      if (currentRun.length > bestRun.length) bestRun = [...currentRun];
    } else {
      currentRun = [];
    }
  }

  if (bestRun.length === 0) return null;
  const first = bestRun[0];
  const last = bestRun[bestRun.length - 1];
  if (!first || !last) return null;
  const hasAnyBest = bestRun.some((h) => h.quality === "best");
  return { from: first.hour, to: last.hour, quality: hasAnyBest ? "best" : "good" };
}

export function computeClearWindow(
  destId: DestinationId,
  lat: number,
  lon: number,
  preDawnValue: boolean,
  data: OpenMeteoResponse,
): ClearWindow {
  const { hourly, fetchedAt, daily } = data;
  const startIdx = currentHourIndex(hourly.time);

  // Build 12-hour timeline from now.
  // Times are bare NPT strings — append +05:45 so Date correctly maps them to UTC.
  const hourlyTimeline: ClearWindowHour[] = [];
  const todayDate = new Date(`${hourly.time[startIdx] ?? ""}+05:45`);

  // Get sunrise/sunset for today from daily data (also NPT strings — append offset)
  const todayStr = todayDate.toISOString().slice(0, 10);
  const sunriseStr = daily.sunrise.find((s) => s.startsWith(todayStr));
  const sunsetStr = daily.sunset.find((s) => s.startsWith(todayStr));

  for (let i = 0; i < 12; i++) {
    const idx = startIdx + i;
    if (idx >= hourly.time.length) break;
    const hourIso = hourly.time[idx] ?? "";
    const hourDate = new Date(`${hourIso}+05:45`);
    const sunTimes = SunCalc.getTimes(hourDate, lat, lon);
    const sunriseTime = sunriseStr ? new Date(`${sunriseStr}+05:45`) : sunTimes.sunrise;
    const sunsetTime = sunsetStr ? new Date(`${sunsetStr}+05:45`) : sunTimes.sunset;
    const isDaylight = hourDate >= sunriseTime && hourDate <= sunsetTime;
    const prevIso = hourly.time[idx - 1] ?? "";
    const isSunrise =
      i > 0 && sunriseTime >= new Date(`${prevIso}+05:45`) && sunriseTime < hourDate;
    const goldenEnd = new Date(sunriseTime.getTime() + 90 * 60000);
    const isGoldenHour = hourDate >= sunriseTime && hourDate <= goldenEnd;

    const cloud = hourly.cloud_cover[idx] ?? 50;
    const precip = hourly.precipitation[idx] ?? 0;
    const quality = cloudToQuality(cloud, precip);

    hourlyTimeline.push({
      hour: `${hourIso}+05:45`,
      quality,
      isDaylight,
      isSunrise,
      isGoldenHour,
    });
  }

  const next = findNextWindow(hourlyTimeline, preDawnValue);
  const pattern = detectPattern(hourlyTimeline);
  const confidence = modelConfidence(fetchedAt);

  return {
    destinationId: destId,
    next,
    hourlyTimeline,
    pattern,
    bestOfLast7Days: null, // populated in Step 3B from archive
    confidence,
    evidenceTier: "forecast-model",
  };
}

export function computeAllClearWindows(
  destinations: Array<{ id: DestinationId; lat: number; lon: number; preDawnValue: boolean }>,
  weatherByDest: Map<DestinationId, OpenMeteoResponse>,
): ClearWindow[] {
  return destinations.flatMap((dest) => {
    const data = weatherByDest.get(dest.id);
    if (!data) return [];
    return [computeClearWindow(dest.id, dest.lat, dest.lon, dest.preDawnValue, data)];
  });
}
