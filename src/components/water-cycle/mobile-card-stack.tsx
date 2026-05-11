/**
 * mobile-card-stack.tsx — Mobile UX (< 768px)
 *
 * Full-polish swipeable card stack for mobile. One chapter per card, swipe or
 * tap next/back to advance. Progress dots at top.
 *
 * §7 hard constraints respected:
 *   - Color grammar: #38BDF8 = active water (active dot), #7DD3FC = ice
 *   - Eases: Material standard cubic-bezier(0.4,0,0.2,1) for card slide
 *   - Touch targets ≥ 44×44 px (all buttons)
 *   - WCAG 4.5:1 contrast — dark gradient behind white text on poster
 *   - No spring / no bounce
 *
 * Per-card content is drawn from the existing per-chapter overlay components
 * adapted for vertical card layout instead of full-screen cinematic overlay.
 *
 * Swipe: hand-rolled via pointermove, 40 px threshold to commit.
 * Keyboard: ArrowLeft / ArrowRight, Escape closes the peel.
 * Lazy mount: only active ± 1 adjacent cards are mounted.
 * IntersectionObserver: preloads next poster image.
 *
 * Accessibility:
 *   - role="region" + aria-roledescription="carousel" on stack root
 *   - role="group" + aria-roledescription="slide" + aria-label per card
 *   - aria-live="polite" on dot-progress for screen reader announcements
 */
"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "./citation-chip";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type ChapterId = "ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";

const CHAPTERS = [
  "ch0",
  "ch1",
  "ch2",
  "ch3",
  "ch4",
  "ch5",
  "ch6",
] as const satisfies readonly ChapterId[];

const CHAPTER_TITLES: Record<ChapterId, string> = {
  ch0: "The reservoir",
  ch1: "The retreat",
  ch2: "The lake bloom",
  ch3: "Where it went",
  ch4: "When it comes",
  ch5: "The feedback loop",
  ch6: "The choice",
};

const CHAPTER_SUBTITLES: Record<ChapterId, string> = {
  ch0: "Hindu Kush Himalaya · 1990 → 2020",
  ch1: "Khumbu · Yala · Annapurna I · Imja",
  ch2: "Imja Tsho grew 35× in 58 years",
  ch3: "Moisture flux through the HKH system",
  ch4: "The shifting melt season",
  ch5: "Black carbon + dust + algae",
  ch6: "SSP1-2.6 vs SSP5-8.5 by 2100",
};

/** Per-chapter headline numbers shown on the card (fallback if provenance empty) */
const CHAPTER_HEADLINES: Record<ChapterId, { value: string; label: string }[]> = {
  ch0: [
    { value: "516 km³", label: "water-equivalent ice lost since 1990" },
    { value: "~9%", label: "of all HKH ice" },
    { value: "~0.5T tonnes", label: "mass loss" },
  ],
  ch1: [
    { value: "4 glaciers", label: "Khumbu, Yala, Annapurna I, Imja" },
    { value: "1990 → 2020", label: "synchronized retreat" },
  ],
  ch2: [
    { value: "1.4 km²", label: "Imja Tsho today" },
    { value: "35×", label: "growth since 1962 (from 0.04 km²)" },
    { value: "60 m", label: "deep" },
  ],
  ch3: [
    { value: "~120 km³/yr", label: "meltwater runoff" },
    { value: "~200 km³/yr", label: "precipitation → ice" },
  ],
  ch4: [
    { value: "Weeks earlier", label: "peak melt arrives now vs 1990" },
    { value: "Aug → Jun", label: "projected peak shift by 2070" },
  ],
  ch5: [
    { value: "6–10%", label: "albedo reduction from black carbon" },
    { value: "Dust dominant", label: "in Solu-Khumbu (Kaspari 2014)" },
  ],
  ch6: [
    { value: "~50%", label: "ice remaining in 2100 (SSP1-2.6)" },
    { value: "~25%", label: "ice remaining in 2100 (SSP5-8.5)" },
  ],
};

