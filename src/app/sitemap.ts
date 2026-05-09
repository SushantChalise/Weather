import type { MetadataRoute } from "next";
import { HISTORICAL_EVENTS } from "@/data/events";
import { PLACE_REGISTRY } from "@/data/places";

const BASE_URL = "https://himalayan-atlas.vercel.app"; // TODO: extract to env var (NEXT_PUBLIC_SITE_URL) once production domain settles

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...Object.keys(PLACE_REGISTRY).map((slug) => ({
      url: `${BASE_URL}/places/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...HISTORICAL_EVENTS.map((event) => ({
      url: `${BASE_URL}/events/${event.slug}`,
      lastModified: new Date(event.timeStart),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
