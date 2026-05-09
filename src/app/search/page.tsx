import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import type { HistoricalEvent } from "@/data/events";
import { HISTORICAL_EVENTS } from "@/data/events";
import type { PlaceRegistryEntry } from "@/data/places";
import { PLACE_REGISTRY } from "@/data/places";
import type { PlaceClass } from "@/db/schema";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Search — Himalayan Atlas",
  description:
    "Search 30 Himalayan places and historical climate events by name, region, or keyword.",
  openGraph: {
    title: "Search — Himalayan Atlas",
    description:
      "Search 30 Himalayan places and historical climate events by name, region, or keyword.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search — Himalayan Atlas",
    description:
      "Search 30 Himalayan places and historical climate events by name, region, or keyword.",
  },
};

// ─── Match helpers ────────────────────────────────────────────────────────────

function matchPlace(place: PlaceRegistryEntry, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    place.name.toLowerCase().includes(lower) ||
    (place.region?.toLowerCase().includes(lower) ?? false)
  );
}

function matchEvent(event: HistoricalEvent, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return event.name.toLowerCase().includes(lower) || event.summary.toLowerCase().includes(lower);
}

// ─── Filter chip component ────────────────────────────────────────────────────

type FilterChipProps = {
  label: string;
  param: string;
  value: string;
  currentValue: string | undefined;
  q: string | undefined;
  country: string | undefined;
  classFilter: string | undefined;
};

function buildChipHref({
  param,
  value,
  currentValue,
  q,
  country,
  classFilter,
}: Omit<FilterChipProps, "label">): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);

  // Toggle: clicking active chip removes it
  if (param === "class") {
    const nextClass = currentValue === value ? undefined : value;
    if (nextClass) params.set("class", nextClass);
    if (country) params.set("country", country);
  } else if (param === "country") {
    const nextCountry = currentValue === value ? undefined : value;
    if (classFilter) params.set("class", classFilter);
    if (nextCountry) params.set("country", nextCountry);
  }

  const qs = params.toString();
  return `/search${qs ? `?${qs}` : ""}`;
}

function FilterChip({
  label,
  param,
  value,
  currentValue,
  q,
  country,
  classFilter,
}: FilterChipProps) {
  const isActive = currentValue === value;
  const href = buildChipHref({ param, value, currentValue, q, country, classFilter });

  return (
    <Link
      href={href}
      className={
        isActive
          ? "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-neutral-800 bg-neutral-900 text-white transition-colors duration-150"
          : "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-neutral-300 bg-white text-neutral-700 hover:ring-neutral-400 hover:bg-neutral-50 transition-colors duration-150"
      }
    >
      {label}
    </Link>
  );
}

// ─── Place card ───────────────────────────────────────────────────────────────

