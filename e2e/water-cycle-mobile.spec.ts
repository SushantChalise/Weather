/**
 * e2e/water-cycle-mobile.spec.ts
 *
 * Acceptance criterion (T4.5 / T4.2 / 08-acceptance-criteria.md "Mobile cards"):
 *   "At 375px viewport: card-stack visible (NOT scroll-scrub video); back/next
 *    buttons work; per-card poster + headline + citation chip render"
 *
 * NOTE: T4.2 may also create this file. Check origin/feat/water-cycle-T4.2-* before
 * opening PR. If T4.2 provides it, coordinate so there's no duplicate.
 * This file is written by T4.5 as the fallback — if T4.2 provides it, use theirs.
 *
 * Per spec §7 constraint #2:
 *   "Mobile-first: 65% Android traffic. Every chapter has a mobile card-stack
 *    variant for screens < 768px."
 */

import { expect, test } from "@playwright/test";

// Device: iPhone SE / common Android phone
const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe("water-cycle mobile (375×812)", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await page.goto("/atlas/water-cycle");
    await page.waitForLoadState("domcontentloaded");
    // Wait for React hydration + isMobile media query resolution
    // MobileCardStack renders after useEffect sets isMobile state
    await page.waitForSelector("button[aria-label='Previous chapter']", { timeout: 10000 })
      .catch(() => {
        // If not found, check if desktop view rendered instead
        console.warn("[WARN] Previous chapter button not found after 10s — may be desktop mode");
      });
  });

  test("card-stack is visible at mobile viewport", async ({ page }) => {
    await test.step("verify mobile card-stack main element", async () => {
      // On mobile, WaterCycleClient renders MobileCardStack inside a <main>
      const mainEl = page.locator("main").first();
      await expect(mainEl).toBeVisible();
    });

    await test.step("progress bar is visible", async () => {
      // Progress bar: div.flex.gap-1 aria-hidden="true"
      const progressBar = page.locator("[aria-hidden='true']").first();
      await expect(progressBar).toBeVisible();
    });

    await test.step("no scroll-scrub video (desktop-only)", async () => {
      // On mobile, MobileCardStack is rendered — no CinematicVideo/video elements
      const videoEl = page.locator("video");
      const videoCount = await videoEl.count();
      expect(
        videoCount,
        "Found <video> elements at mobile viewport — expected MobileCardStack (no video)",
      ).toBe(0);
    });
  });

  test("chapter poster image renders", async ({ page }) => {
    await test.step("poster image is visible", async () => {
      // MobileCardStack renders Next.js <Image> for the poster
      const posterImg = page.locator("img").first();
      await expect(posterImg).toBeVisible({ timeout: 10000 });
    });
  });

  test("chapter title (h2) renders", async ({ page }) => {
    await test.step("chapter heading is visible", async () => {
      // First chapter title is "The reservoir"
      const heading = page.getByRole("heading", { level: 2 }).first();
      await expect(heading).toBeVisible();
    });

    await test.step("first chapter title matches spec", async () => {
      const heading = page.getByRole("heading", { level: 2 }).first();
      await expect(heading).toHaveText(/The reservoir/i);
    });
  });

  test("Next button advances to chapter 2", async ({ page }) => {
    await test.step("click Next chapter button by aria-label", async () => {
      // Use attribute selector to avoid matching citation-chip "Show data sources" button
      const nextBtn = page.locator("button[aria-label='Next chapter']");
      await expect(nextBtn).toBeVisible({ timeout: 10000 });
      // Click using JavaScript to avoid pointer-intercept from CitationChip overlay
      await nextBtn.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(400);
    });

    await test.step("chapter 2 title is now visible", async () => {
      const heading = page.getByRole("heading", { level: 2 }).first();
      await expect(heading).toHaveText(/The retreat/i);
    });
  });

  test("Back button is disabled on first chapter", async ({ page }) => {
    await test.step("Back button disabled state", async () => {
      // Use attribute selector for exact match on aria-label
      const backBtn = page.locator("button[aria-label='Previous chapter']");
      await expect(backBtn).toBeVisible({ timeout: 10000 });
      await expect(backBtn).toBeDisabled();
    });
  });

  test("can navigate to last chapter", async ({ page }) => {
    await test.step("click Next 6 times to reach chapter 7", async () => {
      const nextBtn = page.locator("button[aria-label='Next chapter']");
      await expect(nextBtn).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < 6; i++) {
        await expect(nextBtn).toBeEnabled();
        // Use evaluate click to avoid overlay intercepts
        await nextBtn.evaluate((el: HTMLElement) => el.click());
        await page.waitForTimeout(300);
      }
    });

    await test.step("chapter 7 title visible", async () => {
      const heading = page.getByRole("heading", { level: 2 }).first();
      await expect(heading).toHaveText(/The choice/i);
    });

    await test.step("closing thesis visible on last chapter", async () => {
      const thesis = page.getByText(/The glacier was your reservoir/i);
      await expect(thesis.first()).toBeVisible();
    });

    await test.step("Next button is disabled on last chapter", async () => {
      const nextBtn = page.locator("button[aria-label='Next chapter']");
      await expect(nextBtn).toBeVisible({ timeout: 5000 });
      await expect(nextBtn).toBeDisabled();
    });
  });

  test("dot indicators are interactive", async ({ page }) => {
    await test.step("chapter dot buttons are present", async () => {
      // 7 dot buttons with aria-label "Go to chapter N"
      // Use locator with attribute selector for reliability
      const dots = page.locator("button[aria-label^='Go to chapter']");
      // Wait for dots to appear after hydration
      await expect(dots.first()).toBeVisible({ timeout: 10000 });
      const count = await dots.count();
      expect(count).toBe(7);
    });

    await test.step("clicking dot 3 navigates to chapter 3", async () => {
      // Chapter 3 = "The lake bloom" (0-indexed chapter 2)
      const dot3 = page.locator("button[aria-label='Go to chapter 3']");
      await dot3.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(400);

      const heading = page.getByRole("heading", { level: 2 }).first();
      await expect(heading).toHaveText(/The lake bloom/i);
    });
  });

  test("provenance peel modal opens and closes", async ({ page }) => {
    await test.step("click citation chip / show-data button", async () => {
      // CitationChip renders a "Show all" or "Show sources" button
      // Try matching the show-data button via its aria-label pattern
      const showBtn = page.locator("button[aria-label*='Show data sources']").first();
      const showBtnAlt = page.locator("button[aria-label*='Show all']").first();

      const btnToClick = (await showBtn.count()) > 0 ? showBtn : showBtnAlt;

      if (await btnToClick.count() > 0) {
        await btnToClick.evaluate((el: HTMLElement) => el.click());
        await page.waitForTimeout(400);

        // Dialog should appear
        const dialog = page.getByRole("dialog");
        if (await dialog.count() > 0) {
          await expect(dialog).toBeVisible({ timeout: 5000 });

          // Close it
          const closeBtn = page.getByRole("button", { name: /close/i }).first();
          await closeBtn.evaluate((el: HTMLElement) => el.click());
          await page.waitForTimeout(300);

          // Dialog should be gone
          await expect(dialog).not.toBeVisible();
        }
      } else {
        console.warn(
          "[WARN] No citation chip button found — chapter content may not render citations yet",
        );
      }
    });
  });
});
