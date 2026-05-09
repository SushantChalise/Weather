"use client";

import { useHimawari } from "@/hooks/use-himawari";

export function StaleSatelliteBanner() {
  const { manifest, isStale, source } = useHimawari();

  if (!isStale || !manifest) return null;

  const ageMinutes = manifest.ageMinutes;
  const satelliteName = source === "himawari-9" ? "Himawari-9" : "MODIS Terra";
  const updateNote =
    source === "himawari-9"
      ? "Updating every 30 min."
      : "Daily overpass — next update after 06:30 UTC.";

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs"
    >
      <span aria-hidden="true">⚠</span>
      <span>
        {satelliteName} view is <strong>{ageMinutes} min old</strong> — forecast model used instead.{" "}
        {updateNote}
      </span>
    </div>
  );
}
