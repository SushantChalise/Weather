export function MassBalanceTab() {
  return (
    <div className="px-4 py-6">
      <p className="text-sm text-neutral-600 mb-6">
        Glacier mass balance from ICIMOD and Hugonnet et al. 2021 — being ingested. Khumbu&apos;s
        20-year balance record will appear here.
      </p>

      {/* Wireframe: descending bar chart shape */}
      <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 min-h-56">
        {/* Y-axis label */}
        <div className="flex gap-4 h-40">
          <div className="flex flex-col items-center justify-center w-6 shrink-0">
            <span
              className="text-neutral-400 text-[10px] font-medium uppercase tracking-wide whitespace-nowrap"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Cumulative mass balance (m w.e.)
            </span>
          </div>

          {/* Bar chart wireframe — descending bars */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Grid lines */}
            <div className="w-full border-t border-dashed border-neutral-200" />
            <div className="w-full border-t border-dashed border-neutral-200" />
            <div className="w-full border-t border-dashed border-neutral-200" />
            <div className="w-full border-t border-dashed border-neutral-200" />

            {/* Bars */}
            <div className="flex items-end gap-1 h-32 mt-auto">
              {[90, 82, 76, 70, 63, 55, 48, 40, 33, 25, 18, 10].map((height, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static wireframe
                  key={i}
                  className="flex-1 bg-neutral-100 rounded-t border border-dashed border-neutral-300"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* X-axis placeholder labels */}
        <div className="flex justify-between mt-2 ml-10 text-neutral-300 text-[10px]">
          <span>2000</span>
          <span>2005</span>
          <span>2010</span>
          <span>2015</span>
          <span>2020</span>
        </div>

        <p className="text-center text-neutral-400 text-xs font-medium uppercase tracking-wide mt-4">
          Chart placeholder — data ingestion in progress
        </p>
      </div>
    </div>
  );
}
