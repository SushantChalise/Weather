/**
 * Postgres client + Drizzle wrapper.
 *
 * Two flavours:
 *
 *   - `pool`: node-postgres connection pool. Use in long-running contexts
 *     (ingestion scripts, dev server). Cheap to keep open, expensive to
 *     create per-request.
 *
 *   - `db`: Drizzle wrapper around the pool. Type-safe query builder.
 *
 * For Vercel serverless functions, swap to `@neondatabase/serverless`'s
 * HTTP driver in a follow-up — pool-based clients eat connection slots
 * fast under serverless concurrency.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Lazy: pg.Pool doesn't actually connect on construction, so we only
// surface the missing-env error when something tries to query. Throwing
// at import time breaks `next build` in CI, where DATABASE_URL is absent.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Conservative defaults for Neon free tier (~100 connection limit).
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export const db = drizzle(pool, { schema });

export { schema };
