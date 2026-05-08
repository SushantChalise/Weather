import { ABC_WAYPOINTS } from "@/data/corridors/abc";
import { EBC_WAYPOINTS } from "@/data/corridors/ebc";
import { modelConfidence } from "@/lib/decision/confidence-labeler";
import { nowNPTIso } from "@/lib/npt/format-npt";
import type { OpenMeteoResponse } from "@/lib/open-meteo";
import { currentHourIndex } from "@/lib/open-meteo";
import type { CorridorId, GuideBrief, SegmentCondition } from "@/types/weather";

type SegmentSpec = {
  id: string;
  name: string;
  representativeLat: number;
  representativeLon: number;
  elevationRange: [number, number];
};

// ABC corridor: 3 segments
const ABC_SEGMENTS: SegmentSpec[] = [
  {
    id: "lower",
    name: "Lower trail (Pokhara–Chhomrong)",
    representativeLat: 28.2997,
    representativeLon: 83.7706,
    elevationRange: [827, 2170],
  },
  {
    id: "mid",
    name: "Mid trail (Chhomrong–Deurali)",
    representativeLat: 28.4417,
    representativeLon: 83.8469,
    elevationRange: [2170, 3230],
  },
  {
    id: "upper",
    name: "Upper trail (Deurali–ABC)",
    representativeLat: 28.5086,
    representativeLon: 83.8794,
    elevationRange: [3230, 4130],
  },
];

// EBC corridor: 3 segments
const EBC_SEGMENTS: SegmentSpec[] = [
  {
    id: "lower",
    name: "Lower trail (Lukla–Namche)",
    representativeLat: 27.74,
    representativeLon: 86.7126,
    elevationRange: [2610, 3440],
  },
  {
    id: "mid",
    name: "Mid trail (Namche–Dingboche)",
    representativeLat: 27.8336,
    representativeLon: 86.6999,
    elevationRange: [3440, 4410],
  },
  {
    id: "upper",
    name: "Upper trail (Dingboche–EBC)",
    representativeLat: 27.9557,
    representativeLon: 86.7873,
    elevationRange: [4410, 5364],
  },
];

function tomorrowAMCloud(hourly: OpenMeteoResponse["hourly"]): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  let total = 0;
  let count = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    const t = new Date(hourly.time[i] ?? "");
    const isTomorrow =
      t.getUTCDate() === tomorrow.getUTCDate() && t.getUTCMonth() === tomorrow.getUTCMonth();
    const nptHour = (t.getUTCHours() * 60 + t.getUTCMinutes() + 345) / 60;
    if (isTomorrow && nptHour >= 6 && nptHour <= 10) {
      total += hourly.cloud_cover[i] ?? 50;
      count++;
    }
  }
  return count > 0 ? total / count : 50;
}

function trailSurface(cloud: number, precip: number, wind: number, elevation: number): string {
  if (precip > 5) return "slippery — heavy rain";
  if (precip > 0.5) return "damp conditions";
  if (wind > 40 && elevation > 3500) return "blowing snow risk";
  if (cloud > 70) return "reduced visibility";
  return "good conditions";
}

function conditionLabel(cloud: number, precip: number): string {
  if (precip > 5) return `Rain ${precip.toFixed(0)}mm/h`;
  if (precip > 0.5) return "Light rain";
  if (cloud > 80) return "Heavy overcast";
  if (cloud > 50) return `${cloud.toFixed(0)}% cloud`;
  if (cloud > 20) return "Mostly clear";
  return "Clear";
}

function buildSegmentCondition(spec: SegmentSpec, data: OpenMeteoResponse): SegmentCondition {
  const { hourly } = data;
  const idx = currentHourIndex(hourly.time);
  const cloud = hourly.cloud_cover[idx] ?? 50;
  const precip = hourly.precipitation[idx] ?? 0;
  const wind = hourly.wind_speed_10m[idx] ?? 0;

  return {
    segmentId: spec.id,
    name: spec.name,
    elevationRange: spec.elevationRange,
    conditionLabel: conditionLabel(cloud, precip),
    trailSurface: trailSurface(cloud, precip, wind, spec.elevationRange[0]),
    cloud,
    precip,
    wind,
    tomorrowAMCloud: tomorrowAMCloud(hourly),
    evidenceTier: "forecast-model",
  };
}

function corridorWaypoints(id: CorridorId) {
  return id === "abc" ? ABC_WAYPOINTS : EBC_WAYPOINTS;
}

