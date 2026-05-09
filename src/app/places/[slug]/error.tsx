"use client";

import Link from "next/link";
import { useEffect } from "react";

type PlaceErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PlaceError({ error, reset }: PlaceErrorProps) {
  useEffect(() => {
    // Log internally so the error appears in the browser console without
    // exposing the raw message to the rendered UI.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white">
      {/* Mirror the PlaceHeader top spacing so the error card sits at the
          same vertical position as normal page content. */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-neutral-900 leading-tight">
          We couldn&apos;t load this place
        </h1>
        <p className="mt-3 text-sm text-neutral-600 leading-relaxed max-w-prose">
          Something went wrong. This has been logged. You can try reloading or go back to the
          homepage.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
