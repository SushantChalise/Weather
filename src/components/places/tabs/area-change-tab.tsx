export function AreaChangeTab() {
  return (
    <div className="px-4 py-6">
      <p className="text-sm text-neutral-600 mb-6">
        Glacier outline data from RGI v7 (Randolph Glacier Inventory) — being ingested. Multi-decade
        area change will appear here once outlines are processed.
      </p>

      {/* Wireframe: map outline overlay shape */}
      <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 min-h-56 flex flex-col items-center justify-center gap-4">
        {/* Simulated map with glacier outline */}
        <div className="w-full max-w-xs aspect-video bg-neutral-50 rounded border border-dashed border-neutral-300 relative flex items-center justify-center">
          {/* Simulated glacier outline blob */}
          <div className="w-24 h-16 border-2 border-dashed border-neutral-300 rounded-[40%_60%_55%_45%/50%_45%_55%_50%] bg-neutral-100" />
          {/* Map grid lines */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static wireframe
                key={i}
                className="border border-dashed border-neutral-200"
              />
            ))}
          </div>
        </div>

        {/* Legend placeholder */}
        <div className="flex items-center gap-6 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 border-t-2 border-dashed border-neutral-400" />
            Earliest outline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 border-t-2 border-dashed border-neutral-300" />
            Latest outline
          </span>
        </div>

        <p className="text-neutral-400 text-xs font-medium uppercase tracking-wide">
          Map placeholder — RGI v7 outlines being ingested
        </p>
      </div>
    </div>
  );
}
