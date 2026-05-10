-- NASA FIRMS historical fire hotspots
-- Deduplication key: (time, latitude, longitude, source_label)

CREATE TABLE IF NOT EXISTS fires (
  id            SERIAL PRIMARY KEY,
  time          TIMESTAMPTZ NOT NULL,
  latitude      REAL NOT NULL,
  longitude     REAL NOT NULL,
  confidence    TEXT,
  frp           REAL,
  source_label  TEXT NOT NULL,
  daynight      TEXT CHECK (daynight IN ('D', 'N')),
  source_id     INTEGER NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  ingested_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS fires_dedup_idx
  ON fires (time, latitude, longitude, source_label);

CREATE INDEX IF NOT EXISTS fires_time_idx
  ON fires (time DESC);

CREATE INDEX IF NOT EXISTS fires_source_label_idx
  ON fires (source_label);
