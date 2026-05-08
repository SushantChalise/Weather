import type { ConfidenceLevel } from "@/types/weather";

// Open-Meteo model freshness thresholds (minutes)
const MODEL_FRESH_MAX = 180; // 3h → "forecast"
const MODEL_CAUTION_MAX = 360; // 6h → "low confidence"
// > 6h → "stale"

// Satellite freshness thresholds (minutes) — used in Step 3B+
const SAT_FRESH_MAX = 30; // < 30 min → "observed"
const SAT_CAUTION_MAX = 45; // 30-45 min → "low confidence"
// > 45 min → "stale"

export function modelConfidence(fetchedAtIso: string): ConfidenceLevel {
  const ageMin = (Date.now() - new Date(fetchedAtIso).getTime()) / 60000;
  if (ageMin < MODEL_FRESH_MAX) return "forecast";
  if (ageMin < MODEL_CAUTION_MAX) return "low";
  return "stale";
}

export function satelliteConfidence(frameTimestampIso: string): ConfidenceLevel {
  const ageMin = (Date.now() - new Date(frameTimestampIso).getTime()) / 60000;
  if (ageMin < SAT_FRESH_MAX) return "observed";
  if (ageMin < SAT_CAUTION_MAX) return "low";
  return "stale";
}

// Worst-label rule: card shows the lowest confidence among contributing signals
export function worstConfidence(labels: ConfidenceLevel[]): ConfidenceLevel {
  const RANK: Record<ConfidenceLevel, number> = {
    observed: 0,
    forecast: 1,
    estimated: 2,
    low: 3,
    stale: 4,
  };
  return labels.reduce((worst, cur) => (RANK[cur] > RANK[worst] ? cur : worst));
}

export function modelAgeMinutes(fetchedAtIso: string): number {
  return Math.floor((Date.now() - new Date(fetchedAtIso).getTime()) / 60000);
}
