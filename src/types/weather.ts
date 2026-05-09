export type DestinationId =
  | "pokhara"
  | "abc"
  | "poon-hill"
  | "ebc"
  | "chitwan"
  | "kathmandu"
  | "langtang"
  | "jomsom";

export type TrailEntryId = "nayapul" | "lukla";

export type CorridorId = "abc" | "ebc";

export type TripIntent = "mountain_views" | "trekking" | "lowland";

export type CameraMode = "topdown" | "tilt";

export type TimeMode = "now" | "tomorrow_am" | "afternoon" | "last_24h";

export type LayerId = "clouds" | "rain" | "snow" | "current" | "temperature";

export type SeverityLevel = "best" | "good" | "watch" | "poor" | "avoid";

export type ConfidenceLevel = "observed" | "forecast" | "estimated" | "low" | "stale";

export type EvidenceTier =
  | "observed-satellite"
  | "official-warning"
  | "forecast-model"
  | "estimated-derived"
  | "field-reported"
  | "no-field-report";

export type TrendDirection = "improving" | "stable" | "worsening";

export type Destination = {
  id: DestinationId;
  name: string;
  shortLabel: string;
  lat: number;
  lon: number;
  altitude: number;
  corridor: CorridorId | null;
  tripIntent: TripIntent;
  preDawnValue: boolean;
  defaultViewpointId: string | null;
};

export type TrailEntry = {
  id: TrailEntryId;
  name: string;
  shortLabel: string;
  lat: number;
  lon: number;
  altitude: number;
  corridor: CorridorId;
};

export type Peak = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
};

export type RouteWaypoint = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
};

export type ViewpointId =
  | "sarangkot"
  | "poon-hill"
  | "chhomrong"
  | "abc-viewpoint"
  | "namche"
  | "tengboche"
  | "lobuche"
  | "kala-patthar";

export type Viewpoint = {
  id: ViewpointId;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
  corridor: CorridorId;
  targetPeaks: string[];
  preDawnValue: boolean;
};

export type SnowlineRegion = {
  id: string;
  name: string;
  centroidLat: number;
  centroidLon: number;
  typicalSnowlineRange: [number, number];
  corridors: Array<CorridorId>;
};

// Decision intelligence types (used with mock data in Step 1)

export type DecisionStripPill = {
  category: "best_now" | "best_view" | "watch" | "avoid";
  label: string;
  items: Array<{
    destinationId: string;
    name: string;
    reason: string;
  }>;
};

export type DecisionStripData = {
  pills: DecisionStripPill[];
  computedAt: string; // ISO with +05:45
};

export type CorridorCardData = {
  corridorId: CorridorId | "pokhara";
  title: string;
  conditionIcon: string; // Unicode: ☀ ⛅ ☁ 🌧 ❄ ⚠
  conditionLabel: string;
  trend: TrendDirection;
  trendLabel: string;
  clearWindowSummary: string;
  confidence: ConfidenceLevel;
  evidenceTier: EvidenceTier;
  timestamp: string; // ISO with +05:45
  currentCloud: number; // 0–100, current hour cloud cover
  tomorrowAMCloud: number; // 0–100, avg cloud cover tomorrow 5–10 AM NPT
};

// Step 2 types

export type HaloColor = "gold" | "green" | "blue" | "cyan" | "gray" | "red";

export type DestinationCondition = {
  destinationId: DestinationId;
  haloColor: HaloColor;
  conditionIcon: string;
  conditionLabel: string;
  plainSummary: string;
  confidence: ConfidenceLevel;
  evidenceTier: EvidenceTier;
  timestamp: string; // ISO with +05:45
};

export type ClearWindowQuality = "best" | "good" | "watch" | "cloudy" | "poor";

export type ClearWindowHour = {
  hour: string; // ISO with +05:45
  quality: ClearWindowQuality;
  isDaylight: boolean;
  isSunrise: boolean;
  isGoldenHour: boolean;
};

export type ClearWindow = {
  destinationId: DestinationId;
  viewpointId?: string;
  next: { from: string; to: string; quality: "good" | "best" } | null;
  hourlyTimeline: ClearWindowHour[];
  pattern: string;
  bestOfLast7Days: { day: string; window: string } | null;
  confidence: ConfidenceLevel;
  evidenceTier: EvidenceTier;
};

export type EvidenceSnapshot = {
  timestamp: string; // ISO with +05:45
  thumbUrl: string | null; // null = placeholder in Step 2
  label: string;
  quality: "best" | "worst" | "current";
};

