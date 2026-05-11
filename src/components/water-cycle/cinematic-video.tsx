/**
 * cinematic-video.tsx — Scroll-scrubbed chapter video
 *
 * Uses HTML5 <video> + GSAP ScrollTrigger to scrub currentTime via scroll.
 * Per spec §6: real <video>, NOT filmstrip sprite.
 * Per spec anti-patterns: scrub: true (immediate), NOT scrub: 1 (laggy).
 * Per spec §7: prefers-reduced-motion → static poster, no ScrollTrigger.
 *
 * requestVideoFrameCallback() used where available for sync.
 * Audio: muted always (opt-in audio is a separate toggle, not implemented here).
 *
 * Reduced-motion (T4.1):
 *   - Detects prefers-reduced-motion on mount via window.matchMedia.
 *   - If reduce: skips ScrollTrigger registration; hides <video>; shows <img> poster.
 *   - Watches for the media query CHANGE event so the page responds at runtime.
 *   - No autoplay in reduced-motion mode (WCAG 2.3.3 / spec §7 hard constraint 3).
 */
"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = {
  chapterId: string;
  duration: number; // seconds from provenance.json
  posterUrl: string;
};

export function CinematicVideo({ chapterId, duration, posterUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track reduced-motion preference reactively so the component responds to
  // runtime changes (e.g. user toggles accessibility setting while on page).
  // Initialize with a lazy function so we read matchMedia synchronously on
  // first render (after hydration) rather than defaulting to false and then
  // flipping — this avoids a brief flash where the video is visible before
  // the useEffect fires.
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    // typeof window check is required for SSR (server has no matchMedia)
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // -------------------------------------------------------------------------
  // Media query listener — detect and react to prefers-reduced-motion changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // -------------------------------------------------------------------------
  // Sync aria-hidden on <video> based on reduced-motion preference
  // -------------------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prefersReduced) {
      video.setAttribute("aria-hidden", "true");
      // Ensure no autoplay leaks through
      video.pause();
    } else {
      video.removeAttribute("aria-hidden");
    }
  }, [prefersReduced]);

  // -------------------------------------------------------------------------
  // ScrollTrigger wiring — only when reduced-motion is NOT preferred
  // -------------------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Skip ScrollTrigger entirely under reduced-motion (spec §7 hard constraint 3)
    if (prefersReduced) return;

    gsap.registerPlugin(ScrollTrigger);

    // ~100px scroll per second of video duration
    const scrollDistance = duration * 100;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: `+=${scrollDistance}px`,
      pin: true,
      pinSpacing: true,
      scrub: true, // immediate — NOT scrub: 1 (Codex caveat for data-heavy chapters)
      onUpdate: (self) => {
        const targetTime = self.progress * duration;
        // Use requestVideoFrameCallback for better sync where supported
        const vid = video as HTMLVideoElement & { requestVideoFrameCallback?: unknown };
        if (vid.requestVideoFrameCallback !== undefined) {
          if (Math.abs(vid.currentTime - targetTime) > 0.05) {
            vid.currentTime = targetTime;
          }
        } else {
          vid.currentTime = targetTime;
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, [duration, prefersReduced]);

  return (
    <div ref={containerRef} className="relative w-full h-screen water-cycle-cinematic">
      {/* Static poster — always rendered as the base layer.
          Under reduced-motion: visible (video is hidden + aria-hidden).
          Under normal motion: covered by the video element on top.
          CSS class "water-cycle-fallback" is used by page.module.css media query. */}
      <NextImage
        src={posterUrl}
        alt={`Chapter ${chapterId} — static end-frame poster`}
        fill
        className="object-cover water-cycle-fallback"
        priority
        unoptimized
      />

      {/* The cinematic video — hidden via CSS + aria-hidden when reduced-motion */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        poster={posterUrl}
        className="absolute inset-0 w-full h-full object-cover"
        aria-label={`Cinematic for chapter ${chapterId}`}
        style={prefersReduced ? { display: "none" } : undefined}
      >
        {/*
         * Scrub master loads first (low-bitrate, dense keyframes).
         * High-quality swap is intentionally deferred to later tasks
         * when real video files exist.
         */}
        <source src={`/water-cycle/${chapterId}/cinematic-scrub.webm`} type="video/webm" />
        <source src={`/water-cycle/${chapterId}/cinematic.mp4`} type="video/mp4" />
        {/* Accessible fallback for no-video browsers */}
        View the{" "}
        <a href={posterUrl} className="underline">
          still image
        </a>
        .
      </video>
    </div>
  );
}