function PlaceCard({ slug, entry }: { slug: string; entry: PlaceRegistryEntry }) {
  return (
    <li>
      <Link
        href={`/places/${slug}`}
        className="block h-full rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors duration-150 px-5 py-4 bg-white group"
      >
        <span className="block text-sm font-semibold text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors duration-150">
          {entry.name}
        </span>
        <dl className="text-xs text-neutral-500 space-y-1">
          <div className="flex gap-2">
            <dt className="shrink-0">Class</dt>
            <dd className="text-neutral-700 capitalize">{entry.class.replace("_", " ")}</dd>
          </div>
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
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: HistoricalEvent }) {
  const year = new Date(event.timeStart).getUTCFullYear();

  return (
    <li>
      <Link
        href={`/events/${event.slug}`}
        className="block h-full rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors duration-150 px-5 py-4 bg-white group"
      >
        <span className="block text-sm font-semibold text-neutral-900 mb-2 group-hover:text-neutral-600 transition-colors duration-150">
          {event.name}
        </span>
        <dl className="text-xs text-neutral-500 space-y-1">
          <div className="flex gap-2">
            <dt className="shrink-0">Type</dt>
            <dd className="text-neutral-700 capitalize">{event.eventClass}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0">Year</dt>
            <dd className="text-neutral-700">{year}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-neutral-500 leading-relaxed line-clamp-2">
          {event.summary}
        </p>
      </Link>
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CLASS_CHIPS: { label: string; value: PlaceClass }[] = [
  { label: "Peak", value: "peak" },
  { label: "Glacier", value: "glacier" },
  { label: "Lake", value: "lake" },
  { label: "River point", value: "river_point" },
  { label: "Trek destination", value: "trek_destination" },
  { label: "City", value: "city" },
];

const COUNTRY_CHIPS: { label: string; value: string }[] = [
  { label: "Nepal", value: "Nepal" },
  { label: "India", value: "India" },
  { label: "Pakistan", value: "Pakistan" },
];

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const classFilter = typeof params.class === "string" ? (params.class as PlaceClass) : undefined;
  const countryFilter = typeof params.country === "string" ? params.country : undefined;

  // ── Filter places ──────────────────────────────────────────────────────────
  const placeResults = Object.entries(PLACE_REGISTRY).filter(([, entry]) => {
    if (!matchPlace(entry, q)) return false;
    if (classFilter && entry.class !== classFilter) return false;
    if (countryFilter && entry.country !== countryFilter) return false;
    return true;
  });

  // ── Filter events (no class/country filter — events span regions) ──────────
  const eventResults = HISTORICAL_EVENTS.filter((event) => matchEvent(event, q));

  const hasResults = placeResults.length > 0 || eventResults.length > 0;
  const totalPlaces = Object.keys(PLACE_REGISTRY).length;
  const totalEvents = HISTORICAL_EVENTS.length;

  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-16 max-w-4xl mx-auto">
        {/* Header */}
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight`}
        >
          Search
        </h1>
        <p className="text-lg text-neutral-600 leading-relaxed mb-8">
          Search {totalPlaces} places and {totalEvents} events.
        </p>

        {/* Search form */}
        <form method="GET" action="/search" className="flex gap-2 mb-4">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Try 'Everest' or 'Annapurna'…"
            className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-colors duration-150"
            aria-label="Search query"
          />
          {/* Preserve existing class/country filters across submit */}
          {classFilter && <input type="hidden" name="class" value={classFilter} />}
          {countryFilter && <input type="hidden" name="country" value={countryFilter} />}
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors duration-150"
          >
            Search
          </button>
        </form>

        {/* Filter chips — class */}
        <fieldset className="flex flex-wrap gap-2 mt-4 border-none p-0 m-0 min-w-0">
          <legend className="sr-only">Filter by class</legend>
          {CLASS_CHIPS.map(({ label, value }) => (
            <FilterChip
              key={value}
              label={label}
              param="class"
              value={value}
              currentValue={classFilter}
              q={q || undefined}
              country={countryFilter}
              classFilter={classFilter}
            />
          ))}
        </fieldset>

        {/* Filter chips — country */}
        <fieldset className="flex flex-wrap gap-2 mt-2 pb-8 border-b border-neutral-100 border-x-0 border-t-0 p-0 m-0 min-w-0">
          <legend className="sr-only">Filter by country</legend>
          {COUNTRY_CHIPS.map(({ label, value }) => (
            <FilterChip
              key={value}
              label={label}
              param="country"
              value={value}
              currentValue={countryFilter}
              q={q || undefined}
              country={countryFilter}
              classFilter={classFilter}
            />
          ))}
        </fieldset>

        {/* Results */}
        {hasResults ? (
          <div className="mt-8 space-y-10">
            {/* Places section */}
            {placeResults.length > 0 && (
              <section aria-label="Place results">
                <h2 className="text-base font-semibold text-neutral-900 mb-4">
                  Places{" "}
                  <span className="font-normal text-neutral-500">({placeResults.length})</span>
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {placeResults.map(([slug, entry]) => (
                    <PlaceCard key={slug} slug={slug} entry={entry} />
                  ))}
                </ul>
              </section>
            )}

            {/* Events section */}
            {eventResults.length > 0 && (
              <section aria-label="Event results">
                <h2 className="text-base font-semibold text-neutral-900 mb-4">
                  Events{" "}
                  <span className="font-normal text-neutral-500">({eventResults.length})</span>
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eventResults.map((event) => (
                    <EventCard key={event.slug} event={event} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        ) : (
          <p className="text-neutral-500 mt-8">
            {q || classFilter || countryFilter
              ? "No results. Try a different query or remove a filter."
              : "Enter a search term to find places and events."}
          </p>
        )}
      </div>
    </main>
  );
}
