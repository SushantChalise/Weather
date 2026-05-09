export type HistoricalEvent = {
  slug: string;
  name: string;
  eventClass: "avalanche" | "flood" | "drought" | "earthquake" | "fire" | "cyclone" | "other";
  timeStart: string;
  timeEnd?: string;
  affectedPlaces: string[];
  summary: string;
  evidence?: Record<string, unknown>;
};

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    slug: "annapurna-blizzard-2014",
    name: "2014 Annapurna Blizzard",
    eventClass: "avalanche",
    timeStart: "2014-10-14T00:00:00Z",
    timeEnd: "2014-10-16T00:00:00Z",
    affectedPlaces: ["abc", "poon-hill", "jomsom"],
    summary:
      "A sudden blizzard hit the Annapurna Circuit in mid-October 2014, killing at least 39 trekkers and guides — one of Nepal's deadliest trekking accidents.",
    evidence: { deaths: 39, source: "Nepal Red Cross" },
  },
  {
    slug: "gorkha-earthquake-weather-2015",
    name: "Post-Gorkha Earthquake — Monsoon Season 2015",
    eventClass: "earthquake",
    timeStart: "2015-04-25T00:00:00Z",
    timeEnd: "2015-09-30T00:00:00Z",
    affectedPlaces: ["kathmandu", "langtang"],
    summary:
      "The April 25, 2015 Gorkha earthquake (Mw 7.8) triggered thousands of landslides. The 2015 monsoon season exacerbated damage to already-destabilised hillsides.",
    evidence: { magnitude: 7.8, source: "USGS" },
  },
  {
    slug: "melamchi-flood-2021",
    name: "2021 Melamchi Flood",
    eventClass: "flood",
    timeStart: "2021-06-15T00:00:00Z",
    timeEnd: "2021-06-16T00:00:00Z",
    affectedPlaces: ["kathmandu"],
    summary:
      "A glacial lake outburst flood (GLOF) in the Melamchi River Valley on 15 June 2021 destroyed the Melamchi Water Supply Project intake and swept away homes.",
    evidence: { glof: true, source: "ICIMOD" },
  },
];
