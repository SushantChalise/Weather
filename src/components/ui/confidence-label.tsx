import type { ConfidenceLevel, EvidenceTier } from "@/types/weather";

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  observed: "bg-green-50 text-green-700 border-green-200",
  forecast: "bg-blue-50 text-blue-700 border-blue-200",
  estimated: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-gray-50 text-gray-500 border-gray-200",
  stale: "bg-red-50 text-red-600 border-red-200",
};

const CONFIDENCE_TEXT: Record<ConfidenceLevel, string> = {
  observed: "Observed",
  forecast: "Forecast",
  estimated: "Estimated",
  low: "Low confidence",
  stale: "Stale",
};

const EVIDENCE_TEXT: Record<EvidenceTier, string> = {
  "observed-satellite": "Satellite",
  "official-warning": "Official warning",
  "forecast-model": "Forecast model",
  "estimated-derived": "Derived",
  "field-reported": "Field report",
  "no-field-report": "No field report",
};

type Props = {
  confidence: ConfidenceLevel;
  evidenceTier: EvidenceTier;
  compact?: boolean;
};

export function ConfidenceLabel({ confidence, evidenceTier, compact = false }: Props) {
  if (compact) {
    return (
      <span
        className={[
          "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border",
          CONFIDENCE_STYLES[confidence],
        ].join(" ")}
      >
        {CONFIDENCE_TEXT[confidence]}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className={[
          "inline-flex items-center text-xs px-1.5 py-0.5 rounded border",
          CONFIDENCE_STYLES[confidence],
        ].join(" ")}
      >
        {CONFIDENCE_TEXT[confidence]}
      </span>
      <span className="text-xs text-[var(--color-text-muted)]">·</span>
      <span className="text-xs text-[var(--color-text-muted)]">{EVIDENCE_TEXT[evidenceTier]}</span>
    </div>
  );
}
