/**
 * citation-chip.tsx — Bottom-right citation shortcut chip
 *
 * Shown inside each chapter overlay. Clicking opens the Provenance Peel.
 * Per spec §06: citation chip is always clickable and opens the peel panel.
 *
 * Color grammar (§7): ice = #7DD3FC, not decorative — citations reference data.
 */
"use client";

type Props = {
  sources: readonly string[];
  onShowAll: () => void;
};

export function CitationChip({ sources, onShowAll }: Props) {
  const preview = sources.slice(0, 2).join(" · ");
  const extra = sources.length > 2 ? ` +${sources.length - 2}` : "";

  return (
    <div className="absolute bottom-8 right-8 pointer-events-auto">
      <button
        type="button"
        onClick={onShowAll}
        aria-label={`Show data sources: ${sources.join(", ")}`}
        className={[
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-slate-900/80 backdrop-blur-sm border border-white/10",
          "text-xs text-slate-300 hover:text-white",
          "hover:border-sky-400/50 hover:bg-slate-800/80",
          "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-slate-950",
          "transition-all duration-150",
        ].join(" ")}
      >
        {/* Small colour swatch — ice colour per grammar */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: "#7DD3FC" }}
          aria-hidden="true"
        />
        <span>
          {preview}
          {extra}
        </span>
        <span className="text-slate-500" aria-hidden="true">
          →
        </span>
      </button>
    </div>
  );
}
