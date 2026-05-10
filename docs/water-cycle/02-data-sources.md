# 02 — Data Sources

Every dataset used in any chapter, with verification status. **A worker MUST NOT proceed if a source is `BLOCKED`.**

| Status | Meaning |
|---|---|
| ✅ READY | Already on disk, verified, used by existing /atlas/30-years |
| 🟢 GREEN | Public, license-clear, ingestion task in 07-task-graph.md |
| 🟡 YELLOW | Public but ingestion is non-trivial (digitization, paywall PDF) |
| 🔴 BLOCKED | Currently unavailable for HKH; needs alternate or chapter rescope |

---

## Glaciers

### ICIMOD HKH Glacier Inventory 1990 / 2000 / 2010 / 2020 — ✅ READY

- **Already in repo**: `public/glaciers/hkh/{year}-points.geojson` (centroid points), `public/glaciers/hkh/{year}.geojson.br` (Brotli-compressed full polygons)
- **Source**: ICIMOD RDS dataset 1972729
- **DOI**: `10.26066/rds.1972729` (verify exact DOI in citations.json)
- **License**: CC-BY 4.0
- **Used by**: Ch 0, Ch 1, Ch 2, Ch 6
- **Preprocessing notes**: existing transform at `scripts/transform/icimod-glacier-decades/` produces full polygons; existing `to-points.ts` produces centroid points. Render scripts use full polygons (decompress brotli first).
- **Provenance.json contract field**: `dataset: "ICIMOD HKH Glacier Inventory 2020"`

### Imja Glacier historical outlines (1962, 1992) — 🟡 YELLOW

- **Source**: Somos-Valenzuela et al. 2014, *The Cryosphere*, Fig 2
- **DOI**: `10.5194/tc-8-1661-2014`
- **License**: CC-BY 3.0 (Copernicus Publications)
- **Status**: must digitize from published figure
- **Method**: download paper PDF, extract Fig 2 as image, georeference using known coordinates of Imja Khola valley + Lhotse / Nuptse peaks, trace polygons in QGIS
- **Output**: `data/water-cycle/glaciers/imja-keyframes.geojson` with 4 features (years 1962, 1992, 2010, 2020)
- **Used by**: Ch 0, Ch 2, Ch 4
- **Acceptance criterion**: keyframes overlay correctly on /atlas/30-years map (visual eyeball test); area values within 10% of Somos-Valenzuela 2014 Table 1

### Farinotti et al. 2019 ice-thickness consensus — 🟢 GREEN

- **Source**: Farinotti et al. 2019, *Nature Geoscience*
- **DOI**: `10.1038/s41561-019-0300-3`
- **Data DOI**: `10.3929/ethz-b-000315707` (ETH Research Collection)
- **License**: CC-BY 4.0
- **What it provides**: per-glacier mean ice thickness for global glaciers including HKH
- **Used by**: Ch 0 (volumetric extrusion), Ch 1 (per-glacier shells)
- **Ingestion**: download HKH-region subset; cache to `data/water-cycle/glaciers/farinotti-2019-hkh-thickness.csv`
- **Provenance contract**: include `thickness_model: { method: "Farinotti 2019 consensus estimate", doi: "10.5194/tc-13-665-2019", uncertainty_pct: 25 }`

### Hugonnet et al. 2021 glacier mass balance — 🟢 GREEN

- **Source**: Hugonnet et al. 2021, *Nature*
- **DOI**: `10.1038/s41586-021-03436-0`
- **Data DOI**: `10.6096/13` (Theia)
- **License**: CC-BY 4.0
- **What it provides**: per-glacier elevation change rate 2000-2019, derived from satellite stereo
- **Used by**: Ch 1 (per-glacier deltas validation), spec headline citations
- **Already in repo**: ingestion script at `scripts/ingestion/hugonnet-2021/` (per package.json `db:hugonnet-2021`)

---

## Glacial lakes

### ICIMOD HKH Glacial Lake Inventory current — ✅ READY

