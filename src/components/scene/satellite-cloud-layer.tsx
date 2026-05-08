"use client";

import { Html } from "@react-three/drei";
import { NEPAL_BBOX } from "@/data/nepal-bbox";
import { useSatellite } from "@/hooks/use-satellite";
import type { SatelliteScope } from "@/types/weather";

// Approximate centroids for each satellite scope mapped to Nepal bbox coordinates
const SCOPE_CENTROIDS: Record<SatelliteScope, { lat: number; lon: number }> = {
  annapurna: { lat: 28.55, lon: 83.85 },
  khumbu: { lat: 27.98, lon: 86.92 },
  kathmandu_valley: { lat: 27.71, lon: 85.32 },
  chitwan: { lat: 27.52, lon: 84.35 },
  full: { lat: 28.15, lon: 84.12 },
};

const LON_SPAN = NEPAL_BBOX.east - NEPAL_BBOX.west;
const LAT_SPAN = NEPAL_BBOX.north - NEPAL_BBOX.south;
const ASPECT = LON_SPAN / LAT_SPAN;

function latlonToPlane(lat: number, lon: number): [number, number] {
  const x = (lon - NEPAL_BBOX.west) / LON_SPAN - 0.5;
  const y = (lat - NEPAL_BBOX.south) / LAT_SPAN - 0.5;
  return [x, y];
}

function cloudOpacity(pct: number): number {
  return Math.max(0, Math.min(0.6, (pct / 100) * 0.6));
}

export function SatelliteCloudLayer() {
  const { manifest } = useSatellite();
  if (!manifest) return null;

  return (
    <>
      {(
        Object.entries(manifest.scopes) as [
          SatelliteScope,
          (typeof manifest.scopes)[SatelliteScope],
        ][]
      ).map(([scope, epoch]) => {
        if (!epoch) return null;
        const centroid = SCOPE_CENTROIDS[scope];
        const [x, y] = latlonToPlane(centroid.lat, centroid.lon);
        const opacity = cloudOpacity(epoch.cloudCoverPct);

        return (
          <Html
            key={scope}
            position={[x * ASPECT, y, 0.005]}
            center
            style={{ pointerEvents: "none", zIndex: 5 }}
          >
            <div
              style={{
                width: scope === "full" ? 120 : 60,
                height: scope === "full" ? 80 : 40,
                borderRadius: "50%",
                background: `rgba(220,230,255,${opacity})`,
                border: "1px solid rgba(150,170,220,0.4)",
                filter: "blur(8px)",
              }}
              title={`${scope}: ${epoch.cloudCoverPct}% cloud (satellite)`}
            />
          </Html>
        );
      })}
    </>
  );
}
