import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Glossary — Himalayan Atlas",
  description:
    "Definitions for climate and atmospheric-science terms used across the Himalayan Atlas.",
  openGraph: {
    title: "Glossary — Himalayan Atlas",
    description:
      "Definitions for climate and atmospheric-science terms used across the Himalayan Atlas.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glossary — Himalayan Atlas",
    description:
      "Definitions for climate and atmospheric-science terms used across the Himalayan Atlas.",
  },
};

const terms = [
  {
    id: "anomaly",
    term: "Anomaly",
    definition:
      "A deviation from a long-term average. We typically compare today’s value to a 30-year normal (1991–2020); the difference is the anomaly. Positive = warmer/wetter than normal.",
  },
  {
    id: "baseline-period",
    term: "Baseline period",
    definition:
      "The fixed reference window for “normal”. The Atlas uses 1991–2020 (the latest WMO standard). Different baselines give different anomalies, so we always cite ours.",
  },
  {
    id: "climatology",
    term: "Climatology",
    definition:
      "The set of long-term average climate conditions for a place. Typically expressed as monthly or daily means plus percentile bands across a 30-year window.",
  },
  {
    id: "confidence-interval",
    term: "Confidence interval",
    definition:
      "A range that captures the uncertainty in an estimate. E.g., a P25–P75 band shows where 50 % of past observations fell, given the variability of the climate.",
  },
  {
    id: "broken-line-missing-data",
    term: "Broken-line missing data",
    definition:
      "A chart convention: when data is missing, the line breaks rather than interpolating across the gap. Prevents misleading smoothing.",
  },
  {
    id: "brightness-temperature",
    term: "Brightness temperature",
    definition:
      "The temperature an object would have if it emitted the same infrared radiation as a black body. Used in satellite cloud detection (Himawari Band 13, ~10.4 µm).",
  },
  {
    id: "enso",
    term: "ENSO",
    definition:
      "El Niño–Southern Oscillation. The dominant year-to-year climate variability in the tropical Pacific, with strong teleconnections to Himalayan monsoon strength.",
  },
  {
    id: "freezing-level",
    term: "Freezing level",
    definition:
      "The altitude at which the atmospheric temperature reaches 0°C. Critical for snow vs rain transitions and climbing-window planning.",
  },
  {
    id: "glof",
    term: "GLOF",
    definition:
      "Glacial Lake Outburst Flood. A catastrophic release when a moraine-dammed glacial lake fails. Risk is increasing as glaciers retreat and lakes grow (e.g., Imja Tsho).",
  },
  {
    id: "infrared",
    term: "Infrared (IR)",
    definition:
      "Electromagnetic radiation longer than visible. Thermal IR (8–14 µm) is what satellites use to detect clouds at night.",
  },
  {
    id: "mass-balance-geodetic",
    term: "Mass balance (geodetic)",
    definition:
      "Glacier mass change measured by elevation differencing of DEMs. Used by Hugonnet et al. 2021 for the global glacier database.",
  },
  {
    id: "mass-balance-glaciological",
    term: "Mass balance (glaciological)",
    definition:
      "Glacier mass change measured directly by stake measurements and snow pits in the field. Sparse but ground-truth.",
  },
  {
    id: "monsoon-onset",
    term: "Monsoon onset",
    definition:
      "The date the monsoon arrives at a place. For Nepal, typically June 10–20 (with strong year-to-year variability). Marked by sustained rainfall above a threshold.",
  },
  {
    id: "monsoon-timing",
    term: "Monsoon timing",
    definition:
      "Refers to monsoon onset, withdrawal, and total duration. Climate change is shifting these — onset has been later in some regions.",
  },
  {
    id: "monsoon-withdrawal",
    term: "Monsoon withdrawal",
    definition:
      "The end of the monsoon season. For Nepal, typically late September to early October.",
  },
  {
    id: "normal",
    term: "Normal",
    definition: "Same as baseline — the long-term average for a place at a given time of year.",
  },
  {
    id: "percentile-bands",
    term: "Percentile bands",
    definition:
      "Pre-computed P5/P25/P50/P75/P95 values from the climatology. Used to show “is today inside the typical range, or unusually warm/wet?”.",
  },
  {
    id: "reanalysis",
    term: "Reanalysis",
    definition:
      "A model output constrained by past observations to produce a continuous climate record. ERA5 is the canonical example. Internally consistent but biased in mountain terrain.",
  },
  {
    id: "return-period",
    term: "Return period",
    definition:
      "The average time between events of a given size. A “100-year flood” has a 1 % chance per year of occurring.",
  },
  {
    id: "snow-line",
    term: "Snow line",
    definition:
      "The lowest altitude with continuous snow cover. Rises in summer, falls in winter. Trending upward as climate warms.",
  },
];

export default function GlossaryPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-24 max-w-2xl mx-auto">
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight`}
        >
          Glossary
        </h1>
        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-prose">
          Definitions for climate and atmospheric-science terms used across the Atlas.
        </p>

        <dl className="mt-12 space-y-6">
          {terms.map(({ id, term, definition }) => (
            <div key={id} id={id}>
              <dt className="font-semibold text-neutral-900">{term}</dt>
              <dd className="text-neutral-700 leading-relaxed mt-1">{definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
