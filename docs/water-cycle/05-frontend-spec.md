# 05 — Frontend Spec

## Overview

The page is one Next.js route that:
1. Server-renders end-state HTML (headlines, citations, captions) so the page is meaningful before any JS runs
2. Mounts a client orchestrator that lazy-loads chapter `<video>` elements and wires GSAP ScrollTrigger
3. Provides Provenance Peel toggle per chapter
4. Has a separate mobile card-stack layout below 768px

## Route

```
src/app/atlas/water-cycle/
├── page.tsx          # Server component, metadata, server-renders end-state HTML
├── loading.tsx       # Skeleton during data fetch
├── error.tsx         # Error boundary (if provenance.json fails to parse, etc.)
└── opengraph-image.tsx  # Generates the 1200×630 OG image at build time
```

### `page.tsx`

```typescript
import type { Metadata } from "next";
import { Suspense } from "react";
import { WaterCycleClient } from "@/components/water-cycle/water-cycle-client";
import { loadAllProvenance } from "@/lib/water-cycle/provenance";

export const metadata: Metadata = {
  title: "The Water Cycle — Himalayan Atlas",
  description:
    "How Hindu Kush Himalaya glaciers stored, are losing, and will lose water. " +
    "9% of all HKH ice has melted since 1990 — 516 km³ of water. The glacier was your reservoir.",
  openGraph: {
    title: "The Water Cycle — Himalayan Atlas",
    description: "9% of all Hindu Kush Himalaya ice has melted since 1990. The glacier was your reservoir.",
    type: "article",
    images: [
      {
        url: "/water-cycle/og.jpg",
        width: 1200,
        height: 630,
        alt: "Imja Tsho — the lake is the glacier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Water Cycle — Himalayan Atlas",
    description: "9% of all Hindu Kush Himalaya ice has melted since 1990. The glacier was your reservoir.",
  },
};

export default async function WaterCyclePage() {
  // Load provenance for all 7 chapters at build time (statically bundled)
  const provenance = await loadAllProvenance();
  
  return (
    <Suspense fallback={<WaterCycleSkeleton />}>
      <WaterCycleClient provenance={provenance} />
    </Suspense>
  );
}
```

### Server-rendered end state

Before any JS runs, the page must be readable. Each chapter's `<section>` server-renders:

- A static `<img src="/water-cycle/ch{N}/poster.jpg" />` (the final frame)
- The headline text in `<h2>` and `<p>`
- All citations in a `<details><summary>Sources</summary>...</details>` block
- All numerical values exposed as text

When client JS hydrates:
- The `<img>` is replaced with `<video>` (poster attribute keeps the same image as fallback)
- GSAP wires scroll → `currentTime`
- Provenance toggle becomes interactive

This means `prefers-reduced-motion: reduce` users see the static page exactly as it server-rendered, with no degradation.

## Component tree

```
<WaterCycleClient>
  <ChapterIndex />          # Floating top-right, links to each chapter
  
  <ChapterSection id="ch0">
    <CinematicVideo
      chapterId="ch0"
      duration={30}
      sources={...}
    />
    <ChapterOverlay chapterId="ch0">
      <Headline />
      <Caption />
      <CitationChip onExpand={openProvenance} />
    </ChapterOverlay>
    <ProvenancePeel
      chapterId="ch0"
      provenance={provenance.ch0}
      isOpen={...}
      onClose={...}
    />
  </ChapterSection>
  
  <ChapterSection id="ch1">...</ChapterSection>
  <!-- ... ch2..ch6 ... -->
  
  <ClosingThesis />          # "The glacier was your reservoir. We are draining it."
  <CitationsBibliography />  # Full list at bottom
</WaterCycleClient>

<MobileCardStack> (rendered instead at < 768px)
  <ChapterCard chapterId="ch0" />
  <ChapterCard chapterId="ch1" />
  ...
</MobileCardStack>
```

## Components — detailed specs

### `<WaterCycleClient>`

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Provenance } from "@/lib/water-cycle/types";
import { ChapterSection } from "./chapter-section";
import { MobileCardStack } from "./mobile-card-stack";
import { ChapterIndex } from "./chapter-index";

type Props = {
  provenance: Record<"ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6", Provenance>;
};

