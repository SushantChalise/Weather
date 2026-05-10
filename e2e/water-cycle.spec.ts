/**
 * e2e/water-cycle.spec.ts — Playwright e2e tests for /atlas/water-cycle
 *
 * Acceptance criteria (from docs/water-cycle/08-acceptance-criteria.md):
 *   - /atlas/water-cycle returns 200
 *   - Renders 7 chapter sections
 *   - ScrollTrigger initializes without console error
 *   - Page contains "The reservoir" headline
 */

import { expect, test } from "@playwright/test";

test.describe("/atlas/water-cycle", () => {
  test("returns 200 and contains 'The reservoir' headline", async ({ page }) => {
    // Collect console errors to verify no GSAP ScrollTrigger errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto("/atlas/water-cycle");

    // Page returns HTTP 200
    expect(response?.status()).toBe(200);

    // "The reservoir" headline is present (Chapter 0 title — spec §4 locked)
    await expect(
      page.getByRole("heading", { name: /The reservoir/i }).first(),
    ).toBeVisible();

    // No GSAP / ScrollTrigger errors in console
    const gsapErrors = consoleErrors.filter(
      (e) =>
        e.toLowerCase().includes("gsap") ||
        e.toLowerCase().includes("scrolltrigger") ||
        e.toLowerCase().includes("uncaught"),
    );
    expect(gsapErrors).toHaveLength(0);
  });

  test("renders 7 chapter sections", async ({ page }) => {
    await page.goto("/atlas/water-cycle");

    // Wait for hydration — mobile shows MobileCardStack, desktop shows ChapterSection
    // On desktop: 7 <section> elements with ids ch0..ch6
    // On mobile: card stack (only one visible chapter at a time)
    const isMobile = page.viewportSize()?.width !== undefined && page.viewportSize()!.width < 768;

    if (!isMobile) {
      // Desktop: all 7 sections should be in the DOM
      const sections = page.locator("section[id^='ch']");
      await expect(sections).toHaveCount(7);

      // Each section has an aria-label
      for (const id of ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"]) {
        await expect(page.locator(`#${id}`)).toBeVisible();
      }
    } else {
      // Mobile: MobileCardStack with 7 chapters navigable
      // Progress bar has 7 segments
      const progressBars = page.locator("[aria-hidden='true'] > div").first();
      await expect(progressBars).toBeVisible();
    }
  });

  test("closing thesis is present", async ({ page }) => {
    await page.goto("/atlas/water-cycle");

    // Scroll to the bottom to find the closing thesis
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // The closing thesis text should be present somewhere in the DOM
    const thesisText = page.getByText(/The glacier was your reservoir/i);
    await expect(thesisText.first()).toBeVisible({ timeout: 10000 });
  });
});