- **Already in repo**: `public/glacial-lakes/current.geojson` and `risky.geojson`
- **Source**: ICIMOD RDS, latest available inventory
- **License**: CC-BY 4.0
- **Used by**: Ch 2, Ch 4

### Imja Tsho historical outlines (1962, 1975, 1992, 2010, 2020) — 🟡 YELLOW

- **Source**: Somos-Valenzuela et al. 2014, Fig 4 + ICIMOD 2024 inventory
- **License**: CC-BY 3.0 + CC-BY 4.0
- **Method**: same digitization process as Imja Glacier
- **Critical caveat (Codex review)**: do NOT splice 1962 outlines from Somos-Valenzuela with 2020 outlines from ICIMOD without co-registration audit. Methodology drift creates fake motion.
- **Mitigation**: extract ALL 5 keyframes from Somos-Valenzuela 2014 figures (which include 2010 measured outline), then validate the 2020 outline against ICIMOD 2024 inventory by comparing area in km². If areas differ > 5%, prefer ICIMOD 2024 and note the discrepancy in provenance.
- **Output**: `data/water-cycle/lakes/imja-keyframes.geojson`
- **Used by**: Ch 0, Ch 2, Ch 4

### Imja bathymetry — 🟢 GREEN

- **Source**: Somos-Valenzuela et al. 2014, Table 2
- **What it provides**: max depth (~96.5 m), mean depth, volume estimate
- **Used by**: Ch 4 caption ("60m deep" — verify exact value from paper)
- **Ingestion**: copy-paste from paper into `data/water-cycle/lakes/imja-bathymetry.json`

### South Lhonak Lake 2023 outburst event — 🟢 GREEN

- **Source**: Nature 2026 reconstruction (referenced in Codex review — find exact DOI)
- **Casualties**: 24 dead, 70+ missing (NOT 100+)
- **Used by**: Ch 4 anchor caption
- **Ingestion**: text only, no spatial data needed

---

## Elevation / DEM

### SRTM 30m (HKH bbox) — 🟢 GREEN

