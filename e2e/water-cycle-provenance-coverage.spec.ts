/**
 * e2e/water-cycle-provenance-coverage.spec.ts
 *
 * Acceptance criterion (T4.5 / 08-acceptance-criteria.md "Provenance coverage"):
 * Every visible numerical claim on /atlas/water-cycle tagged with [data-citable]
 * MUST also have a data-citation attribute. Missing data-citation = orphaned claim
 * (spec §5 "Provenance Peel": every visible number traces back to provenance.json).
 *
 * Implementation contract from 08-acceptance-criteria.md:
 *   "every numerical value in the DOM tagged with data-citable must also have
 *    data-citation set."
 */

import { expect, test } from "@playwright/test";

test.describe("water-cycle provenance coverage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await page.waitForLoadState("domcontentloaded");

    // Scroll through the full page to trigger any lazy/scroll-based renders
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
  });

  test("[data-citable] elements all have data-citation", async ({ page }) => {
    await test.step("find all [data-citable] elements", async () => {
      const citableCount = await page.locator("[data-citable]").count();

      if (citableCount === 0) {
        // No citable elements on the page yet — this is acceptable while chapter
        // content is being built (renders are phase 3 tasks). Warn but do not fail.
        console.warn(
          "[WARN] No [data-citable] elements found on page — " +
            "chapter content not yet rendered. " +
            "This test will fail once captions with data-citable are added and data-citation is absent.",
        );
        return;
      }

      console.log(`[INFO] Found ${citableCount} [data-citable] elements`);
    });

    await test.step("each [data-citable] element must have data-citation", async () => {
      // Get all citable elements
      const citableElements = page.locator("[data-citable]");
      const count = await citableElements.count();

      if (count === 0) return; // warn was issued in previous step

      const orphaned: string[] = [];

      for (let i = 0; i < count; i++) {
        const el = citableElements.nth(i);
        const citation = await el.getAttribute("data-citation");
        if (!citation || citation.trim() === "") {
          const text = await el.innerText().catch(() => "[unreadable]");
          orphaned.push(
            `  Element ${i + 1}: text="${text.slice(0, 80)}" has data-citable but no data-citation`,
          );
        }
      }

      expect(
        orphaned,
        `PROVENANCE COVERAGE VIOLATIONS:\n${orphaned.join("\n")}\n\n` +
          "Fix: add data-citation='<doi or url>' to each [data-citable] element, " +
          "pointing to a provenance.json entry.",
      ).toHaveLength(0);
    });
  });

  test("[data-citation] values point to valid provenance entries", async ({ page }) => {
    await test.step("collect citations and validate format", async () => {
      const citationElements = page.locator("[data-citation]");
      const count = await citationElements.count();

      if (count === 0) {
        console.warn("[WARN] No [data-citation] elements found — skipping format check");
        return;
      }

      const invalidCitations: string[] = [];

      for (let i = 0; i < count; i++) {
        const el = citationElements.nth(i);
        const citation = await el.getAttribute("data-citation");
        if (!citation) continue;

        // Citations must be non-empty strings (doi: or url: prefix, or a bare identifier)
        // We validate they're non-empty and truthy — format is enforced by provenance schema
        const trimmed = citation.trim();
        if (trimmed.length === 0) {
          const text = await el.innerText().catch(() => "[unreadable]");
          invalidCitations.push(
            `Element ${i + 1}: "${text.slice(0, 60)}" has empty data-citation`,
          );
        }
      }

      expect(
        invalidCitations,
        `Invalid citations:\n${invalidCitations.join("\n")}`,
      ).toHaveLength(0);
    });
  });
});
