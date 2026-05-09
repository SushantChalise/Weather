import { NextResponse } from "next/server";

type ParamDoc = {
  name: string;
  default: string;
  description: string;
};

type EndpointDoc = {
  path: string;
  params: ParamDoc[];
  description: string;
};

const ENDPOINTS: EndpointDoc[] = [
  {
    path: "/api/weather",
    params: [],
    description:
      "Live weather conditions for all trek destinations, fetched from Open-Meteo. Includes temperature, cloud cover, condition icon, and halo colour. Cached 1 hour.",
  },
  {
    path: "/api/anomaly",
    params: [
      { name: "lat", default: "(required)", description: "Latitude of the point of interest." },
      { name: "lon", default: "(required)", description: "Longitude of the point of interest." },
    ],
    description:
      "Temperature anomaly vs the 30-year baseline (1991–2020) for a given lat/lon, derived from Open-Meteo historical climate and live forecast APIs.",
  },
  {
    path: "/api/corridor-cards",
    params: [],
    description:
      "Weather summary cards for the EBC and ABC trekking corridors: current cloud %, tomorrow AM cloud %, condition label. Cached 1 hour.",
  },
  {
    path: "/api/comparison",
    params: [],
    description:
      "Side-by-side weather comparison data for all corridors, used by the corridor comparison view.",
  },
  {
    path: "/api/decision-strip",
    params: [],
    description:
      "Condensed go/no-go decision strip for the EBC and ABC corridors based on cloud cover, precipitation probability, and wind.",
  },
  {
    path: "/api/himawari",
    params: [],
    description:
      "Himawari-9 Band 13 (thermal IR) tile manifest from Vercel Blob. Returns tileBaseUrl, tileTemplate, maxZoom, and capturedAt timestamp.",
  },
  {
    path: "/api/satellite",
    params: [],
    description:
      "Active satellite imagery manifest listing available epochs and scopes (Nepal-wide, EBC, ABC). Served from Vercel Blob.",
  },
  {
    path: "/api/snowline",
    params: [],
    description:
      "Estimated current snow-line elevation for each HKH region, derived from Open-Meteo temperature lapse-rate calculation.",
  },
  {
    path: "/api/lukla-window",
    params: [],
    description:
      "Lukla airport flight-window forecast: per-hour visibility status and go/hold/no-go for the next 48 hours.",
  },
  {
    path: "/api/earthquakes",
    params: [
      { name: "days", default: "7", description: "Lookback window in days (1–30)." },
      { name: "min_mag", default: "4", description: "Minimum Richter magnitude (0–10)." },
      { name: "west", default: "60.0", description: "Bounding box west longitude." },
      { name: "south", default: "22.0", description: "Bounding box south latitude." },
      { name: "east", default: "100.0", description: "Bounding box east longitude." },
      { name: "north", default: "45.0", description: "Bounding box north latitude." },
    ],
    description:
      "Recent earthquakes in the Hindu Kush–Himalaya region from the USGS Earthquake Hazards Program API.",
  },
  {
    path: "/api/fires",
    params: [
      { name: "days", default: "1", description: "Lookback window in days (1–10)." },
      { name: "west", default: "60.0", description: "Bounding box west longitude." },
      { name: "south", default: "22.0", description: "Bounding box south latitude." },
      { name: "east", default: "100.0", description: "Bounding box east longitude." },
      { name: "north", default: "45.0", description: "Bounding box north latitude." },
    ],
    description:
      "Active fire detections in the HKH region from NASA FIRMS (MODIS + VIIRS), near-real-time.",
  },
  {
    path: "/api/brief/[corridor]",
    params: [
      {
        name: "corridor",
        default: "(path segment)",
        description: "Corridor identifier, e.g. ebc or abc.",
      },
    ],
    description:
      "Narrative weather brief for a trekking corridor, generated from Open-Meteo forecast data.",
  },
  {
    path: "/api/clear-window/[id]",
    params: [
      {
        name: "id",
        default: "(path segment)",
        description: "Destination slug, e.g. ebc or abc.",
      },
    ],
    description:
      "Best clear-sky windows in the next 5 days for a given destination, ranked by cloud cover.",
  },
  {
    path: "/api/replay/[scopeId]",
    params: [
      {
        name: "scopeId",
        default: "(path segment)",
        description: "Scope identifier for the replay archive (e.g. nepal-wide).",
      },
    ],
    description:
      "Historical Himawari satellite imagery epochs for a given geographic scope, served from Vercel Blob.",
  },
  {
    path: "/api/visibility/[viewpointId]",
    params: [
      {
        name: "viewpointId",
        default: "(path segment)",
        description: "Viewpoint slug, e.g. poon-hill.",
      },
    ],
    description:
      "Peak visibility forecast for a named viewpoint, combining cloud cover and precipitation probability.",
  },
  {
    path: "/api/yesterday/[id]",
    params: [
      {
        name: "id",
        default: "(path segment)",
        description: "Destination slug, e.g. ebc.",
      },
    ],
    description:
      "Yesterday's observed conditions for a destination, from Open-Meteo historical API.",
  },
];

export const revalidate = 3600;

export function GET() {
  return NextResponse.json({ endpoints: ENDPOINTS });
}
