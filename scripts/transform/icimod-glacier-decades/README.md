# HKH Glacier Decades Transform

Reads four ICIMOD HKH Glacier shapefile ZIPs (1990/2000/2010/2020), reprojects from HKH Albers Equal Area Conic → WGS84, simplifies polygons at 5% Visvalingam tolerance, and uploads gzipped GeoJSON FeatureCollections to Vercel Blob.

## What the script does

1. Extracts `.shp` / `.dbf` / `.shx` from each ZIP using `yauzl`.
2. Parses each shapefile with the `shapefile` npm package (~14–65k features per decade).
3. Reprojects every coordinate from **HKH North Albers Equal Area Conic** (`+proj=aea +lat_0=15 +lon_0=83 +lat_1=20 +lat_2=43`) to **WGS84** using `proj4`.
4. Adds per-feature metadata:
   - `id` — `{GLIMS_ID}_{year}` (stable, uses the shapefile's GLIMS_ID column).
   - `area_km2` — computed via `@turf/area`, rounded to 3 decimal places.
   - `year`, `GLIMS_ID`, `Mt_Range`, `M_Basin`.
5. Simplifies the WGS84 FeatureCollection at **5% Visvalingam** tolerance with `keep-shapes` (prevents losing small glaciers) via `mapshaper.applyCommands()`.
6. Gzips the result at level 9 with Node's built-in `zlib`.
7. Uploads to Vercel Blob at `glaciers/hkh/{year}.geojson.gz` with `access: "public"`.

Output URLs follow the pattern:
```
https://b4g2j8qv8kuneoz6.public.blob.vercel-storage.com/glaciers/hkh/1990.geojson.gz
https://b4g2j8qv8kuneoz6.public.blob.vercel-storage.com/glaciers/hkh/2000.geojson.gz
https://b4g2j8qv8kuneoz6.public.blob.vercel-storage.com/glaciers/hkh/2010.geojson.gz
https://b4g2j8qv8kuneoz6.public.blob.vercel-storage.com/glaciers/hkh/2020.geojson.gz
```

## Required env vars

| Variable | Description |
|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read-write token for store `B4g2j8QV8KUneoZ6`. |

Add to `.env.local` (gitignored). Copy from the project's `.env.local` or Vercel dashboard.

## Input data

ZIPs must be present at:
```
data/icimod/1973447/HKH Glacier 1990.zip
data/icimod/1973447/HKH Glacier 2000.zip
data/icimod/1973447/HKH Glacier 2010.zip
data/icimod/1973447/HKH Glacier 2020.zip
```

The `data/` directory is gitignored. To populate it:

```bash
npm run icimod:download -- --with-login
# ensure data/icimod/1973447/ exists with the four ZIPs
```

## Usage

```bash
npm run transform:icimod-glacier-decades
```

## Output

Four gzipped GeoJSON FeatureCollections uploaded to Vercel Blob, each containing:
- ~14k–65k glacier polygon features per decade
- Properties: `id`, `area_km2`, `year`, `GLIMS_ID`, `Mt_Range`, `M_Basin`
- Coordinates in WGS84 (EPSG:4326)
- Simplified at 5% Visvalingam tolerance
