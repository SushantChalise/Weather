import { nowNPTIso } from "@/lib/npt/format-npt";
import type { ReplaySummary } from "@/types/weather";

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// MODIS Terra TrueColor tile from NASA GIBS (zoom 8, Nepal region)
// Tile coords computed via Web Mercator: x = lon→tile, y = lat→tile
function gibsTile(date: string, tileX: number, tileY: number): string {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/8/${tileY}/${tileX}.jpg`;
}

// Tile centres (zoom 8, 256 tiles per axis):
// ABC / Annapurna (~83.9°E, 28.5°N) → x=187, y=106
// EBC / Khumbu   (~86.9°E, 28.0°N) → x=189, y=107
// Pokhara        (~83.9°E, 28.2°N) → x=187, y=107

export const MOCK_REPLAY_SUMMARIES: ReplaySummary[] = [
  {
    scopeId: "abc",
    windowStart: nowNPTIso(),
    windowEnd: nowNPTIso(),
    cloudBuildupPattern: "Clouds built after 11 AM on all 3 days",
    bestVisibilityWindow: "Yesterday 6:20–8:10 AM NPT",
    rainEvents: [
      { segment: "Chhomrong–Bamboo", intensity: "heavy", count: 2 },
      { segment: "Bamboo–Deurali", intensity: "moderate", count: 1 },
    ],
    trendForecast: "improving",
    trendReasoning: "Pressure rising; tomorrow morning looks clearer",
    evidenceSnapshots: [
      {
        timestamp: nowNPTIso(),
        thumbUrl: gibsTile(daysAgo(3), 187, 106),
        label: "Yesterday 6:30 AM",
        quality: "best",
      },
      {
        timestamp: nowNPTIso(),
        thumbUrl: gibsTile(daysAgo(1), 187, 106),
        label: "Yesterday 1:20 PM",
        quality: "worst",
      },
      {
        timestamp: nowNPTIso(),
        thumbUrl: gibsTile(daysAgo(1), 187, 106),
        label: "Today 8:10 AM",
        quality: "current",
      },
    ],
  },
  {
    scopeId: "ebc",
    windowStart: nowNPTIso(),
    windowEnd: nowNPTIso(),
    cloudBuildupPattern: "Morning clear, afternoon cloud above Namche on 2 of 3 days",
    bestVisibilityWindow: "Yesterday 5:30–8:00 AM NPT",
    rainEvents: [{ intensity: "light", count: 1 }],
    trendForecast: "stable",
    trendReasoning: "Jet stream stable; same pattern expected tomorrow",
    evidenceSnapshots: [
      {
        timestamp: nowNPTIso(),
        thumbUrl: gibsTile(daysAgo(3), 189, 107),
        label: "Yesterday 5:30 AM",
        quality: "best",
      },
      {
        timestamp: nowNPTIso(),
        thumbUrl: gibsTile(daysAgo(1), 189, 107),
        label: "Yesterday 2:00 PM",
        quality: "worst",
      },
      {
        timestamp: nowNPTIso(),
        thumbUrl: gibsTile(daysAgo(1), 189, 107),
        label: "Today 7:45 AM",
        quality: "current",
      },
    ],
  },
  {
    scopeId: "pokhara",
    windowStart: nowNPTIso(),
    windowEnd: nowNPTIso(),
    cloudBuildupPattern: "Heavy cloud all 3 days, Annapurna fully obscured",
    bestVisibilityWindow: "3 days ago 6:10–8:00 AM NPT",
    rainEvents: [{ intensity: "heavy", count: 3 }],
    trendForecast: "worsening",
    trendReasoning: "Active monsoon moisture; no clear break in 48h",
    evidenceSnapshots: [
      {
        timestamp: nowNPTIso(),
        thumbUrl: gibsTile(daysAgo(3), 187, 107),
        label: "3 days ago 6:10 AM",
        quality: "best",
      },
      {
        timestamp: nowNPTIso(),
        thumbUrl: gibsTile(daysAgo(1), 187, 107),
        label: "Yesterday 3:00 PM",
        quality: "worst",
      },
      {
        timestamp: nowNPTIso(),
        thumbUrl: gibsTile(daysAgo(1), 187, 107),
        label: "Today 9:00 AM",
        quality: "current",
      },
    ],
  },
];
