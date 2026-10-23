import { defineConfig, devices } from "@playwright/test";

import { E2E_CRON_SECRET } from "./e2e/constants";

// The end-to-end tests run a production build against a local Postgres database, which
// `e2e/prepare-db.ts` migrates and seeds first. Override TEST_DATABASE_URL to use another one.
const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/budget_gamer_test";
const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      // The API checks don't depend on the viewport
      testIgnore: /api\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run e2e:prepare && npm run build && npm run start -- --port ${port}`,
    url: `http://localhost:${port}`,
    // Seeding plus a production build takes a while
    timeout: 5 * 60 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    env: {
      DATABASE_URL: databaseUrl,
      DATABASE_DRIVER: "postgres",
      CRON_SECRET: E2E_CRON_SECRET,
      REDDIT_AUTH_TOKEN: "e2e",
    },
  },
});
