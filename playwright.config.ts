import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const E2E_DATABASE_PATH = "./data/e2e.db";

export default defineConfig({
  testDir: "./e2e",
  // One worker: all tests share one SQLite file and clear it in beforeEach.
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node e2e/reset-db.mjs && npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: { DATABASE_PATH: E2E_DATABASE_PATH },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
