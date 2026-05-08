import { NextResponse } from "next/server";
import { REGIONS } from "@/data/regions";
import { forecastSource, makeEvidenceField } from "@/lib/decision/evidence-field";
import { computeRegionalSnowlines } from "@/lib/decision/snowline";
import { fetchOpenMeteo } from "@/lib/open-meteo";

export const revalidate = 1800; // 30 min

export async function GET() {
  try {
    const fetchedAt = new Date().toISOString();
    const weatherByRegion = new Map<string, Awaited<ReturnType<typeof fetchOpenMeteo>>>();
    await Promise.allSettled(
      REGIONS.map(async (region) => {
        const data = await fetchOpenMeteo(region.centroidLat, region.centroidLon);
        weatherByRegion.set(region.id, data);
      }),
    );
    const snowlines = computeRegionalSnowlines(weatherByRegion);
    const _evidence = makeEvidenceField([forecastSource(fetchedAt)]);
    return NextResponse.json({ snowlines, computedAt: fetchedAt, _evidence });
  } catch {
    return NextResponse.json({ error: "Snowline computation failed" }, { status: 503 });
  }
}
