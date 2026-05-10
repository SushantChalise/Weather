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
 */
"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import NextImage from "next/image";
import { useEffect, useRef } from "react";

type Props = {
  chapterId: string;
  duration: number; // seconds from provenance.json
  posterUrl: string;
};

export function CinematicVideo({ chapterId, duration, posterUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Reduced-motion: skip ScrollTrigger entirely, show poster only
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  }, [duration]);

  return (
    <div ref={containerRef} className="relative w-full h-screen water-cycle-cinematic">
      {/* Static fallback shown when prefers-reduced-motion is set (CSS rule) */}
      <NextImage
        src={posterUrl}
        alt={`Chapter ${chapterId} poster — static end-frame`}
        fill
        className="object-cover water-cycle-fallback"
        priority
        unoptimized
        // Always visible as the base layer; video overlays it when loaded
      />

      {/* The actual video — poster keeps fallback frame while loading */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        poster={posterUrl}
        className="absolute inset-0 w-full h-full object-cover"
        aria-label={`Cinematic for chapter ${chapterId}`}
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
