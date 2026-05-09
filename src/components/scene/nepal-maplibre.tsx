"use client";

import { useEffect, useRef } from "react";
import { Layer, Map as MapGL, Marker, Source } from "react-map-gl/maplibre";
import useSWR from "swr";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, LineString } from "geojson";
import type { StyleSpecification } from "maplibre-gl";
import type { MapRef } from "react-map-gl/maplibre";
import { ABC_WAYPOINTS } from "@/data/corridors/abc";
import { EBC_WAYPOINTS } from "@/data/corridors/ebc";
import { DESTINATIONS } from "@/data/destinations";
import { MOCK_CORRIDOR_CARDS } from "@/data/mock/corridor-cards";
import { MOCK_DESTINATION_CONDITIONS } from "@/data/mock/destination-conditions";
import { NEPAL_CENTER } from "@/data/nepal-bbox";
import { useSelectionStore } from "@/state/selectionStore";
import { useWorldStore } from "@/state/worldStore";
import type {
  CorridorCardData,
  CorridorId,
  DestinationCondition,
  HaloColor,
} from "@/types/weather";

// Cloud % → ribbon color: gold = clear, gray = partly cloudy, steel = overcast
function cloudToColor(cloud: number): string {
  if (cloud < 30) return "#D4A843";
  if (cloud < 60) return "#9B9B9B";
  return "#5B7FA5";
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<{ cards: CorridorCardData[] }>);

// MapLibre throws AbortError as an unhandled Promise rejection when it cancels
// in-flight tile fetches (normal behaviour on pan/zoom). Suppress it globally
// so Next.js DevTools doesn't report it as an error.
function useSupressMapLibreAbortErrors() {
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      if (e.reason?.name === "AbortError") e.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
}

const HALO_COLORS: Record<HaloColor, string> = {
  gold: "#D4A843",
  green: "#4CAF72",
  blue: "#4A90C4",
  cyan: "#4ABFC4",
  gray: "#8B8B8B",
  red: "#C44A4A",
};

