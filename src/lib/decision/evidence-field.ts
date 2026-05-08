import type { ApiEvidenceField, ApiEvidenceSource, EvidenceTier } from "@/types/weather";

const TIER_RANK: Record<EvidenceTier, number> = {
  "observed-satellite": 0,
  "official-warning": 1,
  "forecast-model": 2,
  "estimated-derived": 3,
  "field-reported": 4,
  "no-field-report": 5,
};

function worstTier(sources: ApiEvidenceSource[]): EvidenceTier {
  return sources.reduce<EvidenceTier>(
    (worst, s) => (TIER_RANK[s.tier] > TIER_RANK[worst] ? s.tier : worst),
    "observed-satellite",
  );
}

export function makeEvidenceField(sources: ApiEvidenceSource[]): ApiEvidenceField {
  const overallTier = worstTier(sources);
  const isStale = sources.some((s) => s.ageMinutes > 360); // >6h = stale
  return { sources, overallTier, isStale };
}

export function forecastSource(fetchedAt: string): ApiEvidenceSource {
  const ageMinutes = Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60000);
  return {
    name: "Open-Meteo (ECMWF/GFS/ICON)",
    tier: "forecast-model",
    fetchedAt,
    ageMinutes,
  };
}
