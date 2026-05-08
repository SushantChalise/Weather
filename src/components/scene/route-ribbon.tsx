"use client";

import { Html } from "@react-three/drei";
import { NEPAL_BBOX } from "@/data/nepal-bbox";
import type { RouteWaypoint } from "@/types/weather";

const LON_SPAN = NEPAL_BBOX.east - NEPAL_BBOX.west;
const LAT_SPAN = NEPAL_BBOX.north - NEPAL_BBOX.south;
const ASPECT = LON_SPAN / LAT_SPAN;

function toCanvas(lat: number, lon: number): [number, number] {
  const x = (lon - NEPAL_BBOX.west) / LON_SPAN - 0.5;
  const y = (lat - NEPAL_BBOX.south) / LAT_SPAN - 0.5;
  return [x * ASPECT, y];
}

type RouteRibbonProps = {
  waypoints: RouteWaypoint[];
  color: string; // e.g. "#D4A843" gold, "#4A90C4" blue
  label: string;
};

export function RouteRibbon({ waypoints, color, label }: RouteRibbonProps) {
  return (
    <>
      {waypoints.slice(0, -1).map((wp, i) => {
        const next = waypoints[i + 1];
        if (!next) return null;
        const [x1, y1] = toCanvas(wp.lat, wp.lon);
        const [x2, y2] = toCanvas(next.lat, next.lon);

        // Draw SVG line segment as an HTML overlay
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        // Length in canvas units → scale to pixels (approx for 180 zoom ortho cam)
        const dx = (x2 - x1) * 180;
        const dy = (y2 - y1) * 180;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        return (
          <Html
            key={`${wp.id}-${next.id}`}
            position={[midX, midY, 0.008]}
            center
            style={{ pointerEvents: "none", zIndex: 7 }}
          >
            <div
              style={{
                width: `${length}px`,
                height: 3,
                background: color,
                opacity: 0.7,
                transform: `rotate(${-angle}deg)`,
                borderRadius: 2,
              }}
              title={`${label}: ${wp.name} → ${next.name}`}
            />
          </Html>
        );
      })}
      {waypoints.map((wp) => {
        const [x, y] = toCanvas(wp.lat, wp.lon);
        return (
          <Html
            key={`dot-${wp.id}`}
            position={[x, y, 0.009]}
            center
            style={{ pointerEvents: "none", zIndex: 8 }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: color,
                border: "1.5px solid white",
                opacity: 0.85,
              }}
              title={`${wp.name} ${wp.altitude}m`}
            />
          </Html>
        );
      })}
    </>
  );
}