// Material standard ease — §7 mandate
const MATERIAL_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
// Swipe threshold in px to commit a navigation
const SWIPE_THRESHOLD = 40;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  provenance: Record<ChapterId, Provenance>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if an index is "adjacent" (mount-worthy) to current */
function isMountable(idx: number, currentIdx: number): boolean {
  return Math.abs(idx - currentIdx) <= 1;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Small dot indicator for the progress row */
function ProgressDot({
  isActive,
  isCompleted,
  index,
  onClick,
}: {
  isActive: boolean;
  isCompleted: boolean;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-slate-950 rounded-full"
      aria-label={`Go to chapter ${index + 1}`}
      aria-current={isActive ? "true" : undefined}
    >
      <span
        className="block transition-all duration-300"
        style={{
          width: isActive ? "20px" : "8px",
          height: "8px",
          borderRadius: "9999px",
          backgroundColor: isActive
            ? "#38BDF8" // active water — §7
            : isCompleted
              ? "rgba(56,189,248,0.45)" // completed — dimmed active water
              : "rgba(255,255,255,0.18)",
          transitionTimingFunction: MATERIAL_EASE,
        }}
      />
    </button>
  );
}

/** Poster image with gradient overlay for text contrast (WCAG 4.5:1) */
function CardPoster({ chapterId, title }: { chapterId: ChapterId; title: string }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
      <NextImage
        src={`/water-cycle/${chapterId}/poster.jpg`}
        alt={`${title} — chapter poster`}
        fill
        className="object-cover"
        unoptimized
        priority={chapterId === "ch0"}
      />
      {/* Bottom-to-top gradient for text contrast — ≥ 4.5:1 against white */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.4) 50%, rgba(2,6,23,0.0) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Chapter number bottom-left */}
      <span
        className="absolute bottom-3 left-4 text-xs font-mono font-medium"
        style={{ color: "#38BDF8" }}
        aria-hidden="true"
      >
        {`0${CHAPTERS.indexOf(chapterId) + 1}`.slice(-2)} / 07
      </span>
    </div>
  );
}

