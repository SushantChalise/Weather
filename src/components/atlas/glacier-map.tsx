"use client";

import { useEffect } from "react";
import { Map as MapGL, Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";
import Link from "next/link";

const MAP_STYLE: StyleSpecification = {
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
  },
  layers: [
    { id: "esri-imagery", type: "raster", source: "esri-imagery" },
    {
      id: "esri-labels",
      type: "raster",
      source: "esri-labels",
      paint: { "raster-opacity": 0.85 },
    },
  ],
};

export type GlacierMarker = {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  alt: number;
};

function useSupressMapLibreAbortErrors() {
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      if (e.reason?.name === "AbortError") e.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
}

export function GlacierMap({ glaciers }: { glaciers: GlacierMarker[] }) {
  useSupressMapLibreAbortErrors();

  const centerLat = glaciers.reduce((s, g) => s + g.lat, 0) / (glaciers.length || 1);
  const centerLon = glaciers.reduce((s, g) => s + g.lon, 0) / (glaciers.length || 1);

  return (
    <div className="w-full h-[420px] md:h-[520px] rounded-xl overflow-hidden border border-neutral-200">
      <MapGL
        mapStyle={MAP_STYLE}
        onError={(e) => {
          if (e.error?.name === "AbortError") return;
          console.error("MapLibre error:", e.error);
        }}
        initialViewState={{
          longitude: centerLon,
          latitude: centerLat,
          zoom: 6.5,
          pitch: 0,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {glaciers.map((g) => (
          <Marker key={g.slug} longitude={g.lon} latitude={g.lat} anchor="center">
            <Link
              href={`/places/${g.slug}`}
              className="flex flex-col items-center"
              title={`${g.name} — ${g.alt.toLocaleString()} m`}
              aria-label={g.name}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "3px solid #4A90C4",
                  background: "rgba(255,255,255,0.92)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  boxShadow: "0 0 0 3px #4A90C433, 0 2px 6px rgba(0,0,0,0.3)",
                  cursor: "pointer",
                }}
              >
                🧊
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
                  marginTop: 2,
                }}
              >
                {g.name.length > 16 ? `${g.name.slice(0, 14)}…` : g.name}
              </span>
            </Link>
          </Marker>
        ))}
      </MapGL>
    </div>
  );
}
