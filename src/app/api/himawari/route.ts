import { NextResponse } from "next/server";
import type { DataMirrorManifest } from "@/hooks/use-himawari";

export const revalidate = 300;

const MANIFEST_URL =
  "https://cdn.jsdelivr.net/gh/SushantChalise/weather-data-mirror@data-mirror/himawari/latest/manifest.json";

export async function GET() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    try {
      const res = await fetch(MANIFEST_URL, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (res.ok) {
        const manifest = (await res.json()) as DataMirrorManifest;
        const ageMinutes = Math.floor(
          (Date.now() - new Date(manifest.frame_time_utc).getTime()) / 60_000,
        );
        return NextResponse.json({ manifest, ageMinutes, isStale: ageMinutes > 45 });
      }
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Network or timeout
  }

  return NextResponse.json({ error: "Manifest unavailable" }, { status: 503 });
}
