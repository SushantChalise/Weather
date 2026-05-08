import { type NextRequest, NextResponse } from "next/server";
import { forecastSource, makeEvidenceField } from "@/lib/decision/evidence-field";
import { ABC_SEGMENTS, computeGuideBrief, EBC_SEGMENTS } from "@/lib/decision/guide-brief-compute";
import { fetchOpenMeteo } from "@/lib/open-meteo";
import type { CorridorId } from "@/types/weather";

export const revalidate = 600; // 10 min

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ corridor: string }> },
) {
  const { corridor } = await params;
  if (corridor !== "abc" && corridor !== "ebc") {
    return NextResponse.json({ error: `Unknown corridor: ${corridor}` }, { status: 404 });
  }

  const corridorId = corridor as CorridorId;
  const segments = corridorId === "abc" ? ABC_SEGMENTS : EBC_SEGMENTS;

  try {
    const fetchedAt = new Date().toISOString();

    // Fetch weather for each segment representative point
    const weatherBySegment = new Map<string, Awaited<ReturnType<typeof fetchOpenMeteo>>>();
    await Promise.allSettled(
      segments.map(async (seg) => {
        const data = await fetchOpenMeteo(seg.representativeLat, seg.representativeLon);
        weatherBySegment.set(seg.id, data);
      }),
    );

    // Approximate snowline from upper segment freezing level
    const upperData = weatherBySegment.get("upper");
    const snowlineMeters = upperData ? (upperData.hourly.freezing_level_height[0] ?? null) : null;

    const brief = computeGuideBrief(corridorId, weatherBySegment, snowlineMeters);
    const _evidence = makeEvidenceField([forecastSource(fetchedAt)]);

    return NextResponse.json({ brief, _evidence });
  } catch {
    return NextResponse.json({ error: "Guide brief computation failed" }, { status: 503 });
  }
}
