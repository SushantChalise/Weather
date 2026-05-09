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

const RGI_V7: CitationDataset = {
  slug: "rgi-v7",
  name: "Randolph Glacier Inventory v7",
  license: "CC BY 4.0",
  citation:
    "RGI 7.0 Consortium (2023). Randolph Glacier Inventory 7.0 [Data set]. NSIDC. https://doi.org/10.5067/f6jmovy5navz",
  sourceUrl: "https://nsidc.org/data/nsidc-0770/versions/7",
  description: "Canonical global glacier outlines, ~215,000 glaciers worldwide.",
  spatialRes: "vector polygons",
};

export const metadata: Metadata = {
  title: "Glacier Atlas — Himalayan Atlas",
  description:
    "Browse the Hindu Kush–Himalaya glaciers in the Himalayan Atlas, with mass-balance and outline data forthcoming.",
  openGraph: {
    title: "Glacier Atlas — Himalayan Atlas",
    description:
      "Browse the Hindu Kush–Himalaya glaciers in the Himalayan Atlas, with mass-balance and outline data forthcoming.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glacier Atlas — Himalayan Atlas",
    description:
      "Browse the Hindu Kush–Himalaya glaciers in the Himalayan Atlas, with mass-balance and outline data forthcoming.",
  },
};

const glaciers = Object.entries(PLACE_REGISTRY).filter(([, entry]) => entry.class === "glacier");

export default function GlacierAtlasPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-24 max-w-5xl mx-auto">
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight`}
        >
          Glacier Atlas
        </h1>

        <p className="text-lg text-neutral-600 leading-relaxed max-w-prose mb-10">
          The Hindu Kush–Himalaya holds more glacier ice than anywhere outside the polar regions —
          about 100,000&nbsp;km² spread across some 50,000 individual glaciers. Each one is a record
          of climate change, and most are losing mass. This atlas tracks the ones we have data for;
          more are added as ICIMOD and Hugonnet&nbsp;2021 ingestion comes online.
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {glaciers.map(([slug, entry]) => (
            <li key={slug}>
              <Link
                href={`/places/${slug}`}
                className="block h-full rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors duration-150 px-5 py-4 bg-white group"
              >
                <span className="block text-sm font-semibold text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors duration-150">
                  {entry.name}
                </span>
                <dl className="text-xs text-neutral-500 space-y-1">
                  <div className="flex gap-2">
                    <dt className="shrink-0">Altitude</dt>
                    <dd className="text-neutral-700">{entry.alt.toLocaleString()}&nbsp;m</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0">Region</dt>
                    <dd className="text-neutral-700">
                      {entry.region ? `${entry.region}, ` : ""}
                      {entry.country}
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <CitationPill dataset={RGI_V7} />
        </div>
      </div>
    </main>
  );
}
