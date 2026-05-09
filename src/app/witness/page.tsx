import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import { WitnessForm } from "./page.client";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Climate Witness — Himalayan Atlas",
  description:
    "Share first-hand observations of climate change in the Himalayas. For guides, lodge owners, researchers, and locals.",
  openGraph: {
    title: "Climate Witness — Himalayan Atlas",
    description:
      "Share first-hand observations of climate change in the Himalayas. For guides, lodge owners, researchers, and locals.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Climate Witness — Himalayan Atlas",
    description:
      "Share first-hand observations of climate change in the Himalayas. For guides, lodge owners, researchers, and locals.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-16 max-w-2xl mx-auto">
        {/* Beta banner */}
        <div className="mb-6 px-4 py-2 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Beta — submissions are not yet stored. Real intake coming soon.
        </div>

        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight`}
        >
          Climate Witness
        </h1>
        <p className="text-base md:text-lg text-neutral-700 leading-relaxed mb-8 max-w-prose">
          The Himalayas are changing — glaciers retreating, monsoons shifting, lakes growing. The
          people who live and work in these mountains see it first-hand. Share what you&apos;ve
          seen.
        </p>
        <p className="text-sm text-neutral-600 leading-relaxed mb-8 max-w-prose">
          Stories will be reviewed and published with attribution and a link back to the place page
          they relate to.
        </p>

        <WitnessForm />
      </div>
    </main>
  );
}
