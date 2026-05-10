/**
 * mobile-card-stack.tsx — Mobile UX (< 768px)
 *
 * Tap-to-advance card stack — coherent narrative without scroll-scrub video.
 * Per Gemini's review: NOT a "graveyard of static charts" — own coherent UX.
 *
 * Color grammar (§7): ice = #7DD3FC for progress bar, nav dots.
 * Ease: Material standard cubic-bezier(0.4, 0, 0.2, 1) for card transitions.
 */
"use client";

import NextImage from "next/image";
import { useState } from "react";

import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "./citation-chip";

type ChapterId = "ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";

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

const CHAPTERS = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"] as const;

type Props = {
  provenance: Record<ChapterId, Provenance>;
};

export function MobileCardStack({ provenance }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [peelOpenFor, setPeelOpenFor] = useState<string | null>(null);

  const current = CHAPTERS[currentIdx] as ChapterId;
  const prov = provenance[current];

  const handlePrev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const handleNext = () => setCurrentIdx((i) => Math.min(CHAPTERS.length - 1, i + 1));

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col">
      {/* Progress bar — ice colour per grammar */}
      <div className="flex gap-1 p-3 pt-4" aria-hidden="true">
        {CHAPTERS.map((c, i) => (
          <div
            key={c}
            className="flex-1 h-1 rounded transition-all duration-300"
            style={{
              backgroundColor: i <= currentIdx ? "#7DD3FC" : "rgba(255,255,255,0.15)",
              // Material standard ease
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ))}
      </div>

      {/* Chapter counter */}
      <p className="text-slate-500 text-xs px-4 mb-2">
        {currentIdx + 1} / {CHAPTERS.length}
      </p>

      {/* Card */}
      <article
        className="flex-1 flex flex-col px-4"
        aria-label={`Chapter ${currentIdx}: ${CHAPTER_TITLES[current]}`}
      >
        {/* Poster image */}
        <div className="relative rounded-xl overflow-hidden mb-5" style={{ aspectRatio: "16/9" }}>
          <NextImage
            src={`/water-cycle/${current}/poster.jpg`}
            alt={`${CHAPTER_TITLES[current]} — static poster`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Title + subtitle */}
        <h2 className="text-white text-2xl font-serif font-bold leading-tight">
          {CHAPTER_TITLES[current]}
        </h2>
        <p className="text-slate-400 text-sm mt-1">{CHAPTER_SUBTITLES[current]}</p>

        {/* Chapter caption */}
        <p className="text-white/70 text-sm mt-3 leading-relaxed">{prov.caption_text}</p>

        {/* Headline numbers */}
        {prov.headline_numbers.length > 0 && (
          <ul className="mt-4 space-y-2">
            {prov.headline_numbers.map((n) => (
              <li key={`${n.value}-${n.label}`} className="flex gap-3 items-start">
                <span
                  className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#7DD3FC" }}
                  aria-hidden="true"
                />
                <div>
                  <span className="text-white font-bold tabular-nums text-sm">{n.value}</span>
                  <span className="text-slate-400 text-xs ml-2">{n.label}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Citation chip */}
        <div className="mt-4">
          <CitationChip
            sources={
              prov.scene_layers.length > 0
                ? prov.scene_layers.map((l) => l.source.dataset)
                : ["ICIMOD 2026"]
            }
            onShowAll={() => setPeelOpenFor(current)}
          />
        </div>
      </article>

      {/* Navigation */}
      <div className="p-4 flex justify-between items-center border-t border-white/10">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className={[
            "px-4 py-2 rounded text-sm font-medium",
            "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-slate-950",
            "transition-colors duration-150",
            currentIdx === 0
              ? "text-slate-600 cursor-not-allowed"
              : "text-white hover:text-sky-300",
          ].join(" ")}
          aria-label="Previous chapter"
        >
          ← Back
        </button>

        {/* Dot indicators */}
        <div className="flex gap-2" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrentIdx(i)}
              className="w-2 h-2 rounded-full transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-sky-400"
              style={{
                backgroundColor: i === currentIdx ? "#7DD3FC" : "rgba(255,255,255,0.2)",
              }}
              aria-label={`Go to chapter ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIdx === CHAPTERS.length - 1}
          className={[
            "px-4 py-2 rounded text-sm font-medium",
            "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-slate-950",
            "transition-colors duration-150",
            currentIdx === CHAPTERS.length - 1
              ? "text-slate-600 cursor-not-allowed"
              : "text-white hover:text-sky-300",
          ].join(" ")}
          aria-label="Next chapter"
        >
          Next →
        </button>
      </div>

      {/* Closing thesis at end */}
      {currentIdx === CHAPTERS.length - 1 && (
        <div className="px-4 py-8 border-t border-white/10 text-center">
          <p className="text-xl font-serif font-bold">
            <span style={{ color: "#7DD3FC" }}>The glacier was your reservoir.</span>
            <br />
            <span style={{ color: "#F87171" }}>We are draining it.</span>
          </p>
        </div>
      )}

      {/* Provenance peel modal (full-screen on mobile per spec) */}
      {peelOpenFor && (
        <div
          className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Data sources"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-900/95 py-2">
              <h3 className="text-white font-bold text-sm">
                Sources: {CHAPTER_TITLES[peelOpenFor as ChapterId]}
              </h3>
              <button
                type="button"
                onClick={() => setPeelOpenFor(null)}
                aria-label="Close data sources"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                ×
              </button>
            </div>
            <p className="text-slate-400 text-sm">
              Full source data is available in the provenance files for each chapter. Blender render
              tasks will populate full citations.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
