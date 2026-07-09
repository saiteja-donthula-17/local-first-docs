import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Unit tests only — Playwright e2e specs live in ./e2e and run separately.
    include: ["src/**/*.test.ts"],
  },
});
