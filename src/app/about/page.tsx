import { Source_Serif_4 } from "next/font/google";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata = {
  title: "About — Himalayan Atlas",
  description:
    "Project mission, the four-tab mental model, active data sources, and forthcoming integrations for Himalayan Atlas.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="px-4 py-12 md:py-24 max-w-2xl mx-auto">
        {/* Site title */}
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight`}
        >
          Himalayan Atlas
        </h1>

        {/* Lead tagline */}
        <p className="text-lg md:text-xl text-neutral-600 leading-relaxed italic mb-4 max-w-prose">
          The modern frontend for Himalayan weather and climate data — past, present, and future.
        </p>

        {/* Mission */}
        <section id="mission" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-4">
            <a href="#mission" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Mission
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            Himalayan Atlas is the modern frontend for Himalayan weather and climate data — past,
            present, and future.
          </p>
        </section>

        {/* Why this exists */}
        <section id="why" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-4">
            <a href="#why" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Why this exists
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose">
            Himalayan weather and climate data is fragmented across institutions: ICIMOD, NASA,
            ECMWF, regional agencies, scientific papers. Each holds part of the picture; none
            assemble it for a general reader. Himalayan Atlas brings these sources together,
            validates them against each other, and presents them as a single coherent view of the
            region — one that anyone with a stake in the Himalayas (trekkers, mountaineers,
            journalists, researchers, locals) can read and trust.
          </p>
        </section>

        {/* The four-tab mental model */}
        <section id="model" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-4">
            <a href="#model" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            The four-tab mental model
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose mb-4">
            Every place in the Atlas has the same four-tab spine, so readers always know where to
            look:
          </p>
          <ul className="list-disc list-inside text-neutral-700 leading-relaxed max-w-prose space-y-2">
            <li>
              <strong>Now</strong> — what&rsquo;s happening right now: weather, cloud cover, snow
              line
            </li>
            <li>
              <strong>Now vs Normal</strong> — how today compares to the 30-year average
            </li>
            <li>
              <strong>Last 30 Years</strong> — how the climate has changed since 1991
            </li>
            <li>
              <strong>Future</strong> — what climate models project for the rest of this century
            </li>
          </ul>
        </section>

        {/* Active data sources */}
        <section id="data" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-4">
            <a href="#data" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Active data sources
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose mb-4">
            Currently in production:
          </p>
          <ul className="list-disc list-inside text-neutral-700 leading-relaxed max-w-prose space-y-2">
            <li>
              <strong>Open-Meteo</strong> — global weather forecasts, free and open, used for live
              conditions on every place page
            </li>
            <li>
              <strong>Himawari-9 (Band 13, thermal IR)</strong> — geostationary satellite, 30-minute
              cloud imagery over Asia-Pacific
            </li>
            <li>
              <strong>Vercel Blob</strong> — tile storage for processed satellite imagery
            </li>
            <li>
              <strong>Neon Postgres + PostGIS + TimescaleDB</strong> — primary database for places,
              time-series observations, glacier outlines, and climate projections
            </li>
          </ul>
        </section>

        {/* Forthcoming sources */}
        <section id="forthcoming" className="mt-12">
          <h2 className="font-medium text-xl text-neutral-900 mt-12 mb-4">
            <a href="#forthcoming" className="text-xs text-neutral-400 mr-2 align-middle">
              ¶
            </a>
            Forthcoming sources
          </h2>
          <p className="text-neutral-700 leading-relaxed max-w-prose mb-4">Being integrated:</p>
          <ul className="list-disc list-inside text-neutral-700 leading-relaxed max-w-prose space-y-2">
            <li>
              <strong>ICIMOD</strong> — Hindu Kush Himalayan glacier mass balance, hydromet
              stations, hazard data
            </li>
            <li>
              <strong>ERA5 + ERA5-Land</strong> — Copernicus reanalysis, the climate-record backbone
              (1940–present)
            </li>
            <li>
              <strong>CHIRPS</strong> — gauge-blended precipitation, monsoon-aware
            </li>
            <li>
              <strong>Hugonnet et al. 2021</strong> — per-glacier elevation change rates, 2000–2019
            </li>
            <li>
              <strong>Randolph Glacier Inventory v7</strong> — canonical glacier outlines for the
              world
            </li>
            <li>
              <strong>NASA FIRMS</strong> — active fires (MODIS + VIIRS, near-real-time)
            </li>
            <li>
              <strong>OpenAQ</strong> — ground-station air quality (PM2.5, NO₂)
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
