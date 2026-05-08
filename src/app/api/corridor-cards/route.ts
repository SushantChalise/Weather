import { NextResponse } from "next/server";
import { DESTINATIONS } from "@/data/destinations";
import { computeCorridorCard } from "@/lib/decision/corridor-card-compute";
import { forecastSource, makeEvidenceField } from "@/lib/decision/evidence-field";
import { fetchOpenMeteo } from "@/lib/open-meteo";

export const revalidate = 600; // 10 min

// Representative destination for each corridor
const CORRIDOR_REPS = [
  { corridorId: "abc" as const, destId: "abc" },
  { corridorId: "ebc" as const, destId: "ebc" },
  { corridorId: "pokhara" as const, destId: "pokhara" },
];

export async function GET() {
  try {
    const fetchedAt = new Date().toISOString();
    const results = await Promise.allSettled(
      CORRIDOR_REPS.map(async ({ corridorId, destId }) => {
        const dest = DESTINATIONS.find((d) => d.id === destId);
        if (!dest) throw new Error(`Destination ${destId} not found`);
        const data = await fetchOpenMeteo(dest.lat, dest.lon);
        return computeCorridorCard({ corridorId, data });
      }),
    );

    const cards = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const _evidence = makeEvidenceField([forecastSource(fetchedAt)]);
    return NextResponse.json({ cards, _evidence });
  } catch {
    return NextResponse.json({ error: "Corridor cards computation failed" }, { status: 503 });
  }
}
