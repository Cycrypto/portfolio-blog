import { api, jsonInput } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { repository } from "@/lib/repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return api(async () => {
    await requireAdmin(request);
    return repository().getHomeDocument();
  });
}
export async function PUT(request: Request) {
  return api(async () => {
    const admin = await requireAdmin(request, "home:write");
    return repository().saveHome(await jsonInput(request), admin.email);
  });
}
