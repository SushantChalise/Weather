# task-h4 — Source Attribution Component (CitationPill → modal)

## Branch name
feat/citation-pill

## PR title
feat(ui): add CitationPill + CitationModal for data source attribution

## What to build

Every chart and data number on Himalayan Atlas must be attributable to its source dataset.
Build a reusable component: `<CitationPill dataset={...} />` — a small clickable badge that
opens a modal with full dataset provenance.

This is a CORE DESIGN PRINCIPLE from DESIGN.md: source attribution at the container level,
not per-number.

## Component API

```typescript
// src/components/ui/citation-pill.tsx
type CitationDataset = {
  slug: string;
  name: string;          // e.g. "ERA5-Land"
  version?: string;       // e.g. "monthly updates to 2024"
  license: string;        // e.g. "Copernicus licence"
  citation: string;       // full citation string
  sourceUrl: string;      // link to dataset page
  description?: string;   // one-paragraph description
  spatialRes?: string;    // e.g. "0.1°"
  temporalRes?: string;   // e.g. "hourly"
  methodologyUrl?: string;
};

// Usage: <CitationPill dataset={ERA5_DATASET} />
// Usage: <CitationPill dataset={ERA5_DATASET} variant="inline" />
```

## Visual design

**CitationPill** (default variant):
- Small pill in bottom-right of a chart container (or inline after a number)
- Background: neutral-100 (light) / neutral-800 (dark)
- Text: 11px, Inter, "Source: ERA5-Land"
- Icon: small link/info SVG icon (use Heroicons or inline SVG — no external icon library)
- Cursor: pointer
- Hover: slight background change

**CitationModal**:
- Triggered by clicking the pill
- Full-screen overlay on mobile, centered modal on desktop (max-w-md)
- Header: dataset name
- Body:
  - Version (if set)
  - License badge
  - Spatial + temporal resolution (if set)
  - Description paragraph
  - Full citation in a `<blockquote>` or styled block
  - "View dataset →" external link to sourceUrl
  - "Methodology →" link (if methodologyUrl set)
- Close: X button top-right + click-outside + Escape key

## State management
Use `useState` inside CitationModal for open/closed. The CitationPill renders the modal 
inline (not a portal — keep it simple).

## Sample dataset objects to export

Create `src/data/datasets.ts` with typed dataset objects for the sources we'll use:

```typescript
export const OPEN_METEO: CitationDataset = {
  slug: "open-meteo",
  name: "Open-Meteo",
  license: "CC BY 4.0",
  citation: "Open-Meteo.com — Open-Source Weather API. https://open-meteo.com/",
  sourceUrl: "https://open-meteo.com/",
  description: "Open-Meteo is an open-source weather API offering free access to high-resolution weather forecasts, current conditions, and historical data.",
  temporalRes: "hourly",
};

export const ERA5_LAND: CitationDataset = {
  slug: "era5-land",
  name: "ERA5-Land",
  version: "Monthly updates to present",
  license: "Copernicus licence",
  citation: "Muñoz Sabater, J. (2019): ERA5-Land monthly averaged data from 1950 to present. Copernicus Climate Change Service (C3S) Climate Data Store (CDS). doi:10.24381/cds.68d2bb30",
  sourceUrl: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land",
  description: "ERA5-Land is a reanalysis dataset providing a consistent view of the evolution of land variables over several decades at enhanced resolution (0.1°, ~9 km).",
  spatialRes: "0.1° (~9 km)",
  temporalRes: "hourly",
};

export const HIMAWARI9: CitationDataset = {
  slug: "himawari-9-b13",
  name: "Himawari-9 AHI Band 13",
  license: "Public domain (NOAA AWS Open Data)",
  citation: "Japan Meteorological Agency / NOAA. Himawari-9 AHI Level-1b Full Disk. NOAA Big Data Program.",
  sourceUrl: "https://registry.opendata.aws/noaa-himawari/",
  description: "Himawari-9 Band 13 (10.4 µm thermal IR) provides 30-minute cloud imagery at 2 km resolution over the Asia-Pacific region.",
  spatialRes: "2 km",
  temporalRes: "10 min (we use every 30 min)",
};
```

## Files to create
- `src/components/ui/citation-pill.tsx` (CitationPill + CitationModal in one file, `use client`)
- `src/data/datasets.ts` (dataset objects)

## Integration
Wire CitationPill onto the Now tab of the place page (task-h3). 
In `src/components/places/tabs/now-tab.tsx`, add `<CitationPill dataset={OPEN_METEO} />` 
in the bottom-right of the weather card.

If task-h3 branch is not yet merged, just add the CitationPill component and datasets file —
the integration into now-tab.tsx can happen when task-h3 merges.

## Acceptance gate
- `npx tsc --noEmit` passes
- `src/components/ui/citation-pill.tsx` exists with `CitationPill` and `CitationDataset` exported
- `src/data/datasets.ts` exists with at least OPEN_METEO, ERA5_LAND, HIMAWARI9
- No external icon libraries added to package.json
