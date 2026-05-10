/**
 * /atlas/water-cycle — Water Cycle Atlas page
 *
 * Server component. Loads provenance for all 7 chapters at build time,
 * then hands them to the client orchestrator.
 *
 * Per spec §7: server-rendered initial HTML must show end-state (headlines,
 * citations, captions). Animation enhances; doesn't replace data.
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { WaterCycleClient } from "@/components/water-cycle/water-cycle-client";
import { loadAllProvenance } from "@/lib/water-cycle/provenance";

export const metadata: Metadata = {
  title: "The Water Cycle — Himalayan Atlas",
  description:
    "How Hindu Kush Himalaya glaciers stored, are losing, and will lose water. " +
    "9% of all HKH ice has melted since 1990 — 516 km³ of water. The glacier was your reservoir.",
  openGraph: {
    title: "The Water Cycle — Himalayan Atlas",
    description:
      "9% of all Hindu Kush Himalaya ice has melted since 1990. The glacier was your reservoir.",
    type: "article",
    images: [
      {
        url: "/water-cycle/og.jpg",
        width: 1200,
        height: 630,
        alt: "Imja Tsho — the lake is the glacier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Water Cycle — Himalayan Atlas",
    description:
      "9% of all Hindu Kush Himalaya ice has melted since 1990. The glacier was your reservoir.",
  },
};

function WaterCycleSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center" aria-busy="true">
      <p className="text-slate-500 text-sm animate-pulse">Loading Water Cycle Atlas…</p>
    </div>
  );
}

export default async function WaterCyclePage() {
  // Load provenance for all 7 chapters at build time (statically bundled)
  const provenance = await loadAllProvenance();

  return (
    <Suspense fallback={<WaterCycleSkeleton />}>
      <WaterCycleClient provenance={provenance} />
    </Suspense>
  );
}
