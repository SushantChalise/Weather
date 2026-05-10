import { defineConfig } from "vitest/config";

export default defineConfig({
  // Disable CSS processing so Vitest does not load postcss.config.mjs.
  // The test suite is Node-only (no CSS imports); this is safe.
  css: false,
test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    // Point deps.optimizer to nothing so Vite doesn't scan for PostCSS config.
    deps: {
      optimizer: {
        ssr: {
          enabled: false,
        },
      },
    },
  },
});
