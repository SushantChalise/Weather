// Exported here so frontend components can type API responses.

export type FireDetection = {
  lat: number;
  lon: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: string;
  confidence: number;
  bright_t31: number;
  frp: number;
  daynight: "D" | "N";
};

export type FiresResponse = {
  detections: FireDetection[];
  bbox: { west: number; south: number; east: number; north: number };
  days: number;
  fetched_at: string;
};
