import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

// Lazy singleton: neon() validates DATABASE_URL at call time, so we defer
// construction until the first actual query. This prevents build failures in
// environments where DATABASE_URL is absent (Next.js static-analysis pass).
let _db: DbInstance | undefined;

function getDb(): DbInstance {
  if (!_db) {
    _db = drizzle(neon(process.env.DATABASE_URL ?? ""), { schema });
  }
  return _db;
}

export const db = new Proxy({} as DbInstance, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { schema };
