import type { PlaceClass } from "@/db/schema";

export type PlaceRegistryEntry = {
  name: string;
  class: PlaceClass;
  lat: number;
  lon: number;
  alt: number;
  country: string;
  region?: string;
};

export const PLACE_REGISTRY: Record<string, PlaceRegistryEntry> = {
  // Cities
  kathmandu: {
    name: "Kathmandu",
    class: "city",
    lat: 27.7124,
    lon: 85.3113,
    alt: 1400,
    country: "Nepal",
    region: "Bagmati",
  },
  pokhara: {
    name: "Pokhara",
    class: "city",
    lat: 28.2095,
    lon: 83.9595,
    alt: 827,
    country: "Nepal",
    region: "Gandaki",
  },
  // Trek destinations
  ebc: {
    name: "Everest Base Camp",
    class: "trek_destination",
    lat: 28.0072,
    lon: 86.8594,
    alt: 5364,
    country: "Nepal",
    region: "Koshi",
  },
  abc: {
    name: "Annapurna Base Camp",
    class: "trek_destination",
    lat: 28.5319,
    lon: 83.8786,
    alt: 4130,
    country: "Nepal",
    region: "Gandaki",
  },
  "poon-hill": {
    name: "Poon Hill",
    class: "trek_destination",
    lat: 28.3994,
    lon: 83.6908,
    alt: 3210,
    country: "Nepal",
    region: "Gandaki",
  },
  langtang: {
    name: "Langtang Village",
    class: "trek_destination",
    lat: 28.2128,
    lon: 85.515,
    alt: 3430,
    country: "Nepal",
    region: "Bagmati",
  },
  jomsom: {
    name: "Jomsom",
    class: "trek_destination",
    lat: 28.7833,
    lon: 83.7333,
    alt: 2720,
    country: "Nepal",
    region: "Gandaki",
  },
  chitwan: {
    name: "Chitwan National Park",
    class: "trek_destination",
    lat: 27.5372,
    lon: 84.4479,
    alt: 150,
    country: "Nepal",
    region: "Bagmati",
  },
  // Trail entry points
  lukla: {
    name: "Lukla",
    class: "trek_destination",
    lat: 27.6868,
    lon: 86.7294,
    alt: 2860,
    country: "Nepal",
    region: "Koshi",
  },
  namche: {
    name: "Namche Bazaar",
    class: "trek_destination",
    lat: 27.8069,
    lon: 86.714,
    alt: 3440,
    country: "Nepal",
    region: "Koshi",
  },
  // Glaciers
  "khumbu-glacier": {
    name: "Khumbu Glacier",
    class: "glacier",
    lat: 27.9667,
    lon: 86.8333,
    alt: 4900,
    country: "Nepal",
    region: "Koshi",
  },
  "rikha-samba": {
    name: "Rikha Samba Glacier",
    class: "glacier",
    lat: 28.8167,
    lon: 83.5,
    alt: 5400,
    country: "Nepal",
    region: "Gandaki",
  },
  yala: {
    name: "Yala Glacier",
    class: "glacier",
    lat: 28.2333,
    lon: 85.6167,
    alt: 5200,
    country: "Nepal",
    region: "Bagmati",
  },
  gangotri: {
    name: "Gangotri Glacier",
    class: "glacier",
    lat: 30.9333,
    lon: 79.0667,
    alt: 4000,
    country: "India",
    region: "Uttarakhand",
  },
};
