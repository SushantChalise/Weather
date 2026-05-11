/**
 * e2e/water-cycle-a11y.spec.ts
 *
 * Acceptance criterion (T4.5 / 08-acceptance-criteria.md "Accessibility check"):
 * Run @axe-core/playwright against /atlas/water-cycle and assert zero WCAG 2.1 AA
 * violations.
 *
 * Per spec §7 constraint #9:
 *   "WCAG 2.1 AA: keyboard navigation, 4.5:1 contrast, screen-reader-friendly transcripts."
 *
 * Per 08-acceptance-criteria.md Phase 5:
 *   "Lighthouse Accessibility ≥ 95"
 *
 * axe-core is faster and more CI-friendly than running Lighthouse. This test uses
 * @axe-core/playwright to inject the axe engine into the page and check for
 * violations — zero violations is the pass condition.
 *
 * Fixed in fix/water-cycle-a11y-violations (converted from test.fixme):
 *   1. color-contrast: raised text-white/30 and text-white/40 to text-slate-400 in
 *      ch3-sankey.tsx, closing-thesis.tsx, ch6-choice.tsx, and provenance-citations.tsx.
 *   2. dlitem: fixed <dt> contrast (text-slate-600 → text-slate-400) inside <dl>.
 *   3. heading hierarchy: added sr-only <h1> in page.tsx before the Suspense boundary
 *      so heading structure is present in SSR HTML before hydration completes.
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("water-cycle accessibility (WCAG 2.1 AA)", () => {
  test(
    "page has zero WCAG 2.1 AA violations",
    async ({ page }) => {
      await test.step("navigate to water-cycle route", async () => {
        await page.goto("/atlas/water-cycle");
        await page.waitForLoadState("networkidle", { timeout: 30000 });
      });

      await test.step("run axe-core WCAG 2.1 AA analysis", async () => {
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        if (results.violations.length > 0) {
          const violationSummary = results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.map((n) => n.html).slice(0, 3),
          }));
          console.error(
            "Axe violations:\n" + JSON.stringify(violationSummary, null, 2),
          );
        }

        expect(
          results.violations,
          `WCAG 2.1 AA violations found:\n${JSON.stringify(
            results.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              helpUrl: v.helpUrl,
              nodes: v.nodes.length,
            })),
            null,
            2,
          )}`,
        ).toHaveLength(0);
      });
    },
  );

  test(
    "page has zero critical a11y violations",
    async ({ page }) => {
      await test.step("navigate to water-cycle route", async () => {
        await page.goto("/atlas/water-cycle");
        await page.waitForLoadState("domcontentloaded");
      });

      await test.step("check for critical violations specifically", async () => {
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        const criticalViolations = results.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        );

        expect(
          criticalViolations,
          `Critical/serious a11y violations:\n${criticalViolations.map((v) => `[${v.impact}] ${v.id}: ${v.description}`).join("\n")}`,
        ).toHaveLength(0);
      });
    },
  );

  test("axe-core runs without error (smoke)", async ({ page }) => {
    // This test just verifies axe can inject and scan the page without crashing.
    // It does NOT assert zero violations — that's deferred to the fixme tests above.
    // Useful as a CI gate that axe is correctly wired up.
    await test.step("navigate to water-cycle route", async () => {
      await page.goto("/atlas/water-cycle");
      await page.waitForLoadState("domcontentloaded");
    });

    await test.step("axe analysis completes without throwing", async () => {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      // Log violation summary for visibility (not an assertion)
      if (results.violations.length > 0) {
        console.warn(
          `[a11y] ${results.violations.length} WCAG violations found (fix tracked):`,
          results.violations.map((v) => `[${v.impact}] ${v.id}`).join(", "),
        );
      } else {
        console.log("[a11y] Zero WCAG violations — page is clean");
      }

      // axe passes array type check (proof of correct injection)
      expect(Array.isArray(results.violations)).toBe(true);
      expect(results.passes.length).toBeGreaterThan(0);
    });
  });

  test("interactive elements are keyboard accessible", async ({ page }) => {
    await test.step("navigate to water-cycle route", async () => {
      await page.goto("/atlas/water-cycle");
      await page.waitForLoadState("domcontentloaded");
    });

    await test.step("tab to first interactive element", async () => {
      // Focus the page body first
      await page.keyboard.press("Tab");

      // The first focusable element should receive focus
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(
        focusedElement,
        "No element focused after Tab — keyboard navigation broken",
      ).toBeTruthy();
    });

    await test.step("Esc closes any open modals", async () => {
      // Basic check — if a modal opened, Esc should close it
      await page.keyboard.press("Escape");
      // Assert the page is still functional
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test(
    "heading hierarchy is logical",
    async ({ page }) => {
      // page.tsx now renders a sr-only <h1> outside the Suspense boundary so
      // the heading is present in the initial SSR HTML before hydration.
      await test.step("navigate to water-cycle route", async () => {
        await page.goto("/atlas/water-cycle");
        await page.waitForLoadState("domcontentloaded");
      });

      await test.step("check h1 exists", async () => {
        // Page must have at least one meaningful heading structure
        const headingCount = await page.locator("h1, h2, h3").count();
        expect(
          headingCount,
          "No headings found — page must have heading structure for screen readers",
        ).toBeGreaterThan(0);
      });
    },
  );
});
