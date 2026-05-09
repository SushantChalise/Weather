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
  const startDay = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    timeZone: "UTC",
  }).format(start);
  const startMonthYear = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(start);

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
  const endYear = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "UTC",
  }).format(end);

  if (startMonth === endMonth && startMonthYear === `${endMonth} ${endYear}`) {
    const endDay = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      timeZone: "UTC",
    }).format(end);
    return `${startDay}–${endDay} ${startMonth} ${endYear}`;
  }

  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

type EventCardProps = {
  event: HistoricalEvent;
};

export function EventCard({ event }: EventCardProps) {
  const badge = CLASS_BADGE[event.eventClass];
  const dateRange = formatDateRange(event.timeStart, event.timeEnd);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
        >
          {badge.label}
        </span>
        <span className="shrink-0 text-xs text-neutral-500">{dateRange}</span>
      </div>

      <h2 className="mt-3 text-base font-semibold text-neutral-900 leading-snug group-hover:underline">
        {event.name}
      </h2>

      <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{event.summary}</p>

      {event.affectedPlaces.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {event.affectedPlaces.map((place) => (
            <span
              key={place}
              className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"
            >
              {place}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
