import { defineConfig } from "@playwright/test";
import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { ghostFixture, ghostTestKey } from "./tests/support/ghost-fixture.mjs";
const folder = resolve("data/e2e");
mkdirSync(folder, { recursive: true });
for (const name of [
  "portfolio.sqlite",
  "portfolio.sqlite-wal",
  "portfolio.sqlite-shm",
])
  rmSync(resolve(folder, name), { force: true });
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const fixture = resolve(folder, "access-keys.json");
const ghostFixtureFile = resolve(folder, "ghost.json");
writeFileSync(ghostFixtureFile, JSON.stringify(ghostFixture()));
writeFileSync(
  fixture,
  JSON.stringify({
    publicKey: {
      ...publicKey.export({ format: "jwk" }),
      kid: "e2e",
      alg: "RS256",
    },
    privateKey: privateKey.export({ format: "pem", type: "pkcs8" }),
  }),
  { mode: 0o600 },
);
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3001",
    actionTimeout: 10000,
    navigationTimeout: 20000,
    viewport: { width: 1081, height: 1000 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "node --import ./tests/support/mock-access.mjs node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      DATA_DIR: folder,
      CF_ACCESS_TEAM_DOMAIN: "portfolio-test.cloudflareaccess.com",
      CF_ACCESS_AUD: "portfolio-admin-test",
      SITE_URL: "http://127.0.0.1:3001",
      TEST_ACCESS_JWKS_FILE: fixture,
      TEST_GHOST_DATA_FILE: ghostFixtureFile,
      GHOST_ADMIN_URL: "https://ghost-test.invalid",
      GHOST_ADMIN_API_KEY: ghostTestKey,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
