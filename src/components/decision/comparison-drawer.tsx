"use client";

import { useSelectionStore } from "@/state/selectionStore";
import type {
  ComparisonDrawerData,
  ComparisonRecommendation,
  ComparisonRow,
} from "@/types/weather";

const REC_STYLES: Record<ComparisonRecommendation, string> = {
  best: "text-amber-700 font-semibold",
  good: "text-green-700 font-medium",
  watch: "text-gray-600",
  avoid: "text-red-600 font-semibold",
};

const REC_LABELS: Record<ComparisonRecommendation, string> = {
  best: "Best",
  good: "Good",
  watch: "Watch",
  avoid: "Avoid",
};

function TrekkingRow({ row }: { row: ComparisonRow }) {
  return (
    <tr className="border-t border-[var(--color-border-subtle)]">
      <td className="py-2 pr-3 text-sm text-[var(--color-text-primary)] font-medium whitespace-nowrap">
        {row.name}
      </td>
      <td className="py-2 pr-3 text-xs text-[var(--color-text-secondary)]">{row.now}</td>
      <td className="py-2 pr-3 text-xs text-[var(--color-text-secondary)]">
        {row.trailCondition ?? "—"}
      </td>
      <td className="py-2 pr-3 text-xs text-[var(--color-text-secondary)]">
        {row.snowConcern ?? "None"}
      </td>
      <td className={["py-2 text-xs", REC_STYLES[row.recommendation]].join(" ")}>
        {REC_LABELS[row.recommendation]}
      </td>
    </tr>
  );
}

function MountainRow({ row }: { row: ComparisonRow }) {
  return (
    <tr className="border-t border-[var(--color-border-subtle)]">
      <td className="py-2 pr-3 text-sm text-[var(--color-text-primary)] font-medium whitespace-nowrap">
        {row.name}
      </td>
      <td className="py-2 pr-3 text-xs text-[var(--color-text-secondary)]">{row.now}</td>
      <td className="py-2 pr-3 text-xs text-[var(--color-text-secondary)]">{row.tomorrowAM}</td>
      <td className="py-2 pr-3 text-xs text-[var(--color-text-secondary)]">
        {row.viewQuality ?? "—"}
      </td>
      <td className={["py-2 text-xs", REC_STYLES[row.recommendation]].join(" ")}>
        {REC_LABELS[row.recommendation]}
      </td>
    </tr>
  );
}

function LowlandRow({ row }: { row: ComparisonRow }) {
  return (
    <tr className="border-t border-[var(--color-border-subtle)]">
      <td className="py-2 pr-3 text-sm text-[var(--color-text-primary)] font-medium whitespace-nowrap">
        {row.name}
      </td>
      <td className="py-2 pr-3 text-xs text-[var(--color-text-secondary)]">{row.now}</td>
      <td className="py-2 pr-3 text-xs text-[var(--color-text-secondary)]">{row.tomorrowAM}</td>
      <td className={["py-2 text-xs", REC_STYLES[row.recommendation]].join(" ")}>
        {REC_LABELS[row.recommendation]}
      </td>
    </tr>
  );
}

type Props = { data: ComparisonDrawerData };

export function ComparisonDrawer({ data }: Props) {
  const { comparisonDrawerOpen, set } = useSelectionStore();

  if (!comparisonDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => set({ comparisonDrawerOpen: false })}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-label="Destination comparison"
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[var(--color-surface)] shadow-[var(--shadow-xl)] z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Compare Destinations
          </h2>
          <button
            type="button"
            onClick={() => set({ comparisonDrawerOpen: false })}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-lg p-1"
            aria-label="Close comparison"
          >
            ✕
          </button>
        </div>

        {/* Note */}
        <p className="px-5 py-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
          Categories are never mixed — mountain views vs trekking vs lowland are different trips.
        </p>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {data.groups.map((group) => (
            <section key={group.tripIntent}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                {group.label}
              </h3>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="pb-1.5 pr-3 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Destination
                      </th>
                      <th className="pb-1.5 pr-3 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Now
                      </th>
                      {group.tripIntent === "mountain_views" && (
                        <>
                          <th className="pb-1.5 pr-3 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                            Tomorrow AM
                          </th>
                          <th className="pb-1.5 pr-3 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                            View
                          </th>
                        </>
                      )}
                      {group.tripIntent === "trekking" && (
                        <>
                          <th className="pb-1.5 pr-3 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                            Trail
                          </th>
                          <th className="pb-1.5 pr-3 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                            Snow
                          </th>
                        </>
                      )}
                      {group.tripIntent === "lowland" && (
                        <th className="pb-1.5 pr-3 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                          Tomorrow AM
                        </th>
                      )}
                      <th className="pb-1.5 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Call
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) =>
                      group.tripIntent === "trekking" ? (
                        <TrekkingRow key={row.destinationId} row={row} />
                      ) : group.tripIntent === "mountain_views" ? (
                        <MountainRow key={row.destinationId} row={row} />
                      ) : (
                        <LowlandRow key={row.destinationId} row={row} />
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] shrink-0 text-xs text-[var(--color-text-muted)]">
          Mock data — real Decision Intelligence wired in Step 4
        </div>
      </div>
    </>
  );
}
