import { NextResponse } from "next/server";
import { DESTINATIONS } from "@/data/destinations";
import { forecastSource, makeEvidenceField } from "@/lib/decision/evidence-field";
import { conditionFromHourly, fetchOpenMeteo } from "@/lib/open-meteo";

export const revalidate = 3600; // 1h — model runs every 6h, 1h cache is fresh enough

export async function GET() {
  try {
    const fetchedAt = new Date().toISOString();
    const results = await Promise.allSettled(
      DESTINATIONS.map(async (dest) => {
        const data = await fetchOpenMeteo(dest.lat, dest.lon);
        return conditionFromHourly(dest.id, data);
      }),
    );

    const conditions = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failCount = results.filter((r) => r.status === "rejected").length;
    const _evidence = makeEvidenceField([forecastSource(fetchedAt)]);

    return NextResponse.json({
      conditions,
      fetchedAt,
      partial: failCount > 0,
      failCount,
      _evidence,
    });
  } catch {
    return NextResponse.json({ error: "Weather fetch failed" }, { status: 503 });
  }
}
