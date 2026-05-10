import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { PLACE_REGISTRY } from "@/data/places";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas — Himalayan Atlas",
  description: "Browse the Himalayan Atlas by glaciers, peaks, lakes, and rivers.",
  openGraph: {
    title: "Atlas — Himalayan Atlas",
    description: "Browse the Himalayan Atlas by glaciers, peaks, lakes, and rivers.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas — Himalayan Atlas",
    description: "Browse the Himalayan Atlas by glaciers, peaks, lakes, and rivers.",
  },
};

const glaciers = Object.values(PLACE_REGISTRY).filter((e) => e.class === "glacier");
const peaks = Object.values(PLACE_REGISTRY).filter((e) => e.class === "peak");
const lakes = Object.values(PLACE_REGISTRY).filter((e) => e.class === "lake");
const rivers = Object.values(PLACE_REGISTRY).filter((e) => e.class === "river_point");

export default function AtlasIndexPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-24 max-w-3xl mx-auto">
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight`}
        >
          Atlas
        </h1>

        <p className="text-lg text-neutral-600 leading-relaxed max-w-prose mb-10">
          Browse the Himalayan Atlas by class.
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Glaciers — active */}
          <li>
            <Link
              href="/atlas/30-years"
              className="block h-full rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors duration-150 px-5 py-5 bg-white group"
            >
              <span className="block text-base font-semibold text-neutral-900 mb-1 group-hover:text-neutral-600 transition-colors duration-150">
                Glaciers
              </span>
              <span className="block text-sm text-neutral-500 mb-2">{glaciers.length} places</span>
              <span className="block text-sm text-neutral-600 leading-relaxed">
                Mass balance, outlines, photo evidence
              </span>
            </Link>
          </li>

          {/* Peaks — active */}
          <li>
            <Link
              href="/atlas/peaks"
              className="block h-full rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors duration-150 px-5 py-5 bg-white group"
            >
              <span className="block text-base font-semibold text-neutral-900 mb-1 group-hover:text-neutral-600 transition-colors duration-150">
                Peaks
              </span>
              <span className="block text-sm text-neutral-500 mb-2">{peaks.length} places</span>
              <span className="block text-sm text-neutral-600 leading-relaxed">
                Summit weather, climbing windows, permit seasons
              </span>
            </Link>
          </li>

          {/* Lakes — coming soon */}
          <li>
            <div className="block h-full rounded-lg border border-neutral-200 px-5 py-5 bg-white opacity-60 cursor-default">
              <span className="block text-base font-semibold text-neutral-900 mb-1">Lakes</span>
              <span className="block text-sm text-neutral-500 mb-2">
                {lakes.length} places · Coming soon
              </span>
              <span className="block text-sm text-neutral-600 leading-relaxed">
                Glacial lakes, GLOF risk, water levels
              </span>
            </div>
          </li>

          {/* Rivers — coming soon */}
          <li>
            <div className="block h-full rounded-lg border border-neutral-200 px-5 py-5 bg-white opacity-60 cursor-default">
              <span className="block text-base font-semibold text-neutral-900 mb-1">Rivers</span>
              <span className="block text-sm text-neutral-500 mb-2">
                {rivers.length} sample points · Coming soon
              </span>
              <span className="block text-sm text-neutral-600 leading-relaxed">
                Flow seasonality, snowmelt contribution
              </span>
            </div>
          </li>
        </ul>
      </div>
    </main>
  );
}
