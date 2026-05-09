import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceHeader } from "@/components/places/place-header";
import { PlaceTabs } from "@/components/places/place-tabs";
import { PLACE_REGISTRY } from "@/data/places";
import type { Destination, DestinationId } from "@/types/weather";

type PlacePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = PLACE_REGISTRY[slug];
  if (!entry) {
    return { title: "Place Not Found — Himalayan Atlas" };
  }
  const location = entry.region ?? entry.country;
  const title = `${entry.name} — Himalayan Atlas`;
  const description = `Live weather, climate trends, and historical data for ${entry.name}, ${location}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** DestinationId values that the weather API supports */
const WEATHER_DESTINATION_IDS = new Set<string>([
  "pokhara",
  "abc",
  "poon-hill",
  "ebc",
  "chitwan",
  "kathmandu",
  "langtang",
  "jomsom",
]);

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params;

  const entry = PLACE_REGISTRY[slug];

  if (!entry) {
    notFound();
  }

  // Build a Destination-compatible shape for PlaceHeader.
  // We cast `id` because PlaceHeader only renders name/altitude/lat/lon —
  // it never consumes `id` at runtime.
  const place: Destination = {
    id: slug as DestinationId,
    name: entry.name,
    shortLabel: entry.name,
    lat: entry.lat,
    lon: entry.lon,
    altitude: entry.alt,
    corridor: null,
    tripIntent: "trekking",
    preDawnValue: false,
    defaultViewpointId: null,
  };

  const variant = entry.class === "glacier" ? "glacier" : "default";

  // Only pass a DestinationId when the weather API recognises this slug
  const destinationId = WEATHER_DESTINATION_IDS.has(slug) ? (slug as DestinationId) : null;

  return (
    <main className="min-h-screen bg-white">
      <PlaceHeader place={place} />
      <PlaceTabs destinationId={destinationId} lat={entry.lat} lon={entry.lon} variant={variant} />
    </main>
  );
}
