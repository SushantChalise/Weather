# Nepal Mountain Weather Decision Map

Real-time mountain weather decision tool for Nepal. Compare conditions across destinations (Everest Base Camp, ABC, Poon Hill, Pokhara, Kathmandu, Jomsom, Chitwan, Lukla), see clear-window forecasts, and choose better travel windows — with visible evidence and confidence labels.

**Live:** https://weather-ruby-iota-35.vercel.app

---

## Tech stack

- **Framework:** Next.js 15 (App Router) + TypeScript strict
- **Map:** MapLibre GL + React Three Fiber for terrain
- **Data:** Open-Meteo (forecast), MODIS Terra (true-colour fallback), Himawari-9 B13 (10.4 µm thermal IR clouds)
- **State / fetching:** Zustand + SWR
- **Tile pipeline:** Python (`scripts/himawari_pipeline.py`) → Vercel Blob, refreshed every 30 min by GitHub Actions
- **Hosting:** Vercel (auto-deploy from `main`)
- **Lint / format:** Biome
- **Type safety:** TypeScript strict + `noUncheckedIndexedAccess`

---

## Quick start

```powershell
npm install
Copy-Item .env.local.example .env.local
# Fill in HIMAWARI_STORE_ID (find it in the Vercel dashboard → Storage → blob store)
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
| [PRODUCT.md](PRODUCT.md) | Product spec, personas, feature tiers |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data flows, schemas |
| [DESIGN.md](DESIGN.md) | Design system: colors, typography, components |
| [DATA.md](DATA.md) | Data sources, scrapers, pipelines |
| [BUILD_PLAN.md](BUILD_PLAN.md) | Implementation roadmap |
| [STEP1.md](STEP1.md) | Step 1 — scaffolding + first decision UI |
| [SETUP.md](SETUP.md) | One-time project scaffolding spec |
| [**CONTRIBUTING.md**](CONTRIBUTING.md) | **Required reading before opening a PR — branch model, CI, commit rules** |

---

## Contributing

All changes go through a pull request. CI must pass before merge. No direct pushes to `main`.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow, pre-flight checklist, and recovery procedure for broken builds.

---

## License

Private project. All rights reserved.