export function WaterCycleClient({ provenance }: Props) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>("ch0");
  
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  
  useEffect(() => {
    if (isMobile !== false) return;
    
    gsap.registerPlugin(ScrollTrigger);
    
    // Each ChapterSection registers its own ScrollTrigger
    // Master ScrollTrigger here just tracks active chapter for the index
    const triggers = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"].map((id) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => self.isActive && setActiveChapter(id),
      }),
    );
    
    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [isMobile]);
  
  if (isMobile === null) return null; // Wait for SSR-safe match
  if (isMobile) return <MobileCardStack provenance={provenance} />;
  
  return (
    <main className="relative bg-slate-950">
      <ChapterIndex active={activeChapter} />
      {(["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"] as const).map((id) => (
        <ChapterSection key={id} chapterId={id} provenance={provenance[id]} />
      ))}
      <ClosingThesis />
      <CitationsBibliography provenance={provenance} />
    </main>
  );
}
```

### `<CinematicVideo>`

The core of the scroll-scrub mechanism. Per Codex's review:
- Use real `<video>` (not filmstrip)
- Low-bitrate scrub master for fast seeking
- Swap to high-quality on play
- Use `requestVideoFrameCallback()` for sync where supported

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Props = {
  chapterId: string;
  duration: number; // seconds, from provenance.json
  posterUrl: string;
};

export function CinematicVideo({ chapterId, duration, posterUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Detect prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      // Don't autoplay, don't scrub. Show poster.
      return;
    }
    
    // Wire scroll → currentTime
    const trigger = ScrollTrigger.create({
      trigger: video.parentElement,
      start: "top top",
      end: `+=${duration * 100}px`, // ~100px scroll per second of video
      pin: true,
      pinSpacing: true,
      scrub: true, // immediate, NOT scrub: 1 (Codex caveat: scrub:1 lags on data-heavy)
      onUpdate: (self) => {
        const targetTime = self.progress * duration;
        // Use rVFC if available for sync
        if ("requestVideoFrameCallback" in video) {
          // Direct seek, browser handles
          if (Math.abs(video.currentTime - targetTime) > 0.05) {
            video.currentTime = targetTime;
          }
        } else {
          video.currentTime = targetTime;
        }
      },
    });
    
    return () => trigger.kill();
  }, [chapterId, duration]);
  
  // When user pauses (stops scrolling), swap to high-quality source
  // (rough heuristic: detect scroll has stopped for 1 second)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsHighQuality(true);
      }, 1000);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  return (
    <div className="relative w-full h-screen">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        poster={posterUrl}
        className="w-full h-full object-cover"
        aria-label={`Chapter cinematic for ${chapterId}`}
      >
        {/* Scrub master loads first */}
        <source src={`/water-cycle/${chapterId}/cinematic-scrub.webm`} type="video/webm" />
        {/* High-quality swapped in via JS when user pauses */}
        {isHighQuality && (
          <>
            <source src={`/water-cycle/${chapterId}/cinematic.webm`} type="video/webm" />
            <source src={`/water-cycle/${chapterId}/cinematic.mp4`} type="video/mp4" />
          </>
        )}
        Your browser doesn't support video. <a href={posterUrl}>View the still</a>.
      </video>
    </div>
  );
}
```

**Critical**: this uses `scrub: true` (immediate), not `scrub: 1` (1-second smoothing). Per Codex's review for data-heavy sections.

### `<ChapterSection>`

```typescript
"use client";

import { useState } from "react";
import { CinematicVideo } from "./cinematic-video";
import { ChapterOverlay } from "./chapter-overlay";
import { ProvenancePeel } from "./provenance-peel";
import type { Provenance } from "@/lib/water-cycle/types";

type Props = {
  chapterId: "ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";
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
      <CinematicVideo
        chapterId={chapterId}
        duration={provenance.duration_s}
        posterUrl={`/water-cycle/${chapterId}/poster.jpg`}
      />
      <ChapterOverlay
        chapterId={chapterId}
        provenance={provenance}
        onShowProvenance={() => setIsPeelOpen(true)}
      />
      <ProvenancePeel
        chapterId={chapterId}
        provenance={provenance}
        isOpen={isPeelOpen}
        onClose={() => setIsPeelOpen(false)}
      />
    </section>
  );
}
```

