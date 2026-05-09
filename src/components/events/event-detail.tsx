import Link from "next/link";
import type { HistoricalEvent } from "@/data/events";

const CLASS_BADGE: Record<
  HistoricalEvent["eventClass"],
  { bg: string; text: string; label: string }
> = {
  avalanche: { bg: "bg-blue-100", text: "text-blue-900", label: "Avalanche" },
  flood: { bg: "bg-teal-100", text: "text-teal-900", label: "Flood" },
  drought: { bg: "bg-amber-100", text: "text-amber-900", label: "Drought" },
  earthquake: { bg: "bg-red-100", text: "text-red-900", label: "Earthquake" },
  fire: { bg: "bg-orange-100", text: "text-orange-900", label: "Fire" },
  cyclone: { bg: "bg-indigo-100", text: "text-indigo-900", label: "Cyclone" },
  other: { bg: "bg-neutral-100", text: "text-neutral-900", label: "Other" },
};

function formatDateRange(timeStart: string, timeEnd?: string): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const start = new Date(timeStart);

  if (!timeEnd) {
    return fmt.format(start);
  }

  const end = new Date(timeEnd);
  const startMonth = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(start);
  const endMonth = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(end);
  const startYear = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "UTC",
  }).format(start);
  const endYear = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "UTC",
  }).format(end);

  if (startMonth === endMonth && startYear === endYear) {
    const startDay = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      timeZone: "UTC",
    }).format(start);
    const endDay = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      timeZone: "UTC",
    }).format(end);
    return `${startDay}–${endDay} ${startMonth} ${startYear}`;
  }

  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

type EventDetailProps = {
  event: HistoricalEvent;
};

export function EventDetail({ event }: EventDetailProps) {
  const badge = CLASS_BADGE[event.eventClass];
  const dateRange = formatDateRange(event.timeStart, event.timeEnd);

  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      {/* Back link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-6"
      >
        &larr; All events
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
          <span className="text-sm text-neutral-500">{dateRange}</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{event.name}</h1>
      </header>

      {/* Affected places */}
      {event.affectedPlaces.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Affected places
          </h2>
          <div className="flex flex-wrap gap-2">
            {event.affectedPlaces.map((slug) => (
              <Link
                key={slug}
                href={`/places/${slug}`}
                className="inline-block rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                {slug}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Summary */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
          Summary
        </h2>
        <p className="text-base text-neutral-700 leading-relaxed">{event.summary}</p>
      </section>

      {/* Placeholder — Weather data */}
      <section className="mb-6">
        <div className="rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center">
          <p className="text-sm font-medium text-neutral-400">
            Weather data on this date — being ingested
          </p>
        </div>
      </section>

      {/* Placeholder — ICIMOD hazard data */}
      <section className="mb-8">
        <div className="rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center">
          <p className="text-sm font-medium text-neutral-400">
            ICIMOD hazard data — being ingested
          </p>
        </div>
      </section>

      {/* Footer note */}
      <footer className="border-t border-neutral-100 pt-4">
        <p className="text-xs text-neutral-400">
          Sources will be cited via CitationPill once data is wired
        </p>
      </footer>
    </article>
  );
}
