/**
 * water-cycle-client.tsx — Main client orchestrator
 *
 * Detects mobile vs desktop, registers GSAP ScrollTrigger chapter tracking,
 * and renders either the desktop cinematic experience or the mobile card-stack.
 *
 * Per spec §7:
 *   - Mobile-first: 65% Android traffic → MobileCardStack at < 768px
 *   - prefers-reduced-motion → CinematicVideo skips ScrollTrigger internally
 *   - GSAP registerPlugin called once at module scope (React 19 safe pattern)
 *   - Cleanup kills all triggers to avoid leaks in Strict Mode
 *
 * Color grammar (§7): bg-slate-950 is the base canvas for the cinematic.
 */
"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

import type { Provenance } from "@/lib/water-cycle/types";
import { ChapterIndex } from "./chapter-index";
import { ChapterSection } from "./chapter-section";
import { CitationsBibliography } from "./citations-bibliography";
import { ClosingThesis } from "./closing-thesis";
import { MobileCardStack } from "./mobile-card-stack";

type ChapterId = "ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";
const CHAPTER_IDS = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"] as const;

type Props = {
  provenance: Record<ChapterId, Provenance>;
};

export function WaterCycleClient({ provenance }: Props) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("ch0");
  // Ref to avoid stale closure in cleanup
  const triggersRef = useRef<ReturnType<typeof ScrollTrigger.create>[]>([]);

  // -------------------------------------------------------------------------
  // Media query listener — SSR-safe (null until mounted)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // -------------------------------------------------------------------------
  // GSAP ScrollTrigger — chapter tracking (desktop only)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isMobile !== false) return; // null (unmounted) or true (mobile) → skip

    gsap.registerPlugin(ScrollTrigger);

    // Master triggers track which chapter is in the center of the viewport
    // so ChapterIndex can highlight the active dot.
    // Each ChapterSection registers its own pin trigger independently.
    const newTriggers = CHAPTER_IDS.map((id) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => {
          if (self.isActive) setActiveChapter(id);
        },
      }),
    );
    triggersRef.current = newTriggers;

    return () => {
      for (const t of newTriggers) {
        t.kill();
      }
      triggersRef.current = [];
    };
  }, [isMobile]);

  // -------------------------------------------------------------------------
  // SSR-safe: render null until we know mobile/desktop
  // (avoids hydration mismatch)
  // -------------------------------------------------------------------------
  if (isMobile === null) return null;

  // -------------------------------------------------------------------------
  // Mobile card stack
  // -------------------------------------------------------------------------
  if (isMobile) {
    return <MobileCardStack provenance={provenance} />;
  }

  // -------------------------------------------------------------------------
  // Desktop cinematic experience
  // -------------------------------------------------------------------------
  return (
    <main className="relative bg-slate-950">
      {/* Floating chapter navigation dots */}
      <ChapterIndex active={activeChapter} />

      {/* 7 chapter sections */}
      {CHAPTER_IDS.map((id) => (
        <ChapterSection key={id} chapterId={id} provenance={provenance[id]} />
      ))}

      {/* Closing thesis */}
      <ClosingThesis />

      {/* Full bibliography — loads /water-cycle/citations.json at runtime */}
      <CitationsBibliography />
    </main>
  );
}