export type ReplaySummary = {
  scopeId: string;
  windowStart: string;
  windowEnd: string;
  cloudBuildupPattern: string;
  bestVisibilityWindow: string;
  rainEvents: Array<{ segment?: string; intensity: "light" | "moderate" | "heavy"; count: number }>;
  trendForecast: TrendDirection;
  trendReasoning: string;
  evidenceSnapshots: EvidenceSnapshot[];
};

export type ComparisonRecommendation = "best" | "good" | "watch" | "avoid";

export type ComparisonRow = {
  destinationId: DestinationId;
  name: string;
  now: string;
  tomorrowAM: string;
  recommendation: ComparisonRecommendation;
  viewQuality?: string; // mountain_views only
  trailCondition?: string; // trekking only
  snowConcern?: string; // trekking only
};

export type ComparisonGroup = {
  tripIntent: TripIntent;
  label: string;
  rows: ComparisonRow[];
};

export type ComparisonDrawerData = {
  groups: ComparisonGroup[];
  computedAt: string;
};

// Step 3B — Satellite pipeline types

export type SatelliteScope = "annapurna" | "khumbu" | "kathmandu_valley" | "chitwan" | "full";

export type SatelliteEpoch = {
  capturedAt: string; // ISO — when JMA Himawari-9 captured this frame
  processedAt: string; // ISO — when offline pipeline processed + cloud-masked it
  scope: SatelliteScope;
  cloudCoverPct: number; // 0–100, aggregated from cloud mask pixels
  hash: string; // SHA-256 of input tile content (determinism anchor)
  thumbUrl: string | null; // null until offline pipeline produces WebP thumbnails
};

export type SatelliteManifest = {
  generatedAt: string; // ISO — when manifest.json was last written
  latestCaptureAt: string; // ISO — most recent epoch in archive
  ageMinutes: number; // minutes since latestCaptureAt
  isStale: boolean; // true when ageMinutes > 45
  scopes: Partial<Record<SatelliteScope, SatelliteEpoch>>;
  archive72h: SatelliteEpoch[];
  bestSnapshot: SatelliteEpoch | null; // lowest cloudCoverPct in archive
  worstSnapshot: SatelliteEpoch | null; // highest cloudCoverPct in archive
  source: "himawari-9" | "modis-terra" | "mock";
};

export type ApiEvidenceSource = {
  name: string;
  tier: EvidenceTier;
  fetchedAt: string;
  ageMinutes: number;
};

export type ApiEvidenceField = {
  sources: ApiEvidenceSource[];
  overallTier: EvidenceTier;
  isStale: boolean;
};

// Step 5 — Route intelligence types

export type SegmentCondition = {
  segmentId: string;
  name: string;
  elevationRange: [number, number];
  conditionLabel: string;
  trailSurface: string; // "damp", "slippery", "fresh snow risk", "good conditions"
  cloud: number;
  precip: number;
  wind: number;
  tomorrowAMCloud: number;
  evidenceTier: EvidenceTier;
};

// v1.1 types

export type LuklaFlightStatus = "open" | "marginal" | "closed";

export type LuklaHourWindow = {
  hour: string; // ISO
  status: LuklaFlightStatus;
  cloudLow: number; // 0-100%
  windKmh: number;
  visibilityKm: number;
};

export type LuklaFlightWindow = {
  currentStatus: LuklaFlightStatus;
  statusReason: string;
  morningHours: LuklaHourWindow[]; // 06:00–12:00 NPT
  cloudLow: number;
  windKmh: number;
  visibilityKm: number;
  timestamp: string; // ISO
};

export type YesterdayActual = {
  destinationId: DestinationId;
  date: string; // YYYY-MM-DD
  peakConditionLabel: string;
  peakConditionIcon: string;
  maxPrecipMm: number;
  maxWindKmh: number;
  minTempC: number;
  maxTempC: number;
  clearHoursAM: number; // hours 5–11 AM with cloud < 30%
};

export type SeasonalPattern = {
  month: number; // 1-12
  season: "pre-monsoon" | "monsoon" | "post-monsoon" | "winter";
  seasonLabel: string;
  morningClearChancePct: number;
  afternoonRainChancePct: number;
  typicalClearHour: string; // e.g. "before 10 AM"
  flightRiskNote: string;
};

export type GuideBrief = {
  corridorId: CorridorId;
  generatedAt: string; // ISO NPT
  overallCondition: string;
  segmentConditions: SegmentCondition[];
  snowlineMeters: number | null;
  snowlineCrossingWaypoint: string | null;
  clearWindow: { from: string; to: string; quality: "good" | "best" } | null;
  confidence: ConfidenceLevel;
  evidenceTier: EvidenceTier;
  plaintext: string; // copy-ready brief text
};
