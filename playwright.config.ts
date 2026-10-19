import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3001",
    actionTimeout: 10000,
    navigationTimeout: 20000,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      DATA_DIR: "./data/e2e",
      ADMIN_PASSWORD: "test-portfolio-password",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
