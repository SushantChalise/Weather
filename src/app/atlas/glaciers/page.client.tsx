"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { PLACE_REGISTRY } from "@/data/places";

export function GlacierMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const glaciers = Object.entries(PLACE_REGISTRY).filter(([, p]) => p.class === "glacier");

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [86, 28],
      zoom: 4.5,
    });
    mapRef.current = map;

    map.on("load", () => {
      for (const [slug, place] of glaciers) {
        const el = document.createElement("a");
        el.href = `/places/${slug}`;
        el.style.cssText =
          "display:block;width:14px;height:14px;border-radius:50%;background:#0a0a0a;border:2px solid #fff;cursor:pointer;text-decoration:none;";
        el.title = place.name;
        new maplibregl.Marker({ element: el }).setLngLat([place.lon, place.lat]).addTo(map);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[400px] md:h-[500px] rounded-lg border border-neutral-200 overflow-hidden"
    />
  );
}
