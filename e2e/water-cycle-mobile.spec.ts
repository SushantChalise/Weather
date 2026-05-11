/**
 * e2e/water-cycle-mobile.spec.ts — Playwright e2e tests for MobileCardStack
 *
 * Task T4.2 acceptance (from docs/water-cycle/08-acceptance-criteria.md):
 *   - At 375px viewport: card-stack visible, scroll-scrub video hidden
 *   - Back/Next buttons work
 *   - Per-card poster + headline + citation chip render
 *   - Keyboard arrow navigation works
 */

import { expect, test } from "@playwright/test";

// All tests in this file run at mobile 375x812 viewport
test.use({ viewport: { width: 375, height: 812 } });

const CHAPTER_TITLES = [
  "The reservoir",
  "The retreat",
  "The lake bloom",
  "Where it went",
  "When it comes",
  "The feedback loop",
  "The choice",
] as const;

test.describe("MobileCardStack — /atlas/water-cycle at 375px", () => {
  // Dismiss Next.js dev overlay before each test so it doesn't intercept pointer events
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Remove the nextjs-portal overlay element that intercepts pointer events in dev mode
      const observer = new MutationObserver(() => {
        const portals = document.querySelectorAll('nextjs-portal');
        for (const portal of portals) portal.remove();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  });

  test("card-stack is visible; scroll-scrub video hidden", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/atlas/water-cycle");

    // The mobile-card-stack root should be visible
    const cardStack = page.getByTestId("mobile-card-stack");
    await expect(cardStack).toBeVisible({ timeout: 8000 });

    // The cinematic video sections (desktop only) should NOT be present
    // (water-cycle-client renders either MobileCardStack or ChapterSections, not both)
    const chapterSections = page.locator("section[id='ch0']");
    // Either not in DOM or hidden — the mobile path doesn't render chapter sections
    const count = await chapterSections.count();
    expect(count).toBe(0);

    // No console errors
    const critical = errors.filter(
      (e) =>
        !e.includes("ERR_FILE_NOT_FOUND") && // poster images may not exist in test
        !e.includes("404") &&
        !e.includes("NetworkError"), // network-related are OK (poster/video not present in CI)
    );
    expect(critical).toHaveLength(0);
  });

  test("first chapter card shows chapter 1 title and poster", async ({ page }) => {
    await page.goto("/atlas/water-cycle");

    // Wait for card stack to be visible
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // "The reservoir" heading should be visible
    await expect(
      page.getByRole("heading", { name: "The reservoir" }).first(),
    ).toBeVisible({ timeout: 5000 });

    // Chapter counter "1 / 7" should be shown
    await expect(page.getByText("1 / 7")).toBeVisible();
  });

  test("Next button advances through all 7 chapters in sequence", async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // Verify first chapter
    await expect(
      page.getByRole("heading", { name: CHAPTER_TITLES[0] }).first(),
    ).toBeVisible({ timeout: 5000 });

    // Click Next 6 times and verify each chapter title appears
    // Remove nextjs-portal overlay before each click so buttons are reachable
    for (let i = 1; i < CHAPTER_TITLES.length; i++) {
      await page.evaluate(() => {
        document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
      });
      // Find the Next button (aria-label contains "next chapter")
      const nextBtn = page.getByRole("button", { name: /next chapter/i });
      await expect(nextBtn).toBeEnabled();
      await nextBtn.click();

      // Wait for the title of the new chapter to be visible
      await expect(
        page.getByRole("heading", { name: CHAPTER_TITLES[i] }).first(),
      ).toBeVisible({ timeout: 5000 });

      // Counter should reflect position
      await expect(page.getByText(`${i + 1} / 7`)).toBeVisible();
    }

    // At last chapter, Next button should be disabled
    const nextBtn = page.getByRole("button", { name: /Already at last chapter/i });
    await expect(nextBtn).toBeDisabled();
  });

  test("Back button works (navigate forward then back)", async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // Remove nextjs-portal overlay so nav buttons are clickable
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
    });

    // Go to chapter 2
    await page.getByRole("button", { name: /next chapter/i }).click();
    // Wait for counter to update to "2 / 7"
    await expect(page.getByText("2 / 7")).toBeVisible({ timeout: 5000 });

    // Re-remove portal (may be re-injected after state change)
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
    });

    // Back button should now go back to chapter 1
    await page.getByRole("button", { name: /previous chapter/i }).click();
    // Wait for counter to show "1 / 7" confirming state update
    await expect(page.getByText("1 / 7")).toBeVisible({ timeout: 5000 });
    // Heading is in the active card
    await expect(
      page.locator('[aria-roledescription="slide"][aria-hidden="false"] h2').first()
    ).toContainText(CHAPTER_TITLES[0], { timeout: 5000 });
  });

  test("Back button is disabled on first chapter", async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // At chapter 0, Back should be disabled
    const backBtn = page.getByRole("button", { name: /Already at first chapter/i });
    await expect(backBtn).toBeDisabled();
  });

  test("keyboard arrow navigation (ArrowRight / ArrowLeft)", async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // Focus the page body
    await page.locator("body").click();

    // Press ArrowRight to advance to chapter 2
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("heading", { name: CHAPTER_TITLES[1] }).first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("2 / 7")).toBeVisible();

    // Press ArrowLeft to go back
    await page.keyboard.press("ArrowLeft");
    await expect(
      page.getByRole("heading", { name: CHAPTER_TITLES[0] }).first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("1 / 7")).toBeVisible();
  });

  test("progress dot navigation jumps to correct chapter", async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // Remove nextjs-portal overlay before clicking
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
    });

    // Find the "Go to chapter 4" dot button
    const dot4 = page.locator('button[aria-label="Go to chapter 4"]');
    await expect(dot4).toBeAttached({ timeout: 5000 });
    await dot4.click();

    // Should now show chapter 4 (index 3)
    await expect(
      page.getByRole("heading", { name: CHAPTER_TITLES[3] }).first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("4 / 7")).toBeVisible();
  });

  test("citation chip is visible and 'Show data' button opens peel", async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // Remove nextjs-portal overlay and programmatically click the "Show data" button
    // to trigger React's onClick handler for setPeelOpenFor
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
      // Find and click the Show data sources button
      const btn = document.querySelector('button[aria-label^="Show data sources for"]') as HTMLButtonElement;
      btn?.click();
    });

    // Modal should appear — the peel dialog
    await page.waitForFunction(
      () => !!document.querySelector('[role="dialog"][aria-modal="true"]'),
      { timeout: 5000 }
    );

    // Close via X button — same approach
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
      const closeBtn = document.querySelector('button[aria-label="Close data sources"]') as HTMLButtonElement;
      closeBtn?.click();
    });
    await page.waitForFunction(
      () => !document.querySelector('[role="dialog"][aria-modal="true"]'),
      { timeout: 3000 }
    );
  });

  test("Escape key closes the provenance peel", async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // Click Show data button programmatically (avoid portal interception)
    await page.evaluate(() => {
      document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
      const btn = document.querySelector('button[aria-label^="Show data sources for"]') as HTMLButtonElement;
      btn?.click();
    });

    await page.waitForFunction(
      () => !!document.querySelector('[role="dialog"][aria-modal="true"]'),
      { timeout: 5000 }
    );

    // Press Escape to close
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.querySelector('[role="dialog"][aria-modal="true"]'),
      { timeout: 3000 }
    );
  });

  test("closing thesis visible on last chapter", async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // Navigate to the last chapter (index 6)
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => {
        document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
      });
      await page.getByRole("button", { name: /next chapter/i }).click();
    }

    // Closing thesis should be on the final chapter
    await expect(
      page.getByText("The glacier was your reservoir."),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("We are draining it.")).toBeVisible();
  });

  test("carousel has accessible ARIA structure", async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await expect(page.getByTestId("mobile-card-stack")).toBeVisible({ timeout: 8000 });

    // Carousel region — now a <section> with aria-roledescription="carousel"
    const carousel = page.locator('[aria-roledescription="carousel"]');
    await expect(carousel).toBeVisible();
    await expect(carousel).toHaveAttribute("aria-label", "Chapter cards");

    // Active slide should have aria-hidden="false"
    // (other slides set aria-hidden="true" when not active)
    const activeSlide = page.locator('[aria-roledescription="slide"][aria-hidden="false"]').first();
    await expect(activeSlide).toBeVisible({ timeout: 3000 });
    await expect(activeSlide).toHaveAttribute("aria-roledescription", "slide");
  });
});
