import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Load DATABASE_URL + COLLAB_TOKEN_SECRET from .env before tests run.
    setupFiles: ["dotenv/config"],
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
  },
});
