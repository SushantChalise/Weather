import { NextResponse } from "next/server";
import type { Earthquake } from "@/data/earthquakes";

export const revalidate = 1800; // 30 min — USGS catalog updates frequently

const HKH = { west: 78, south: 23, east: 92, north: 33 };

type UsgsFeature = {
  id: string;
  properties: Record<string, unknown>;
  geometry: { coordinates: [number, number, number] };
};

type UsgsGeoJson = {
  features?: UsgsFeature[];
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Math.max(1, Math.min(30, Number(searchParams.get("days") ?? 7)));
  const minMag = Math.max(0, Math.min(10, Number(searchParams.get("min_mag") ?? 4)));
  const west = Number(searchParams.get("west") ?? HKH.west);
  const south = Number(searchParams.get("south") ?? HKH.south);
  const east = Number(searchParams.get("east") ?? HKH.east);
  const north = Number(searchParams.get("north") ?? HKH.north);

  if (![west, south, east, north].every(Number.isFinite) || west >= east || south >= north) {
    return NextResponse.json({ error: "Invalid bbox" }, { status: 400 });
  }

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  const startISO = start.toISOString();

  const url =
    `https://earthquake.usgs.gov/fdsnws/event/1/query` +
    `?format=geojson` +
    `&starttime=${startISO}` +
    `&minmagnitude=${minMag}` +
    `&minlatitude=${south}` +
    `&minlongitude=${west}` +
    `&maxlatitude=${north}` +
    `&maxlongitude=${east}`;

  let geojson: UsgsGeoJson;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) {
      return NextResponse.json({ error: `USGS upstream ${r.status}` }, { status: 502 });
    }
    geojson = (await r.json()) as UsgsGeoJson;
  } catch {
    return NextResponse.json({ error: "USGS upstream timeout" }, { status: 504 });
  }

  const events: Earthquake[] = (geojson.features ?? []).map((f) => {
    const [lon, lat, depth] = f.geometry.coordinates;
    return {
      id: f.id,
      mag: Number(f.properties.mag ?? 0),
      place: String(f.properties.place ?? ""),
      time: Number(f.properties.time ?? 0),
      depth_km: depth ?? 0,
      lat: lat ?? 0,
      lon: lon ?? 0,
      url: String(f.properties.url ?? ""),
      tsunami: Boolean(f.properties.tsunami),
    };
  });

  return NextResponse.json({
    events,
    bbox: { west, south, east, north },
    days,
    min_mag: minMag,
    fetched_at: new Date().toISOString(),
  });
}
