import { defineConfig } from "@playwright/test";

const baseURL = process.env.BLOG_URL || "http://127.0.0.1:13001";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseURL).hostname))
  throw new Error("Ghost browser tests must use a local smoke stack");

export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    viewport: { width: 1440, height: 1080 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
});
