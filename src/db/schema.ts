/**
 * Drizzle schema — TypeScript types matching the SQL in `drizzle/migrations/`.
 *
 * Source of truth for the schema is the SQL files (see drizzle/migrations/0000_setup.sql).
 * This file mirrors that schema for type-safe query building from application code.
 *
 * PostGIS geometry columns are typed as `string` here (WKT / GeoJSON serialization
 * is handled by application code via PostGIS functions like ST_AsGeoJSON, ST_GeomFromGeoJSON).
 *
 * See PRODUCT.md §11 for the design source of truth.
 */

import {
  boolean,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// PostGIS geometry custom type. Stored as `geometry` in Postgres; serialised
// as WKT / GeoJSON via PostGIS functions in queries.
const geometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry";
  },
});

// ─── Place registry ─────────────────────────────────────────────────────
export const places = pgTable(
  "places",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    class: text("class").notNull(),
    country: text("country").notNull(),
    region: text("region"),
    geom: geometry("geom"),
    altitudeM: integer("altitude_m"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("places_class_idx").on(table.class),
    index("places_country_idx").on(table.country),
  ],
);

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;
export type PlaceClass = "trek_destination" | "glacier" | "peak" | "lake" | "river_point" | "city";

// ─── Dataset registry ───────────────────────────────────────────────────
export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  version: text("version"),
  license: text("license").notNull(),
  citation: text("citation").notNull(),
  sourceUrl: text("source_url").notNull(),
  description: text("description"),
  spatialRes: text("spatial_res"),
  temporalRes: text("temporal_res"),
  dateAdded: date("date_added").defaultNow(),
  isActive: boolean("is_active").default(true).notNull(),
});

export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;

// ─── Time-series observations (TimescaleDB hypertable on `time`) ────────
export const obsWeatherDaily = pgTable(
  "obs_weather_daily",
  {
    time: timestamp("time", { withTimezone: true }).notNull(),
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    variable: text("variable").notNull(),
    value: doublePrecision("value"),
    unit: text("unit"),
    sourceId: integer("source_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "restrict" }),
    sourceVersion: text("source_version"),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.time, table.placeId, table.variable, table.sourceId] }),
    index("obs_weather_daily_place_var_time_idx").on(table.placeId, table.variable, table.time),
  ],
);

export type WeatherObservation = typeof obsWeatherDaily.$inferSelect;
export type NewWeatherObservation = typeof obsWeatherDaily.$inferInsert;

// ─── Pre-computed climatology (30-year normals) ─────────────────────────
export const obsClimatology = pgTable(
  "obs_climatology",
  {
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    variable: text("variable").notNull(),
    doy: integer("doy").notNull(),
    mean: doublePrecision("mean"),
    p05: doublePrecision("p05"),
    p25: doublePrecision("p25"),
    p50: doublePrecision("p50"),
    p75: doublePrecision("p75"),
    p95: doublePrecision("p95"),
    baselinePeriod: text("baseline_period").notNull(),
    sourceId: integer("source_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({
      columns: [table.placeId, table.variable, table.doy, table.baselinePeriod, table.sourceId],
    }),
  ],
);

