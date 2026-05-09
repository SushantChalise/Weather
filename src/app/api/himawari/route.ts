import { NextResponse } from "next/server";

export const revalidate = 120; // 2 min — pipeline runs every 30 min

export type HimawariManifest = {
  satellite: string;
  band: string;
  capturedAt: string; // ISO UTC
  processedAt: string; // ISO UTC
  ageMinutes: number;
  tileBaseUrl: string;
  tileTemplate: string; // "{z}/{x}/{y}.png"
  minZoom: number;
  maxZoom: number;
  bbox: [number, number, number, number]; // [west, south, east, north]
};

// Fallback: MODIS Terra today (always available, ~60-90 min lag after 06:00 UTC)
function modisManifest(): HimawariManifest & { source: "modis-fallback" } {
  const now = new Date();
  const useToday = now.getUTCHours() >= 6;
  const d = new Date(now);
  if (!useToday) d.setUTCDate(d.getUTCDate() - 1);
  const date = d.toISOString().slice(0, 10);
  const capturedAt = `${date}T05:30:00Z`;
  const ageMinutes = Math.floor((Date.now() - new Date(capturedAt).getTime()) / 60_000);

  return {
    satellite: "MODIS Terra",
    band: "True Colour (B01/B02/B03)",
    capturedAt,
    processedAt: `${date}T06:30:00Z`,
    ageMinutes,
    tileBaseUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9`,
    tileTemplate: "{z}/{y}/{x}.jpg", // GIBS uses {y}/{x} order
    minZoom: 1,
    maxZoom: 9,
    bbox: [78, 23, 92, 33],
    source: "modis-fallback",
  };
}

export async function GET() {
  // Try to fetch the Himawari manifest from Vercel Blob
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (blobToken) {
    try {
      const res = await fetch("https://blob.vercel-storage.com/himawari/manifest.json", {
        headers: { Authorization: `Bearer ${blobToken}` },
        next: { revalidate: 120 },
      });

      if (res.ok) {
        const manifest = (await res.json()) as HimawariManifest;
        // If manifest is > 90 min old, also return MODIS as fallback info
        return NextResponse.json({
          himawari: manifest,
          isStale: manifest.ageMinutes > 45,
          source: "himawari-9",
        });
      }
    } catch {
      // Blob not configured or unavailable — fall through to MODIS
    }
  }

  // No Himawari tiles yet — return MODIS as the active cloud source
  return NextResponse.json({
    himawari: modisManifest(),
    isStale: true,
    source: "modis-fallback",
  });
}
