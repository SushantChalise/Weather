import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import type { PlaceRegistryEntry } from "@/data/places";
import { PLACE_REGISTRY } from "@/data/places";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Compare places — Himalayan Atlas",
  description: "Side-by-side comparison of any two places in the Himalayan Atlas.",
  openGraph: {
    title: "Compare places — Himalayan Atlas",
    description: "Side-by-side comparison of any two places in the Himalayan Atlas.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare places — Himalayan Atlas",
    description: "Side-by-side comparison of any two places in the Himalayan Atlas.",
  },
};

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function classLabel(cls: PlaceRegistryEntry["class"]): string {
  switch (cls) {
    case "trek_destination":
      return "Trek destination";
    case "glacier":
      return "Glacier";
    case "peak":
      return "Peak";
    case "lake":
      return "Lake";
    case "river_point":
      return "River point";
    case "city":
      return "City";
    default:
      return cls;
  }
}

interface PlaceCardProps {
  slug: string;
  entry: PlaceRegistryEntry;
  label: "A" | "B";
}

function PlaceCard({ slug, entry, label }: PlaceCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors duration-150 p-6 bg-white flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500 shrink-0 mt-0.5">
          {label}
        </span>
        <h2 className="flex-1 text-xl font-semibold text-neutral-900 leading-snug">{entry.name}</h2>
      </div>

      <dl className="text-sm text-neutral-600 space-y-2">
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-neutral-400">Class</dt>
          <dd className="text-neutral-700">{classLabel(entry.class)}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-neutral-400">Country</dt>
          <dd className="text-neutral-700">{entry.country}</dd>
        </div>
        {entry.region && (
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-neutral-400">Region</dt>
            <dd className="text-neutral-700">{entry.region}</dd>
          </div>
        )}
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-neutral-400">Altitude</dt>
          <dd className="text-neutral-700">{entry.alt.toLocaleString()} m</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-neutral-400">Lat / Lon</dt>
          <dd className="text-neutral-700 font-mono text-xs">
            {entry.lat.toFixed(4)}, {entry.lon.toFixed(4)}
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-2">
        <Link
          href={`/places/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-150"
        >
          View place page
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

interface DeltaRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function DeltaRow({ label, value, highlight }: DeltaRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-neutral-100 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span
        className={`text-sm font-medium ${highlight ? "text-neutral-900" : "text-neutral-600"}`}
      >
        {value}
      </span>
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const rawA = typeof params.a === "string" ? params.a : "ebc";
  const rawB = typeof params.b === "string" ? params.b : "abc";

  // Fall back to hardcoded defaults whose presence in PLACE_REGISTRY is certain.
  const defaultA = PLACE_REGISTRY.ebc as PlaceRegistryEntry;
  const defaultB = PLACE_REGISTRY.abc as PlaceRegistryEntry;

  const slugA = rawA in PLACE_REGISTRY ? rawA : "ebc";
  const slugB = rawB in PLACE_REGISTRY ? rawB : "abc";

  const placeA: PlaceRegistryEntry = PLACE_REGISTRY[slugA] ?? defaultA;
  const placeB: PlaceRegistryEntry = PLACE_REGISTRY[slugB] ?? defaultB;

  const altDiff = Math.abs(placeA.alt - placeB.alt);
  const higherPlace = placeA.alt >= placeB.alt ? placeA.name : placeB.name;
  const dist = Math.round(distanceKm(placeA.lat, placeA.lon, placeB.lat, placeB.lon));
  const sameCountry = placeA.country === placeB.country;
  const sameRegion = placeA.region !== undefined && placeA.region === placeB.region;

  const allSlugs = Object.keys(PLACE_REGISTRY);

  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-24 max-w-5xl mx-auto">
        {/* Header */}
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight`}
        >
          Compare places
        </h1>
        <p className="text-lg text-neutral-600 leading-relaxed max-w-prose mb-10">
          Pick any two places in the Himalayan Atlas to compare their altitude, location, and
          distance.
        </p>

        {/* Picker form */}
        <form
          method="GET"
          action="/compare"
          className="flex flex-col sm:flex-row gap-4 mb-10 items-end"
        >
          <div className="flex-1 flex flex-col gap-1.5">
            <label
              htmlFor="select-a"
              className="text-xs font-medium text-neutral-500 uppercase tracking-wide"
            >
              Place A
            </label>
            <select
              id="select-a"
              name="a"
              defaultValue={slugA}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              {allSlugs.map((slug) => (
                <option key={slug} value={slug}>
                  {PLACE_REGISTRY[slug]?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <label
              htmlFor="select-b"
              className="text-xs font-medium text-neutral-500 uppercase tracking-wide"
            >
              Place B
            </label>
            <select
              id="select-b"
              name="b"
              defaultValue={slugB}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              {allSlugs.map((slug) => (
                <option key={slug} value={slug}>
                  {PLACE_REGISTRY[slug]?.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="shrink-0 rounded-lg bg-neutral-900 text-white px-5 py-2 text-sm font-medium hover:bg-neutral-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            Compare
          </button>
        </form>

        {/* Side-by-side cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <PlaceCard slug={slugA} entry={placeA} label="A" />
          <PlaceCard slug={slugB} entry={placeB} label="B" />
        </div>

        {/* Delta panel */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-6 py-5">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-1">
            Differences
          </h2>
          <DeltaRow
            label="Altitude difference"
            value={`${altDiff.toLocaleString()} m (${higherPlace} is higher)`}
            highlight
          />
          <DeltaRow label="Distance" value={`${dist.toLocaleString()} km`} highlight />
          <DeltaRow
            label="Same country"
            value={
              sameCountry
                ? `Yes — both in ${placeA.country}`
                : `No — ${placeA.country} vs ${placeB.country}`
            }
          />
          <DeltaRow
            label="Same region"
            value={
              sameRegion
                ? `Yes — both in ${placeA.region}`
                : placeA.region && placeB.region
                  ? `No — ${placeA.region} vs ${placeB.region}`
                  : "No"
            }
          />
        </div>
      </div>
    </main>
  );
}
