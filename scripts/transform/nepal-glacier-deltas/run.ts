#!/usr/bin/env tsx

/**
 * Nepal Glacier Deltas
 *
 * Joins ICIMOD HKH glacier inventories across decades (1990, 2000, 2010, 2020),
 * filters to glaciers whose centroid falls inside the Nepal admin polygon
 * (Natural Earth 10m), and computes per-glacier loss + Nepal-wide aggregates.
 *
 * Reads:  public/glaciers/hkh/{year}-points.geojson  (centroid + properties)
 *         data/boundaries/nepal.geojson              (Natural Earth Admin0)
 * Writes: public/glaciers/nepal-deltas.json          (consumed by atlas client)
 *
 * Run with: npm run transform:nepal-glacier-deltas
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// @turf/boolean-point-in-polygon ships ESM with broken "exports" map for
// TypeScript — types live in dist/js/index.d.ts but `exports` only points
// at dist/es/index.js. Import as untyped and cast to a narrow signature
// matching the API we use.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — see comment above
import booleanPointInPolygonModule from "@turf/boolean-point-in-polygon";

type PointInPolygonFn = (
  pt: GeoJSON.Feature<GeoJSON.Point> | GeoJSON.Point | number[],
  poly: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | GeoJSON.Polygon | GeoJSON.MultiPolygon,
) => boolean;

const booleanPointInPolygon: PointInPolygonFn =
  typeof booleanPointInPolygonModule === "function"
    ? (booleanPointInPolygonModule as PointInPolygonFn)
    : ((booleanPointInPolygonModule as { default: PointInPolygonFn }).default);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const POINTS_DIR = path.join(PROJECT_ROOT, "public", "glaciers", "hkh");
const NEPAL_POLY = path.join(PROJECT_ROOT, "data", "boundaries", "nepal.geojson");
const OUT_PATH = path.join(PROJECT_ROOT, "public", "glaciers", "nepal-deltas.json");

const YEARS = [1990, 2000, 2010, 2020] as const;
type Year = (typeof YEARS)[number];

interface GlacierProps {
  id: string;
  area_km2: number;
  year: number;
  GLIMS_ID: string;
  Mt_Range: string;
  M_Basin: string;
}

type PointFeature = GeoJSON.Feature<GeoJSON.Point, GlacierProps>;
type PointFC = GeoJSON.FeatureCollection<GeoJSON.Point, GlacierProps>;

// Famous Nepal glaciers — name, centroid coordinates from published inventories,
// short note. Listed in display priority: when several names map to the same
// physical glacier feature in the ICIMOD inventory, the higher-priority name
// wins so we surface the most recognizable one. Pruned of close-pair
// duplicates (Nuptse / West Rongbuk fold into Khumbu in this inventory).
const FAMOUS: { name: string; lat: number; lon: number; note?: string }[] = [
  { name: "Khumbu", lat: 27.96, lon: 86.86, note: "Everest's south flank — Khumbu Icefall" },
  { name: "Imja", lat: 27.9, lon: 86.93, note: "Feeds Imja Tsho — fastest-growing lake" },
  { name: "Ngozumpa", lat: 27.95, lon: 86.69, note: "Longest glacier in Nepal" },
  { name: "Cho Oyu", lat: 28.09, lon: 86.66, note: "World's 6th highest peak" },
  { name: "Kanchenjunga", lat: 27.7, lon: 88.13, note: "World's 3rd highest peak" },
  { name: "Yalung", lat: 27.66, lon: 88.05, note: "Kanchenjunga south face" },
  { name: "Makalu", lat: 27.89, lon: 87.08, note: "Mt. Makalu (8,485 m)" },
  { name: "Barun", lat: 27.85, lon: 87.05, note: "Source of Barun River" },
  { name: "Annapurna I", lat: 28.6, lon: 83.83, note: "First 8,000 m peak climbed" },
  { name: "Annapurna South", lat: 28.51, lon: 83.81 },
  { name: "Manaslu", lat: 28.55, lon: 84.56, note: "World's 8th highest peak" },
  { name: "Himalchuli", lat: 28.43, lon: 84.64 },
  { name: "Dhaulagiri", lat: 28.7, lon: 83.49, note: "World's 7th highest peak" },
  { name: "Hidden Valley", lat: 28.71, lon: 83.55 },
  { name: "Rikha Samba", lat: 28.83, lon: 83.5, note: "Long-monitored benchmark" },
  { name: "Yala", lat: 28.23, lon: 85.61, note: "Langtang benchmark glacier" },
  { name: "Langtang", lat: 28.2, lon: 85.55 },
  { name: "Lirung", lat: 28.24, lon: 85.55 },
  { name: "Kanjiroba", lat: 29.16, lon: 82.67 },
  { name: "Api", lat: 30.0, lon: 80.93, note: "Far-western Nepal" },
  { name: "Saipal", lat: 29.96, lon: 81.32 },
  { name: "Nampa", lat: 30.07, lon: 80.99 },
];

function readPoints(year: Year): PointFC {
  const p = path.join(POINTS_DIR, `${year}-points.geojson`);
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as PointFC;
}

function readNepalPoly(): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  const fc = JSON.parse(fs.readFileSync(NEPAL_POLY, "utf8")) as GeoJSON.FeatureCollection;
  const f = fc.features[0];
  if (!f) throw new Error("Nepal polygon empty");
  return f as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
}

function inNepal(
  pt: GeoJSON.Feature<GeoJSON.Point>,
  nepal: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
): boolean {
  return booleanPointInPolygon(pt, nepal);
}

function nearestFamous(
  lon: number,
  lat: number,
  maxDeg = 0.06, // ~6.6 km at this latitude — tight to avoid spurious matches
): string | null {
  let best: { name: string; d: number; note?: string } | null = null;
  for (const g of FAMOUS) {
    const dLon = g.lon - lon;
    const dLat = g.lat - lat;
    const d = Math.sqrt(dLon * dLon + dLat * dLat);
    if (d <= maxDeg && (!best || d < best.d)) {
      best = { name: g.name, d, note: g.note };
    }
  }
  return best ? best.name : null;
}

interface DeltaRow {
  glims_id: string;
  area_1990: number;
  area_2020: number;
  delta_km2: number;
  delta_pct: number; // negative = shrunk
  lon: number;
  lat: number;
  range: string;
  basin: string;
  named?: string;
}

interface BasinRow {
  basin: string;
  count_1990: number;
  count_2020: number;
  area_1990: number;
  area_2020: number;
  delta_km2: number;
  delta_pct: number;
}

interface RangeRow {
  range: string;
  count_1990: number;
  count_2020: number;
  area_1990: number;
  area_2020: number;
  delta_km2: number;
  delta_pct: number;
}

interface RegionRow {
  region: string;
  lon_min: number;
  lon_max: number;
  count_1990: number;
  count_2020: number;
  area_1990: number;
  area_2020: number;
  delta_km2: number;
  delta_pct: number;
}

interface NepalDeltasOut {
  generated_at: string;
  source: string;
  totals_by_year: Record<Year, { count: number; area_km2: number }>;
  total_delta_km2: number;
  total_delta_pct: number;
  disappeared_count: number;
  appeared_count: number;
  top_shrunk_absolute: DeltaRow[];
  top_shrunk_pct: DeltaRow[];
  by_basin: BasinRow[];
  by_range: RangeRow[];
  by_region: RegionRow[];
  named_glaciers: DeltaRow[];
}

function aggregateBy<T extends { count_1990: number; count_2020: number; area_1990: number; area_2020: number; delta_km2: number; delta_pct: number }>(
  by: Map<string, { c1: number; c2: number; a1: number; a2: number }>,
  keyName: "basin" | "range",
): T[] {
  const out: T[] = [];
  for (const [k, v] of by.entries()) {
    const delta_km2 = round3(v.a2 - v.a1);
    const delta_pct = v.a1 > 0 ? round1((delta_km2 / v.a1) * 100) : 0;
    out.push({
      [keyName]: k,
      count_1990: v.c1,
      count_2020: v.c2,
      area_1990: round3(v.a1),
      area_2020: round3(v.a2),
      delta_km2,
      delta_pct,
    } as unknown as T);
  }
  out.sort((a, b) => Math.abs(b.delta_km2) - Math.abs(a.delta_km2));
  return out;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

async function main(): Promise<void> {
  console.log("Nepal Glacier Deltas");
  console.log(`  Reading ${POINTS_DIR}/{year}-points.geojson`);
  console.log(`  Nepal polygon: ${NEPAL_POLY}\n`);

  const nepal = readNepalPoly();

  // 1. Per-year filtered totals
  const totals = {} as Record<Year, { count: number; area_km2: number }>;
  const perYearProps = {} as Record<Year, Map<string, GlacierProps & { lon: number; lat: number }>>;

  for (const year of YEARS) {
    process.stdout.write(`  [${year}] reading … `);
    const fc = readPoints(year);
    process.stdout.write(`${fc.features.length} HKH features → filtering Nepal … `);

    const map = new Map<string, GlacierProps & { lon: number; lat: number }>();
    let area = 0;
    for (const feat of fc.features) {
      if (!inNepal(feat, nepal)) continue;
      const [lon, lat] = feat.geometry.coordinates;
      if (lon === undefined || lat === undefined) continue;
      const props = feat.properties;
      area += props.area_km2;
      // GLIMS_ID is the cross-year join key; if missing fall back to id
      const key = props.GLIMS_ID && props.GLIMS_ID.trim() !== "" ? props.GLIMS_ID : props.id;
      map.set(key, { ...props, lon, lat });
    }
    perYearProps[year] = map;
    totals[year] = { count: map.size, area_km2: round3(area) };
    console.log(`${map.size} in Nepal (${round3(area)} km²)`);
  }

  // 2. Per-glacier delta 1990 → 2020 via Voronoi-style assignment.
  //    GLIMS_IDs drift as a glacier retreats and big glaciers fragment into
  //    many small ones, so a pure ID join (or one-to-one nearest-neighbor)
  //    badly under-counts the 2020 area of large glaciers. Instead, for each
  //    2020 glacier we find the CLOSEST 1990 centroid and add the 2020 area
  //    into that 1990 glacier's bucket. This guarantees no double-counting
  //    and no orphans (each 2020 km² is attributed exactly once), so the
  //    per-glacier deltas sum to the Nepal-wide delta.
  const map1990 = perYearProps[1990];
  const map2020 = perYearProps[2020];

  // Spatial grid on 1990 centroids for fast nearest lookup.
  const CELL = 0.05; // grid cell size in degrees (~5.5 km)
  const grid1990 = new Map<string, (GlacierProps & { lon: number; lat: number })[]>();
  function cellKey(lon: number, lat: number): string {
    return `${Math.floor(lon / CELL)}_${Math.floor(lat / CELL)}`;
  }
  for (const f of map1990.values()) {
    const k = cellKey(f.lon, f.lat);
    const bucket = grid1990.get(k) ?? [];
    bucket.push(f);
    grid1990.set(k, bucket);
  }

  // For each 2020 glacier, find the nearest 1990 centroid and attribute area.
  const ORPHAN_DEG = 0.15; // ~16 km — well above realistic glacier displacement
  const sums2020 = new Map<string, number>(); // 1990 id → summed 2020 area
  let orphan2020 = 0;
  for (const b of map2020.values()) {
    const cx = Math.floor(b.lon / CELL);
    const cy = Math.floor(b.lat / CELL);
    let nearest: { id: string; d: number } | null = null;
    // Search up to 3 cells out to handle sparse regions.
    for (let dx = -3; dx <= 3; dx += 1) {
      for (let dy = -3; dy <= 3; dy += 1) {
        const bucket = grid1990.get(`${cx + dx}_${cy + dy}`);
        if (!bucket) continue;
        for (const a of bucket) {
          const dLon = a.lon - b.lon;
          const dLat = a.lat - b.lat;
          const d = Math.sqrt(dLon * dLon + dLat * dLat);
          if (!nearest || d < nearest.d) nearest = { id: a.id, d };
        }
      }
    }
    if (!nearest || nearest.d > ORPHAN_DEG) {
      orphan2020 += 1;
      continue;
    }
    sums2020.set(nearest.id, (sums2020.get(nearest.id) ?? 0) + b.area_km2);
  }

  const rows: DeltaRow[] = [];
  let disappeared = 0;
  for (const a of map1990.values()) {
    const area_2020 = sums2020.get(a.id) ?? 0;
    if (area_2020 === 0) disappeared += 1;
    const delta = area_2020 - a.area_km2;
    const pct = a.area_km2 > 0 ? (delta / a.area_km2) * 100 : 0;
    rows.push({
      glims_id: a.GLIMS_ID || a.id,
      area_1990: round3(a.area_km2),
      area_2020: round3(area_2020),
      delta_km2: round3(delta),
      delta_pct: round1(pct),
      lon: round3(a.lon),
      lat: round3(a.lat),
      range: a.Mt_Range || "",
      basin: a.M_Basin || "",
      named: nearestFamous(a.lon, a.lat) ?? undefined,
    });
  }
  const appeared = orphan2020;

  // 3. Top by absolute area lost. Filter:
  //    - delta_km2 < 0 (actually shrunk)
  //    - area_1990 >= 2.0 (meaningful baseline)
  //    - area_2020 > 0.5 (non-zero successor — drops border-crossing
  //      artifacts where the centroid moved into Tibet and got filtered out)
  const top_shrunk_absolute = rows
    .filter((r) => r.delta_km2 < 0 && r.area_1990 >= 2.0 && r.area_2020 >= 0.5)
    .sort((a, b) => a.delta_km2 - b.delta_km2)
    .slice(0, 25);

  // 4. Top by % lost — same artifact filter, larger baseline so percentages
  //    aren't dominated by tiny noisy glaciers.
  const top_shrunk_pct = rows
    .filter((r) => r.delta_pct < 0 && r.area_1990 >= 3.0 && r.area_2020 >= 0.5)
    .sort((a, b) => a.delta_pct - b.delta_pct)
    .slice(0, 25);

  // 5. By basin and range aggregates
  const byBasin = new Map<string, { c1: number; c2: number; a1: number; a2: number }>();
  const byRange = new Map<string, { c1: number; c2: number; a1: number; a2: number }>();

  for (const a of map1990.values()) {
    const bk = a.M_Basin || "Unknown";
    const rk = a.Mt_Range || "Unknown";
    const bv = byBasin.get(bk) ?? { c1: 0, c2: 0, a1: 0, a2: 0 };
    bv.c1 += 1;
    bv.a1 += a.area_km2;
    byBasin.set(bk, bv);
    const rv = byRange.get(rk) ?? { c1: 0, c2: 0, a1: 0, a2: 0 };
    rv.c1 += 1;
    rv.a1 += a.area_km2;
    byRange.set(rk, rv);
  }
  for (const b of map2020.values()) {
    const bk = b.M_Basin || "Unknown";
    const rk = b.Mt_Range || "Unknown";
    const bv = byBasin.get(bk) ?? { c1: 0, c2: 0, a1: 0, a2: 0 };
    bv.c2 += 1;
    bv.a2 += b.area_km2;
    byBasin.set(bk, bv);
    const rv = byRange.get(rk) ?? { c1: 0, c2: 0, a1: 0, a2: 0 };
    rv.c2 += 1;
    rv.a2 += b.area_km2;
    byRange.set(rk, rv);
  }

  const by_basin = aggregateBy<BasinRow>(byBasin, "basin");
  const by_range = aggregateBy<RangeRow>(byRange, "range");

  // Sub-regional aggregation by longitude — useful storytelling slice since
  // Nepal's glaciers are distributed along the Himalayan crest west to east.
  const REGIONS = [
    { region: "Far-West Nepal", lon_min: 80.0, lon_max: 81.5 },
    { region: "West Nepal", lon_min: 81.5, lon_max: 83.5 },
    { region: "Central Nepal", lon_min: 83.5, lon_max: 86.0 },
    { region: "East Nepal", lon_min: 86.0, lon_max: 88.3 },
  ];
  const by_region: RegionRow[] = REGIONS.map((r) => {
    let c1 = 0;
    let c2 = 0;
    let a1 = 0;
    let a2 = 0;
    for (const g of map1990.values()) {
      if (g.lon >= r.lon_min && g.lon < r.lon_max) {
        c1 += 1;
        a1 += g.area_km2;
      }
    }
    for (const g of map2020.values()) {
      if (g.lon >= r.lon_min && g.lon < r.lon_max) {
        c2 += 1;
        a2 += g.area_km2;
      }
    }
    const delta_km2 = round3(a2 - a1);
    const delta_pct = a1 > 0 ? round1((delta_km2 / a1) * 100) : 0;
    return {
      region: r.region,
      lon_min: r.lon_min,
      lon_max: r.lon_max,
      count_1990: c1,
      count_2020: c2,
      area_1990: round3(a1),
      area_2020: round3(a2),
      delta_km2,
      delta_pct,
    };
  });

  // 6. Named glaciers — for each famous coord, find the LARGEST glacier
  //    within ~5 km in 1990 and (independently) in 2020. The ICIMOD
  //    inventory sometimes merges adjacent named glaciers into one feature,
  //    so we dedupe by glims_id afterwards (FAMOUS list is in priority
  //    order, so the recognizable name wins).
  const NAMED_RADIUS = 0.05; // ~5.5 km
  function largestNearby(
    fam: { lat: number; lon: number },
    src: Map<string, GlacierProps & { lon: number; lat: number }>,
  ): (GlacierProps & { lon: number; lat: number; d: number }) | null {
    let best: (GlacierProps & { lon: number; lat: number; d: number }) | null = null;
    for (const f of src.values()) {
      const dLon = fam.lon - f.lon;
      const dLat = fam.lat - f.lat;
      const d = Math.sqrt(dLon * dLon + dLat * dLat);
      if (d > NAMED_RADIUS) continue;
      if (!best || f.area_km2 > best.area_km2) {
        best = { ...f, d };
      }
    }
    return best;
  }

  const seenGlimsIds = new Set<string>();
  const namedRows: DeltaRow[] = [];
  for (const fam of FAMOUS) {
    const a = largestNearby(fam, map1990);
    const b = largestNearby(fam, map2020);
    if (!a) continue;
    const idKey = a.GLIMS_ID || a.id;
    if (seenGlimsIds.has(idKey)) continue; // already labeled with a higher-priority name
    seenGlimsIds.add(idKey);
    const area_2020 = b?.area_km2 ?? 0;
    const delta = area_2020 - a.area_km2;
    const pct = a.area_km2 > 0 ? (delta / a.area_km2) * 100 : 0;
    namedRows.push({
      glims_id: idKey,
      area_1990: round3(a.area_km2),
      area_2020: round3(area_2020),
      delta_km2: round3(delta),
      delta_pct: round1(pct),
      lon: round3(b?.lon ?? a.lon),
      lat: round3(b?.lat ?? a.lat),
      range: (b?.Mt_Range || a.Mt_Range) ?? "",
      basin: (b?.M_Basin || a.M_Basin) ?? "",
      named: fam.name,
    });
  }
  const named_glaciers = namedRows.sort((a, b) => a.delta_km2 - b.delta_km2);

  const total_delta_km2 = round3(totals[2020].area_km2 - totals[1990].area_km2);
  const total_delta_pct =
    totals[1990].area_km2 > 0 ? round1((total_delta_km2 / totals[1990].area_km2) * 100) : 0;

  const out: NepalDeltasOut = {
    generated_at: new Date().toISOString(),
    source: "ICIMOD HKH Glacier Inventory + Natural Earth 10m Admin0",
    totals_by_year: totals,
    total_delta_km2,
    total_delta_pct,
    disappeared_count: disappeared,
    appeared_count: appeared,
    top_shrunk_absolute,
    top_shrunk_pct,
    by_basin,
    by_range,
    by_region,
    named_glaciers,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);

  console.log("\n=== Summary ===");
  for (const y of YEARS) {
    console.log(`  ${y}: ${totals[y].count} glaciers, ${totals[y].area_km2} km²`);
  }
  console.log(
    `  Δ 1990→2020: ${total_delta_km2} km² (${total_delta_pct}%), ` +
      `${disappeared} disappeared, ${appeared} new`,
  );
  console.log(`  Top shrunk (absolute): ${top_shrunk_absolute[0]?.glims_id ?? "—"} ${top_shrunk_absolute[0]?.delta_km2 ?? 0} km²`);
  console.log(`  Named matches: ${named_glaciers.length}`);
  console.log(`  Wrote ${OUT_PATH} (${sizeKb} KB)`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
