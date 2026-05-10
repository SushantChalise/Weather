import { defineConfig } from "vitest/config";

export default defineConfig({
  // Override postcss to no-op so Vite's optimizer doesn't load postcss.config.mjs.
  // postcss.config.mjs uses the string-form "@tailwindcss/postcss" plugin which is
  // valid for Next.js / @tailwindcss/postcss v4 but Vite's bundler rejects it.
  // This is safe: the test suite has zero CSS imports.
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    deps: {
      optimizer: {
        ssr: {
          enabled: false,
        },
        web: {
          enabled: false,
        },
      },
    },
  },
});
