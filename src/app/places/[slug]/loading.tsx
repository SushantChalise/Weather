/**
 * Loading skeleton for /places/[slug].
 * Mirrors the structure of PlaceHeader + PlaceTabs so there is no layout
 * shift when the Server Component resolves.
 */
export default function PlaceLoading() {
  return (
    <main className="min-h-screen bg-white">
      {/* ── PlaceHeader skeleton ── */}
      <header className="px-4 pt-6 pb-4">
        {/* Breadcrumb: "Nepal › Place Name" */}
        <div className="h-3 w-2/5 rounded bg-neutral-200 animate-pulse mb-2" />

        {/* h1 title */}
        <div className="h-7 w-3/5 rounded bg-neutral-200 animate-pulse" />

        {/* Altitude badge + coordinates row */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <div className="h-5 w-16 rounded-full bg-neutral-200 animate-pulse" />
          <div className="h-3 w-28 rounded bg-neutral-200 animate-pulse" />
        </div>
      </header>

      {/* ── PlaceTabs skeleton ── */}
      <div>
        {/* Tab bar — 4 static skeleton pills matching "Now / Now vs Normal / Last 30 Years / Future" */}
        <div className="overflow-x-auto border-b border-neutral-200">
          <div className="flex min-w-max px-4 gap-1">
            <div className="my-3 mx-2 h-4 w-10  rounded bg-neutral-200 animate-pulse" />
            <div className="my-3 mx-2 h-4 w-24  rounded bg-neutral-200 animate-pulse" />
            <div className="my-3 mx-2 h-4 w-24  rounded bg-neutral-200 animate-pulse" />
            <div className="my-3 mx-2 h-4 w-14  rounded bg-neutral-200 animate-pulse" />
          </div>
        </div>

        {/* Tab content card */}
        <div className="px-4 py-4 space-y-3">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-3">
            <div className="h-4 w-1/3 rounded bg-neutral-200 animate-pulse" />
            <div className="h-3 w-full rounded bg-neutral-200 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-neutral-200 animate-pulse" />
            <div className="h-3 w-4/6 rounded bg-neutral-200 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
