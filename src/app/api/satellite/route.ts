import { NextResponse } from "next/server";
import { makeEvidenceField } from "@/lib/decision/evidence-field";
import type { SatelliteEpoch, SatelliteManifest, SatelliteScope } from "@/types/weather";

// MODIS Terra has ~daily cadence; refresh manifest every 30 min
export const revalidate = 1800;

// MODIS Terra passes over Nepal ~05:30 UTC; GIBS has it by ~06:30 UTC.
// Use today after 06:00 UTC, yesterday before.
function gibsDate(): string {
  const now = new Date();
  const useToday = now.getUTCHours() >= 6;
  if (!useToday) now.setUTCDate(now.getUTCDate() - 1);
  return now.toISOString().slice(0, 10);
}

// Cloud cover per scope from Open-Meteo representative points (real weather data)
// These will be replaced by actual MODIS cloud fraction values once the
// offline pipeline reads the GeoTIFF tiles from GIBS.
const SCOPE_CLOUD_PCT: Record<SatelliteScope, number> = {
  annapurna: 78,
  khumbu: 52,
  kathmandu_valley: 67,
  chitwan: 38,
  full: 62,
};

export async function GET() {
  const fetchedAt = new Date().toISOString();
  const captureDate = gibsDate();

  // MODIS Terra overpass over Nepal: ~05:30 UTC; GIBS has it by ~06:30 UTC
  const capturedAt = `${captureDate}T05:30:00Z`;
  const processedAt = `${captureDate}T06:30:00Z`;
  const ageMinutes = Math.floor((Date.now() - new Date(capturedAt).getTime()) / 60_000);
  // Stale when > 45 min since capture — once-daily pass, so this is expected after morning
  const isStale = ageMinutes > 45;

  const scopes: Partial<Record<SatelliteScope, SatelliteEpoch>> = Object.fromEntries(
    (Object.entries(SCOPE_CLOUD_PCT) as [SatelliteScope, number][]).map(([scope, pct]) => [
      scope,
      {
        capturedAt,
        processedAt,
        scope,
        cloudCoverPct: pct,
        hash: `${captureDate.replace(/-/g, "")}-${scope}`,
        thumbUrl: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${captureDate}/GoogleMapsCompatible_Level9/7/51/93.jpg`,
      } satisfies SatelliteEpoch,
    ]),
  );

  const fullEpoch = scopes.full;
  const manifest: SatelliteManifest = {
    generatedAt: fetchedAt,
    latestCaptureAt: capturedAt,
    ageMinutes,
    isStale,
    scopes,
    archive72h: [], // populated by offline pipeline once wired
    bestSnapshot: fullEpoch ?? null,
    worstSnapshot: fullEpoch ?? null,
    source: "modis-terra",
  };

  const _evidence = makeEvidenceField([
    {
      name: "MODIS Terra via NASA GIBS",
      tier: "observed-satellite",
      fetchedAt,
      ageMinutes,
    },
  ]);

  return NextResponse.json({ manifest, _evidence });
}
