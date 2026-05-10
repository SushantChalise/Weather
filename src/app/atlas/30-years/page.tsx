import type { Metadata } from "next";
import { Suspense } from "react";
import { Atlas30YearsClient } from "@/components/scene/atlas-30-years-client";

export const metadata: Metadata = {
  title: "30 Years of Himalayan Glacier Loss — Himalayan Atlas",
  description:
    "Watch every glacier in the Hindu Kush Himalaya shrink across four decades. Real ICIMOD outlines from 1990, 2000, 2010, 2020.",
  openGraph: {
    title: "30 Years of Himalayan Glacier Loss — Himalayan Atlas",
    description:
      "Watch every glacier in the Hindu Kush Himalaya shrink across four decades. Real ICIMOD outlines from 1990, 2000, 2010, 2020.",
    type: "website",
    images: [
      {
        url: "/og?title=30+Years+of+Himalayan+Glacier+Loss&subtitle=Hindu+Kush+Himalaya+%C2%B7+ICIMOD+1990%E2%80%932020&accent=%231a3a5c",
        width: 1200,
        height: 630,
        alt: "30 Years of Himalayan Glacier Loss",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "30 Years of Himalayan Glacier Loss — Himalayan Atlas",
    description:
      "Watch every glacier in the Hindu Kush Himalaya shrink across four decades. Real ICIMOD outlines from 1990, 2000, 2010, 2020.",
  },
};

export default function Atlas30YearsPage() {
  return (
    <Suspense>
      <Atlas30YearsClient />
    </Suspense>
  );
}
