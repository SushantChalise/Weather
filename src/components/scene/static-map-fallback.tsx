"use client";

import { DESTINATIONS } from "@/data/destinations";
import { MOCK_DESTINATION_CONDITIONS } from "@/data/mock/destination-conditions";
import { NEPAL_BBOX } from "@/data/nepal-bbox";
import { useWeather } from "@/hooks/use-weather";

const LON_SPAN = NEPAL_BBOX.east - NEPAL_BBOX.west;
const LAT_SPAN = NEPAL_BBOX.north - NEPAL_BBOX.south;

function toPct(lat: number, lon: number): { left: string; bottom: string } {
  return {
    left: `${((lon - NEPAL_BBOX.west) / LON_SPAN) * 100}%`,
    bottom: `${((lat - NEPAL_BBOX.south) / LAT_SPAN) * 100}%`,
  };
}

const HALO_COLORS: Record<string, string> = {
  gold: "#D4A843",
  green: "#4CAF72",
  blue: "#4A90C4",
  cyan: "#4ABFC4",
  gray: "#8B8B8B",
  red: "#C44A4A",
};

export function StaticMapFallback() {
  const { conditions } = useWeather();
  const source = conditions ?? MOCK_DESTINATION_CONDITIONS;
  const condMap = new Map(source.map((c) => [c.destinationId, c]));

  return (
    <div
      className="w-full h-full relative bg-[#C4D4A0]"
      role="img"
      aria-label="Nepal weather map (low-bandwidth static view)"
    >
      {DESTINATIONS.map((dest) => {
        const cond = condMap.get(dest.id);
        const { left, bottom } = toPct(dest.lat, dest.lon);
        const color = HALO_COLORS[cond?.haloColor ?? "gray"];

        return (
          <div
            key={dest.id}
            className="absolute flex flex-col items-center"
            style={{ left, bottom, transform: "translate(-50%, 50%)", pointerEvents: "none" }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: `2px solid ${color}`,
                background: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
              }}
              title={cond?.conditionLabel}
            >
              {cond?.conditionIcon ?? "☁"}
            </div>
            <span
              style={{
                fontSize: 8,
                fontWeight: 600,
                color: "#1A1A1A",
                background: "rgba(255,255,255,0.8)",
                padding: "1px 3px",
                borderRadius: 2,
                whiteSpace: "nowrap",
                marginTop: 2,
              }}
            >
              {dest.shortLabel}
            </span>
          </div>
        );
      })}

      <div className="absolute top-2 left-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
        Low-bandwidth mode — 3D map paused
      </div>
    </div>
  );
}
