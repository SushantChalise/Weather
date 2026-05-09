"use client";

import useSWR from "swr";
import { LuklaFlightCard } from "@/components/decision/lukla-flight-card";
import { VisibilityCard } from "@/components/decision/visibility-card";
import { YesterdayCard } from "@/components/decision/yesterday-card";
import { ApiErrorBoundary } from "@/components/scene/api-error-boundary";
import { CopyBriefButton } from "@/components/ui/copy-brief-button";
import { ShareButton } from "@/components/ui/share-button";
import { DESTINATIONS } from "@/data/destinations";
import { VIEWPOINTS } from "@/data/viewpoints";
import { useSelectionStore } from "@/state/selectionStore";
import { useWorldStore } from "@/state/worldStore";
import type {
  CorridorId,
  DestinationId,
  GuideBrief,
  ReplaySummary,
  SegmentCondition,
  ViewpointId,
} from "@/types/weather";

// ─── shared fetcher ────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── corridor panel helpers ────────────────────────────────────────────────

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

function SegmentRow({ seg, showTomorrow }: { seg: SegmentCondition; showTomorrow: boolean }) {
  return (
    <div className="py-2 border-b border-[var(--color-border)] last:border-0">
      <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-0.5">{seg.name}</p>
      {showTomorrow ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          Tomorrow AM: {seg.tomorrowAMCloud.toFixed(0)}% cloud
        </p>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          {seg.conditionLabel} ·{" "}
          <span className={trailSurfaceColor(seg.trailSurface)}>{seg.trailSurface}</span>
        </p>
      )}
    </div>
  );
}

function BriefContent({ corridorId }: { corridorId: CorridorId }) {
  const timeMode = useWorldStore((s) => s.timeMode);
  const showTomorrow = timeMode === "tomorrow_am" || timeMode === "afternoon";

  const { data, isLoading } = useSWR<{ brief: GuideBrief }>(`/api/brief/${corridorId}`, fetcher, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
  });

  if (isLoading) return <p className="text-xs text-[var(--color-text-muted)] py-4">Loading…</p>;
  if (!data?.brief)
    return <p className="text-xs text-[var(--color-text-muted)] py-4">Unable to load brief.</p>;

  const { brief } = data;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-[var(--color-text-primary)]">
        {showTomorrow ? "Tomorrow morning conditions" : brief.overallCondition}
      </p>

      <div className="flex flex-col mt-1">
        {brief.segmentConditions.map((seg) => (
          <SegmentRow key={seg.segmentId} seg={seg} showTomorrow={showTomorrow} />
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

function corridorViewpoint(corridorId: CorridorId): { id: ViewpointId; name: string } | null {
  const map: Record<CorridorId, ViewpointId> = { abc: "abc-viewpoint", ebc: "kala-patthar" };
  const id = map[corridorId];
  const vp = VIEWPOINTS.find((v) => v.id === id);
  return vp ? { id: vp.id, name: vp.name } : null;
}

// ─── general (non-corridor) destination panel ──────────────────────────────

function EvidenceSnapshotGrid({ summary }: { summary: ReplaySummary }) {
  const snaps = summary.evidenceSnapshots;
  if (snaps.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-[var(--color-text-primary)]">Last 72h evidence</p>
      <div className="grid grid-cols-3 gap-1.5">
        {snaps.map((snap) => (
          <div
            key={snap.quality}
            className="flex flex-col rounded border border-[var(--color-border)] overflow-hidden"
          >
            {snap.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={snap.thumbUrl} alt={snap.label} className="w-full h-12 object-cover" />
            ) : (
              <div className="h-12 bg-[var(--color-surface-alt)] flex items-center justify-center text-xl">
                {snap.quality === "best" ? "🌄" : snap.quality === "worst" ? "🌧" : "⛅"}
              </div>
            )}
            <p className="text-[9px] text-[var(--color-text-muted)] px-1 py-0.5 truncate">
              {snap.label}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)]">
        {summary.cloudBuildupPattern}. {summary.trendReasoning}.
      </p>
    </div>
  );
}

function GeneralContent({ destId, destName }: { destId: DestinationId; destName: string }) {
  const timeMode = useWorldStore((s) => s.timeMode);
  const showTomorrow = timeMode === "tomorrow_am" || timeMode === "afternoon";

  const { data: weatherData } = useSWR<{
    conditions: Array<{
      destinationId: string;
      conditionLabel: string;
      conditionIcon: string;
      plainSummary: string;
    }>;
  }>("/api/weather", fetcher, { refreshInterval: 10 * 60 * 1000, revalidateOnFocus: false });
  const cond = weatherData?.conditions.find((c) => c.destinationId === destId);

  const { data: replayData } = useSWR<{ summary: ReplaySummary }>(
    `/api/replay/${destId}`,
    fetcher,
    { refreshInterval: 30 * 60 * 1000, revalidateOnFocus: false },
  );

  const dest = DESTINATIONS.find((d) => d.id === destId);
  const viewpointId = dest?.defaultViewpointId as ViewpointId | null;
  const viewpoint = viewpointId ? VIEWPOINTS.find((v) => v.id === viewpointId) : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Current / tomorrow conditions */}
      <div>
        <p className="text-xs font-medium text-[var(--color-text-primary)] mb-1">
          {showTomorrow ? "Tomorrow morning" : "Now"}
        </p>
        {cond ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {cond.conditionIcon} {showTomorrow ? "Forecast pending" : cond.plainSummary}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">Loading…</p>
        )}
      </div>

      {/* Visibility if viewpoint available */}
      {viewpoint && (
        <ApiErrorBoundary>
          <VisibilityCard viewpointId={viewpoint.id} viewpointName={viewpoint.name} />
        </ApiErrorBoundary>
      )}

      {/* 72h evidence snapshots */}
      {replayData?.summary && <EvidenceSnapshotGrid summary={replayData.summary} />}

      {/* Yesterday's actual */}
      <ApiErrorBoundary>
        <YesterdayCard destId={destId} destName={destName} />
      </ApiErrorBoundary>

      <ShareButton className="w-full text-xs py-2 rounded border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-alt)]" />
    </div>
  );
}