- **Source**: NASA SRTM via [OpenTopography API](https://opentopography.org/) or USGS EarthExplorer
- **License**: Public domain (NASA)
- **Bbox**: HKH `[70°E, 26°N, 95°E, 36°N]`
- **Approx file size**: ~2 GB raw, can be downsampled / clipped before render
- **Used by**: all chapters needing terrain

### SRTM 30m (Imja basin) — 🟢 GREEN

- **Source**: same
- **Bbox**: Imja basin `[86.85°E, 27.85°N, 87.05°E, 28.0°N]`
- **Approx size**: ~3 MB raw

### Optional: ALOS PALSAR 12.5m (HKH high-res) — 🟢 GREEN

- **Source**: [JAXA G-Portal](https://gportal.jaxa.jp/) or Alaska Satellite Facility
- **License**: Free for non-commercial / educational
- **Use**: only if SRTM 30m looks pixelated in macro shots (Ch 4 specifically)

---

## Atmosphere / temperature

### ERA5 / ERA5-Land — 🟢 GREEN

- **Source**: [Copernicus Climate Data Store (CDS)](https://cds.climate.copernicus.eu/)
- **License**: CC-BY 4.0 (Copernicus)
- **Used by**: Ch 5 (temperature anomaly / freezing-line context — only if simplified version of Ch 5 ships)
- **Critical caveat (Codex review)**: ERA5 does NOT provide a simple "freezing-level altitude" variable. Need to derive from pressure-level temperature + geopotential. **For v7 we explicitly defer this** to a future session.

---

## Black carbon / impurities (Ch 5)

### Kaspari et al. 2014 albedo measurements — 🟢 GREEN (PRIMARY for Ch 5)

- **Source**: Kaspari et al. 2014, *Atmospheric Chemistry and Physics*, [acp.copernicus.org/articles/14/8089/2014/](https://acp.copernicus.org/articles/14/8089/2014/)
- **DOI**: `10.5194/acp-14-8089-2014`
- **License**: CC-BY 3.0
- **Critical numbers** (use these, not Gemini's "Sun-Eater" overclaim):
  - BC alone: 6-10% albedo reduction
  - BC instantaneous radiative forcing: 75-120 W/m²
  - **Dust forcing in same analysis: 488-525 W/m²** (5-7× larger than BC)
  - Combined BC + dust: forcing dominated by dust
- **Used by**: Ch 5 caption + chart values
- **Ingestion**: extract values into `data/water-cycle/impurities/kaspari-2014-figure-data.json`

### Jacobi et al. 2015 BC modeling — 🟢 GREEN (SECONDARY)

- **Source**: Jacobi et al. 2015, *The Cryosphere*
- **DOI**: `10.5194/tc-9-1685-2015`
- **What it provides**: modeled BC radiative forcing in upper Khumbu, ~3-13 W/m² depending on concentration
- **Used by**: Ch 5 supporting evidence

### NSIDC `stc_modscgdrf_hist` — 🔴 BLOCKED

- **Status**: COVERAGE DOES NOT INCLUDE HKH (western US tiles only, per Codex's verification)
- **Action**: do not plan to use this dataset for HKH visualization. The Ch 5 visual must rely on Kaspari + Jacobi published values, not a dataset-driven raster.

### NASA SPIRES NRT — 🟢 GREEN (potential alternative)

- **Source**: [nsidc.org/data/spires_nrt/](https://nsidc.org/data/spires_nrt/versions/2)
- **Status**: investigate during Ch 5 ingestion task
- **Critical**: verify HKH coverage before committing

---

## Future scenarios (Ch 6)

### Rounce et al. 2023 — 🟢 GREEN

- **Source**: Rounce et al. 2023, *Science*
- **DOI**: `10.1126/science.abo1324`
- **Open-access PDF**: cryospheric.org/wp-content/uploads/2023/01/rounce-et-al-2023-science.abo1324-2.pdf
- **License**: All rights reserved (Science) — but supplementary data CC-BY (verify in paper)
- **What it provides**: per-glacier mass projections through 2100 under multiple SSPs (and RCPs)
- **Critical (Codex review)**: use **SSP1-2.6 vs SSP5-8.5** for the "choice" framing, NOT RCP 4.5 ("worst case" was sloppy)
- **Used by**: Ch 6
- **Ingestion**:
  - Identify Imja-region glaciers in the dataset (RGI ID lookup)
  - Aggregate HKH-wide totals per SSP per year (2025, 2050, 2075, 2100)
  - Output: `data/water-cycle/scenarios/rounce-2023-imja.json` and `rounce-2023-hkh-aggregate.json`
- **Acceptance**: ingested values cross-checked against published Fig 1 / Fig 2 within ±5%

### OGGM (Open Global Glacier Model) projections — 🟢 GREEN (alternative for Rounce)

- **Source**: [docs.oggm.org/en/v1.6.1/download-projections.html](https://docs.oggm.org/en/v1.6.1/download-projections.html)
- **License**: Open
- **What it provides**: SSP-based glacier projections, RGI-indexed
- **Use**: cross-validation if Rounce 2023 ingestion is non-trivial

### IPCC AR6 framing — 🟢 GREEN

- **Source**: IPCC AR6 WG1 Chapter 4 (Cross-Chapter Box 1.4)
- **License**: All rights reserved IPCC, citations / fair use
- **Used by**: Ch 6 framing language

---

## Population / human stakes

### Miles et al. 2021 (250M dependent population) — 🟢 GREEN (PRIMARY)

- **Source**: Miles et al. 2021, *Nature Communications*
- **DOI**: `10.1038/s41467-021-23073-4`
- **License**: CC-BY 4.0
- **Critical numbers** (Codex-validated):
  - **~250 million** people in glacier-fed water-scarce zones (Indus, Ganges, Brahmaputra basins)
  - 28% of HKH glacier mass projected lost by 2100 under SSP2-4.5
- **Used by**: Ch 6 closing line, Ch 4 downstream framing
- **Ingestion**: extract values into `data/water-cycle/scenarios/miles-2021-headline-stats.json`

### WorldPop 2020 100m Constrained — 🟢 GREEN (use the Constrained variant)

- **Source**: [worldpop.org](https://www.worldpop.org/)
- **License**: CC-BY 4.0
- **Critical (Gemini review)**: use the **Constrained** 100m dataset (population pinned to known building footprints), NOT the Unconstrained one (smooths over uninhabitable cliffs).
- **Used by**: Ch 4 downstream village population
- **Caveat (Codex review)**: do NOT claim "exact GLOF flood-zone exposure". WorldPop within a buffer ≠ flood-zone modeling. Use coarser claim: "communities in the Imja Khola valley downstream — basin population estimate".

### OpenStreetMap Khumbu villages — 🟢 GREEN

- **Source**: [openstreetmap.org](https://www.openstreetmap.org/)
- **License**: ODbL
- **Used by**: Ch 4 village markers
- **Ingestion**: query Overpass API for nodes tagged `place=village|hamlet` within Khumbu region; export as GeoJSON Point collection

---

## Audio (Ch 0 ambient + optional throughout)

### Status: 🔴 MOSTLY BLOCKED for HKH-specific recordings

- Public-domain glacier audio (USGS, NOAA, NPS) is mostly **Arctic / Alaska tidewater calving** — **geographically false** to use for HKH.
- ICIMOD station audio releases: investigate; not currently known to be available.
- Ambient soundscape (wind, river, distant village) — can use Creative Commons recordings labeled clearly: "ambient soundscape — not field recording from HKH".

**Decision for v7**: **default audio off**. If audio is added, it must be ambient + opt-in + labeled correctly. **No "field recording from Imja"** unless we have a HKH-specific source documented.

---

## Data ingestion sequence (Phase 1)

The Phase-1 ingestion tasks (07-task-graph.md tasks T1-T4) are parallelizable. They produce the `data/water-cycle/` directory structure:

```
data/water-cycle/
├── dem/
│   ├── srtm-hkh-30m.tif         (download from OpenTopography, ~2 GB)
│   └── srtm-imja-30m.tif        (clip from above, ~3 MB)
├── glaciers/
│   ├── icimod-1990.geojson      (decompress from public/glaciers/hkh/1990.geojson.br)
│   ├── icimod-2020.geojson      (same)
│   ├── imja-keyframes.geojson   (DIGITIZE from Somos-Valenzuela 2014)
│   └── farinotti-2019-hkh-thickness.csv (download ETH research collection)
├── lakes/
│   ├── icimod-current.geojson   (copy from public/glacial-lakes/current.geojson)
│   ├── imja-keyframes.geojson   (DIGITIZE from Somos-Valenzuela 2014 Fig 4)
│   └── imja-bathymetry.json     (extract from paper)
├── scenarios/
│   ├── rounce-2023-imja.json    (extract from supplementary)
│   ├── rounce-2023-hkh-aggregate.json (same)
│   └── miles-2021-headline-stats.json (small JSON of citations)
├── impurities/
│   └── kaspari-2014-figure-data.json (extract from paper)
└── README.md                     (table of contents pointing back to this doc)
```

**Acceptance for Phase 1**: every file above exists, has valid format, file sizes within expected ranges. Smoke test: a Python script that loads each file successfully and reports count/size.

## Citation chip (must appear on every chapter)

Every chapter's HTML overlay MUST display a small "Sources" chip (bottom-right of the cinematic) listing the primary 1-3 datasets used. Click expands the full Provenance Peel.

Example for Ch 0:
> Sources: ICIMOD 2026 · Farinotti 2019 · Hugonnet 2021. **Show all →**

## Citations file format

`public/water-cycle/citations.json` is generated by aggregating all chapter `provenance.json` files. Schema:

```typescript
type Citations = {
  generated_at: string;
  sources: {
    id: string; // hash of (title + doi + year)
    title: string;
    authors: string;
    journal?: string;
    year: number;
    doi?: string;
    url: string;
    license: string;
    used_in_chapters: ("ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6")[];
    purpose: string; // one sentence what we used it for
  }[];
};
```

Generated by `scripts/transform/water-cycle/build-citations.ts` (Phase 4 task).
