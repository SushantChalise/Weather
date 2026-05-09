import { NextResponse } from "next/server";

export const revalidate = 120; // 2 min

export type HimawariManifest = {
  satellite: string;
  band: string;
  capturedAt: string;
  processedAt: string;
  ageMinutes: number;
  tileBaseUrl: string;
  tileTemplate: string;
  minZoom: number;
  maxZoom: number;
  bbox: [number, number, number, number];
};

// Fallback: today's MODIS Terra from GIBS (always available after 06:00 UTC)
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
    tileBaseUrl:
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9`,
    tileTemplate: "{z}/{y}/{x}.jpg",
    minZoom: 1,
    maxZoom: 9,
    bbox: [78, 23, 92, 33],
    source: "modis-fallback",
  };
}

export async function GET() {
  // Vercel Blob public files are at {storeId}.public.blob.vercel-storage.com
  // The storeId is embedded in the token (4th segment when split by "_")
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = token?.split("_")[3];

  if (storeId) {
    try {
      const manifestUrl =
        `https://${storeId}.public.blob.vercel-storage.com/himawari/manifest.json`;
      const res = await fetch(manifestUrl, { next: { revalidate: 120 } });

      if (res.ok) {
        const manifest = (await res.json()) as HimawariManifest;
        const ageMinutes = Math.floor(
          (Date.now() - new Date(manifest.capturedAt).getTime()) / 60_000,
        );
        return NextResponse.json({
          himawari: { ...manifest, ageMinutes },
          isStale: ageMinutes > 45,
          source: "himawari-9",
        });
      }
    } catch {
      // Blob store not seeded yet — fall through to MODIS
    }
  }

  return NextResponse.json({
    himawari: modisManifest(),
    isStale: true,
    source: "modis-fallback",
  });
}
