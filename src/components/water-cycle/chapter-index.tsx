/**
 * chapter-index.tsx — Floating chapter navigation
 *
 * Fixed right-side dot nav linking to each chapter section.
 * Hidden on mobile (< 768px) — mobile has MobileCardStack instead.
 * Active chapter highlighted in ice color (#7DD3FC per spec §7).
 *
 * Per spec §7: eases — Material standard for transitions.
 */
"use client";

const CHAPTERS = [
  { id: "ch0", title: "The reservoir" },
  { id: "ch1", title: "The retreat" },
  { id: "ch2", title: "The lake bloom" },
  { id: "ch3", title: "Where it went" },
  { id: "ch4", title: "When it comes" },
  { id: "ch5", title: "The feedback loop" },
  { id: "ch6", title: "The choice" },
] as const;

type Props = {
  active: string;
};

export function ChapterIndex({ active }: Props) {
  return (
    <nav
      className="fixed top-1/2 right-6 -translate-y-1/2 z-50 hidden md:block"
      aria-label="Chapter index"
    >
      <ol className="flex flex-col gap-3">
        {CHAPTERS.map((ch) => {
          const isActive = active === ch.id;
          return (
            <li key={ch.id}>
              <a
                href={`#${ch.id}`}
                className={[
                  "flex items-center gap-2 group",
                  "transition-opacity duration-200",
                  // Material standard ease
                  "transition-[opacity] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]",
                  isActive ? "opacity-100" : "opacity-50 hover:opacity-100",
                ].join(" ")}
                aria-current={isActive ? "true" : "false"}
                aria-label={ch.title}
              >
                {/* Dot — ice colour when active */}
                <span
                  className="block w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-200"
                  style={{
                    backgroundColor: isActive ? "#7DD3FC" : "rgba(255,255,255,0.4)",
                  }}
                  aria-hidden="true"
                />
                {/* Label — only visible on hover */}
                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                  {ch.title}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
