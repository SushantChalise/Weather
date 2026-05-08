"use client";

import { useSatellite } from "@/hooks/use-satellite";

export function StaleSatelliteBanner() {
  const { isStale, ageMinutes } = useSatellite();

  if (!isStale) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs"
    >
      <span aria-hidden="true">⚠</span>
      <span>
        Satellite view is <strong>{ageMinutes} min old</strong> — forecast model used instead.
        Updating every 30 min.
      </span>
    </div>
  );
}
