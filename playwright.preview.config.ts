import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "preview-core-smoke.spec.ts",
  workers: 1,
  use: {
    baseURL: process.env.PREVIEW_CORE_SMOKE_URL
  }
});
