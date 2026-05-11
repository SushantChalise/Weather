/**
 * e2e/water-cycle-asset-budget.spec.ts
 *
 * Acceptance criterion (T4.5 / 08-acceptance-criteria.md "Asset budget script"):
 *   - Every file in public/water-cycle/ch{N}/cinematic* is < 24 MiB
 *   - Every poster.jpg in public/water-cycle/ch{N}/ is < 500 KiB
 *   - Total public/water-cycle/ directory size < 250 MiB
 *
 * This test reads from disk (no running dev server needed). It is placed in the
 * e2e/ directory so it runs as part of the full Playwright suite.
 * NOTE: We use process.cwd() to resolve paths — no import.meta.url needed.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// Resolve public/water-cycle/ relative to the repo root (process.cwd() in Playwright)
const WATER_CYCLE_DIR = join(process.cwd(), "public", "water-cycle");

const PER_FILE_CAP_MIB = 24;
const POSTER_CAP_KIB = 500;
const TOTAL_CAP_MIB = 250;

const PER_FILE_CAP_BYTES = PER_FILE_CAP_MIB * 1024 * 1024;
const POSTER_CAP_BYTES = POSTER_CAP_KIB * 1024;
const TOTAL_CAP_BYTES = TOTAL_CAP_MIB * 1024 * 1024;

function fmt(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

function walk(dir: string): { path: string; size: number }[] {
  const entries: { path: string; size: number }[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      entries.push(...walk(full));
    } else {
      entries.push({ path: full, size: st.size });
    }
  }
  return entries;
}

const CHAPTER_IDS = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"] as const;

test.describe("water-cycle asset budget", () => {
  test("public/water-cycle directory exists", async () => {
    await test.step("directory exists", () => {
      expect(
        existsSync(WATER_CYCLE_DIR),
        `Expected ${WATER_CYCLE_DIR} to exist`,
      ).toBe(true);
    });
  });

  for (const chapterId of CHAPTER_IDS) {
    test.describe(`chapter ${chapterId}`, () => {
      const chapterDir = join(WATER_CYCLE_DIR, chapterId);

      test(`cinematic files < ${PER_FILE_CAP_MIB} MiB each`, async () => {
        if (!existsSync(chapterDir)) {
          test.skip(true, `${chapterId} directory not yet created — render task pending`);
          return;
        }

        await test.step(`scan ${chapterId}/cinematic*`, () => {
          const files = readdirSync(chapterDir).filter((f) =>
            f.startsWith("cinematic"),
          );

          if (files.length === 0) {
            console.warn(
              `[WARN] No cinematic* files found in ${chapterId} — render task may be pending`,
            );
            // Not a hard fail if renders aren't done yet — scaffolded ahead of renders
            return;
          }

          for (const file of files) {
            const full = join(chapterDir, file);
            const { size } = statSync(full);
            expect(
              size,
              `${chapterId}/${file} is ${fmt(size)} — exceeds ${PER_FILE_CAP_MIB} MiB cap`,
            ).toBeLessThan(PER_FILE_CAP_BYTES);
          }
        });
      });

      test(`poster.jpg < ${POSTER_CAP_KIB} KiB`, async () => {
        if (!existsSync(chapterDir)) {
          test.skip(true, `${chapterId} directory not yet created — render task pending`);
          return;
        }

        await test.step(`check ${chapterId}/poster.jpg`, () => {
          const posterPath = join(chapterDir, "poster.jpg");
          if (!existsSync(posterPath)) {
            console.warn(
              `[WARN] ${chapterId}/poster.jpg not found — render task may be pending`,
            );
            return;
          }
          const { size } = statSync(posterPath);
          expect(
            size,
            `${chapterId}/poster.jpg is ${fmt(size)} — exceeds ${POSTER_CAP_KIB} KiB cap`,
          ).toBeLessThan(POSTER_CAP_BYTES);
        });
      });
    });
  }

  test(`total public/water-cycle/ size < ${TOTAL_CAP_MIB} MiB`, async () => {
    await test.step("sum all files", () => {
      if (!existsSync(WATER_CYCLE_DIR)) {
        console.warn("[WARN] public/water-cycle/ does not exist yet — skipping total-size check");
        return;
      }

      const files = walk(WATER_CYCLE_DIR);
      const totalBytes = files.reduce((s, f) => s + f.size, 0);

      console.log(
        `[INFO] public/water-cycle/ total: ${fmt(totalBytes)} / ${TOTAL_CAP_MIB} MiB`,
      );

      expect(
        totalBytes,
        `Total public/water-cycle/ is ${fmt(totalBytes)} — exceeds ${TOTAL_CAP_MIB} MiB cap`,
      ).toBeLessThan(TOTAL_CAP_BYTES);
    });
  });
});
