// Test process only. Next.js code never imports this module.
// Provide a fake Cloudflare JWKS endpoint; token verification still runs in full.
import { readFileSync, writeFileSync } from "node:fs";
import { ghostResponse } from "./ghost-fixture.mjs";
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (
    url === "https://portfolio-test.cloudflareaccess.com/cdn-cgi/access/certs"
  ) {
    const fixture = JSON.parse(
      readFileSync(process.env.TEST_ACCESS_JWKS_FILE, "utf8"),
    );
    return Response.json({ keys: [fixture.publicKey] });
  }
  if (
    url.startsWith("https://ghost-test.invalid/ghost/api/admin/") &&
    process.env.TEST_GHOST_DATA_FILE
  ) {
    const state = JSON.parse(
      readFileSync(process.env.TEST_GHOST_DATA_FILE, "utf8"),
    );
    const response = await ghostResponse(state, url, init);
    if (init?.method !== "GET" && response.ok)
      writeFileSync(process.env.TEST_GHOST_DATA_FILE, JSON.stringify(state));
    return response;
  }
  return originalFetch(input, init);
};
