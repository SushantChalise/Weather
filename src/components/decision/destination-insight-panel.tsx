"use client";

import useSWR from "swr";
import { VisibilityCard } from "@/components/decision/visibility-card";
import { ApiErrorBoundary } from "@/components/scene/api-error-boundary";
import { CopyBriefButton } from "@/components/ui/copy-brief-button";
import { ShareButton } from "@/components/ui/share-button";
import { VIEWPOINTS } from "@/data/viewpoints";
import { useSelectionStore } from "@/state/selectionStore";
import type { CorridorId, GuideBrief, SegmentCondition, ViewpointId } from "@/types/weather";

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ brief: GuideBrief }>);

const QUALITY_COLOR: Record<string, string> = {
  good: "text-green-700",
  slippery: "text-red-600",
  damp: "text-amber-700",
  blowing: "text-blue-700",
  reduced: "text-gray-600",
};

function trailSurfaceColor(surface: string): string {
  for (const [key, cls] of Object.entries(QUALITY_COLOR)) {
    if (surface.toLowerCase().includes(key)) return cls;
  }
  return "text-green-700";
}

function SegmentRow({ seg }: { seg: SegmentCondition }) {
  return (
    <div className="py-2 border-b border-[var(--color-border)] last:border-0">
      <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-0.5">{seg.name}</p>
      <p className="text-xs text-[var(--color-text-muted)]">
        {seg.conditionLabel} ·{" "}
        <span className={trailSurfaceColor(seg.trailSurface)}>{seg.trailSurface}</span>
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">
        Tomorrow AM: {seg.tomorrowAMCloud.toFixed(0)}% cloud
      </p>
    </div>
  );
}

function BriefContent({ corridorId }: { corridorId: CorridorId }) {
  const { data, isLoading } = useSWR(`/api/brief/${corridorId}`, fetcher, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4">Loading route conditions…</p>;
  }
  if (!data?.brief) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4">Unable to load brief.</p>;
  }

  const { brief } = data;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-[var(--color-text-primary)]">
        {brief.overallCondition}
      </p>

      <div className="flex flex-col mt-1">
        {brief.segmentConditions.map((seg) => (
          <SegmentRow key={seg.segmentId} seg={seg} />
        ))}
      </div>

      {brief.snowlineCrossingWaypoint && (
        <p className="text-xs text-cyan-700 mt-1">
          ❄ Snowline crosses at {brief.snowlineCrossingWaypoint} (~
          {brief.snowlineMeters?.toFixed(0)}m)
        </p>
      )}
      {!brief.snowlineCrossingWaypoint && brief.snowlineMeters !== null && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Snowline at {brief.snowlineMeters.toFixed(0)}m — below route
        </p>
      )}

      {brief.clearWindow ? (
        <p className="text-xs text-amber-700 mt-1">Best window: Tomorrow 06:00–09:30 AM NPT</p>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">No clear window in next 24h</p>
      )}

      <p className="text-xs text-[var(--color-text-muted)] mt-1 border-t border-[var(--color-border)] pt-2">
        Source: {brief.evidenceTier} · {brief.confidence}
      </p>

      <div className="flex gap-2 mt-2">
        <CopyBriefButton
          corridorId={corridorId}
          className="flex-1 text-xs py-2 rounded bg-[var(--color-accent)] text-white font-medium hover:opacity-90"
        />
        <ShareButton className="flex-1 text-xs py-2 rounded border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)]" />
      </div>
    </div>
  );
}

// Pick the hero viewpoint for this corridor
function corridorViewpoint(corridorId: CorridorId): { id: ViewpointId; name: string } | null {
  const map: Record<CorridorId, ViewpointId> = {
    abc: "abc-viewpoint",
    ebc: "kala-patthar",
  };
  const id = map[corridorId];
  const vp = VIEWPOINTS.find((v) => v.id === id);
  return vp ? { id: vp.id, name: vp.name } : null;
}

export function DestinationInsightPanel() {
  const { insightPanelOpen, selectedCorridor, set } = useSelectionStore();

  if (!insightPanelOpen || !selectedCorridor) return null;

  const corridorLabel = selectedCorridor === "abc" ? "ABC Corridor" : "Everest Corridor";
  const vp = corridorViewpoint(selectedCorridor);

  return (
    <div
      className="absolute top-0 right-0 h-full w-full sm:w-72 bg-[var(--color-surface)] border-l border-[var(--color-border)] z-30 flex flex-col shadow-xl overflow-y-auto"
      role="dialog"
      aria-label={`${corridorLabel} route insight`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {corridorLabel} — Route Detail
        </h2>
        <button
          type="button"
          onClick={() => set({ insightPanelOpen: false })}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none p-1"
          aria-label="Close route detail"
        >
          ×
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex flex-col gap-4">
        <ApiErrorBoundary>
          <BriefContent corridorId={selectedCorridor} />
        </ApiErrorBoundary>
        {vp && (
          <ApiErrorBoundary>
            <VisibilityCard viewpointId={vp.id} viewpointName={vp.name} />
          </ApiErrorBoundary>
        )}
      </div>
    </div>
  );
}
