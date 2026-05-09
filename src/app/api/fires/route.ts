import { NextResponse } from "next/server";
import type { FireDetection } from "@/data/fires";

export const revalidate = 3600; // 1 hour — fire detections update slowly

const HKH_BBOX = { west: 78, south: 23, east: 92, north: 33 };

export async function GET(req: Request) {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) {
    return NextResponse.json({ error: "FIRMS not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const west = Number(searchParams.get("west") ?? HKH_BBOX.west);
  const south = Number(searchParams.get("south") ?? HKH_BBOX.south);
  const east = Number(searchParams.get("east") ?? HKH_BBOX.east);
  const north = Number(searchParams.get("north") ?? HKH_BBOX.north);
  const days = Math.max(1, Math.min(10, Number(searchParams.get("days") ?? 1)));

  if (![west, south, east, north].every(Number.isFinite) || west >= east || south >= north) {
    return NextResponse.json({ error: "Invalid bbox" }, { status: 400 });
  }

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/MODIS_NRT/${west},${south},${east},${north}/${days}`;

  let csv: string;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) {
      return NextResponse.json({ error: `FIRMS upstream ${r.status}` }, { status: 502 });
    }
    csv = await r.text();
  } catch {
    return NextResponse.json({ error: "FIRMS upstream timeout" }, { status: 504 });
  }

  const lines = csv.trim().split("\n");
  // lines[0] is the header; if there are no data rows, return empty
  if (lines.length < 2) {
    return NextResponse.json({
      detections: [] as FireDetection[],
      bbox: { west, south, east, north },
      days,
      fetched_at: new Date().toISOString(),
    });
  }

  // CSV columns (0-indexed):
  // 0:latitude 1:longitude 2:brightness 3:scan 4:track 5:acq_date 6:acq_time
  // 7:satellite 8:instrument 9:confidence 10:version 11:bright_t31 12:frp 13:daynight
  const detections: FireDetection[] = [];
  for (const line of lines.slice(1)) {
    const p = line.split(",");
    if (p.length < 14) continue;

    const lat = Number(p[0]);
    const lon = Number(p[1]);
    const brightness = Number(p[2]);
    const scan = Number(p[3]);
    const track = Number(p[4]);
    const acq_date = p[5] ?? "";
    const acq_time = p[6] ?? "";
    const satellite = p[7] ?? "";
    const instrument = p[8] ?? "";
    const confidence = Number(p[9]);
    // p[10] is version — not exposed in the response type
    const bright_t31 = Number(p[11]);
    const frp = Number(p[12]);
    const daynightRaw = (p[13] ?? "").trim();
    const daynight: "D" | "N" = daynightRaw === "N" ? "N" : "D";

    // Skip rows where numeric fields didn't parse
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(brightness)) {
      continue;
    }

    detections.push({
      lat,
      lon,
      brightness,
      scan,
      track,
      acq_date,
      acq_time,
      satellite,
      instrument,
      confidence,
      bright_t31,
      frp,
      daynight,
    });
  }

  return NextResponse.json({
    detections,
    bbox: { west, south, east, north },
    days,
    fetched_at: new Date().toISOString(),
  });
}
