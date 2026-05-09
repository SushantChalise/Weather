import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetail } from "@/components/events/event-detail";
import { HISTORICAL_EVENTS } from "@/data/events";
import { PLACE_REGISTRY } from "@/data/places";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return HISTORICAL_EVENTS.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = HISTORICAL_EVENTS.find((e) => e.slug === slug);
  if (!event) return { title: "Event Not Found — Himalayan Atlas" };
  const title = `${event.name} — Himalayan Atlas`;
  const description =
    event.summary.length > 160 ? `${event.summary.slice(0, 157)}...` : event.summary;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = HISTORICAL_EVENTS.find((e) => e.slug === slug);

  if (!event) {
    notFound();
  }

  // JSON-LD structured data — content sourced entirely from static typed registry (no user input)
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.timeStart,
    description: event.summary,
  };
  if (event.timeEnd) jsonLd.endDate = event.timeEnd;
  const firstPlaceSlug = event.affectedPlaces[0];
  if (firstPlaceSlug && PLACE_REGISTRY[firstPlaceSlug]) {
    const p = PLACE_REGISTRY[firstPlaceSlug];
    jsonLd.location = {
      "@type": "Place",
      name: p.name,
      geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lon },
    };
  }

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD script — statically typed registry data, no user input
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventDetail event={event} />
    </main>
  );
}
