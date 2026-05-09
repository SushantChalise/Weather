import type { Metadata } from "next";
import { EventCard } from "@/components/events/event-card";
import { HISTORICAL_EVENTS } from "@/data/events";

export const metadata: Metadata = {
  title: "Historical Climate Events — Himalayan Atlas",
  description:
    "Archive of significant weather and climate events in the Himalayas, with linked meteorological data.",
  openGraph: {
    title: "Historical Climate Events — Himalayan Atlas",
    description:
      "Archive of significant weather and climate events in the Himalayas, with linked meteorological data.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Historical Climate Events — Himalayan Atlas",
    description:
      "Archive of significant weather and climate events in the Himalayas, with linked meteorological data.",
  },
};

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Historical Climate Events</h1>
        <p className="mt-3 max-w-2xl text-base text-neutral-600">
          A curated archive of significant weather and climate events across the Himalayas. Each
          event will be linked to meteorological observations and ICIMOD hazard datasets as data
          ingestion is completed.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HISTORICAL_EVENTS.map((event) => (
          <EventCard key={event.slug} event={event} />
        ))}
      </div>
    </main>
  );
}
