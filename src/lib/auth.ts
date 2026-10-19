import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { repository } from "./repository";
import { AppError } from "./validation";
export const SESSION_COOKIE = "portfolio-owner";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const isLocalHost = (host: string) =>
  /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);
export function sessionValid(token: string | undefined) {
  if (!token) return false;
  const session = repository()
    .db.prepare("SELECT expires_at FROM sessions WHERE token_hash=?")
    .get(tokenHash(token));
  return !!session && Number(session.expires_at) > Date.now();
}
export async function isOwner() {
  return sessionValid((await cookies()).get(SESSION_COOKIE)?.value);
}
export async function requireOwnerPage() {
  if (!(await isOwner())) redirect("/admin/login");
}
export async function requireOwner(request?: Request) {
  if (request) verifyOrigin(request);
  if (!(await isOwner())) throw new AppError("로그인이 필요합니다.", 401);
}
export function verifyOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host"))
    throw new AppError("허용되지 않은 요청입니다.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new AppError("허용되지 않은 요청입니다.", 403);
}
export async function localLoginHint() {
  return (
    process.env.NODE_ENV !== "production" &&
    !process.env.ADMIN_PASSWORD &&
    isLocalHost((await headers()).get("host") ?? "")
  );
}
export function login(password: string, host: string) {
  const db = repository().db;
  const now = Date.now();
  const attempts = db
    .prepare("SELECT count,reset_at FROM login_attempts WHERE key=?")
    .get("owner");
  if (
    attempts &&
    Number(attempts.reset_at) > now &&
    Number(attempts.count) >= 10
  )
    throw new AppError(
      "로그인 시도가 너무 많습니다. 15분 뒤 다시 시도해 주세요.",
      429,
    );
  const expected =
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV !== "production" && isLocalHost(host)
      ? "local-portfolio"
      : "");
  if (!expected)
    throw new AppError(
      "관리자 비밀번호가 설정되지 않았습니다. 서버의 ADMIN_PASSWORD를 설정해 주세요.",
      503,
    );
  const valid =
    password.length <= 256 &&
    timingSafeEqual(
      scryptSync(password, "portfolio-owner-v1", 64),
      scryptSync(expected, "portfolio-owner-v1", 64),
    );
  if (!valid) {
    if (!attempts || Number(attempts.reset_at) <= now)
      db.prepare("INSERT OR REPLACE INTO login_attempts VALUES (?,?,?)").run(
        "owner",
        1,
        now + 15 * 60 * 1000,
      );
    else
      db.prepare("UPDATE login_attempts SET count=count+1 WHERE key=?").run(
        "owner",
      );
    throw new AppError("비밀번호를 확인해 주세요.", 401);
  }
  db.prepare("DELETE FROM login_attempts WHERE key=?").run("owner");
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES (?,?)").run(
    tokenHash(token),
    now + SESSION_SECONDS * 1000,
  );
  return token;
}
export function logout(token?: string) {
  if (token)
    repository()
      .db.prepare("DELETE FROM sessions WHERE token_hash=?")
      .run(tokenHash(token));
}
