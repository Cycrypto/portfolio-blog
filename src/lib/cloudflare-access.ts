import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { AppError } from "./validation";
import type { Principal } from "./types";
export interface AccessConfig {
  issuer: string;
  audience: string;
}
export function accessConfig(): AccessConfig | null {
  const domain = process.env.CF_ACCESS_TEAM_DOMAIN?.trim()
    .replace(/^https:\/\//, "")
    .replace(/\/$/, "");
  const audience = process.env.CF_ACCESS_AUD?.trim();
  if (
    !domain ||
    !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) ||
    !audience
  )
    return null;
  return { issuer: `https://${domain}`, audience };
}
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
function signingKeys(issuer: string) {
  let keys = keySets.get(issuer);
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`), {
      timeoutDuration: 5000,
    });
    keySets.set(issuer, keys);
  }
  return keys;
}
// Only a signed identity token for the administrator Access application grants
// the admin role. Access Allow policies/groups own membership; email headers,
// arbitrary role claims and service tokens never grant permission.
export async function verifyAccessToken(
  token: string | null,
  config: AccessConfig,
  getKey: JWTVerifyGetKey = signingKeys(config.issuer),
): Promise<Principal> {
  if (!token || token.length > 32768)
    throw new AppError("Cloudflare Access 로그인이 필요합니다.", 401);
  try {
    const { payload } = await jwtVerify(token, getKey, {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "email", "iat", "exp", "type"],
    });
    if (
      payload.type !== "app" ||
      typeof payload.sub !== "string" ||
      !payload.sub ||
      typeof payload.email !== "string" ||
      !payload.email.includes("@")
    ) {
      throw new AppError("관리자 권한이 없습니다.", 403);
    }
    return { id: payload.sub, email: payload.email, role: "admin" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Cloudflare Access 인증을 확인할 수 없습니다. 다시 로그인해 주세요.",
      401,
    );
  }
}
export function verifyOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.SITE_URL || request.url).origin;
  if (
    !origin ||
    origin !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new AppError("허용되지 않은 요청입니다.", 403);
  }
}
export const permissions = { admin: ["home:read", "home:write"] } as const;
export function authorize(
  principal: Principal,
  permission: "home:read" | "home:write",
) {
  if (!permissions[principal.role]?.includes(permission))
    throw new AppError("관리자 권한이 없습니다.", 403);
}
