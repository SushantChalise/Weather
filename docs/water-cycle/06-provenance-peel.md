# 06 — The Provenance Peel

This is the central new feature. Without it, the page is "another beautiful explainer." With it, the page is a primary reference.

> *"Make the cinema falsifiable."* — Codex, v5 review

## What it is

A toggle on every chapter that:
1. Pauses the cinematic at its current frame
2. Decomposes the rendered geometry into 3 stacked layers, each animated in over 400ms
3. Reveals a side panel listing every dataset, citation, and uncertainty for everything visible
4. Lets the user verify any claim without leaving the page

When toggled off → reverse animation → cinematic resumes from where it paused.

## Why this is the million-x

Currently educational climate pages fall into two camps:
- **Cinematic but unverifiable**: NYT-style, beautiful, but you have to trust them.
- **Verifiable but inert**: papers, IPCC, no story.

Provenance Peel does both. The cinematic teaches the story; the peel proves the cinematic. **Every visual moment has receipts.**

That's what makes it canonical for journalists, researchers, educators, and skeptics.

## Interaction spec

### Trigger

A button labeled **"Show data"** appears top-right of the cinematic, persistent throughout each chapter. Visual: ghosted icon with text, becomes solid on hover. Always keyboard-accessible (`tab`-navigable, `enter` to activate). Aria label: "Show data sources for this chapter".

Citation chip (bottom-right) is also clickable and opens the same panel.

### Open animation (400ms total)

| Time | What |
|---|---|
| 0ms | User clicks "Show data". |
| 0-100ms | Cinematic `<video>` `pause()` is called. Current frame held. Light desaturate filter applied to video element via CSS (`filter: saturate(0.4)`). |
| 100-300ms | **Layer 1 reveal**: SVG overlay slides in from above the video, drawing 2D outlines of every polygon in the scene (glaciers, lakes, etc.) color-coded by source dataset. Stroke-dashoffset animation — 200ms. |
| 200-400ms | **Layer 2 reveal**: SVG dots appear at DEM grid sample points (only where in scene). Animated fade-in, 100ms staggered across points. |
| 300-400ms | **Layer 3 reveal**: Station pins (if any in scene — Yala, Pyramid, etc.) drop in with a subtle bounce. |
| 400ms | Side panel slides in from right (320px wide), containing the citation list. Animation: `transform: translateX(0)` from `translateX(100%)`, 300ms ease-out. |

### Close animation

Same animation in reverse, 300ms total. Side panel slides out, layers fade, video resumes (`play()` is NOT called automatically — user has to scroll to resume scrub).

### What's NOT animated (intentionally)

- The video element itself — it stays paused, frame held.
- The chapter overlay (headlines, captions) — they remain visible, on top of the peeled view.
- Any other chapters' video / audio — only this chapter is affected.

## The 3 layers

### Layer 1: source-dataset outlines

For each `polygon-extrusion` or `polygon-flat` entry in `provenance.scene_layers`, render an SVG overlay polygon at the same screen-space coordinates as it appears in the current video frame.

How to compute screen-space coords:
- Read `provenance.camera_path` for the current frame's camera state
- Project the polygon's GeoJSON coords through that camera
- Render as SVG `<path>`

Color is sourced from `scene_layer.source.dataset`:
- ICIMOD glaciers → `#7DD3FC` (sky)
- ICIMOD lakes → `#0E7490` (teal)
- Somos-Valenzuela 2014 (historical Imja) → distinct cross-hatched fill (visually distinguishes "this came from a paper, not an inventory")
- WorldPop villages → `#FCD34D` (gold)
- DEM (no polygon, this is layer 2)

Each outline is labeled with its dataset name (small text, aria-friendly).

### Layer 2: DEM grid

Sparse sample points from the underlying DEM, only where the camera is currently focused. Visual: tiny `+` glyphs at ~30 grid points across the visible area. Tooltip on hover: elevation in meters, source ("SRTM 30m").

This is a "look at the resolution" cue — viewer sees the data isn't infinite-resolution, has texture.

### Layer 3: station pins

Where applicable per chapter:
- Ch 4 (Imja basin): the Imja Tsho monitoring station, the Pyramid Lab (~5,000m).
- Ch 5: any albedo measurement station from Kaspari 2014.

Each pin has a popover on hover/click showing:
- Station name
- Coordinates
- What data this station measures
- Source institution

## Side panel content

Layout (320px wide on desktop, full-screen modal on mobile):

```
┌─────────────────────────────────────────┐
│  Sources for: The reservoir       [×]   │
├─────────────────────────────────────────┤
│                                         │
│  Chapter 0 — 9% / 516 km³ ice lost      │
│                                         │
│  ▌ Glacier outlines                     │
│  ICIMOD HKH Glacier Inventory 1990      │
│  doi: 10.26066/rds.1972729              │
│  CC-BY 4.0 · 65,188 features            │
│  Filter: all polygons                   │
│  Preprocess: mapshaper -simplify 5%     │
│  [Download GeoJSON →]                   │
│                                         │
│  ▌ Glacier outlines                     │
│  ICIMOD HKH Glacier Inventory 2020      │
│  doi: 10.26066/rds.1972729              │
│  CC-BY 4.0 · 63,761 features            │
│  [Download GeoJSON →]                   │
│                                         │
│  ▌ Ice thickness                        │
│  Farinotti 2019 consensus estimate      │
│  doi: 10.5194/tc-13-665-2019            │
│  CC-BY 4.0                              │
│  Uncertainty: ±25%                      │
│                                         │
│  ▌ Lake outlines                        │
│  ICIMOD Glacial Lake Inventory 2024     │
│  ...                                    │
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  ▌ Headline numbers                     │
│  516 km³ — water-equivalent ice lost   │
│  (ICIMOD HKH Cryosphere Assessment 2026)│
│                                         │
│  9% — share of total HKH ice lost      │
│  (ICIMOD HKH Cryosphere Assessment 2026)│
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  Generated: 2026-05-15T10:32:00Z       │
│  Blender: 5.1.1                         │
│  Script hash: a8f3...92be               │
│                                         │
│  [View full bibliography]               │
└─────────────────────────────────────────┘
```

