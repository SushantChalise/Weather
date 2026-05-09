# Himalayan Atlas

The modern frontend for Himalayan weather and climate data — past, present, and future. Built place by place, sourced from every authoritative dataset that reaches the region, and honest about what the data can and cannot say.

For two concentric audiences served by one surface:
- **Trekkers and mountaineers** — practical climate-aware decision support
- **Climate-curious visitors** — researchers, journalists, students, NGO staff, climate-aware travelers

**Live (transitional URL):** https://weather-ruby-iota-35.vercel.app
**Status:** v2.0 product spec — pivoted from "Nepal Mountain Weather Decision Map" (v1) to "Himalayan Atlas" (v2)

---

## What's in the atlas

A standardised place page for every named place in the Himalaya — currently 8 trekking destinations, expanding to 34 Tier-1 places (hero glaciers, iconic peaks, signal lakes, river points, cities), then HKH-wide (Karakoram, Indian Himalaya, Tibet, Bhutan, the major river systems originating from Himalayan glaciers).

Every place has the same four-tab spine:

| Tab | Question it answers |
|---|---|
| **Now** | What's happening here right now? |
| **Now vs Normal** | How does this compare to the 30-year baseline? |
| **Last 30 years** | How has this place changed? |
| **Future** | What is this place projected to look like? |

See [PRODUCT.md](PRODUCT.md) for the full spec, feature pillars, place catalogue, and feature ranking.

---

## Tech stack

- **Framework:** Next.js 15 (App Router) + TypeScript strict
- **Map:** MapLibre GL + React Three Fiber for tilt mode
- **Database:** Postgres + PostGIS + TimescaleDB
- **Charting:** Observable Plot (preferred) / Recharts (existing)
- **Hosting:** Vercel (frontend + tile blob), GitHub Actions (ingestion cron), Neon or Supabase (Postgres)
- **Lint / format:** Biome
- **Type safety:** TypeScript strict + `noUncheckedIndexedAccess`

---

## Quick start

```powershell
npm install
Copy-Item .env.local.example .env.local
# Fill in HIMAWARI_STORE_ID and DATABASE_URL (Neon / Supabase)
npm run dev
# http://localhost:3000
```

Other scripts:

```powershell
npm run typecheck    # tsc --noEmit
npm run build        # next build
npm run lint         # biome check --write src/
npm run format       # biome format --write src/
```

---

## Documentation

| Document | What |
|---|---|
| [**PRODUCT.md**](PRODUCT.md) | **Canonical product spec — read first** |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, database, ingestion pipelines |
| [DATA.md](DATA.md) | Dataset inventory, source classes, licensing, validation |
| [DESIGN.md](DESIGN.md) | Design system: colors, typography, components |
| [BUILD_PLAN.md](BUILD_PLAN.md) | Hour-by-hour build sequence (vibecoding-paced) |
| [SETUP.md](SETUP.md) | One-time project scaffolding spec (legacy v1; revise during hour 0) |
| [**CONTRIBUTING.md**](CONTRIBUTING.md) | **Required reading before opening a PR — branch model, CI, commits** |

---

## Geographic scope

Climate is regional. The product follows the system, not political borders:

| Tier | Coverage |
|---|---|
| **Core** | Nepal |
| **Regional** | Hindu Kush Himalaya — Pakistan, India, Bhutan, Tibet/China, Nepal |
| **System** | Himalayan glaciers (Karakoram, Hindu Kush, Pamir, HKH proper) and the river systems originating from them — Indus, Ganges, Brahmaputra, Yangtze, Yellow, Mekong, Salween, Irrawaddy |

See PRODUCT.md §2 for the geography-first principle.

---

## Contributing

All changes go through a pull request. CI must pass before merge. No direct pushes to `main`.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow, pre-flight checklist, and recovery procedure for broken builds.

---

## License

Code: TBD (currently private project, all rights reserved). Data: each dataset retains its source license — see DATA.md for per-dataset attribution. Charts and visualisations are derivative works under the source dataset's license; we display attribution per source's terms.
