import { REGIONS } from "@/data/regions";
import type { OpenMeteoResponse } from "@/lib/open-meteo";
import { currentHourIndex } from "@/lib/open-meteo";

export type RegionalSnowlineResult = {
  regionId: string;
  name: string;
  altitudeMeters: number;
  validFrom: string;
  validTo: string;
  source: "openmeteo_geopotential" | "estimated";
};

export function computeRegionalSnowlines(
  weatherByRegion: Map<string, OpenMeteoResponse>,
): RegionalSnowlineResult[] {
  return REGIONS.map((region) => {
    const data = weatherByRegion.get(region.id);
    if (!data) {
      // Fallback: midpoint of typical seasonal range
      const mid = Math.round((region.typicalSnowlineRange[0] + region.typicalSnowlineRange[1]) / 2);
      return {
        regionId: region.id,
        name: region.name,
        altitudeMeters: mid,
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 6 * 3600000).toISOString(),
        source: "estimated",
      };
    }

    const { hourly, fetchedAt } = data;
    const idx = currentHourIndex(hourly.time);

    // freezing_level_height is in meters; this is the 0°C isotherm altitude
    const freezingLevel = hourly.freezing_level_height[idx] ?? null;

    const snowline =
      freezingLevel !== null
        ? Math.round(Math.max(freezingLevel, region.typicalSnowlineRange[0]))
        : Math.round((region.typicalSnowlineRange[0] + region.typicalSnowlineRange[1]) / 2);

    return {
      regionId: region.id,
      name: region.name,
      altitudeMeters: snowline,
      validFrom: fetchedAt,
      validTo: new Date(new Date(fetchedAt).getTime() + 3600000).toISOString(),
      source: freezingLevel !== null ? "openmeteo_geopotential" : "estimated",
    };
  });
}

// Which segment does the corridor cross the snowline?
export function snowlineCrossingWaypoint(
  waypoints: Array<{ id: string; altitude: number }>,
  snowlineMeters: number,
): string | null {
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (!a || !b) continue;
    if (a.altitude < snowlineMeters && b.altitude >= snowlineMeters) {
      return b.id;
    }
  }
  return null;
}
