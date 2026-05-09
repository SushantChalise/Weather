import { NextResponse } from "next/server";
import { currentHourIndex, fetchOpenMeteo } from "@/lib/open-meteo";
import type { LuklaFlightStatus, LuklaFlightWindow, LuklaHourWindow } from "@/types/weather";

export const revalidate = 600;

const LUKLA_LAT = 27.6868;
const LUKLA_LON = 86.7294;

function flightStatus(cloudLow: number, windKmh: number, visKm: number): LuklaFlightStatus {
  if (cloudLow > 60 || windKmh > 50 || visKm < 5) return "closed";
  if (cloudLow > 35 || windKmh > 38 || visKm < 8) return "marginal";
  return "open";
}

function statusReason(cloudLow: number, windKmh: number, visKm: number): string {
  if (visKm < 5) return `Visibility ${visKm.toFixed(0)} km — below minimum`;
  if (windKmh > 50) return `Wind ${windKmh.toFixed(0)} km/h — above limit`;
  if (cloudLow > 60) return `Low cloud cover ${cloudLow.toFixed(0)}% — ceiling too low`;
  if (windKmh > 38) return `Wind ${windKmh.toFixed(0)} km/h — marginal conditions`;
  if (cloudLow > 35) return `Low cloud ${cloudLow.toFixed(0)}% — marginal ceiling`;
  return "Conditions within operating limits";
}

export async function GET() {
  try {
    const data = await fetchOpenMeteo(LUKLA_LAT, LUKLA_LON);
    const { hourly } = data;
    const now = currentHourIndex(hourly.time);

    const cloudLow = hourly.cloud_cover_low[now] ?? 0;
    const windKmh = hourly.wind_speed_10m[now] ?? 0;
    const visKm = (hourly.visibility[now] ?? 10000) / 1000;

    // Build morning window (06:00–12:00 NPT) — find those hour indices.
    // Times are bare NPT strings; parse hour directly from the string.
    const morningHours: LuklaHourWindow[] = [];
    for (let i = 0; i < hourly.time.length; i++) {
      const t = hourly.time[i];
      if (!t) continue;
      const nptHour = parseInt(t.slice(11, 13), 10);
      if (nptHour >= 6 && nptHour <= 11) {
        // Only include times within next 24h
        const diffH = (new Date(`${t}+05:45`).getTime() - Date.now()) / 3_600_000;
        if (diffH > -1 && diffH < 25) {
          const cl = hourly.cloud_cover_low[i] ?? 0;
          const wk = hourly.wind_speed_10m[i] ?? 0;
          const vk = (hourly.visibility[i] ?? 10000) / 1000;
          morningHours.push({
            hour: t,
            status: flightStatus(cl, wk, vk),
            cloudLow: cl,
            windKmh: wk,
            visibilityKm: vk,
          });
        }
      }
    }

    const result: LuklaFlightWindow = {
      currentStatus: flightStatus(cloudLow, windKmh, visKm),
      statusReason: statusReason(cloudLow, windKmh, visKm),
      morningHours,
      cloudLow,
      windKmh,
      visibilityKm: visKm,
      timestamp: data.fetchedAt,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Lukla window computation failed" }, { status: 503 });
  }
}
