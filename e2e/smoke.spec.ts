import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("/ loads with h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("/places/ebc loads", async ({ page }) => {
    await page.goto("/places/ebc");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("/events loads", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
