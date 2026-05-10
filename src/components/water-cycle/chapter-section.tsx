/**
 * chapter-section.tsx — Sticky-pinned chapter wrapper
 *
 * Each chapter is a full-viewport section containing:
 *   - CinematicVideo (scroll-scrubbed)
 *   - ChapterOverlay (headlines, captions, citation chip, show-data button)
 *   - ProvenancePeel (triggered by overlay button)
 *
 * Per spec §7: id attr on <section> is used by ScrollTrigger and chapter index.
 * aria-label includes the shot_id for screen readers.
 */
"use client";

import { useState } from "react";

import type { Provenance } from "@/lib/water-cycle/types";
import { ChapterOverlay } from "./chapter-overlay";
import { CinematicVideo } from "./cinematic-video";
import { ProvenancePeel } from "./provenance-peel";

type ChapterId = "ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";

type Props = {
  chapterId: ChapterId;
  provenance: Provenance;
};

export function ChapterSection({ chapterId, provenance }: Props) {
  const [isPeelOpen, setIsPeelOpen] = useState(false);

  return (
    <section
      id={chapterId}
      className="relative min-h-screen"
      aria-label={`Chapter ${chapterId.slice(2)}: ${provenance.shot_id}`}
    >
      {/* Scroll-scrubbed cinematic video */}
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

      {/* Provenance Peel — slides in from right on toggle */}
      <ProvenancePeel
        chapterId={chapterId}
        provenance={provenance}
        isOpen={isPeelOpen}
        onClose={() => setIsPeelOpen(false)}
      />
    </section>
  );
}
