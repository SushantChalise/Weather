import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetail } from "@/components/events/event-detail";
import { HISTORICAL_EVENTS } from "@/data/events";

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

  return (
    <main className="min-h-screen bg-white">
      <EventDetail event={event} />
    </main>
  );
}