function snowlineCrossingForCorridor(
  corridorId: CorridorId,
  snowlineMeters: number | null,
): string | null {
  if (snowlineMeters === null) return null;
  const waypoints = corridorWaypoints(corridorId);
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (!a || !b) continue;
    if (a.altitude < snowlineMeters && b.altitude >= snowlineMeters) return b.name;
  }
  return null;
}

function bestClearWindow(
  segments: SegmentCondition[],
): { from: string; to: string; quality: "good" | "best" } | null {
  const upperSeg = segments.find((s) => s.segmentId === "upper") ?? segments[0];
  if (!upperSeg) return null;
  // Simplified: use tomorrowAMCloud for the window estimate
  const cloud = upperSeg.tomorrowAMCloud;
  if (cloud > 55) return null;
  const quality: "good" | "best" = cloud < 30 ? "best" : "good";
  return { from: "06:00+05:45", to: "09:30+05:45", quality };
}

function buildPlaintext(brief: Omit<GuideBrief, "plaintext">): string {
  const lines: string[] = [
    `${brief.corridorId.toUpperCase()} Corridor — Weather Brief`,
    `Generated: ${brief.generatedAt}`,
    `Confidence: ${brief.confidence}`,
    ``,
    `OVERALL: ${brief.overallCondition}`,
    ``,
    `ROUTE SEGMENTS:`,
  ];

  for (const seg of brief.segmentConditions) {
    lines.push(`  ${seg.name} (${seg.elevationRange[0]}–${seg.elevationRange[1]}m)`);
    lines.push(`   Now: ${seg.conditionLabel} · ${seg.trailSurface}`);
    lines.push(`   Tomorrow AM: ${seg.tomorrowAMCloud.toFixed(0)}% cloud`);
    lines.push(``);
  }

  if (brief.snowlineCrossingWaypoint) {
    lines.push(
      `SNOWLINE: Crosses at ${brief.snowlineCrossingWaypoint} (~${brief.snowlineMeters?.toFixed(0)}m)`,
    );
  } else {
    lines.push(`SNOWLINE: Below route (${brief.snowlineMeters?.toFixed(0)}m) — no concern`);
  }

  if (brief.clearWindow) {
    lines.push(`BEST WINDOW: Tomorrow 06:00–09:30 AM NPT`);
  } else {
    lines.push(`BEST WINDOW: No clear window in next 24h`);
  }

  lines.push(``);
  lines.push(`Evidence: ${brief.evidenceTier}. No satellite or field reports for this route.`);
  return lines.join("\n");
}

export function computeGuideBrief(
  corridorId: CorridorId,
  weatherBySegment: Map<string, OpenMeteoResponse>,
  snowlineMeters: number | null,
): GuideBrief {
  const specs = corridorId === "abc" ? ABC_SEGMENTS : EBC_SEGMENTS;

  const segmentConditions: SegmentCondition[] = specs.flatMap((spec) => {
    const data = weatherBySegment.get(spec.id);
    if (!data) return [];
    return [buildSegmentCondition(spec, data)];
  });

  // Overall condition from upper segment (most interesting)
  const upper = segmentConditions.find((s) => s.segmentId === "upper");
  const overallCloud = upper?.cloud ?? 50;
  const tomorrowCloud = upper?.tomorrowAMCloud ?? 50;

  let overallCondition = "Mixed conditions along route";
  if (tomorrowCloud < 30) overallCondition = "Clear morning window — excellent visibility expected";
  else if (tomorrowCloud < 50) overallCondition = "Good morning window before cloud builds";
  else if (overallCloud > 70) overallCondition = "Overcast — plan for reduced visibility";

  const crossingWaypoint = snowlineCrossingForCorridor(corridorId, snowlineMeters);
  const clearWindow = bestClearWindow(segmentConditions);
  const confidence = modelConfidence(new Date().toISOString());

  const brief: Omit<GuideBrief, "plaintext"> = {
    corridorId,
    generatedAt: nowNPTIso(),
    overallCondition,
    segmentConditions,
    snowlineMeters,
    snowlineCrossingWaypoint: crossingWaypoint,
    clearWindow,
    confidence,
    evidenceTier: "forecast-model",
  };

  return { ...brief, plaintext: buildPlaintext(brief) };
}

export type { SegmentSpec };
export { ABC_SEGMENTS, EBC_SEGMENTS };
