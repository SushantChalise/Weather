import { Source_Serif_4 } from "next/font/google";
import Link from "next/link";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

type NavCard = {
  label: string;
  description: string;
  href: string;
};

const NAV_CARDS: NavCard[] = [
  {
    label: "Atlas",
    description: "Browse the homepage and interactive mountain weather map.",
    href: "/",
  },
  {
    label: "Places",
    description: "Start with Everest Base Camp — weather, routes, and conditions.",
    href: "/places/ebc",
  },
  {
    label: "Events",
    description: "Browse historical Himalayan climate events and anomaly records.",
    href: "/events",
  },
  {
    label: "About",
    description: "Learn about the project mission, data sources, and methodology.",
    href: "/about",
  },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <main className="flex-1 px-4 pt-12 pb-16 md:pt-24 max-w-2xl mx-auto w-full">
        {/* Heading */}
        <h1
          className={`${sourceSerif.className} text-4xl md:text-5xl font-semibold text-[var(--color-text-primary)] mb-4 tracking-tight`}
        >
          Off the map
        </h1>

        {/* Body copy */}
        <p className="text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed mb-10 max-w-prose">
          The page you&rsquo;re looking for isn&rsquo;t here. It may have moved, or it never existed
          at this URL. Try one of these instead:
        </p>

        {/* Navigation cards — 2×2 grid on desktop, single column on mobile */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NAV_CARDS.map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="block rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors duration-150 px-5 py-4 bg-[var(--color-surface)] group"
              >
                <span className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-accent)] transition-colors duration-150">
                  {card.label}
                </span>
                <span className="block text-sm text-[var(--color-text-secondary)] leading-snug">
                  {card.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Himalayan Atlas &mdash; modern frontend for Himalayan weather and climate data
        </p>
      </footer>
    </div>
  );
}