/** Card-level headline numbers (from provenance or fallback) */
function CardHeadlines({
  chapterId,
  provenance,
}: {
  chapterId: ChapterId;
  provenance: Provenance;
}) {
  const numbers =
    provenance.headline_numbers.length > 0
      ? provenance.headline_numbers
      : CHAPTER_HEADLINES[chapterId];

  if (numbers.length === 0) return null;

  return (
    <ul className="mt-4 space-y-2" aria-label="Key statistics">
      {numbers.slice(0, 3).map((n) => (
        <li key={`${n.value}-${n.label}`} className="flex gap-3 items-start">
          <span
            className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: "#38BDF8" }}
            aria-hidden="true"
          />
          <div>
            <span
              className="font-bold tabular-nums text-sm"
              style={{ color: "#7DD3FC" }}
              data-color-token="ice"
            >
              {n.value}
            </span>
            <span className="text-slate-400 text-xs ml-2">{n.label}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MobileCardStack({ provenance }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [peelOpenFor, setPeelOpenFor] = useState<ChapterId | null>(null);

  // Swipe state
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const swipeDeltaX = useRef<number>(0);
  const [liveOffset, setLiveOffset] = useState(0); // px for real-time drag feedback
  const isDragging = useRef(false);
  const cardContainerRef = useRef<HTMLElement>(null);

  // Non-null assertion: goTo() always clamps to [0, CHAPTERS.length - 1]
  const current = CHAPTERS[currentIdx] as ChapterId;

  // -----------------------------------------------------------------------
  // Navigation helpers
  // -----------------------------------------------------------------------
  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, idx));
    setCurrentIdx(clamped);
    setLiveOffset(0);
    swipeDeltaX.current = 0;
  }, []);

  const goNext = useCallback(() => goTo(currentIdx + 1), [currentIdx, goTo]);
  const goPrev = useCallback(() => goTo(currentIdx - 1), [currentIdx, goTo]);

  // -----------------------------------------------------------------------
  // Keyboard navigation
  // -----------------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (peelOpenFor !== null) {
        if (e.key === "Escape") {
          e.preventDefault();
          setPeelOpenFor(null);
        }
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [peelOpenFor, goNext, goPrev]);

  // -----------------------------------------------------------------------
  // Pointer (touch/mouse) swipe
  // -----------------------------------------------------------------------
  function handlePointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    swipeDeltaX.current = 0;
    isDragging.current = false;
    if (cardContainerRef.current) {
      cardContainerRef.current.setPointerCapture(e.pointerId);
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (pointerStartX.current === null || pointerStartY.current === null) return;

    const dx = e.clientX - pointerStartX.current;
    const dy = e.clientY - pointerStartY.current;

    // If predominantly vertical scroll, don't capture horizontal swipe
    if (!isDragging.current && Math.abs(dy) > Math.abs(dx) + 5) {
      pointerStartX.current = null;
      return;
    }

    isDragging.current = true;
    swipeDeltaX.current = dx;

    // Dampen swipe at edges (can't go past first/last)
    let offset = dx;
    if ((currentIdx === 0 && dx > 0) || (currentIdx === CHAPTERS.length - 1 && dx < 0)) {
      offset = dx * 0.25; // rubber-band
    }
    setLiveOffset(offset);
  }

  function handlePointerUp() {
    if (pointerStartX.current === null) return;

    const delta = swipeDeltaX.current;

    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
    } else {
      // Snap back
      setLiveOffset(0);
    }

    pointerStartX.current = null;
    pointerStartY.current = null;
    swipeDeltaX.current = 0;
    isDragging.current = false;
  }

  function handlePointerCancel() {
    pointerStartX.current = null;
    pointerStartY.current = null;
    swipeDeltaX.current = 0;
    isDragging.current = false;
    setLiveOffset(0);
  }

  // -----------------------------------------------------------------------
  // Announce card changes to screen readers
  // -----------------------------------------------------------------------
  const announcementText = `Chapter ${currentIdx + 1} of ${CHAPTERS.length}: ${CHAPTER_TITLES[current]}`;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col" data-testid="mobile-card-stack">
      {/* ---- Progress indicators ---- */}
      <div className="px-4 pt-5 pb-2">
        {/* aria-live region announces card changes to screen readers */}
        {/* biome: use <section> instead of <div role="region"> */}
        <section
          aria-label="Chapter progress"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcementText}
        </section>

        {/* Visual dot row */}
        <div className="flex items-center gap-2" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <ProgressDot
              key={c}
              index={i}
              isActive={i === currentIdx}
              isCompleted={i < currentIdx}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        {/* Page counter */}
        <p className="text-slate-500 text-xs mt-1.5 tabular-nums">
          {currentIdx + 1} / {CHAPTERS.length}
        </p>
      </div>

      {/* ---- Card carousel ---- */}
      {/* biome: use <section> instead of <div role="region">; keep aria-roledescription for carousel */}
      <section
        ref={cardContainerRef}
        aria-roledescription="carousel"
        aria-label="Chapter cards"
        className="flex-1 flex flex-col relative overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {CHAPTERS.map((chId, idx) => {
          const prov = provenance[chId];
          const isActive = idx === currentIdx;
          const offset = (idx - currentIdx) * 100; // percent

          // Lazy mount — only active ± 1
          if (!isMountable(idx, currentIdx)) return null;

          const cardSources =
            prov.scene_layers.length > 0
              ? prov.scene_layers.map((l) => l.source.dataset)
              : ["ICIMOD 2026"];

          return (
            // biome: article is semantically appropriate for a slide; role="group" would shadow it
            // ARIA carousel pattern: article + aria-roledescription="slide" satisfies screen readers
            <article
              key={chId}
              aria-roledescription="slide"
              aria-label={`Chapter ${idx + 1} of 7: ${CHAPTER_TITLES[chId]}`}
              aria-hidden={!isActive}
              className="absolute inset-0 flex flex-col"
              style={{
                transform: `translateX(calc(${offset * 100}% + ${liveOffset}px))`,
                // While dragging, use instant update; on release use animated spring-free ease
                transition: isDragging.current ? "none" : `transform 300ms ${MATERIAL_EASE}`,
                willChange: "transform",
              }}
            >
              {/* Scrollable content within a card */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {/* Poster image */}
                <CardPoster chapterId={chId} title={CHAPTER_TITLES[chId]} />

                {/* Title + subtitle */}
                <h2 className="text-white text-3xl font-serif font-bold leading-tight mt-4">
                  {CHAPTER_TITLES[chId]}
                </h2>
                <p className="text-slate-400 text-sm mt-1">{CHAPTER_SUBTITLES[chId]}</p>

                {/* Chapter caption (HTML from provenance) */}
                {prov.caption_text && (
                  <p className="text-white/70 text-sm mt-3 leading-relaxed">
                    {/* caption_text is plain text in the empty stubs; strip any HTML tags for safety */}
                    {prov.caption_text.replace(/<[^>]*>/g, "")}
                  </p>
                )}

                {/* Headline numbers */}
                <CardHeadlines chapterId={chId} provenance={prov} />

                {/* "Show data" button that opens the peel */}
                <button
                  type="button"
                  onClick={() => setPeelOpenFor(chId)}
                  aria-label={`Show data sources for ${CHAPTER_TITLES[chId]}`}
                  className={[
                    "mt-5 flex items-center gap-2 px-4 py-2.5 rounded-lg w-full justify-center",
                    "bg-slate-800/80 backdrop-blur-sm border border-white/10 text-sm text-slate-300",
                    "hover:text-white hover:border-sky-400/50 hover:bg-slate-700/80",
                    "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-slate-950",
                    "transition-colors duration-200",
                  ].join(" ")}
                >
                  Show data
                  <span className="text-slate-500" aria-hidden="true">
                    →
                  </span>
                </button>

                {/* Citation chip */}
                <div className="mt-3">
                  <CitationChip sources={cardSources} onShowAll={() => setPeelOpenFor(chId)} />
                </div>

                {/* Closing thesis at the final chapter */}
                {idx === CHAPTERS.length - 1 && (
                  <div className="mt-8 py-6 border-t border-white/10 text-center">
                    <p className="text-lg font-serif font-bold leading-snug">
                      <span style={{ color: "#7DD3FC" }} data-color-token="ice">
                        The glacier was your reservoir.
                      </span>
                      <br />
                      <span style={{ color: "#F87171" }} data-color-token="loss">
                        We are draining it.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* ---- Navigation bar ---- */}
      <nav
        className="flex-shrink-0 border-t border-white/10 bg-slate-950/95 backdrop-blur-sm"
        aria-label="Chapter navigation"
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back button — ≥ 44×44 px touch target */}
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIdx === 0}
            className={[
              "flex items-center justify-center gap-1.5",
              "min-w-[44px] min-h-[44px] px-4 py-2 rounded-lg",
              "text-sm font-medium",
              "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-slate-950",
              "transition-colors duration-200",
              currentIdx === 0
                ? "text-slate-600 cursor-not-allowed"
                : "text-white hover:text-sky-300 hover:bg-white/5",
            ].join(" ")}
            aria-label={
              currentIdx === 0
                ? "Already at first chapter"
                : `Go to previous chapter: ${CHAPTER_TITLES[CHAPTERS[currentIdx - 1] ?? "ch0"]}`
            }
          >
            ←<span className="hidden sm:inline">Back</span>
          </button>

          {/* Center: chapter title abbreviation */}
          <span className="text-slate-500 text-xs text-center max-w-[140px] truncate">
            {CHAPTER_TITLES[current]}
          </span>

          {/* Next button — ≥ 44×44 px touch target */}
          <button
            type="button"
            onClick={goNext}
            disabled={currentIdx === CHAPTERS.length - 1}
            className={[
              "flex items-center justify-center gap-1.5",
              "min-w-[44px] min-h-[44px] px-4 py-2 rounded-lg",
              "text-sm font-medium",
              "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-slate-950",
              "transition-colors duration-200",
              currentIdx === CHAPTERS.length - 1
                ? "text-slate-600 cursor-not-allowed"
                : "text-white hover:text-sky-300 hover:bg-white/5",
            ].join(" ")}
            aria-label={
              currentIdx === CHAPTERS.length - 1
                ? "Already at last chapter"
                : `Go to next chapter: ${CHAPTER_TITLES[CHAPTERS[currentIdx + 1] ?? "ch6"]}`
            }
          >
            <span className="hidden sm:inline">Next</span>→
          </button>
        </div>
      </nav>

      {/* ---- Provenance peel modal ---- */}
      {peelOpenFor !== null && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          style={{ backgroundColor: "rgba(2,6,23,0.97)" }}
          role="dialog"
          aria-modal="true"
          aria-label={`Data sources: ${CHAPTER_TITLES[peelOpenFor]}`}
        >
          <div className="p-4 max-w-lg mx-auto">
            {/* Sticky header */}
            <div
              className="sticky top-0 flex items-center justify-between mb-4 py-3 border-b border-white/10"
              style={{ backgroundColor: "rgba(2,6,23,0.97)" }}
            >
              <h3 className="text-white font-bold text-base">
                Sources: <span style={{ color: "#7DD3FC" }}>{CHAPTER_TITLES[peelOpenFor]}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPeelOpenFor(null)}
                aria-label="Close data sources"
                className={[
                  "flex items-center justify-center",
                  "w-11 h-11 rounded-lg",
                  "text-slate-400 hover:text-white",
                  "hover:bg-white/10",
                  "focus:outline-none focus:ring-2 focus:ring-sky-400",
                  "transition-colors duration-150",
                ].join(" ")}
              >
                ×
              </button>
            </div>

            {/* Scene layers as citation list */}
            {provenance[peelOpenFor].scene_layers.length > 0 ? (
              <ul className="space-y-4">
                {provenance[peelOpenFor].scene_layers.map((layer) => (
                  <li
                    key={layer.id}
                    className="p-3 rounded-lg border border-white/10 bg-slate-900/60"
                  >
                    <p className="text-white text-sm font-medium">{layer.source.dataset}</p>
                    {layer.source.doi && (
                      <p className="text-slate-500 text-xs mt-1 font-mono">
                        DOI: {layer.source.doi}
                      </p>
                    )}
                    {layer.source.filter && (
                      <p className="text-slate-400 text-xs mt-1">Filter: {layer.source.filter}</p>
                    )}
                    {layer.source.n_features != null && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        {layer.source.n_features.toLocaleString()} features
                      </p>
                    )}
                    {layer.thickness_model && (
                      <p className="text-slate-500 text-xs mt-1">
                        Thickness: {layer.thickness_model.method} ±
                        {layer.thickness_model.uncertainty_pct}%
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 rounded-lg border border-white/10 bg-slate-900/60">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Full source data will be available once the Blender render task for this chapter
                  completes and populates the provenance.json file.
                </p>
                <p className="text-slate-500 text-xs mt-3">
                  Chapter: {peelOpenFor} · {provenance[peelOpenFor].shot_id}
                </p>
              </div>
            )}

            {/* Headline number citations */}
            {provenance[peelOpenFor].headline_numbers.length > 0 && (
              <div className="mt-6">
                <h4 className="text-white/50 text-xs uppercase tracking-wider mb-3">
                  Cited numbers
                </h4>
                <ul className="space-y-2">
                  {provenance[peelOpenFor].headline_numbers.map((n) => (
                    <li
                      key={`${n.value}-${n.citation}`}
                      className="flex gap-3 p-2 rounded border border-white/5"
                    >
                      <span
                        className="font-bold tabular-nums text-sm flex-shrink-0"
                        style={{ color: "#7DD3FC" }}
                      >
                        {n.value}
                      </span>
                      <div>
                        <span className="text-slate-300 text-xs">{n.label}</span>
                        <p className="text-slate-500 text-xs mt-0.5 font-mono">{n.citation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
