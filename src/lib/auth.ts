import { headers } from "next/headers";
import {
  accessConfig,
  authorize,
  verifyAccessToken,
  verifyOrigin,
} from "./cloudflare-access";
import { AppError } from "./validation";
export async function requireAdmin(
  request?: Request,
  permission: "home:read" | "home:write" = "home:read",
) {
  const config = accessConfig();
  if (!config) throw new AppError("Cloudflare Access 설정이 필요합니다.", 503);
  if (request && permission === "home:write") verifyOrigin(request);
  const incoming = request?.headers ?? (await headers());
  const principal = await verifyAccessToken(
    incoming.get("cf-access-jwt-assertion"),
    config,
  );
  authorize(principal, permission);
  return principal;
}
