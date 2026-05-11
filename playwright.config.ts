import { defineConfig, devices } from "@playwright/test";

const port = process.env.TEST_PORT ?? "3000";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // Global timeout: 60 s per test (allows full route compile in CI)
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      // Default desktop project — used by smoke, water-cycle smoke, fact-guard,
      // provenance-coverage, color-guard, a11y, asset-budget specs.
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Mobile project — used by water-cycle-mobile.spec.ts
      // Emulates iPhone SE viewport (375×812) used in §15 Chrome testing protocol
      name: "mobile-chrome",
      use: {
        ...devices["iPhone SE"],
        // Override to the exact dims from the spec §15 protocol
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    // 120 s gives Next.js enough time to cold-compile in CI
    timeout: 120_000,
  },
});
