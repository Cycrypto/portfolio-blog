// Test process only. Next.js code never imports this module.
// Provide a fake Cloudflare JWKS endpoint; token verification still runs in full.
import { readFileSync } from "node:fs";
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
  return originalFetch(input, init);
};
