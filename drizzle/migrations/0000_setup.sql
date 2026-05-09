-- Himalayan Atlas — initial schema
-- See PRODUCT.md §11 for the design source of truth.
-- Idempotent: safe to re-run.

-- ─── Extensions ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ─── Place registry ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS places (
  id           SERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  class        TEXT NOT NULL CHECK (class IN (
    'trek_destination', 'glacier', 'peak', 'lake', 'river_point', 'city'
  )),
  country      TEXT NOT NULL,
  region       TEXT,
  geom         GEOMETRY(Geometry, 4326),
  altitude_m   INTEGER,
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS places_geom_idx ON places USING GIST (geom);
CREATE INDEX IF NOT EXISTS places_class_idx ON places (class);
CREATE INDEX IF NOT EXISTS places_country_idx ON places (country);

-- ─── Dataset registry ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS datasets (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  version       TEXT,
  license       TEXT NOT NULL,
  citation      TEXT NOT NULL,
  source_url    TEXT NOT NULL,
  description   TEXT,
  spatial_res   TEXT,
  temporal_res  TEXT,
  date_added    DATE DEFAULT CURRENT_DATE,
  is_active     BOOLEAN DEFAULT TRUE NOT NULL
);

-- ─── Time-series observations (TimescaleDB hypertable) ───────────────────
CREATE TABLE IF NOT EXISTS obs_weather_daily (
  time            TIMESTAMPTZ NOT NULL,
  place_id        INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  variable        TEXT NOT NULL,
  value           DOUBLE PRECISION,
  unit            TEXT,
  source_id       INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  source_version  TEXT,
  ingested_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (time, place_id, variable, source_id)
);
SELECT create_hypertable('obs_weather_daily', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS obs_weather_daily_place_var_time_idx
  ON obs_weather_daily (place_id, variable, time DESC);

-- ─── Pre-computed climatology (30-year normals) ──────────────────────────
CREATE TABLE IF NOT EXISTS obs_climatology (
  place_id          INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  variable          TEXT NOT NULL,
  doy               INTEGER NOT NULL CHECK (doy BETWEEN 1 AND 366),
  mean              DOUBLE PRECISION,
  p05               DOUBLE PRECISION,
  p25               DOUBLE PRECISION,
  p50               DOUBLE PRECISION,
  p75               DOUBLE PRECISION,
  p95               DOUBLE PRECISION,
  baseline_period   TEXT NOT NULL,
  source_id         INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  PRIMARY KEY (place_id, variable, doy, baseline_period, source_id)
);

-- ─── Cryosphere — glacier outlines, time-versioned ───────────────────────
CREATE TABLE IF NOT EXISTS cryo_glacier_outlines (
  id            SERIAL PRIMARY KEY,
  place_id      INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  outline_year  INTEGER NOT NULL,
  geom          GEOMETRY(MultiPolygon, 4326),
  area_km2      DOUBLE PRECISION,
  source_id     INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  UNIQUE (place_id, outline_year, source_id)
);
CREATE INDEX IF NOT EXISTS cryo_outlines_geom_idx ON cryo_glacier_outlines USING GIST (geom);

-- ─── Cryosphere — glacier mass balance time series (hypertable) ──────────
CREATE TABLE IF NOT EXISTS cryo_glacier_mass_balance (
  time        TIMESTAMPTZ NOT NULL,
  place_id    INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  value       DOUBLE PRECISION,
  method      TEXT NOT NULL CHECK (method IN ('glaciological', 'geodetic', 'modeled')),
  source_id   INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  PRIMARY KEY (time, place_id, method, source_id)
);
SELECT create_hypertable('cryo_glacier_mass_balance', 'time', if_not_exists => TRUE);

-- ─── Cryosphere — glacial lakes ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cryo_glacial_lakes (
  id            SERIAL PRIMARY KEY,
  place_id      INTEGER REFERENCES places(id) ON DELETE SET NULL,
  inventory_year INTEGER NOT NULL,
  geom          GEOMETRY(MultiPolygon, 4326),
  area_km2      DOUBLE PRECISION,
  glof_risk     TEXT CHECK (glof_risk IN ('low', 'medium', 'high', 'very_high', 'unknown')),
  source_id     INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  metadata      JSONB
);
CREATE INDEX IF NOT EXISTS cryo_lakes_geom_idx ON cryo_glacial_lakes USING GIST (geom);

-- ─── Climate projections — CMIP6 summaries ───────────────────────────────
CREATE TABLE IF NOT EXISTS proj_cmip6_summaries (
  place_id    INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  scenario    TEXT NOT NULL CHECK (scenario IN ('ssp126', 'ssp245', 'ssp585')),
  variable    TEXT NOT NULL,
  period      TEXT NOT NULL,
  baseline    TEXT NOT NULL,
  delta_mean  DOUBLE PRECISION,
  delta_p10   DOUBLE PRECISION,
  delta_p90   DOUBLE PRECISION,
  n_models    INTEGER,
  source_id   INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  PRIMARY KEY (place_id, scenario, variable, period, baseline, source_id)
);

-- ─── Historical events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events_historical (
  id                SERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  event_class       TEXT NOT NULL CHECK (event_class IN (
    'earthquake', 'flood', 'glof', 'storm', 'avalanche', 'landslide', 'drought', 'heatwave', 'other'
  )),
  time_start        TIMESTAMPTZ NOT NULL,
  time_end          TIMESTAMPTZ,
  affected_geom     GEOMETRY(Geometry, 4326),
  affected_places   INTEGER[],
  summary           TEXT NOT NULL,
  evidence          JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS events_time_idx ON events_historical (time_start DESC);
CREATE INDEX IF NOT EXISTS events_class_idx ON events_historical (event_class);
CREATE INDEX IF NOT EXISTS events_places_idx ON events_historical USING GIN (affected_places);

-- ─── Active events (live feed: FIRMS fires, HydroSAR floods, etc.) ───────
CREATE TABLE IF NOT EXISTS events_active (
  id                SERIAL PRIMARY KEY,
  event_class       TEXT NOT NULL CHECK (event_class IN ('fire', 'flood', 'storm', 'other')),
  detected_at       TIMESTAMPTZ NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  geom              GEOMETRY(Geometry, 4326),
  metadata          JSONB,
  source_id         INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS events_active_detected_idx ON events_active (detected_at DESC);
CREATE INDEX IF NOT EXISTS events_active_geom_idx ON events_active USING GIST (geom);
CREATE INDEX IF NOT EXISTS events_active_expires_idx ON events_active (expires_at);

-- ─── Photo archive ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos_archive (
  id            SERIAL PRIMARY KEY,
  place_id      INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  capture_time  TIMESTAMPTZ NOT NULL,
  source        TEXT NOT NULL,
  caption       TEXT,
  license       TEXT NOT NULL,
  url           TEXT NOT NULL,
  blob_path     TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS photos_place_time_idx
  ON photos_archive (place_id, capture_time DESC);

-- ─── Migration ledger ────────────────────────────────────────────────────
-- Tracks which migrations have been applied. Created here so subsequent
-- migrations can use it.
CREATE TABLE IF NOT EXISTS _migrations (
  id           SERIAL PRIMARY KEY,
  filename     TEXT UNIQUE NOT NULL,
  checksum     TEXT NOT NULL,
  applied_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
