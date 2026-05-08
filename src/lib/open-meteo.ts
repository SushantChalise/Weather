import type { DestinationCondition, DestinationId, EvidenceTier, HaloColor } from "@/types/weather";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

const HOURLY_PARAMS = [
  "cloud_cover",
  "cloud_cover_low",
  "cloud_cover_mid",
  "cloud_cover_high",
  "precipitation",
  "precipitation_probability",
  "snowfall",
  "temperature_2m",
  "wind_speed_10m",
  "wind_gusts_10m",
  "weather_code",
  "freezing_level_height",
  "visibility",
].join(",");

export type OpenMeteoHourly = {
  time: string[];
  cloud_cover: number[];
  cloud_cover_low: number[];
  cloud_cover_mid: number[];
  cloud_cover_high: number[];
  precipitation: number[];
  precipitation_probability: number[];
  snowfall: number[];
  temperature_2m: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  weather_code: number[];
  freezing_level_height: number[];
  visibility: number[];
};

export type OpenMeteoDaily = {
  time: string[];
  sunrise: string[];
  sunset: string[];
};

export type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
  fetchedAt: string; // ISO, when we retrieved this
};

export async function fetchOpenMeteo(lat: number, lon: number): Promise<OpenMeteoResponse> {
  const url = new URL(BASE_URL);
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lon.toFixed(4));
  url.searchParams.set("hourly", HOURLY_PARAMS);
  url.searchParams.set("daily", "sunrise,sunset");
  url.searchParams.set("timezone", "Asia/Kathmandu");
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("models", "best_match");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { ...data, fetchedAt: new Date().toISOString() };
}

// WMO weather interpretation code → display
type WmoInfo = { icon: string; label: string; haloColor: HaloColor; severity: number };

const WMO_MAP: Record<number, WmoInfo> = {
  0: { icon: "☀", label: "Clear sky", haloColor: "gold", severity: 0 },
  1: { icon: "🌤", label: "Mostly clear", haloColor: "gold", severity: 1 },
  2: { icon: "⛅", label: "Partly cloudy", haloColor: "green", severity: 2 },
  3: { icon: "☁", label: "Overcast", haloColor: "gray", severity: 3 },
  45: { icon: "🌫", label: "Fog", haloColor: "gray", severity: 3 },
  48: { icon: "🌫", label: "Icy fog", haloColor: "gray", severity: 3 },
  51: { icon: "🌦", label: "Light drizzle", haloColor: "blue", severity: 4 },
  53: { icon: "🌦", label: "Drizzle", haloColor: "blue", severity: 4 },
  55: { icon: "🌦", label: "Dense drizzle", haloColor: "blue", severity: 5 },
  61: { icon: "🌧", label: "Light rain", haloColor: "blue", severity: 4 },
  63: { icon: "🌧", label: "Rain", haloColor: "blue", severity: 5 },
  65: { icon: "🌧", label: "Heavy rain", haloColor: "blue", severity: 6 },
  71: { icon: "🌨", label: "Light snow", haloColor: "cyan", severity: 4 },
  73: { icon: "🌨", label: "Snow", haloColor: "cyan", severity: 5 },
  75: { icon: "❄", label: "Heavy snow", haloColor: "cyan", severity: 6 },
  77: { icon: "🌨", label: "Snow grains", haloColor: "cyan", severity: 4 },
  80: { icon: "🌧", label: "Rain showers", haloColor: "blue", severity: 5 },
  81: { icon: "🌧", label: "Rain showers", haloColor: "blue", severity: 5 },
  82: { icon: "⛈", label: "Heavy showers", haloColor: "blue", severity: 6 },
  85: { icon: "🌨", label: "Snow showers", haloColor: "cyan", severity: 5 },
  86: { icon: "❄", label: "Heavy snow showers", haloColor: "cyan", severity: 6 },
  95: { icon: "⛈", label: "Thunderstorm", haloColor: "red", severity: 7 },
  96: { icon: "⛈", label: "Thunderstorm + hail", haloColor: "red", severity: 8 },
  99: { icon: "⛈", label: "Heavy thunderstorm", haloColor: "red", severity: 8 },
};

export function wmoInfo(code: number): WmoInfo {
  return WMO_MAP[code] ?? { icon: "☁", label: "Cloud", haloColor: "gray", severity: 3 };
}

// Get the index in the hourly array closest to "now"
export function currentHourIndex(times: string[]): number {
  const now = Date.now();
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (!t) continue;
    const diff = Math.abs(new Date(t).getTime() - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

export function conditionFromHourly(
  id: DestinationId,
  data: OpenMeteoResponse,
): DestinationCondition {
  const { hourly, fetchedAt } = data;
  const idx = currentHourIndex(hourly.time);
  const code = hourly.weather_code[idx] ?? 3;
  const info = wmoInfo(code);
  const precip = hourly.precipitation[idx] ?? 0;
  const wind = hourly.wind_speed_10m[idx] ?? 0;
  const cloud = hourly.cloud_cover[idx] ?? 0;
  const temp = hourly.temperature_2m[idx] ?? null;

  const evidenceTier: EvidenceTier = "forecast-model";
  const confidence = "forecast" as const;

  let plainSummary = info.label;
  if (precip > 0.5) plainSummary += `, ${precip.toFixed(1)}mm rain`;
  if (wind > 40) plainSummary += `, gusts ${wind.toFixed(0)} km/h`;
  if (temp !== null) plainSummary += `, ${temp.toFixed(0)}°C`;
  if (cloud > 70) plainSummary += " — reduced visibility";

  // Upgrade halo to red for severe conditions (avoid threshold)
  const haloColor: HaloColor = precip > 25 || wind > 60 ? "red" : info.haloColor;

  return {
    destinationId: id,
    haloColor,
    conditionIcon: info.icon,
    conditionLabel: info.label,
    plainSummary,
    confidence,
    evidenceTier,
    timestamp: fetchedAt,
  };
}
