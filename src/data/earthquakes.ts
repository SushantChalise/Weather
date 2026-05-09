// Exported here so frontend components can type API responses.

export type Earthquake = {
  id: string;
  mag: number;
  place: string;
  time: number; // ms epoch
  depth_km: number;
  lat: number;
  lon: number;
  url: string;
  tsunami: boolean;
};

export type EarthquakesResponse = {
  events: Earthquake[];
  bbox: { west: number; south: number; east: number; north: number };
  days: number;
  min_mag: number;
  fetched_at: string;
};
