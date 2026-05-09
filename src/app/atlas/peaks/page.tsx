import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import type { CitationDataset } from "@/components/ui/citation-pill";
import { CitationPill } from "@/components/ui/citation-pill";
import { PLACE_REGISTRY } from "@/data/places";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Peaks Atlas — Himalayan Atlas",
  description:
    "Browse the highest summits of the Himalaya and Karakoram, with climbing-window weather data forthcoming.",
  openGraph: {
    title: "Peaks Atlas — Himalayan Atlas",
    description:
      "Browse the highest summits of the Himalaya and Karakoram, with climbing-window weather data forthcoming.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peaks Atlas — Himalayan Atlas",
    description:
      "Browse the highest summits of the Himalaya and Karakoram, with climbing-window weather data forthcoming.",
  },
};

const PLACE_REGISTRY_DATASET: CitationDataset = {
  slug: "place-registry",
  name: "Place Registry (curated)",
  license: "various / public domain",
  citation:
    "Curated from public sources (Wikipedia, Nepal/Pakistan official inventories, peer-reviewed papers).",
  sourceUrl: "https://en.wikipedia.org/wiki/List_of_highest_mountains_on_Earth",
  description:
    "Coordinates and altitude curated from open data sources for places not yet in canonical scientific datasets.",
};

const peaks = Object.entries(PLACE_REGISTRY)
  .filter(([, entry]) => entry.class === "peak")
  .sort(([, a], [, b]) => b.alt - a.alt)
  .map(([slug, entry]) => ({ slug, ...entry }));

export default function PeaksAtlasPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-20 max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-10 max-w-2xl">
          <h1
            className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-5 tracking-tight`}
          >
            Peaks Atlas
          </h1>
          <p className="text-base md:text-lg text-neutral-600 leading-relaxed">
            Eight of the world&rsquo;s fourteen 8,000-metre summits stand in the Himalaya and
            Karakoram. These pages track the climbing-window weather and freezing-level climatology
            that determines when summits are reachable &mdash; data forthcoming as the
            climate-window pipeline comes online.
          </p>
        </header>

        {/* Peak cards grid */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {peaks.map((peak) => (
            <li key={peak.slug}>
              <Link
                href={`/places/${peak.slug}`}
                className="flex flex-col h-full rounded-lg border border-neutral-200 hover:border-neutral-400 bg-white transition-colors duration-150 px-5 py-4 group"
              >
                {/* Altitude — prominent */}
                <span className="block text-2xl font-semibold text-neutral-900 tabular-nums mb-1">
                  {peak.alt.toLocaleString()} m
                </span>

                {/* Peak name */}
                <span className="block text-base font-medium text-neutral-800 group-hover:text-neutral-600 transition-colors duration-150 mb-1">
                  {peak.name}
                </span>

                {/* Country / region */}
                <span className="block text-sm text-neutral-500 mt-auto pt-3">
                  {peak.country}
                  {peak.region ? ` · ${peak.region}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Source attribution */}
        <footer className="border-t border-neutral-100 pt-4">
          <CitationPill dataset={PLACE_REGISTRY_DATASET} />
        </footer>
      </div>
    </main>
  );
}