// Yesterday in UTC — MODIS Terra data available after ~3h processing delay
function gibsDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function buildMapStyle(): StyleSpecification {
  const date = gibsDate();
  return {
    version: 8,
    sources: {
      "esri-imagery": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "© Esri, Maxar, Earthstar Geographics",
      },
      "esri-labels": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
      },
      // MODIS Terra CorrectedReflectance (TrueColor) — clouds appear white naturally.
      // At 0.5 opacity: clear areas show crisp ESRI terrain, cloudy areas look hazy/white.
      // Level9 = max zoom 9; JPEG format.
      "modis-cloud": {
        type: "raster",
        tiles: [
          `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        ],
        tileSize: 256,
        maxzoom: 9,
        attribution: "NASA GIBS · MODIS Terra",
      },
    },
    layers: [
      { id: "esri-imagery", type: "raster", source: "esri-imagery" },
      {
        id: "esri-labels",
        type: "raster",
        source: "esri-labels",
        paint: { "raster-opacity": 0.85 },
      },
      {
        id: "modis-cloud",
        type: "raster",
        source: "modis-cloud",
        paint: { "raster-opacity": 0.55 },
      },
    ],
  };
}

function toLineString(waypoints: ReadonlyArray<{ lon: number; lat: number }>): Feature<LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: waypoints.map((w) => [w.lon, w.lat]),
    },
  };
}

function RouteLine({
  id,
  waypoints,
  color,
}: {
  id: string;
  waypoints: ReadonlyArray<{ lon: number; lat: number }>;
  color: string;
}) {
  const data = toLineString(waypoints);
  return (
    <Source id={id} type="geojson" data={data}>
      {/* White halo underneath for legibility over imagery */}
      <Layer
        id={`${id}-halo`}
        type="line"
        paint={{ "line-color": "#ffffff", "line-width": 5, "line-opacity": 0.45 }}
        layout={{ "line-join": "round", "line-cap": "round" }}
      />
      <Layer
        id={`${id}-line`}
        type="line"
        paint={{ "line-color": color, "line-width": 2.5, "line-opacity": 0.95 }}
        layout={{ "line-join": "round", "line-cap": "round" }}
      />
    </Source>
  );
}

type Props = { liveConditions?: DestinationCondition[] | null };

const TOPDOWN_PITCH = 0;
const TILT_PITCH = 55;
const TILT_ZOOM_DELTA = -0.5; // zoom out slightly when tilted for context

export function NepalMapLibre({ liveConditions }: Props) {
  useSupressMapLibreAbortErrors();
  const { set } = useSelectionStore();
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const timeMode = useWorldStore((s) => s.timeMode);
  const mapRef = useRef<MapRef>(null);

  const { data: cardData } = useSWR("/api/corridor-cards", fetcher, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 0,
  });
  const cards = cardData?.cards ?? MOCK_CORRIDOR_CARDS;

  // Ribbon color responds to time mode: use tomorrowAMCloud in AM mode, currentCloud otherwise
  const useAM = timeMode === "tomorrow_am" || timeMode === "afternoon";
  const abcCloud = useAM
    ? (cards.find((c) => c.corridorId === "abc")?.tomorrowAMCloud ?? 80)
    : (cards.find((c) => c.corridorId === "abc")?.currentCloud ?? 80);
  const ebcCloud = useAM
    ? (cards.find((c) => c.corridorId === "ebc")?.tomorrowAMCloud ?? 80)
    : (cards.find((c) => c.corridorId === "ebc")?.currentCloud ?? 80);

  const condByDest = new globalThis.Map(
    (liveConditions ?? MOCK_DESTINATION_CONDITIONS).map((c) => [c.destinationId, c]),
  );

  // Animate pitch when tilt mode toggles
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const isTilt = cameraMode === "tilt";
    const currentZoom = map.getZoom();
    map.easeTo({
      pitch: isTilt ? TILT_PITCH : TOPDOWN_PITCH,
      zoom: isTilt ? currentZoom + TILT_ZOOM_DELTA : currentZoom - TILT_ZOOM_DELTA,
      duration: 700,
      easing: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
    });
  }, [cameraMode]);

  return (
    <div className="w-full h-full">
      <MapGL
        ref={mapRef}
        mapStyle={buildMapStyle()}
        onError={(e) => {
          // AbortError is expected — MapLibre cancels in-flight tile fetches when
          // tiles leave the viewport. Not a real error; suppress to keep console clean.
          if (e.error?.name === "AbortError") return;
          console.error("MapLibre error:", e.error);
        }}
        initialViewState={{
          longitude: NEPAL_CENTER.lon,
          latitude: NEPAL_CENTER.lat,
          zoom: 7.2,
          pitch: 0,
          bearing: 0,
        }}
        maxBounds={[
          [78.0, 24.5],
          [90.0, 32.0],
        ]}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <RouteLine id="abc-route" waypoints={ABC_WAYPOINTS} color={cloudToColor(abcCloud)} />
        <RouteLine id="ebc-route" waypoints={EBC_WAYPOINTS} color={cloudToColor(ebcCloud)} />

        {DESTINATIONS.map((dest) => {
          const cond = condByDest.get(dest.id);
          const haloColor = HALO_COLORS[cond?.haloColor ?? "gray"];
          const icon = cond?.conditionIcon ?? "☁";

          return (
            <Marker key={dest.id} longitude={dest.lon} latitude={dest.lat} anchor="center">
              <button
                type="button"
                className="flex flex-col items-center"
                style={{
                  gap: 3,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
                aria-label={`${dest.name}: ${cond?.conditionLabel ?? "loading"}`}
                onClick={() => {
                  set({
                    selectedDestinationId: dest.id,
                    selectedCorridor: dest.corridor as CorridorId | null,
                    insightPanelOpen: true,
                  });
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: `3px solid ${haloColor}`,
                    background: "rgba(255,255,255,0.92)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    boxShadow: `0 0 0 3px ${haloColor}33, 0 2px 6px rgba(0,0,0,0.3)`,
                  }}
                >
                  {icon}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#fff",
                    background: "rgba(0,0,0,0.65)",
                    padding: "1px 4px",
                    borderRadius: 3,
                    whiteSpace: "nowrap",
                    letterSpacing: "0.02em",
                  }}
                >
                  {dest.shortLabel}
                </span>
              </button>
            </Marker>
          );
        })}
      </MapGL>
    </div>
  );
}
