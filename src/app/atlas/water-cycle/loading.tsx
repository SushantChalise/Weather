/**
 * loading.tsx — Skeleton shown while page data loads
 */
export default function WaterCycleLoading() {
  return (
    <div
      className="min-h-screen bg-slate-950 flex items-center justify-center"
      role="status"
      aria-busy="true"
    >
      <div className="text-center space-y-4">
        {/* Pulsing headline skeleton */}
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse mx-auto" />
        <div className="h-4 w-48 bg-slate-800/60 rounded animate-pulse mx-auto" />
      </div>
    </div>
  );
}
