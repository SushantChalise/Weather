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
  if (!event) return {};
  return {
    title: `${event.name} — Himalayan Atlas`,
    description: event.summary,
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
