import { NextResponse } from "next/server";
import { DESTINATIONS } from "@/data/destinations";
import { computeComparisonData } from "@/lib/decision/comparison-compute";
import { forecastSource, makeEvidenceField } from "@/lib/decision/evidence-field";
import { fetchOpenMeteo } from "@/lib/open-meteo";

export const revalidate = 600; // 10 min

export async function GET() {
  try {
    const fetchedAt = new Date().toISOString();
    const results = await Promise.allSettled(
      DESTINATIONS.map(async (dest) => ({
        id: dest.id,
        name: dest.name,
        tripIntent: dest.tripIntent,
        altitude: dest.altitude,
        data: await fetchOpenMeteo(dest.lat, dest.lon),
      })),
    );

    const destinations = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const comparison = computeComparisonData(destinations);
    const _evidence = makeEvidenceField([forecastSource(fetchedAt)]);
    return NextResponse.json({ ...comparison, _evidence });
  } catch {
    return NextResponse.json({ error: "Comparison computation failed" }, { status: 503 });
  }
}
