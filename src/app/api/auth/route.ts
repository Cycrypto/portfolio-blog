import { cookies } from "next/headers";
import { api, jsonInput } from "@/lib/api";
import {
  isOwner,
  login,
  logout,
  SESSION_COOKIE,
  SESSION_SECONDS,
  verifyOrigin,
} from "@/lib/auth";
import { AppError } from "@/lib/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return api(async () => ({ authenticated: await isOwner() }));
}
export async function POST(request: Request) {
  return api(async () => {
    verifyOrigin(request);
    const input = await jsonInput(request);
    if (typeof input.password !== "string")
      throw new AppError("비밀번호를 입력해 주세요.");
    const token = login(input.password, request.headers.get("host") ?? "");
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_SECONDS,
    });
    return { authenticated: true };
  });
}
export async function DELETE(request: Request) {
  return api(async () => {
    verifyOrigin(request);
    const jar = await cookies();
    logout(jar.get(SESSION_COOKIE)?.value);
    jar.delete(SESSION_COOKIE);
    return { authenticated: false };
  });
}
