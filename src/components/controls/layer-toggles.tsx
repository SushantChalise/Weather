"use client";

import { useWorldStore } from "@/state/worldStore";
import type { LayerId } from "@/types/weather";

const LAYERS: Array<{ id: LayerId; icon: string; label: string }> = [
  { id: "clouds", icon: "☁", label: "Clouds" },
  { id: "rain", icon: "🌧", label: "Rain" },
  { id: "snow", icon: "❄", label: "Snow" },
  { id: "current", icon: "📍", label: "Current" },
  { id: "temperature", icon: "🌡", label: "Temp" },
];

const LEGENDS: Record<LayerId, string> = {
  clouds: "Satellite cloud cover (yesterday)",
  rain: "Precipitation intensity · size = mm/h",
  snow: "High-altitude snow risk (above 3,500m)",
  current: "Current condition icons only",
  temperature: "Surface temperature · blue=cold · red=warm",
};

export function LayerToggles() {
  const { activeLayer, set } = useWorldStore();

  return (
    <div className="flex flex-col gap-1">
      <fieldset className="flex items-center gap-1">
        <legend className="sr-only">Map layer toggles</legend>
        {LAYERS.map(({ id, icon, label }) => {
          const isActive = activeLayer === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => set({ activeLayer: id })}
              aria-pressed={isActive}
              aria-label={`Toggle ${label} layer`}
              className={[
                "flex items-center gap-1 px-2 py-1.5 rounded text-sm font-medium",
                "transition-colors duration-150 min-h-[36px]",
                isActive
                  ? "bg-[var(--color-text-primary)] text-[var(--color-text-inverse)]"
                  : "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]",
              ].join(" ")}
            >
              <span aria-hidden>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </fieldset>
      {/* Per-layer mini-legend (§8) */}
      <p className="text-[10px] text-[var(--color-text-muted)] leading-none">
        {LEGENDS[activeLayer]}
      </p>
    </div>
  );
}
