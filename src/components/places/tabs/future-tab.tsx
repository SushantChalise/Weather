export function FutureTab() {
  return (
    <div className="px-4 py-6">
      <p className="text-sm text-neutral-600 mb-6">
        Climate projections coming soon — CMIP6 downscaled scenarios for the Himalayan region.
      </p>
      <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 flex flex-col items-center justify-center gap-2 min-h-48">
        <span className="text-neutral-400 text-xs font-medium uppercase tracking-wide">
          Chart placeholder
        </span>
        <span className="text-neutral-300 text-xs text-center">
          SSP2-4.5 &amp; SSP5-8.5 temperature projections · 2025–2100
        </span>
      </div>
    </div>
  );
}
