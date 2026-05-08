# Project Setup

Exact scaffolding specification. Run these commands and create these config files to get a working dev environment before writing any application code.

---

## 1. Initialize project

```powershell
cd C:\Users\ACER\Projects\Weather
npx create-next-app@15 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

If the directory already has files (PRODUCT.md, etc.), create-next-app will refuse. In that case, init in a temp dir and move the generated files:
```powershell
npx create-next-app@15 temp-init --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
# Move generated files into Weather/, keeping existing .md docs
# Delete temp-init
```

---

## 2. Dependencies (pinned versions)

```powershell
# Core
npm install next@15.5.18 react@19 react-dom@19

# 3D engine
npm install three@0.184.0 @react-three/fiber@9.6.1 @react-three/drei@10.7.7

# State + data
npm install zustand@5.0.13 swr@2.4.1

# Utilities
npm install suncalc@1.9.0

# Styling (Tailwind v4 is installed by create-next-app, verify version)
npm install tailwindcss@4.2.4

# Dev dependencies
npm install -D @biomejs/biome@2.4.14 @types/three @types/suncalc typescript@5.5
```

**Do NOT install** (not needed in v1):
- `@react-three/postprocessing` — Step 6 only
- `framer-motion` — not used in this project
- Any icon library — Unicode symbols in v1
- Any CSS-in-JS library — Tailwind only

---

## 3. package.json scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check --write src/",
    "format": "biome format --write src/",
    "check": "biome check src/ && npx tsc --noEmit",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 4. TypeScript config — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Key: `"strict": true` and `"noUncheckedIndexedAccess": true` — no `any`, no unchecked index access.

---

## 5. Next.js config — `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {},
  // Transpile three.js ecosystem packages
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default nextConfig;
```

---

## 6. Biome config — `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": [".next", "node_modules", "public"]
  }
}
```

---

## 7. Tailwind v4 — `src/app/globals.css`

Tailwind v4 uses CSS-based configuration, not `tailwind.config.js`.

```css
@import "tailwindcss";

@theme {
  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;

  /* Decision signal colors */
  --color-best: #D4A843;
  --color-good: #6B9E6B;
  --color-watch: #8B8B8B;
  --color-poor: #5B7FA5;
  --color-avoid: #C45B4A;
  --color-rain: #4A8BC4;
  --color-snow: #7EC8E3;
  --color-cloud: #B8B8B8;
  --color-sunrise: #E8A84C;

  /* Neutral palette */
  --color-bg: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F5F3EF;
  --color-border: #E5E2DB;
  --color-border-subtle: #EDEBE6;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-muted: #9B9B9B;
  --color-text-inverse: #FFFFFF;

  /* Terrain */
  --color-terrain-lowland: #C4D4A0;
  --color-terrain-midhill: #A8C090;
  --color-terrain-highland: #8B9E7A;
  --color-terrain-alpine: #B0A890;
  --color-terrain-snow: #E8E4E0;
  --color-terrain-shadow: #4A4A4A;
  --color-terrain-highlight: #F0EDE8;

  /* Typography */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.10);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.16);
}

/* Base styles */
body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}

/* NPT timestamp utility class */
.npt-badge {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background-color: var(--color-surface-alt);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--color-text-muted);
}
```

---

## 8. Directory structure (create before coding)

```powershell
# From C:\Users\ACER\Projects\Weather\
mkdir src\components\scene
mkdir src\components\decision
mkdir src\components\controls
mkdir src\components\ui
mkdir src\lib\decision
mkdir src\lib\terrain
mkdir src\lib\npt
mkdir src\lib\performance
mkdir src\data\corridors
mkdir src\state
mkdir src\types
mkdir src\shaders
mkdir tests\acceptance
mkdir public\terrain
mkdir public\satellite
```

---

## 9. `.gitignore`

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
build/

# IDE
.vscode/
*.sw?

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local
.env.production

# Output (scraper results)
output/

# Vercel
.vercel
```

---

## 10. Verification

After setup, these commands must all pass:

```powershell
npx tsc --noEmit          # TypeScript clean
npm run dev                # Dev server starts on localhost:3000
npx biome check src/      # Lint clean
```

The dev server should show the default Next.js page. That confirms the scaffold is correct before any application code is written.

---

## 11. Step 1 terrain approach — DECISION

**Step 1 uses a pre-rendered static shaded-relief image, NOT live DEM tiles.**

Why: Step 1's acceptance gate is "user identifies Pokhara, Everest, ABC in 5 seconds." That tests layout and decision UI, not terrain fidelity. Loading real GLO-30 tiles requires a tile pipeline, custom shaders, and LOD management — all of which belong in Step 3 (real data integration).

For Step 1:
- Generate or download a shaded-relief PNG of Nepal (~2048×1024, ~200KB)
- Render it as a textured plane in R3F with correct aspect ratio and geo-bounds
- Place destination markers as HTML overlays positioned via lat/lon → screen projection
- The map is visually clean but not interactive (no zoom, no tilt in Step 1)

For Step 3:
- Replace the static PNG with actual GLO-30 DEM tile loading
- Add camera controls (zoom, pan, tilt)
- Enable terrain mesh for cloud-deck occlusion

This decision is documented here because it changes what Step 1 code looks like. A developer who starts with DEM tiles in Step 1 will spend 3 days on terrain before touching the Decision Strip.
