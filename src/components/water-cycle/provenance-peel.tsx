/**
 * provenance-peel.tsx — The Provenance Peel
 *
 * The central feature of the Water-Cycle Atlas.
 * "Make the cinema falsifiable." — Codex, v5 review
 *
 * Interaction (per docs/water-cycle/06-provenance-peel.md):
 *   - "Show data" button top-right of cinematic → opens peel
 *   - Video pauses at current frame; desaturate filter applied
 *   - 3 SVG overlay layers animate in (400ms total)
 *   - Side panel slides in from right (320px desktop, full-screen mobile)
 *   - Esc to close; close button; reverse animation on close
 *   - Video NOT auto-resumed on close
 *
 * Open animation timing (spec §06):
 *   0ms        — user clicks "Show data"
 *   0-100ms    — video pauses, desaturate
 *   100-300ms  — Layer 1 (SourceOutlines) animates in
 *   200-400ms  — Layer 2 (DemGrid) fades in
 *   300-400ms  — Layer 3 (StationPins) drops in
 *   400ms+     — side panel slides in from right (300ms ease-out CSS)
 *
 * Two eases only (spec §7):
 *   Material standard: cubic-bezier(0.4, 0, 0.2, 1)  — scene transitions
 *   Gentle-out:        cubic-bezier(0.16, 1, 0.3, 1)  — data motion
 *
 * Color grammar (§7 — violations are bugs):
 *   #7DD3FC ice  #0E7490 lakes  #38BDF8 active-water
 *   #F87171 loss #FBBF24 heat   #FCD34D people  #475569 terrain
 *
 * Out of scope in this PR:
 *   - Real screen-space SVG projection (T3.x render tasks)
 *   - Production /atlas/water-cycle page (T2.3)
 */
"use client";

import { useEffect, useRef } from "react";

import type { Provenance } from "@/lib/water-cycle/types";
import { DemGrid } from "./dem-grid";
import { HeadlineCitations, RenderMetadata, SceneLayerCitations } from "./provenance-citations";
import { SourceOutlines } from "./source-outlines";
import { StationPins } from "./station-pins";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ProvenancePeelProps = {
  /** The chapter DOM element id — used to find the <video> sibling to pause */
  chapterId: string;
  provenance: Provenance;
  isOpen: boolean;
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// ProvenancePeel
// ---------------------------------------------------------------------------

export function ProvenancePeel({ chapterId, provenance, isOpen, onClose }: ProvenancePeelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Track whether we paused the video (so we don't resume one we didn't pause)
  const didPauseRef = useRef(false);

  // -------------------------------------------------------------------------
  // Video pause + desaturate on open; body scroll lock
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) {
      // Remove desaturate on close (video is NOT auto-resumed per spec anti-pattern)
      const video = document.querySelector(`#${chapterId} video`) as HTMLVideoElement | null;
      if (video && didPauseRef.current) {
        video.style.filter = "";
      }
      didPauseRef.current = false;
      return;
    }

    // Pause video and desaturate (0-100ms window)
    const video = document.querySelector(`#${chapterId} video`) as HTMLVideoElement | null;
    if (video && !video.paused) {
      video.pause();
      didPauseRef.current = true;
    }
    if (video) {
      // Material standard ease, 100ms
      video.style.transition = "filter 100ms cubic-bezier(0.4, 0, 0.2, 1)";
      video.style.filter = "saturate(0.4)";
    }

    // Focus close button for keyboard users
    const timer = window.setTimeout(() => {
      const btn = panelRef.current?.querySelector<HTMLButtonElement>(
        'button[aria-label="Close data sources panel"]',
      );
      btn?.focus();
    }, 420); // After full open animation (400ms layers + panel start)

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, chapterId]);

  // -------------------------------------------------------------------------
  // Esc to close
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // -------------------------------------------------------------------------
  // Reduced-motion: peel is open by default (per spec §7 & §06)
  // The parent component is responsible for passing isOpen=true when
  // prefers-reduced-motion: reduce is detected.  ProvenancePeel itself does
  // NOT force open — the parent controls state.
  // -------------------------------------------------------------------------

  if (!isOpen) return null;

  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* SVG Layer overlays — positioned over the cinematic video            */}
      {/* Parent <section id={chapterId}> must be position:relative          */}
      {/* ------------------------------------------------------------------ */}

      {/* Layer 1 — source-dataset outlines (100-300ms) */}
      <SourceOutlines provenance={provenance} />

      {/* Layer 2 — DEM grid points; skipped on mobile per spec */}
      {!isMobile && <DemGrid provenance={provenance} />}

      {/* Layer 3 — station pins (300-400ms) */}
      <StationPins provenance={provenance} />

      {/* ------------------------------------------------------------------ */}
      {/* Side panel                                                          */}
      {/* Desktop: 320px right-anchored. Mobile: full-screen modal.          */}
      {/* Slides in from right — plain CSS transition, no heavy library.     */}
      {/* ------------------------------------------------------------------ */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Data sources for chapter: ${provenance.shot_id}`}
        className={[
          // Base
          "fixed top-0 bottom-0 overflow-y-auto z-50",
          "bg-slate-900 text-white border-l border-white/10 shadow-2xl",
          // Desktop: right-anchored 320px
          // Mobile: full-width
          "right-0 w-full md:w-80",
          // Slide-in animation: CSS transform, 300ms gentle-out
        ].join(" ")}
        style={{
          // 400ms delay matches end of layer animations
          animation: "wc-panel-slide-in 300ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both",
        }}
      >
        {/* Panel header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Sources for</p>
            <h3 className="text-sm font-bold text-white truncate">
              {/* Chapter title from shot_id (e.g. "hkh-flyover" → "Hkh Flyover") */}
              {provenance.shot_id
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close data sources panel"
            className={[
              "flex-shrink-0 ml-3 w-8 h-8 flex items-center justify-center",
              "rounded-full text-slate-400 hover:text-white hover:bg-white/10",
              "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 focus:ring-offset-slate-900",
              "transition-colors",
            ].join(" ")}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>

        {/* Panel body */}
        <div className="px-4 py-4 space-y-0">
          {/* Scene layer citations */}
          <SceneLayerCitations layers={provenance.scene_layers} />

          <hr className="my-4 border-white/10" />

          {/* Headline number citations */}
          <HeadlineCitations numbers={provenance.headline_numbers} />

          <hr className="my-4 border-white/10" />

          {/* Render metadata */}
          <RenderMetadata provenance={provenance} />

          {/* Full bibliography link */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <a
              href="/atlas/water-cycle/citations"
              className={[
                "text-xs text-slate-400 underline decoration-slate-600",
                "hover:text-sky-300 hover:decoration-sky-400",
                "focus:outline-none focus:ring-1 focus:ring-sky-400 rounded",
              ].join(" ")}
            >
              View full bibliography →
            </a>
          </div>
        </div>
      </aside>

      {/* Panel slide-in keyframe — injected once */}
      <style>{`
        @keyframes wc-panel-slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
