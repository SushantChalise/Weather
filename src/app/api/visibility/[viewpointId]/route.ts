import { type NextRequest, NextResponse } from "next/server";
import { VIEWPOINTS } from "@/data/viewpoints";
import { forecastSource, makeEvidenceField } from "@/lib/decision/evidence-field";
import { computeVisibility } from "@/lib/decision/visibility-compute";
import { fetchOpenMeteo } from "@/lib/open-meteo";
import type { ViewpointId } from "@/types/weather";

export const revalidate = 600; // 10 min

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ viewpointId: string }> },
) {
  const { viewpointId } = await params;
  const vp = VIEWPOINTS.find((v) => v.id === viewpointId);
  if (!vp) return NextResponse.json({ error: "Unknown viewpoint" }, { status: 404 });

  try {
    const fetchedAt = new Date().toISOString();
    const data = await fetchOpenMeteo(vp.lat, vp.lon);
    const result = computeVisibility(vp.id as ViewpointId, vp.targetPeaks, data);
    const _evidence = makeEvidenceField([forecastSource(fetchedAt)]);
    return NextResponse.json({ result, _evidence });
  } catch {
    return NextResponse.json({ error: "Visibility computation failed" }, { status: 503 });
  }
}
