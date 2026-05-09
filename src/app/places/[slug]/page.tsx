import { notFound } from "next/navigation";
import { PlaceHeader } from "@/components/places/place-header";
import { PlaceTabs } from "@/components/places/place-tabs";
import { DESTINATIONS } from "@/data/destinations";

type PlacePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PlacePage({ params }: PlacePageProps) {
  const { slug } = await params;

  const place = DESTINATIONS.find((d) => d.id === slug);

  if (!place) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <PlaceHeader place={place} />
      <PlaceTabs destinationId={place.id} lat={place.lat} lon={place.lon} />
    </main>
  );
}
