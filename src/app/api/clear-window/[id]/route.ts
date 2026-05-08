import { type NextRequest, NextResponse } from "next/server";
import { DESTINATIONS } from "@/data/destinations";
import { computeClearWindow } from "@/lib/decision/clear-window";
import { fetchOpenMeteo } from "@/lib/open-meteo";
import type { DestinationId } from "@/types/weather";

export const revalidate = 600; // 10 min

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dest = DESTINATIONS.find((d) => d.id === id);
  if (!dest) return NextResponse.json({ error: "Unknown destination" }, { status: 404 });

  try {
    const data = await fetchOpenMeteo(dest.lat, dest.lon);
    const window = computeClearWindow(
      dest.id as DestinationId,
      dest.lat,
      dest.lon,
      dest.preDawnValue,
      data,
    );
    return NextResponse.json(window);
  } catch {
    return NextResponse.json({ error: "Clear window computation failed" }, { status: 503 });
  }
}
