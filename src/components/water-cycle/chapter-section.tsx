/**
 * chapter-section.tsx — Sticky-pinned chapter wrapper
 *
 * Each chapter is a full-viewport section containing:
 *   - CinematicVideo (scroll-scrubbed)
 *   - ChapterOverlay (headlines, captions, citation chip, show-data button)
 *   - ProvenancePeel (triggered by overlay button)
 *   - ChapterTranscriptWithMotionDetect (sr-only normally; visible under reduced-motion)
 *
 * Per spec §7: id attr on <section> is used by ScrollTrigger and chapter index.
 * aria-label includes the shot_id for screen readers.
 *
 * T4.1 reduced-motion:
 *   When prefers-reduced-motion: reduce is active, ProvenancePeel is opened by
 *   default (isPeelOpen starts true, or is forced true via the media query).
 *   The transcript article is also rendered visually via ChapterTranscriptWithMotionDetect.
 */
"use client";

import { useEffect, useState } from "react";

import type { Provenance } from "@/lib/water-cycle/types";
import { ChapterOverlay } from "./chapter-overlay";
import { ChapterTranscriptWithMotionDetect } from "./chapter-transcript";
import { CinematicVideo } from "./cinematic-video";
import { ProvenancePeel } from "./provenance-peel";

type ChapterId = "ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";

type Props = {
  chapterId: ChapterId;
  provenance: Provenance;
};

export function ChapterSection({ chapterId, provenance }: Props) {
  // Initialize prefersReduced synchronously so the peel opens on first render
  // rather than waiting for a useEffect tick.  This prevents a flash where the
  // peel is closed before the useEffect fires.
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  // Initialize isPeelOpen to true if reduced-motion is detected synchronously
  const [isPeelOpen, setIsPeelOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // -------------------------------------------------------------------------
  // Detect prefers-reduced-motion and open peel by default when set.
  // Per WATER_CYCLE_SPEC.md §7 hard constraint 3 and docs/water-cycle/06-provenance-peel.md:
  //   "prefers-reduced-motion: reduce → provenance peel is open by default"
  // -------------------------------------------------------------------------
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = mq.matches;
    setPrefersReduced(isReduced);
    if (isReduced) {
      setIsPeelOpen(true);
    }

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
      if (e.matches) {
        // Motion preference just changed to reduce — open peel immediately
        setIsPeelOpen(true);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section
      id={chapterId}
      className="relative min-h-screen"
      aria-label={`Chapter ${chapterId.slice(2)}: ${provenance.shot_id}`}
    >
      {/* Scroll-scrubbed cinematic video (hides itself + shows poster under reduced-motion) */}
      <CinematicVideo
        chapterId={chapterId}
        duration={provenance.duration_s}
        posterUrl={`/water-cycle/${chapterId}/poster.jpg`}
      />

      {/* Per-chapter overlay: headlines, captions, citation chip */}
      <div className="absolute inset-0 z-10">
        <ChapterOverlay
          chapterId={chapterId}
          provenance={provenance}
          onShowProvenance={() => setIsPeelOpen(true)}
        />
      </div>

      {/* Provenance Peel — open by default under reduced-motion; triggered by button otherwise */}
      <ProvenancePeel
        chapterId={chapterId}
        provenance={provenance}
        isOpen={isPeelOpen}
        onClose={() => {
          // Under reduced-motion: allow closing (user can still press Esc or click X)
          // per spec: "it just doesn't require a click to open"
          setIsPeelOpen(false);
        }}
        isReducedMotion={prefersReduced}
      />

      {/* Chapter transcript — sr-only normally, visible under reduced-motion (T4.1) */}
      <div className="relative z-20 px-4 py-2 max-w-2xl mx-auto">
        <ChapterTranscriptWithMotionDetect provenance={provenance} />
      </div>
    </section>
  );
}
