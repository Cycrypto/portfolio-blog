import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from "jose";
import {
  accessConfig,
  authorize,
  verifyAccessToken,
  verifyOrigin,
} from "../src/lib/cloudflare-access";
import { AppError } from "../src/lib/validation";
const config = {
  issuer: "https://test.cloudflareaccess.com",
  audience: "administrator-app",
};
const fails = (status: number) => (e: unknown) =>
  e instanceof AppError && e.status === status;
test("only valid identity tokens for the administrator application grant RBAC permissions", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const key = await exportJWK(publicKey);
  key.kid = "test";
  key.alg = "RS256";
  const keys = createLocalJWKSet({ keys: [key] });
  const sign = (overrides: Record<string, unknown> = {}) =>
    new SignJWT({
      sub: "user",
      email: "admin@example.com",
      type: "app",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
      iss: config.issuer,
      aud: config.audience,
      ...overrides,
    })
      .setProtectedHeader({ alg: "RS256", kid: "test" })
      .sign(privateKey);
  const principal = await verifyAccessToken(await sign(), config, keys);
  assert.equal(principal.role, "admin");
  authorize(principal, "home:write");
  await assert.rejects(() => verifyAccessToken(null, config, keys), fails(401));
  await assert.rejects(
    () => verifyAccessToken("forged", config, keys),
    fails(401),
  );
  for (const overrides of [
    { aud: "public-app", role: "admin" },
    { iss: "https://evil.example" },
    { exp: 1 },
    { nbf: Math.floor(Date.now() / 1000) + 3600 },
  ]) {
    await assert.rejects(
      async () => verifyAccessToken(await sign(overrides), config, keys),
      fails(401),
    );
  }
  await assert.rejects(
    async () =>
      verifyAccessToken(await sign({ type: "service" }), config, keys),
    fails(403),
  );
  const other = await generateKeyPair("RS256");
  const forged = await new SignJWT({
    sub: "attacker",
    email: "admin@example.com",
    type: "app",
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setIssuedAt()
    .setExpirationTime("1m")
    .sign(other.privateKey);
  await assert.rejects(
    () => verifyAccessToken(forged, config, keys),
    fails(401),
  );
});
test("Access config fails closed and writes require an exact same-origin request", () => {
  const domain = process.env.CF_ACCESS_TEAM_DOMAIN,
    aud = process.env.CF_ACCESS_AUD,
    site = process.env.SITE_URL;
  try {
    delete process.env.CF_ACCESS_TEAM_DOMAIN;
    delete process.env.CF_ACCESS_AUD;
    assert.equal(accessConfig(), null);
    process.env.CF_ACCESS_TEAM_DOMAIN = "https://evil.example";
    process.env.CF_ACCESS_AUD = "aud";
    assert.equal(accessConfig(), null);
    process.env.SITE_URL = "https://junha.space";
    verifyOrigin(
      new Request("http://internal:3000/api/admin/home", {
        headers: { origin: "https://junha.space" },
      }),
    );
    for (const origin of ["https://evil.example", "null", ""]) {
      assert.throws(
        () =>
          verifyOrigin(
            new Request("https://junha.space/api/admin/home", {
              headers: { origin },
            }),
          ),
        fails(403),
      );
    }
  } finally {
    for (const [key, value] of [
      ["CF_ACCESS_TEAM_DOMAIN", domain],
      ["CF_ACCESS_AUD", aud],
      ["SITE_URL", site],
    ]) {
      if (value === undefined) delete process.env[key!];
      else process.env[key!] = value;
    }
  }
});