Every item links to:
- DOI (resolves to publisher)
- Direct download URL where available
- License (CC-BY, ODbL, etc.)
- Filter / preprocessing notes (so a researcher can reproduce)

## Component spec

```typescript
// src/components/water-cycle/provenance-peel.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Provenance } from "@/lib/water-cycle/types";

type Props = {
  chapterId: string;
  provenance: Provenance;
  isOpen: boolean;
  onClose: () => void;
};

export function ProvenancePeel({ chapterId, provenance, isOpen, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Pause video when opening, but don't auto-resume on close
  useEffect(() => {
    if (!isOpen) return;
    const video = document.querySelector(
      `#${chapterId} video`,
    ) as HTMLVideoElement | null;
    video?.pause();
    
    // Focus the close button for keyboard users
    const btn = panelRef.current?.querySelector('button[aria-label="Close"]');
    (btn as HTMLButtonElement | null)?.focus();
    
    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, chapterId]);
  
  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Layer overlays (positioned over the video) */}
      <SourceOutlines provenance={provenance} />
      <DemGrid provenance={provenance} />
      <StationPins provenance={provenance} />
      
      {/* Side panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Data sources"
        className="fixed right-0 top-0 bottom-0 w-80 max-w-full bg-slate-900 text-white border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
      >
        <div className="p-4">
          <header className="flex items-center justify-between mb-4">
            <h3 className="font-bold">
              Sources for: {provenance.shot_id}
            </h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          
          <ScenelayerCitations layers={provenance.scene_layers} />
          <hr className="my-4 border-white/10" />
          <HeadlineCitations numbers={provenance.headline_numbers} />
          <hr className="my-4 border-white/10" />
          <RenderMetadata provenance={provenance} />
        </div>
      </aside>
    </>
  );
}
```

## SVG layer rendering

The trickiest piece: rendering polygon outlines that align with the paused video frame.

**Approach**: pre-compute the screen-space coordinates of every layer polygon at every keyframe in the camera path, save into a separate `screenspace.json` per chapter. At peel-open time, look up the current frame and use those coords.

**Generation**: a Blender post-render script projects every polygon through the animated camera and emits the JSON.

```python
# scripts/render/water-cycle/shared/screenspace.py
"""After rendering, project all scene_layer polygons through the camera at each keyframe.
Output: public/water-cycle/ch{N}/screenspace.json with frame-by-frame screen coords."""

import bpy
import json
from pathlib import Path

def project_layer_screenspace(layer_id: str, frame_range: tuple[int, int]) -> dict:
    """Returns { frame: [[x, y], ...] } for the given layer's vertices in screen pixels."""
    ...
```

Frontend reads this and renders SVG paths at the right place.

## Mobile behavior

On mobile (< 768px), the Provenance Peel becomes a **full-screen modal**, not a side panel. Activated via tap on the citation chip. Layer overlays may be simplified (Layer 2 DEM grid skipped to reduce visual clutter at small sizes).

## Reduced-motion behavior

Per WATER_CYCLE_SPEC.md §7: when `prefers-reduced-motion: reduce` is set, the Provenance Peel is **open by default** for every chapter (showing all citations beneath the still poster). Toggling animations off shouldn't make data harder to find.

## Acceptance criteria

| Test | Pass condition |
|---|---|
| Toggle opens & closes on every chapter | Click test on ch0..ch6 |
| Layer 1 outlines align with paused video frame | Visual eyeball — outlines match what's on screen |
| Layer 2 DEM grid points appear sparsely (~30 points) | Manual count |
| Layer 3 station pins appear only where chapter has stations | Verify ch4 has Imja station, ch1 has none |
| Side panel scrolls if content exceeds viewport | Manual test |
| Keyboard navigation: tab focuses close button on open | Keyboard test |
| Esc closes panel | Keyboard test |
| Mobile: panel is full-screen modal | Resize browser to 375px |
| Reduced-motion: panel is open by default | Force prefers-reduced-motion |
| Every cited DOI resolves to a publisher page | Link click test (sample 5 randomly) |
| `provenance.json` parsing failure → graceful fallback | Test with malformed JSON |

## Anti-patterns

- ❌ Don't fetch dataset metadata at runtime. All citations come from provenance.json (built-time bundled).
- ❌ Don't auto-resume video on close. User opted out; let them scroll to resume.
- ❌ Don't show Layer 2 (DEM grid) on mobile (visual noise at small sizes).
- ❌ Don't use a heavy library for the side panel slide-in. Plain CSS transitions are enough.
- ❌ Don't make the panel modal block the citation chip (chip should still be clickable to close).
- ❌ Don't show layers without their citation. If something appears in the cinematic and isn't in `provenance.json`, that's a bug.
