import { NextResponse } from "next/server";

export const revalidate = 86400; // 24 hours

type ParamSpec = {
  name: string;
  type: string;
  default?: string;
  description: string;
};

type EndpointSpec = {
  path: string;
  method: "GET";
  description: string;
  params: ParamSpec[];
};

const ENDPOINTS: EndpointSpec[] = [
  {
    path: "/api/weather",
    method: "GET",
    description:
      "Current weather conditions for all known destinations via Open-Meteo. Returns an array of conditions with evidence metadata.",
    params: [],
  },
  {
    path: "/api/anomaly",
    method: "GET",
    description:
      "Temperature anomaly vs 1991–2020 climate normal (EC_Earth3P_HR model) for a given lat/lon. Returns delta, normal, current, and month name.",
    params: [
      { name: "lat", type: "number", description: "Latitude" },
      { name: "lon", type: "number", description: "Longitude" },
    ],
  },
  {
    path: "/api/fires",
    method: "GET",
    description:
      "Recent active fire detections from NASA FIRMS (MODIS NRT) for a bounding box. Requires FIRMS_MAP_KEY env var.",
    params: [
      { name: "west", type: "number", default: "78", description: "Bbox west (deg lon)" },
      { name: "south", type: "number", default: "23", description: "Bbox south (deg lat)" },
      { name: "east", type: "number", default: "92", description: "Bbox east (deg lon)" },
      { name: "north", type: "number", default: "33", description: "Bbox north (deg lat)" },
      { name: "days", type: "number", default: "1", description: "Days back to query (1–10)" },
    ],
  },
  {
    path: "/api/earthquakes",
    method: "GET",
    description:
      "Recent earthquakes from the USGS FDSN catalog for a bounding box. Filtered by minimum magnitude.",
    params: [
      { name: "days", type: "number", default: "7", description: "Days back to query (1–30)" },
      {
        name: "min_mag",
        type: "number",
        default: "4",
        description: "Minimum magnitude (0–10)",
      },
      { name: "west", type: "number", default: "78", description: "Bbox west (deg lon)" },
      { name: "south", type: "number", default: "23", description: "Bbox south (deg lat)" },
      { name: "east", type: "number", default: "92", description: "Bbox east (deg lon)" },
      { name: "north", type: "number", default: "33", description: "Bbox north (deg lat)" },
    ],
  },
  {
    path: "/api/himawari",
    method: "GET",
    description:
      "Satellite cloud tile manifest. Returns Himawari-9 B13 manifest from Vercel Blob when available, or falls back to MODIS Terra true-colour tiles from NASA GIBS.",
    params: [],
  },
  {
    path: "/api/satellite",
    method: "GET",
    description:
      "MODIS Terra satellite snapshot manifest with per-scope cloud cover percentages. Scopes: annapurna, khumbu, kathmandu_valley, chitwan, full.",
    params: [],
  },
  {
    path: "/api/snowline",
    method: "GET",
    description:
      "Regional snowline elevations (m) derived from Open-Meteo freezing-level heights for all known regions.",
    params: [],
  },
  {
    path: "/api/decision-strip",
    method: "GET",
    description:
      "Decision strip ranking all destinations by current go/no-go status. Returns ranked list with evidence metadata.",
    params: [],
  },
  {
    path: "/api/comparison",
    method: "GET",
    description:
      "Side-by-side weather comparison across all destinations. Returns comparison matrix with evidence metadata.",
    params: [],
  },
  {
    path: "/api/corridor-cards",
    method: "GET",
    description:
      "Per-corridor summary cards for abc, ebc, and pokhara. Returns an array of cards with evidence metadata.",
    params: [],
  },
  {
    path: "/api/brief/[corridor]",
    method: "GET",
    description:
      "Detailed guide brief for a trekking corridor, including per-segment weather and snowline. corridor must be 'abc' or 'ebc'.",
    params: [
      {
        name: "corridor",
        type: "string",
        description: "Corridor slug: 'abc' (Annapurna Base Camp) or 'ebc' (Everest Base Camp)",
      },
    ],
  },
  {
    path: "/api/clear-window/[id]",
    method: "GET",
    description:
      "Next clear-sky window forecast for a destination. id must be a known destination slug (ebc, abc, lukla, etc.).",
    params: [
      {
        name: "id",
        type: "string",
        description: "Destination slug (e.g. ebc, abc, lukla, pokhara)",
      },
    ],
  },
  {
    path: "/api/visibility/[viewpointId]",
    method: "GET",
    description:
      "Visibility forecast for a specific viewpoint and its target peaks. viewpointId must be a known viewpoint slug.",
    params: [
      {
        name: "viewpointId",
        type: "string",
        description: "Viewpoint slug (e.g. poon-hill, nagarkot, sarangkot)",
      },
    ],
  },
  {
    path: "/api/yesterday/[id]",
    method: "GET",
    description:
      "Yesterday's actual weather summary for a destination — peak condition, precipitation, wind, temps, and clear AM hours.",
    params: [
      {
        name: "id",
        type: "string",
        description: "Destination slug (e.g. ebc, abc, lukla, pokhara)",
      },
    ],
  },
  {
    path: "/api/replay/[scopeId]",
    method: "GET",
    description:
      "72-hour replay summary for a scope — cloud buildup patterns, best visibility window, rain events, and trend forecast. Includes MODIS Terra evidence thumbnails.",
    params: [
      {
        name: "scopeId",
        type: "string",
        description:
          "Scope slug: abc, ebc, pokhara, kathmandu, chitwan, jomsom, langtang, poon-hill",
      },
    ],
  },
  {
    path: "/api/lukla-window",
    method: "GET",
    description:
      "Lukla airport flight window assessment — current status (open/marginal/closed), reason, and morning hourly breakdown (06:00–12:00 NPT).",
    params: [],
  },
];

export async function GET() {
  return NextResponse.json({
    endpoints: ENDPOINTS,
    fetched_at: new Date().toISOString(),
  });
}
