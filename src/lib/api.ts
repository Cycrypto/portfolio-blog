import { NextResponse } from "next/server";
import { AppError, isAppError } from "./validation";
export async function api(fn: () => unknown | Promise<unknown>, status = 200) {
  try {
    return NextResponse.json(await fn(), {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (isAppError(error))
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { error: "요청 형식을 확인해 주세요." },
        { status: 400 },
      );
    console.error(error);
    return NextResponse.json(
      { error: "요청을 처리하지 못했습니다. 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
export async function jsonInput(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new AppError("JSON 형식이 필요합니다.", 415);
  const text = await request.text();
  if (text.length > 1_100_000) throw new AppError("요청이 너무 큽니다.", 413);
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new AppError("JSON 객체를 전달해 주세요.");
  return parsed;
}
