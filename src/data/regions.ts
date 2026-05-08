import type { SnowlineRegion } from "@/types/weather";

export const REGIONS: SnowlineRegion[] = [
  {
    id: "annapurna_south",
    name: "Annapurna South",
    centroidLat: 28.53,
    centroidLon: 83.84,
    typicalSnowlineRange: [4200, 5500],
    corridors: ["abc"],
  },
  {
    id: "everest_khumbu",
    name: "Everest / Khumbu",
    centroidLat: 27.99,
    centroidLon: 86.86,
    typicalSnowlineRange: [5000, 5600],
    corridors: ["ebc"],
  },
  {
    id: "langtang",
    name: "Langtang",
    centroidLat: 28.25,
    centroidLon: 85.55,
    typicalSnowlineRange: [4800, 5400],
    corridors: [],
  },
  {
    id: "manaslu",
    name: "Manaslu",
    centroidLat: 28.5494,
    centroidLon: 84.5619,
    typicalSnowlineRange: [5000, 5500],
    corridors: [],
  },
  {
    id: "dolpo_mustang",
    name: "Dolpo / Mustang",
    centroidLat: 28.95,
    centroidLon: 83.5,
    typicalSnowlineRange: [5200, 5800],
    corridors: [],
  },
];
