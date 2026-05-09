import type { Metadata } from "next";
import { ClimateTimeMachine } from "./page.client";

export const metadata: Metadata = {
  title: "Climate Time Machine — Himalayan Atlas",
  description:
    "Compare today's climate to 30-year normals across the Himalayan Atlas. Slide through decades to see how each variable has changed.",
  openGraph: {
    title: "Climate Time Machine — Himalayan Atlas",
    description:
      "Compare today's climate to 30-year normals across the Himalayan Atlas. Slide through decades to see how each variable has changed.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Climate Time Machine — Himalayan Atlas",
    description:
      "Compare today's climate to 30-year normals across the Himalayan Atlas. Slide through decades to see how each variable has changed.",
  },
};

export default function Page() {
  return <ClimateTimeMachine />;
}
