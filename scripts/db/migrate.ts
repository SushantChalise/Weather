#!/usr/bin/env tsx

/**
 * Migration runner.
 *
 * Reads SQL files from `drizzle/migrations/` in alphanumeric order.
 * Tracks applied migrations in the `_migrations` table by filename + checksum.
 * Refuses to re-apply a migration whose checksum has changed (indicates
 * the file was edited after being applied — that's a bug).
 *
 * Usage:
 *   npm run db:migrate
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

const MIGRATIONS_DIR = join(process.cwd(), "drizzle", "migrations");

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Add it to .env.local.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log("Connected to Postgres.");

  try {
    // Bootstrap the migration ledger if it doesn't exist yet.
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id           SERIAL PRIMARY KEY,
        filename     TEXT UNIQUE NOT NULL,
        checksum     TEXT NOT NULL,
        applied_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migrations to apply.");
      return;
    }

    const appliedRows = await client.query<{ filename: string; checksum: string }>(
      "SELECT filename, checksum FROM _migrations",
    );
    const applied = new Map(appliedRows.rows.map((r) => [r.filename, r.checksum]));

    let appliedCount = 0;
    for (const file of files) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");

      const previousChecksum = applied.get(file);
      if (previousChecksum !== undefined) {
        if (previousChecksum !== checksum) {
          throw new Error(
            `Migration ${file} was previously applied with a different checksum. ` +
              `Editing applied migrations is forbidden. Create a new migration instead.`,
          );
        }
        console.log(`  ${file} — already applied (skipping)`);
        continue;
      }

      console.log(`  ${file} — applying…`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (filename, checksum) VALUES ($1, $2)", [
          file,
          checksum,
        ]);
        await client.query("COMMIT");
        appliedCount += 1;
        console.log(`  ${file} — done`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log(
      `Migration complete. ${appliedCount} new migration${appliedCount === 1 ? "" : "s"} applied.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:");
  console.error(err);
  process.exit(1);
});
