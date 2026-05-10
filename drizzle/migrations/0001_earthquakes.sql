-- Himalayan Atlas — earthquakes table
-- Stores USGS historical M ≥ 4.5 events for the Nepal-centred bounding box.
-- Idempotent: safe to re-run.

-- ─── Earthquakes ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earthquakes (
  id           VARCHAR PRIMARY KEY,
  time         TIMESTAMPTZ NOT NULL,
  magnitude    REAL NOT NULL,
  latitude     REAL NOT NULL,
  longitude    REAL NOT NULL,
  depth_km     REAL,
  place_label  TEXT,
  source_id    INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  ingested_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS earthquakes_time_idx       ON earthquakes (time DESC);
CREATE INDEX IF NOT EXISTS earthquakes_magnitude_idx  ON earthquakes (magnitude DESC);
