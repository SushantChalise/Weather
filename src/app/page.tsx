import { BottomSheet } from "@/components/controls/bottom-sheet";
import { LayerToggles } from "@/components/controls/layer-toggles";
import { TimeControl } from "@/components/controls/time-control";
import { DestinationInsightPanel } from "@/components/decision/destination-insight-panel";
import { SelectionClearWindow } from "@/components/decision/selection-clear-window";
import { LiveComparisonDrawer } from "@/components/decision/live-comparison-drawer";
import { LiveCorridorCards } from "@/components/decision/live-corridor-cards";
import { LiveDecisionStrip } from "@/components/decision/live-decision-strip";
import { ReplaySummaryCard } from "@/components/decision/replay-summary";
import { IdleDetector } from "@/components/scene/idle-detector";
import { LowBandwidthDetector } from "@/components/scene/low-bandwidth-detector";
import { NepalMapClient } from "@/components/scene/nepal-map-client";
import { PerformanceDetector } from "@/components/scene/performance-detector";
import { LiveActionButtons } from "@/components/ui/live-action-buttons";
import { LowBandwidthToggle } from "@/components/ui/low-bandwidth-toggle";
import { NptClock } from "@/components/ui/npt-clock";
import { SourceAttribution } from "@/components/ui/source-attribution";
import { StaleSatelliteBanner } from "@/components/ui/stale-satellite-banner";
import { TiltModeButton } from "@/components/ui/tilt-mode-button";
import { MOCK_COMPARISON_DATA } from "@/data/mock/comparison-data";
import { MOCK_CORRIDOR_CARDS } from "@/data/mock/corridor-cards";
import { MOCK_REPLAY_SUMMARIES } from "@/data/mock/replay-summaries";

export default function Home() {
  const abcReplay = MOCK_REPLAY_SUMMARIES.find((s) => s.scopeId === "abc");

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12 bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0">
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-tight">
          <span className="hidden sm:inline">Nepal Mountain Weather Decision Map</span>
          <span className="sm:hidden">Nepal Weather</span>
        </h1>
        <div className="flex items-center gap-3">
          <NptClock />
          <button
            type="button"
            aria-label="Settings"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg p-1"
          >
            ⚙
          </button>
        </div>
      </header>

      {/* Stale satellite warning — client-side, hidden when data is fresh */}
      <StaleSatelliteBanner />

      {/* Decision Strip — live via SWR */}
      <LiveDecisionStrip />

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map — live conditions via SWR inside client component */}
        <main className="flex-1 relative overflow-hidden">
          <NepalMapClient />
          {/* Route insight panel — overlays map when a corridor destination is clicked */}
          <DestinationInsightPanel />
        </main>

        {/* Side panel — desktop only */}
        <aside className="hidden lg:flex flex-col w-80 bg-[var(--color-surface-alt)] border-l border-[var(--color-border)] overflow-y-auto shrink-0">
          <div className="flex flex-col gap-3 p-4">
            <LiveCorridorCards fallback={MOCK_CORRIDOR_CARDS} />
            <LiveActionButtons />

            <SelectionClearWindow />
            {abcReplay && <ReplaySummaryCard data={abcReplay} />}
          </div>
        </aside>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-2 px-3 py-2 bg-[var(--color-surface-alt)] border-t border-[var(--color-border)] max-h-[38vh] overflow-y-auto pb-16">
        <LiveCorridorCards fallback={MOCK_CORRIDOR_CARDS} />
        <LiveActionButtons />
        <SelectionClearWindow />
        {abcReplay && <ReplaySummaryCard data={abcReplay} />}
      </div>

      <LiveComparisonDrawer fallback={MOCK_COMPARISON_DATA} />

      {/* Bottom bar — desktop */}
      <footer className="hidden lg:flex items-center gap-4 px-4 h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0">
        <LayerToggles />
        <div className="h-6 w-px bg-[var(--color-border)]" />
        <TimeControl />
        <div className="h-6 w-px bg-[var(--color-border)]" />
        <TiltModeButton />
        <LowBandwidthToggle />
        <div className="ml-auto">
          <SourceAttribution />
        </div>
      </footer>

      {/* Bottom sheet — mobile */}
      <BottomSheet>
        <div className="flex flex-col gap-4">
          <LayerToggles />
          <TimeControl />
          <div className="flex gap-2">
            <TiltModeButton />
            <LowBandwidthToggle />
          </div>
        </div>
      </BottomSheet>

      {/* Client-only runtime detectors */}
      <IdleDetector />
      <PerformanceDetector />
      <LowBandwidthDetector />
    </div>
  );
}
