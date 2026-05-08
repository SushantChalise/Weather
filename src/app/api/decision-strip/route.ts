import { NextResponse } from "next/server";
import { DESTINATIONS } from "@/data/destinations";
import { computeDecisionStrip } from "@/lib/decision/decision-strip-compute";
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
        data: await fetchOpenMeteo(dest.lat, dest.lon),
      })),
    );

    const destinations = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const strip = computeDecisionStrip(destinations);
    const _evidence = makeEvidenceField([forecastSource(fetchedAt)]);
    return NextResponse.json({ ...strip, _evidence });
  } catch {
    return NextResponse.json({ error: "Decision strip computation failed" }, { status: 503 });
  }
}