// ─── Cryosphere — glacier outlines (time-versioned) ─────────────────────
export const cryoGlacierOutlines = pgTable(
  "cryo_glacier_outlines",
  {
    id: serial("id").primaryKey(),
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    outlineYear: integer("outline_year").notNull(),
    geom: geometry("geom"),
    areaKm2: doublePrecision("area_km2"),
    sourceId: integer("source_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "restrict" }),
  },
  (table) => [unique().on(table.placeId, table.outlineYear, table.sourceId)],
);

// ─── Cryosphere — glacier mass balance (TimescaleDB hypertable) ─────────
export const cryoGlacierMassBalance = pgTable(
  "cryo_glacier_mass_balance",
  {
    time: timestamp("time", { withTimezone: true }).notNull(),
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    value: doublePrecision("value"),
    method: text("method").notNull(),
    sourceId: integer("source_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.time, table.placeId, table.method, table.sourceId] })],
);

// ─── Cryosphere — glacial lakes ─────────────────────────────────────────
export const cryoGlacialLakes = pgTable("cryo_glacial_lakes", {
  id: serial("id").primaryKey(),
  placeId: integer("place_id").references(() => places.id, { onDelete: "set null" }),
  inventoryYear: integer("inventory_year").notNull(),
  geom: geometry("geom"),
  areaKm2: doublePrecision("area_km2"),
  glofRisk: text("glof_risk"),
  sourceId: integer("source_id")
    .notNull()
    .references(() => datasets.id, { onDelete: "restrict" }),
  metadata: jsonb("metadata"),
});

// ─── Climate projections — CMIP6 summaries ──────────────────────────────
export const projCmip6Summaries = pgTable(
  "proj_cmip6_summaries",
  {
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    scenario: text("scenario").notNull(),
    variable: text("variable").notNull(),
    period: text("period").notNull(),
    baseline: text("baseline").notNull(),
    deltaMean: doublePrecision("delta_mean"),
    deltaP10: doublePrecision("delta_p10"),
    deltaP90: doublePrecision("delta_p90"),
    nModels: integer("n_models"),
    sourceId: integer("source_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({
      columns: [
        table.placeId,
        table.scenario,
        table.variable,
        table.period,
        table.baseline,
        table.sourceId,
      ],
    }),
  ],
);

// ─── Historical events ──────────────────────────────────────────────────
export const eventsHistorical = pgTable(
  "events_historical",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    eventClass: text("event_class").notNull(),
    timeStart: timestamp("time_start", { withTimezone: true }).notNull(),
    timeEnd: timestamp("time_end", { withTimezone: true }),
    affectedGeom: geometry("affected_geom"),
    affectedPlaces: integer("affected_places").array(),
    summary: text("summary").notNull(),
    evidence: jsonb("evidence"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("events_time_idx").on(table.timeStart),
    index("events_class_idx").on(table.eventClass),
  ],
);

// ─── Active events (live feed: FIRMS, HydroSAR, etc.) ───────────────────
export const eventsActive = pgTable(
  "events_active",
  {
    id: serial("id").primaryKey(),
    eventClass: text("event_class").notNull(),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    geom: geometry("geom"),
    metadata: jsonb("metadata"),
    sourceId: integer("source_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "restrict" }),
  },
  (table) => [
    index("events_active_detected_idx").on(table.detectedAt),
    index("events_active_expires_idx").on(table.expiresAt),
  ],
);

// ─── Photo archive ──────────────────────────────────────────────────────
export const photosArchive = pgTable(
  "photos_archive",
  {
    id: serial("id").primaryKey(),
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    captureTime: timestamp("capture_time", { withTimezone: true }).notNull(),
    source: text("source").notNull(),
    caption: text("caption"),
    license: text("license").notNull(),
    url: text("url").notNull(),
    blobPath: text("blob_path"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("photos_place_time_idx").on(table.placeId, table.captureTime)],
);

// ─── FIRMS fire hotspots (NASA MODIS + VIIRS historical) ─────────────────
export const fires = pgTable(
  "fires",
  {
    id: serial("id").primaryKey(),
    time: timestamp("time", { withTimezone: true }).notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    confidence: text("confidence"),
    frp: real("frp"),
    sourceLabel: text("source_label").notNull(),
    daynight: text("daynight"),
    sourceId: integer("source_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "restrict" }),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("fires_dedup_idx").on(table.time, table.latitude, table.longitude, table.sourceLabel),
    index("fires_time_idx").on(table.time),
    index("fires_source_label_idx").on(table.sourceLabel),
  ],
);

export type Fire = typeof fires.$inferSelect;
export type NewFire = typeof fires.$inferInsert;