### `<ChapterOverlay>` — server-renderable

This is where most of the static end-state lives. Per-chapter overlay components live in `per-chapter/`:

```
src/components/water-cycle/per-chapter/
├── ch0-reservoir.tsx
├── ch1-retreat.tsx
├── ch2-lake-bloom.tsx
├── ch3-sankey.tsx
├── ch4-hydro-clock.tsx     # The most HTML-heavy chapter (clock UI)
├── ch5-impurities.tsx
└── ch6-choice.tsx
```

Each one is a Server Component that takes `provenance` and renders headlines/captions/charts. Example:

```typescript
// per-chapter/ch0-reservoir.tsx
import type { Provenance } from "@/lib/water-cycle/types";
import { CitationChip } from "../citation-chip";

export function Ch0Overlay({ provenance, onShowProvenance }: {
  provenance: Provenance;
  onShowProvenance: () => void;
}) {
  const headlineMass = provenance.headline_numbers.find((n) => n.label.includes("water-equivalent"));
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Page title (top-left) */}
      <div className="absolute top-8 left-8 max-w-md pointer-events-auto">
        <h2 className="text-white text-4xl md:text-6xl font-serif font-bold">
          The reservoir
        </h2>
        <p className="mt-2 text-white/70 text-base">
          Hindu Kush Himalaya · 1990 → 2020
        </p>
      </div>
      
      {/* Headline (right side, mid) */}
      <div className="absolute top-1/3 right-8 max-w-sm pointer-events-auto">
        <p className="text-white text-2xl tabular-nums font-bold">
          {headlineMass?.value}
        </p>
        <p className="text-white/80 text-sm mt-1">
          of water lost since 1990 — 9% of all HKH ice.
        </p>
      </div>
      
      {/* Citation chip (bottom-right) */}
      <CitationChip
        sources={["ICIMOD 2026", "Farinotti 2019"]}
        onShowAll={onShowProvenance}
      />
    </div>
  );
}
```

### `<ChapterIndex>` — floating navigation

```typescript
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

export function ChapterIndex({ active }: { active: string }) {
  return (
    <nav
      className="fixed top-1/2 right-6 -translate-y-1/2 z-50 hidden md:block"
      aria-label="Chapter index"
    >
      <ol className="flex flex-col gap-3">
        {CHAPTERS.map((ch) => (
          <li key={ch.id}>
            <a
              href={`#${ch.id}`}
              className={`flex items-center gap-2 group transition-opacity ${
                active === ch.id ? "opacity-100" : "opacity-50 hover:opacity-100"
              }`}
              aria-current={active === ch.id ? "true" : "false"}
            >
              <span
                className={`block w-2 h-2 rounded-full ${
                  active === ch.id ? "bg-sky-300" : "bg-white/40"
                }`}
                aria-hidden="true"
              />
              <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {ch.title}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### `<MobileCardStack>` — < 768px variant

Mobile gets a fundamentally different UX: tap-to-advance card stack, not scroll-scrub video. Per Gemini's review: "graveyard of static charts" is wrong — give mobile its own coherent narrative.

```typescript
"use client";

import { useState } from "react";
import type { Provenance } from "@/lib/water-cycle/types";

type Props = {
  provenance: Record<"ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6", Provenance>;
};

export function MobileCardStack({ provenance }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const chapters = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"] as const;
  const current = chapters[currentIdx];
  
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top progress bar */}
      <div className="flex gap-1 p-3">
        {chapters.map((c, i) => (
          <div
            key={c}
            className={`flex-1 h-1 rounded ${
              i <= currentIdx ? "bg-sky-300" : "bg-white/20"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      
      {/* Card */}
      <article className="flex-1 flex flex-col p-6">
        <img
          src={`/water-cycle/${current}/poster.jpg`}
          alt={`Chapter ${currentIdx} poster`}
          className="w-full rounded-xl mb-6"
        />
        <h2 className="text-white text-2xl font-bold">
          {provenance[current].caption_text}
        </h2>
        {/* Headlines, citation chip, etc. */}
      </article>
      
      {/* Tap-to-advance */}
      <div className="p-6 flex justify-between">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="text-white px-4 py-2"
        >
          ← Back
        </button>
        <button
          onClick={() => setCurrentIdx(Math.min(chapters.length - 1, currentIdx + 1))}
          disabled={currentIdx === chapters.length - 1}
          className="text-white px-4 py-2"
        >
          Next →
        </button>
      </div>
    </main>
  );
}
```

## Provenance loader

```typescript
// src/lib/water-cycle/provenance.ts
import { promises as fs } from "fs";
import path from "path";
import type { Provenance } from "./types";

