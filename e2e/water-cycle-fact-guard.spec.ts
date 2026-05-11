/**
 * e2e/water-cycle-fact-guard.spec.ts
 *
 * Acceptance criterion (T4.5 / 08-acceptance-criteria.md "Number-fact accuracy guard"):
 * Scans ALL rendered text on /atlas/water-cycle for forbidden numerical claims locked
 * by the editorial review. These phrases represent corrected or superseded numbers.
 *
 * Forbidden phrases (from WATER_CYCLE_SPEC.md §3 "Anti-numbers"):
 *   - /2\.5\s*trillion\s*tonnes/i  — was 5× overstatement; use ~0.5 trillion
 *   - /-12%\s*area/i              — superseded by ICIMOD's "~9% of all HKH ice"
 *   - /1\.65\s*billion/i          — basin pop, not meltwater-dependent; use 250M
 *   - /100\+\s*killed/i           — South Lhonak inflated; use 24+70
 *   - /doubled\s*in\s*17\s*years/i — Imja math error; it's 35×, not 2×
 *   - /RCP\s*4\.5.*worst\s*case/i  — deprecated IPCC framing; use SSP scenarios
 */

import { expect, test } from "@playwright/test";

const FORBIDDEN_PHRASES: { pattern: RegExp; description: string }[] = [
  {
    pattern: /2\.5\s*trillion\s*tonnes/i,
    description: "OLD WRONG NUMBER — 5× overstatement; use ~0.5 trillion tonnes",
  },
  {
    pattern: /-12%\s*area/i,
    description: "SUPERSEDED phrasing — use '~9% of all HKH ice' per ICIMOD 2026",
  },
  {
    pattern: /1\.65\s*billion/i,
    description:
      "WRONG POPULATION CLAIM — basin pop, not meltwater-dependent; use ~250M",
  },
  {
    pattern: /100\+\s*killed/i,
    description:
      "INFLATED South Lhonak death toll — journalism not yet verified; use '24 dead, 70+ missing'",
  },
  {
    pattern: /doubled\s*in\s*17\s*years/i,
    description: "IMJA MATH ERROR — it grew 35×, not doubled; '17 years' framing also wrong",
  },
  {
    pattern: /RCP\s*4\.5.*worst\s*case/i,
    description: "DEPRECATED IPCC FRAMING — use SSP1-2.6 vs SSP5-8.5 (AR6 framework)",
  },
];

test.describe("water-cycle fact guard", () => {
  test.beforeEach(async ({ page }) => {
    // Capture all console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`[browser console error] ${msg.text()}`);
      }
    });
  });

  test("page loads without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await test.step("navigate to water-cycle page", async () => {
      // Use explicit timeout for goto to avoid 60s default test timeout
      await page.goto("/atlas/water-cycle", { timeout: 45000, waitUntil: "domcontentloaded" });
    });

    await test.step("assert zero unexpected console errors on page load", () => {
      const nonExpectedErrors = consoleErrors.filter((e) => {
        const lower = e.toLowerCase();
        return (
          !lower.includes("hydration") &&
          !lower.includes("prefetch") &&
          !lower.includes("favicon") &&
          // Filter out expected 404s for pending render assets (cinematic videos ch1-ch6)
          !lower.includes("failed to load resource") &&
          !lower.includes("404")
        );
      });

      const resourceErrors = consoleErrors.filter((e) => {
        const lower = e.toLowerCase();
        return lower.includes("failed to load resource") || lower.includes("404");
      });
      if (resourceErrors.length > 0) {
        console.warn(
          `[WARN] ${resourceErrors.length} resource 404(s) — pending render assets:`,
          resourceErrors.slice(0, 3),
        );
      }

      expect(
        nonExpectedErrors,
        `Console errors found: ${JSON.stringify(nonExpectedErrors, null, 2)}`,
      ).toHaveLength(0);
    });
  });

  for (const { pattern, description } of FORBIDDEN_PHRASES) {
    test(`forbidden phrase not present: ${pattern.source}`, async ({ page }) => {
      await test.step("navigate to water-cycle page", async () => {
        await page.goto("/atlas/water-cycle");
        await page.waitForLoadState("domcontentloaded");
      });

      await test.step(`scan page text for forbidden pattern: ${pattern.source}`, async () => {
        // Read visible text content of the entire page body
        const bodyText = await page.evaluate(() => document.body.innerText);

        const matched = pattern.test(bodyText);
        expect(
          matched,
          `FORBIDDEN PHRASE FOUND: ${pattern.source}\nReason: ${description}\nMatched in page text. Fix the caption/overlay copy.`,
        ).toBe(false);
      });
    });
  }

  test("all forbidden phrases absent (single-pass scan)", async ({ page }) => {
    await test.step("navigate to water-cycle page", async () => {
      await page.goto("/atlas/water-cycle");
      await page.waitForLoadState("domcontentloaded");

      // Scroll to bottom to trigger any lazy-loaded content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
    });

    await test.step("scan full page text for all forbidden phrases", async () => {
      const bodyText = await page.evaluate(() => document.body.innerText);

      const violations: string[] = [];
      for (const { pattern, description } of FORBIDDEN_PHRASES) {
        if (pattern.test(bodyText)) {
          violations.push(`• ${pattern.source}: ${description}`);
        }
      }

      expect(
        violations,
        `FACT GUARD VIOLATIONS:\n${violations.join("\n")}`,
      ).toHaveLength(0);
    });
  });
});
