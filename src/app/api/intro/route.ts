import { api, jsonInput } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { repository } from "@/lib/repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return api(() => repository().getIntro());
}
export async function PUT(request: Request) {
  return api(async () => {
    await requireOwner(request);
    return repository().saveIntro(await jsonInput(request));
  });
}
