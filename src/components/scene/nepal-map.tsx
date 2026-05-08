"use client";

import { Html, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CameraRig } from "@/components/scene/camera-rig";
import { CloudShells } from "@/components/scene/cloud-shells";
import { RouteRibbon } from "@/components/scene/route-ribbon";
import { SatelliteCloudLayer } from "@/components/scene/satellite-cloud-layer";
import { ABC_WAYPOINTS } from "@/data/corridors/abc";
import { EBC_WAYPOINTS } from "@/data/corridors/ebc";
import { DESTINATIONS, TRAIL_ENTRIES } from "@/data/destinations";
import { MOCK_DESTINATION_CONDITIONS } from "@/data/mock/destination-conditions";
import { NEPAL_BBOX } from "@/data/nepal-bbox";
import { PEAKS } from "@/data/peaks";
import { useSelectionStore } from "@/state/selectionStore";
import type {
  CorridorId,
  Destination,
  DestinationCondition,
  HaloColor,
  Peak,
  TrailEntry,
} from "@/types/weather";

// Map a lat/lon to a [-0.5, 0.5] x/y position on the plane
function latlonToPlane(lat: number, lon: number): [number, number] {
  const x = (lon - NEPAL_BBOX.west) / (NEPAL_BBOX.east - NEPAL_BBOX.west) - 0.5;
  // Flip y: north is up
  const y = (lat - NEPAL_BBOX.south) / (NEPAL_BBOX.north - NEPAL_BBOX.south) - 0.5;
  return [x, y];
}

// Aspect ratio of the Nepal bbox
const LON_SPAN = NEPAL_BBOX.east - NEPAL_BBOX.west; // 8.14°
const LAT_SPAN = NEPAL_BBOX.north - NEPAL_BBOX.south; // 4.10°
const ASPECT = LON_SPAN / LAT_SPAN; // ~1.98

const HALO_COLORS: Record<HaloColor, string> = {
  gold: "#D4A843",
  green: "#4CAF72",
  blue: "#4A90C4",
  cyan: "#4ABFC4",
  gray: "#8B8B8B",
  red: "#C44A4A",
};

function makeConditionMap(live: DestinationCondition[] | null): Map<string, DestinationCondition> {
  const source = live ?? MOCK_DESTINATION_CONDITIONS;
  return new Map(source.map((c) => [c.destinationId, c]));
}

function DestinationMarker({
  dest,
  conditionMap,
}: {
  dest: Destination;
  conditionMap: Map<string, DestinationCondition>;
}) {
  const [x, y] = latlonToPlane(dest.lat, dest.lon);
  const cond = conditionMap.get(dest.id);
  const haloColor = HALO_COLORS[cond?.haloColor ?? "gray"];
  const icon = cond?.conditionIcon ?? "☁";
  const { set } = useSelectionStore();

  function handleClick() {
    const corridor = dest.corridor as CorridorId | null;
    set({
      selectedDestinationId: dest.id,
      selectedCorridor: corridor,
      insightPanelOpen: corridor !== null,
    });
  }

  return (
    <Html position={[x * ASPECT, y, 0.01]} center style={{ zIndex: 10 }}>
      <button
        type="button"
        onClick={handleClick}
        className="flex flex-col items-center cursor-pointer focus:outline-none"
        style={{ gap: "3px", background: "none", border: "none", padding: 0 }}
        aria-label={`${dest.name}: ${cond?.conditionLabel ?? "loading"}`}
      >
        {/* Status halo ring */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: `3px solid ${haloColor}`,
            background: "rgba(255,255,255,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            boxShadow: `0 0 0 3px ${haloColor}22, 0 1px 4px rgba(0,0,0,0.18)`,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#1A1A1A",
            background: "rgba(255,255,255,0.85)",
            padding: "1px 4px",
            borderRadius: 3,
            whiteSpace: "nowrap",
          }}
        >
          {dest.shortLabel}
        </span>
      </button>
    </Html>
  );
}

function TrailMarker({ entry }: { entry: TrailEntry }) {
  const [x, y] = latlonToPlane(entry.lat, entry.lon);
  return (
    <Html position={[x * ASPECT, y, 0.01]} center style={{ pointerEvents: "none", zIndex: 10 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: "#6B6B6B",
          background: "rgba(255,255,255,0.8)",
          padding: "1px 4px",
          borderRadius: 3,
          border: "1px solid #E5E2DB",
          whiteSpace: "nowrap",
        }}
      >
        ✈ {entry.shortLabel}
      </div>
    </Html>
  );
}

function PeakLabel({ peak }: { peak: Peak }) {
  const [x, y] = latlonToPlane(peak.lat, peak.lon);
  if (peak.altitude < 7000) return null; // only show 8000ers + prominent peaks
  return (
    <Html position={[x * ASPECT, y, 0.01]} center style={{ pointerEvents: "none", zIndex: 9 }}>
      <div
        style={{
          fontSize: 8,
          fontWeight: 500,
          color: "#4A4A4A",
          whiteSpace: "nowrap",
        }}
      >
        ▲ {peak.name} {(peak.altitude / 1000).toFixed(1)}k
      </div>
    </Html>
  );
}

function TerrainPlane() {
  return (
    <mesh rotation={[0, 0, 0]}>
      <planeGeometry args={[ASPECT, 1, 1, 1]} />
      <meshBasicMaterial color="#C4D4A0" />
    </mesh>
  );
}

type NepalMapProps = { liveConditions?: DestinationCondition[] | null };

export function NepalMap({ liveConditions }: NepalMapProps = {}) {
  const conditionMap = makeConditionMap(liveConditions ?? null);
  return (
    <div className="w-full h-full" role="img" aria-label="Nepal weather map">
      <Canvas>
        <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={180} near={0.1} far={100} />
        <CameraRig />
        <ambientLight intensity={1} />
        <TerrainPlane />
        {DESTINATIONS.map((d) => (
          <DestinationMarker key={d.id} dest={d} conditionMap={conditionMap} />
        ))}
        {TRAIL_ENTRIES.map((e) => (
          <TrailMarker key={e.id} entry={e} />
        ))}
        {PEAKS.map((p) => (
          <PeakLabel key={p.id} peak={p} />
        ))}
        <RouteRibbon waypoints={ABC_WAYPOINTS} color="#D4A843" label="ABC" />
        <RouteRibbon waypoints={EBC_WAYPOINTS} color="#4A90C4" label="EBC" />
        <CloudShells />
        <SatelliteCloudLayer />
      </Canvas>
    </div>
  );
}
