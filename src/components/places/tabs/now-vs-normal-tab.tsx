export function NowVsNormalTab() {
  return (
    <div className="px-4 py-6">
      <p className="text-sm text-neutral-600 mb-6">
        Historical baseline data coming soon — we&apos;re ingesting 30 years of ERA5 data.
      </p>
      <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 flex flex-col items-center justify-center gap-2 min-h-48">
        <span className="text-neutral-400 text-xs font-medium uppercase tracking-wide">
          Chart placeholder
        </span>
        <span className="text-neutral-300 text-xs text-center">
          Temperature vs 30-year average · Monthly bars
        </span>
      </div>
    </div>
  );
}
