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

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.local.example).");
}

export const pool = new Pool({
  connectionString: databaseUrl,
  // Conservative defaults for Neon free tier (~100 connection limit).
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export const db = drizzle(pool, { schema });

export { schema };