export async function loadAllProvenance(): Promise<Record<string, Provenance>> {
  const chapters = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"];
  const result: Record<string, Provenance> = {};
  for (const ch of chapters) {
    const filePath = path.join(process.cwd(), "public", "water-cycle", ch, "provenance.json");
    try {
      const text = await fs.readFile(filePath, "utf-8");
      result[ch] = JSON.parse(text);
    } catch {
      // During dev / pre-render, provenance may not exist yet — fall back to empty
      result[ch] = createEmptyProvenance(ch);
    }
  }
  return result;
}
```

This is run at build time (since the route is statically rendered). At runtime, `provenance` is bundled into the page.

## Reduced-motion strategy

Single CSS rule + JS detection:

```css
/* In a global CSS file */
@media (prefers-reduced-motion: reduce) {
  /* Hide all GSAP-driven animations */
  .water-cycle-cinematic { display: none; }
  /* Show static fallback */
  .water-cycle-fallback { display: block; }
  /* Provenance Peel always open by default */
  .water-cycle-peel { display: block; }
}
```

The `<CinematicVideo>` component checks `prefers-reduced-motion` on mount and skips ScrollTrigger registration if true.

## Bundle budget tracking

| Component | Size estimate |
|---|---|
| GSAP core + ScrollTrigger | ~30 KB |
| D3 selective imports (`d3-scale`, `d3-axis`, `d3-shape`, `d3-line`) | ~25 KB |
| WaterCycleClient + ChapterSection + CinematicVideo | ~12 KB (custom) |
| ProvenancePeel + ProvenanceCitations | ~10 KB |
| MobileCardStack | ~6 KB |
| Per-chapter overlays (ch0..ch6) | ~5 KB each = ~35 KB total |
| **Total estimated client JS** | **~118 KB compressed** |

Well under the 250 KB hard cap.

## Acceptance criteria for frontend

| Test | Pass condition |
|---|---|
| Server-renders end-state HTML | Disable JS in browser; page is still readable |
| Lighthouse Performance (mobile) | ≥ 75 |
| Lighthouse Accessibility | ≥ 95 |
| GSAP ScrollTrigger doesn't leak in React 19 Strict Mode | Mount/unmount cycle in dev: no duplicate triggers (check ScrollTrigger.getAll().length on remount) |
| Reduced-motion → static page | Force `prefers-reduced-motion: reduce` in DevTools, verify no animation runs |
| Mobile card-stack at < 768px | Resize browser to 375px width, verify card-stack appears |
| Tab navigation moves between chapters | Manual keyboard test |
| All citation chips clickable | Manual click test |
| All `<video>` elements have `playsinline` and `muted` (Safari autoplay) | Code review |
| Bundle JS size ≤ 250 KB compressed | `npm run build` then check `.next/static/chunks/app/atlas/water-cycle/page-*.js` |

## Anti-patterns

- ❌ Don't use Framer Motion for data viz. UI micro-interactions only (or skip entirely).
- ❌ Don't use Three.js / R3F runtime 3D. Pre-rendered video is mobile-cheaper.
- ❌ Don't fetch provenance.json at runtime via `fetch()`. Load at build time, bundle into page.
- ❌ Don't autoplay audio. Audio is opt-in, separate toggle.
- ❌ Don't hardcode chapter titles in components. Read from provenance.shot_id or a static config.
- ❌ Don't use `scrub: 1` for data-heavy chapters (Ch 1, 3, 6). Use `scrub: true` (immediate). Codex caveat.
- ❌ Don't put video files in `data/`. They go in `public/water-cycle/ch{N}/`.
- ❌ Don't ship a `<video>` without `playsinline` (Safari autoplay breaks otherwise).
