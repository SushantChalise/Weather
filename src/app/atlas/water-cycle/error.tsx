/**
 * error.tsx — Error boundary for the water-cycle route
 *
 * Shown when provenance.json fails to parse or any async error occurs.
 * Must be a Client Component per Next.js App Router convention.
 */
"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WaterCycleError({ error, reset }: Props) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error("[water-cycle] page error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen bg-slate-950 flex items-center justify-center p-8"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-white text-2xl font-bold">Something went wrong</h2>
        <p className="text-slate-400 text-sm">
          The Water Cycle Atlas could not load. This may be a temporary issue.
        </p>
        {error.digest && (
          <p className="text-slate-600 text-xs font-mono">Error ID: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-4 px-4 py-2 rounded bg-sky-700 text-white text-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-950 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
