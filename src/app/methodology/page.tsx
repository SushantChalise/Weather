import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Methodology — Himalayan Atlas",
  description: "How Himalayan Atlas sources, validates, and presents climate data.",
  openGraph: {
    title: "Methodology — Himalayan Atlas",
    description: "How Himalayan Atlas sources, validates, and presents climate data.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Methodology — Himalayan Atlas",
    description: "How Himalayan Atlas sources, validates, and presents climate data.",
  },
};

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-24 max-w-2xl mx-auto">
        {/* Page title */}
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight`}
        >
          Methodology
        </h1>

        {/* Lead */}
        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed italic mb-4 max-w-prose">
          How Himalayan Atlas sources, validates, transforms, and presents climate data.
        </p>

        {/* 1. Why methodology matters */}
        <section id="why" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-3">
            <a href="#why" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Why methodology matters
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            Himalayan Atlas exists to be a trustworthy reference. That means every chart and number
            must be traceable to a peer-reviewed dataset, with version, license, and citation
            visible to the reader. This page documents how we source, validate, transform, and
            present that data.
          </p>
        </section>

        {/* 2. The 4-stage ingestion pipeline */}
        <section id="pipeline" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-3">
            <a href="#pipeline" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            The 4-stage ingestion pipeline
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose mb-4">
            Each external dataset goes through four mandatory stages before any data reaches a
            chart:
          </p>
          <ul className="list-disc list-inside text-neutral-700 leading-relaxed max-w-prose space-y-2 mb-4">
            <li>
              <strong>Scrape</strong> — download from the official source, preserve manifests,
              license, and version
            </li>
            <li>
              <strong>Validate</strong> — schema checks, spatial bounds, missing-data thresholds,
              monotonicity (time, altitude)
            </li>
            <li>
              <strong>Transform</strong> — units, projections, derived fields, NA handling
            </li>
            <li>
              <strong>Load</strong> — idempotent UPSERT into Postgres with{" "}
              <code className="text-sm bg-neutral-100 px-1 py-0.5 rounded">
                (time, place, variable, source)
              </code>{" "}
              keys
            </li>
          </ul>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            If any stage fails, the pipeline aborts before bad data reaches the database. Manifests
            are checksummed; re-running a pipeline doesn&rsquo;t duplicate rows.
          </p>
        </section>

        {/* 3. Source attribution */}
        <section id="attribution" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-3">
            <a href="#attribution" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Source attribution
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose mb-4">
            Every chart, every number on Himalayan Atlas links to a source dataset via the{" "}
            <code className="text-sm bg-neutral-100 px-1 py-0.5 rounded">&lt;CitationPill&gt;</code>{" "}
            component. Click any pill to see:
          </p>
          <ul className="list-disc list-inside text-neutral-700 leading-relaxed max-w-prose space-y-2 mb-4">
            <li>Dataset name and version</li>
            <li>License (CC-BY, public domain, or restricted)</li>
            <li>Full bibliographic citation</li>
            <li>Spatial and temporal resolution</li>
            <li>Direct link to the upstream source</li>
          </ul>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            We never strip a number from its source.
          </p>
        </section>

        {/* 4. Uncertainty bands */}
        <section id="uncertainty" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-3">
            <a href="#uncertainty" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Uncertainty bands
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose mb-4">
            Climate data is uncertain. Charts that show projections always show:
          </p>
          <ul className="list-disc list-inside text-neutral-700 leading-relaxed max-w-prose space-y-2 mb-4">
            <li>Multi-model spread (the range across CMIP6 GCMs)</li>
            <li>Confidence intervals where the source provides them</li>
            <li>Missing-data gaps as broken lines, not interpolated curves</li>
          </ul>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            We show distributions, not single lines. Single-line forecasts are misleading.
          </p>
        </section>

        {/* 5. Reanalysis vs observation */}
        <section id="reanalysis" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-3">
            <a href="#reanalysis" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Reanalysis vs observation
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            Some sources are reanalysis (model outputs constrained by observations — ERA5), others
            are direct observation (CHIRPS-blended gauges, MODIS satellite). We label which is which
            on every chart and pill. Reanalysis is internally consistent across space and time;
            observations are ground truth at points but sparse.
          </p>
        </section>

        {/* 6. Versioning */}
        <section id="versioning" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-3">
            <a href="#versioning" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Versioning
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            Every pipeline output is tagged with the source dataset version (e.g., ERA5 monthly
            aggregates, RGI v7.0). When upstream sources release new versions, we re-ingest and
            version the table; old data is archived, not overwritten in place.
          </p>
        </section>

        {/* 7. Limitations */}
        <section id="limitations" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-3">
            <a href="#limitations" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Limitations
          </h2>
          <ul className="list-disc list-inside text-neutral-700 leading-relaxed max-w-prose space-y-2 mb-4">
            <li>Reanalysis bias in mountain terrain — we cross-check with CHIRPS where possible</li>
            <li>
              0.1° spatial resolution = 11 km grid cell; sub-grid features (a single peak&rsquo;s
              microclimate) aren&rsquo;t resolved
            </li>
            <li>Glacier outlines are static snapshots — they age between RGI versions</li>
            <li>Air-quality coverage is sparse outside Kathmandu and Pokhara</li>
          </ul>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            We aim to flag limitations on each visualization rather than hide them.
          </p>
        </section>

        {/* 8. How to cite us */}
        <section id="cite-us" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-3">
            <a href="#cite-us" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            How to cite us
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose mb-4">
            When citing Himalayan Atlas, use the following format:
          </p>
          <blockquote className="border-l-2 border-neutral-300 pl-4 text-neutral-600 leading-relaxed max-w-prose italic mb-4">
            Himalayan Atlas (2026). [Page or chart title]. Data: &#123;dataset_list&#125;. Retrieved
            [date] from https://himalayan-atlas.vercel.app/&#123;path&#125;.
          </blockquote>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            When in doubt, cite the underlying dataset (per its citation field) — we are an
            aggregator, not a primary source.
          </p>
        </section>
      </div>
    </main>
  );
}
