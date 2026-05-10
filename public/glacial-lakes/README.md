# HKH Glacial Lakes

Brotli-precompressed GeoJSON files containing glacial lake polygon data for the
Koshi, Gandaki, and Karnali river basins (Nepal, Tibet, India).

## Files

| File | Contents | Source dataset |
|---|---|---|
| `current.geojson.br` | All mapped glacial lakes (~3k lakes, 2015 survey) | ICIMOD RDS ID 1971946 |
| `risky.geojson.br` | Potentially dangerous glacial lakes (47 lakes) | ICIMOD RDS ID 1971950 |

## Format

Each file is a **Brotli-compressed GeoJSON FeatureCollection** (`.geojson.br`).

Cloudflare Pages serves these files with:
- `Content-Encoding: br` — browser decompresses transparently
- `Content-Type: application/json`
- `Cache-Control: public, max-age=31536000, immutable`

## Processing pipeline

1. Source: ICIMOD ZIP containing a shapefile (WGS84 coordinates, no reprojection needed)
2. Simplification at 3% Visvalingam tolerance via `mapshaper` (keep-shapes preserves small lakes)
3. Brotli compression at quality 11 (maximum) via Node.js `zlib.brotliCompressSync`
4. Written to this directory

## Feature properties (current lakes)

```ts
{
  id: string;           // GL_ID from source or GL{hash} fallback
  area_km2: number;     // polygon area in km²
  kind: "current";
  basin: string;        // major river basin (Koshi/Gandaki/Karnali)
  sub_basin: string;    // sub-basin name
  elevation_m: number;  // lake elevation in metres
  lake_type: string;    // lake type code
  country: string;      // country name
}
```

## Feature properties (risky lakes)

Same as current lakes plus:

```ts
{
  kind: "risky";
  risk_tier: "low" | "medium" | "high";
}
```

### Risk-tier bucketing

Source column `Rank` uses Roman numerals. Bucket rule:

| Source `Rank` | `risk_tier` | Meaning |
|---|---|---|
| `I` | `high` | Priority I — highest GLOF risk, requires immediate attention |
| `II` | `medium` | Priority II |
| `III` | `low` | Priority III |

All 47 records have `VS_inspect = PDL` (visually inspected, potentially dangerous lake).

## Usage

Cloudflare's edge handles Brotli decompression automatically — the browser receives plain JSON:

```js
const r = await fetch('/glacial-lakes/current.geojson.br');
const fc = await r.json(); // browser handles Brotli decompression transparently
console.log(fc.features.length); // number of lake polygons

const risky = await fetch('/glacial-lakes/risky.geojson.br');
const rc = await risky.json();
const highRisk = rc.features.filter(f => f.properties.risk_tier === 'high');
```

## Source attribution

ICIMOD (International Centre for Integrated Mountain Development).

- Current lakes: "Glacial lakes in the Koshi, Gandaki, and Karnali river basins of Nepal, the Tibet Autonomous Region of China, and India." ICIMOD RDS ID 1971946. https://rds.icimod.org/Home/DataDetail?metadataId=1971946
- Dangerous lakes: "Potentially dangerous glacial lakes in the Koshi, Gandaki, and Karnali river basins..." ICIMOD RDS ID 1971950. https://rds.icimod.org/Home/DataDetail?metadataId=1971950

License: CC BY-NC-SA 4.0. Retrieved 2026.