// ─── panel shell ───────────────────────────────────────────────────────────

export function DestinationInsightPanel() {
  const { insightPanelOpen, selectedDestinationId, selectedCorridor, set } = useSelectionStore();

  if (!insightPanelOpen || !selectedDestinationId) return null;

  const dest = DESTINATIONS.find((d) => d.id === selectedDestinationId);
  const destName = dest?.name ?? selectedDestinationId;
  const isCorridorDest = selectedCorridor !== null;

  return (
    <div
      className="absolute top-0 right-0 h-full w-full sm:w-72 bg-[var(--color-surface)] border-l border-[var(--color-border)] z-30 flex flex-col shadow-xl overflow-y-auto"
      role="dialog"
      aria-label={`${destName} insight`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {isCorridorDest ? `${destName} — Route Detail` : destName}
        </h2>
        <button
          type="button"
          onClick={() => set({ insightPanelOpen: false, selectedDestinationId: null })}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg leading-none p-1"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex flex-col gap-4">
        {isCorridorDest && selectedCorridor ? (
          <>
            <ApiErrorBoundary>
              <BriefContent corridorId={selectedCorridor} />
            </ApiErrorBoundary>
            {(() => {
              const vp = corridorViewpoint(selectedCorridor);
              return vp ? (
                <ApiErrorBoundary>
                  <VisibilityCard viewpointId={vp.id} viewpointName={vp.name} />
                </ApiErrorBoundary>
              ) : null;
            })()}
            {selectedCorridor === "ebc" && (
              <ApiErrorBoundary>
                <LuklaFlightCard />
              </ApiErrorBoundary>
            )}
            {(() => {
              const d = DESTINATIONS.find((d) => d.id === selectedDestinationId);
              return d ? (
                <ApiErrorBoundary>
                  <YesterdayCard destId={d.id} destName={d.name} />
                </ApiErrorBoundary>
              ) : null;
            })()}
          </>
        ) : (
          <ApiErrorBoundary>
            <GeneralContent destId={selectedDestinationId} destName={destName} />
          </ApiErrorBoundary>
        )}
      </div>
    </div>
  );
}
