# HKH Glacier Decadal Outlines

Brotli-precompressed GeoJSON files containing Hindu Kush Himalaya glacier polygon outlines for four decades.

## Files

| File | Decade | Source dataset |
|---|---|---|
| `1990.geojson.br` | ~1990 | ICIMOD RDS ID 1973447: HKH Glacier 1990 |
| `2000.geojson.br` | ~2000 | ICIMOD RDS ID 1973447: HKH Glacier 2000 |
| `2010.geojson.br` | ~2010 | ICIMOD RDS ID 1973447: HKH Glacier 2010 |
| `2020.geojson.br` | ~2020 | ICIMOD RDS ID 1973447: HKH Glacier 2020 |

## Format

Each file is a **Brotli-compressed GeoJSON FeatureCollection** (`.geojson.br`).

Cloudflare Pages serves these files with:
- `Content-Encoding: br` — browser decompresses transparently
- `Content-Type: application/json`
- `Cache-Control: public, max-age=31536000, immutable`

## Processing pipeline

1. Source: ICIMOD ZIP containing a shapefile projected in HKH North Albers Equal Area Conic
2. Reprojection to WGS84 (EPSG:4326) via `proj4`
3. Simplification at 5% Visvalingam tolerance via `mapshaper` (keep-shapes preserves small glaciers)
4. Brotli compression at quality 11 (maximum) via Node.js `zlib.brotliCompressSync`
5. Written to this directory

## Feature properties

```ts
{
  id: string;       // GLIMS_ID_{year} or GH{hash}_{year} if no GLIMS_ID
  area_km2: number; // polygon area in km²
  year: number;     // decade year (1990/2000/2010/2020)
  GLIMS_ID: string; // GLIMS glacier identifier (may be empty)
  Mt_Range: string; // mountain range name
  M_Basin: string;  // major river basin
}
```

## Usage

Cloudflare's edge handles Brotli decompression automatically — the browser receives plain JSON:

```js
const r = await fetch('/glaciers/hkh/2020.geojson.br');
const fc = await r.json(); // browser handles Brotli decompression transparently
console.log(fc.features.length); // number of glacier polygons
```

## Source attribution

ICIMOD (International Centre for Integrated Mountain Development). HKH Glacier inventory.
ICIMOD Research Data Series ID 1973447. Retrieved 2026.
License: CC BY-NC-SA 4.0. https://rds.icimod.org/Home/DataDetail?metadataId=1973447
