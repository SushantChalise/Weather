import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { PLACE_REGISTRY } from "@/data/places";
import { PlacePicker } from "./place-picker";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Compare Places — Himalayan Atlas",
  description:
    "Side-by-side comparison of altitude, region, country, and coordinates for any two Himalayan places.",
  openGraph: {
    title: "Compare Places — Himalayan Atlas",
    description:
      "Side-by-side comparison of altitude, region, country, and coordinates for any two Himalayan places.",
    type: "website",
  },
};

const ALL_SLUGS = Object.keys(PLACE_REGISTRY).sort();
const PICKER_OPTIONS = ALL_SLUGS.map((slug) => ({
  slug,
  name: PLACE_REGISTRY[slug]?.name ?? slug,
}));

const DEFAULT_A = "ebc";
const DEFAULT_B = "abc";

type SearchParams = Promise<{ a?: string; b?: string }>;

function PlaceCard({ slug }: { slug: string }) {
  const entry = PLACE_REGISTRY[slug];
  if (!entry) {
    return (
      <div className="flex-1 rounded-xl border border-neutral-200 px-6 py-8 bg-white">
        <p className="text-sm text-neutral-500">Place not found: {slug}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-xl border border-neutral-200 px-6 py-8 bg-white">
      <Link
        href={`/places/${slug}`}
        className="block text-xl font-semibold text-neutral-900 hover:text-neutral-600 transition-colors mb-1"
      >
        {entry.name}
      </Link>
      <p className="text-xs text-neutral-400 capitalize mb-6">{entry.class.replace("_", " ")}</p>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between border-b border-neutral-100 pb-2">
          <dt className="text-neutral-500">Altitude</dt>
          <dd className="font-medium text-neutral-900">{entry.alt.toLocaleString()} m</dd>
        </div>
        <div className="flex justify-between border-b border-neutral-100 pb-2">
          <dt className="text-neutral-500">Region</dt>
          <dd className="font-medium text-neutral-900">{entry.region ?? "—"}</dd>
        </div>
        <div className="flex justify-between border-b border-neutral-100 pb-2">
          <dt className="text-neutral-500">Country</dt>
          <dd className="font-medium text-neutral-900">{entry.country}</dd>
        </div>
        <div className="flex justify-between border-b border-neutral-100 pb-2">
          <dt className="text-neutral-500">Latitude</dt>
          <dd className="font-mono text-neutral-900">{entry.lat.toFixed(4)}°</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Longitude</dt>
          <dd className="font-mono text-neutral-900">{entry.lon.toFixed(4)}°</dd>
        </div>
      </dl>
    </div>
  );
}

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const slugA = ALL_SLUGS.includes(params.a ?? "") ? (params.a ?? DEFAULT_A) : DEFAULT_A;
  const slugB = ALL_SLUGS.includes(params.b ?? "") ? (params.b ?? DEFAULT_B) : DEFAULT_B;

  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-24 max-w-4xl mx-auto">
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight`}
        >
          Compare places
        </h1>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-prose mb-10">
          Select any two Himalayan places to compare their altitude, region, and coordinates.
        </p>

        <PlacePicker options={PICKER_OPTIONS} valueA={slugA} valueB={slugB} />

        <div className="flex flex-col sm:flex-row gap-4">
          <PlaceCard slug={slugA} />
          <div className="flex items-center justify-center sm:flex-col text-neutral-300 text-lg font-semibold py-2 sm:py-0">
            vs
          </div>
          <PlaceCard slug={slugB} />
        </div>
      </div>
    </main>
  );
}
