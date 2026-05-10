# 09 — Citations

This is the seed bibliography. As tasks complete, each `provenance.json` is parsed and aggregated into `public/water-cycle/citations.json` (T4.4 task). This markdown stays as a human-readable reference.

## Format per entry

```
**Author Year** · *Journal* · DOI/URL · License · Used in: Ch X (purpose)
```

## Cryosphere data — primary

**ICIMOD HKH Cryosphere Assessment 2026** · ICIMOD report · [icimod.org/world-glacier-water-meteorology-days](https://www.icimod.org/world-glacier-water-meteorology-days/) · CC-BY 4.0 · Used in: Ch 0 (headline 9% / 516 km³), Ch 6 (baseline)

**ICIMOD HKH Glacier Inventory 1990, 2000, 2010, 2020** · ICIMOD RDS dataset · DOI: `10.26066/rds.1972729` · CC-BY 4.0 · Used in: Ch 0, Ch 1, Ch 2, Ch 6 (glacier outlines)

**ICIMOD Glacial Lake Inventory 2024 (current + risky)** · ICIMOD RDS · CC-BY 4.0 · Already in `public/glacial-lakes/` · Used in: Ch 2, Ch 4 (current lake outlines)

**Farinotti et al. 2019** *Nature Geoscience* · "A consensus estimate for the ice thickness distribution of all glaciers on Earth" · DOI: [10.1038/s41561-019-0300-3](https://doi.org/10.1038/s41561-019-0300-3) · Data DOI: `10.3929/ethz-b-000315707` · CC-BY 4.0 · Used in: Ch 0, Ch 1 (volumetric thickness model, ±25% uncertainty)

**Hugonnet et al. 2021** *Nature* · "Accelerated global glacier mass loss in the early twenty-first century" · DOI: [10.1038/s41586-021-03436-0](https://doi.org/10.1038/s41586-021-03436-0) · Data DOI: `10.6096/13` · CC-BY 4.0 · Used in: Ch 1 (per-glacier delta validation), spec headline citations

## Imja Tsho

**Somos-Valenzuela et al. 2014** *The Cryosphere* · "Changes in Imja Tsho in the Mount Everest region of Nepal" · DOI: [10.5194/tc-8-1661-2014](https://doi.org/10.5194/tc-8-1661-2014) · CC-BY 3.0 · Used in: Ch 0, Ch 2 (lake + glacier keyframes 1962, 1975, 1992, 2010, 2020 + bathymetry)

## Future projections

**Rounce et al. 2023** *Science* · "Global glacier change in the 21st century: Every increase in temperature matters" · DOI: [10.1126/science.abo1324](https://doi.org/10.1126/science.abo1324) · Open-access PDF: [cryospheric.org](https://cryospheric.org/wp-content/uploads/2023/01/rounce-et-al-2023-science.abo1324-2.pdf) · License: All rights reserved Science (citations only) · Used in: Ch 6 (SSP1-2.6 vs SSP5-8.5 projections to 2100)

**PyGEM HMA glacier projections** · NSIDC dataset · DOI: `10.5067/H118TCMSUH3Q` · License: Open · [nsidc.org/data/hma_gl_rcpr](https://nsidc.org/data/hma_gl_rcpr/versions/1) · Used in: Ch 6 (per-glacier projection underlying Rounce 2023)

**OGGM Open Global Glacier Model projections** · [docs.oggm.org](https://docs.oggm.org/en/v1.6.1/download-projections.html) · Open · Used in: Ch 6 cross-validation

**IPCC AR6 WG1 Chapter 4** · IPCC report (Cross-Chapter Box 1.4) · [ipcc.ch/report/ar6/wg1](https://www.ipcc.ch/report/ar6/wg1/figures/chapter-1/ccbox-1-4-figure-1/) · Citations only · Used in: Ch 6 (SSP framing)

**Miles et al. 2021** *Nature Communications* · "Health and sustainability of glaciers in High Mountain Asia" · DOI: [10.1038/s41467-021-23073-4](https://doi.org/10.1038/s41467-021-23073-4) · CC-BY 4.0 · Used in: Ch 4 (downstream framing), Ch 6 closing line (250 million people, 28% by 2100)

## Atmospheric / impurity science

**Kaspari et al. 2014** *Atmospheric Chemistry and Physics* · "Black carbon and dust...high-altitude HKH" · DOI: [10.5194/acp-14-8089-2014](https://doi.org/10.5194/acp-14-8089-2014) · CC-BY 3.0 · Used in: Ch 5 (BC + dust radiative forcing values: BC 75-120 W/m², dust 488-525 W/m²)

**Jacobi et al. 2015** *The Cryosphere* · BC modeling in upper Khumbu · DOI: [10.5194/tc-9-1685-2015](https://doi.org/10.5194/tc-9-1685-2015) · CC-BY 3.0 · Used in: Ch 5 (modeled BC forcing 3-13 W/m²)

## DEM / terrain

**NASA SRTM 30m (SRTMGL1)** · Public domain (NASA) · Distributed via [OpenTopography](https://opentopography.org/) · Used in: Ch 0, Ch 1, Ch 2, Ch 5, Ch 6 (terrain mesh)

**ALOS PALSAR DEM (12.5m)** · JAXA, ASF · Open (research) · Used in: optional Ch 4 macro shots

## Geographic / human

**OpenStreetMap (Khumbu villages)** · ODbL · Used in: Ch 2, Ch 4 (downstream village markers)

**WorldPop 2020 100m Constrained** · [worldpop.org](https://www.worldpop.org/) · CC-BY 4.0 · Used in: Ch 4 (population around villages)

## Hazard events

**South Lhonak 2023 reconstruction** · Nature 2026 (verify exact DOI; was referenced as `s41598-026-35895-7` in Codex review) · TBD · Used in: Ch 4 caption (24 dead, 70+ missing — replaces "100+ killed" inflated journalism)

## Tools & libraries (acknowledgement)

**Blender 5.1.1** · GPL · [blender.org](https://www.blender.org/) · Used for: cinematic rendering

**flubber** · MIT · [github.com/veltman/flubber](https://github.com/veltman/flubber) · Used for: SVG path morphing in browser (lake bloom alternative if Blender shape keys aren't enough)

**GSAP + ScrollTrigger** · GreenSock standard license · Used for: scroll orchestration

**D3.js (selective imports)** · BSD-3-Clause · [d3js.org](https://d3js.org/) · Used for: HTML chart overlays

**MapLibre GL** · BSD-3-Clause · Used for: /atlas/30-years embed in Ch 1 explore mode

**ffmpeg / SVT-AV1 / libx264** · LGPL/GPL · Used for: video encoding

**OpenTopography API** · [opentopography.org](https://opentopography.org/) · Open (registration) · Used for: DEM ingestion

**BlenderGIS plugin** · GPL · [github.com/domlysz/BlenderGIS](https://github.com/domlysz/BlenderGIS) · Optional · Used for: SRTM ingestion convenience in Blender

## Style of in-page citation

When a number or claim appears in the page text, it MUST link to its source. Format:

> "9% of all HKH ice has melted [^icimod-2026]"

with `[^icimod-2026]` resolving to:

> ICIMOD HKH Cryosphere Assessment 2026. CC-BY 4.0.

These citation references should match keys in `provenance.json` `headline_numbers[].citation` field.

## Bibliography page

T4.4 builds `public/water-cycle/citations.json` from all chapter `provenance.json` files. The bibliography is then rendered at `/atlas/water-cycle#bibliography` (anchor at the bottom of the page) as a sortable, filterable, downloadable list. License attribution is mandatory per CC-BY-style licensing.
