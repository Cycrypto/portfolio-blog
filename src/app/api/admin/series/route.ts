import { api, jsonInput } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createSeries, getSeriesWorkspace, saveSeries } from "@/lib/series";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return api(async () => {
    await requireAdmin(request, "series:read");
    return getSeriesWorkspace();
  });
}
export async function POST(request: Request) {
  return api(async () => {
    await requireAdmin(request, "series:write");
    return createSeries(await jsonInput(request));
  }, 201);
}
export async function PUT(request: Request) {
  return api(async () => {
    await requireAdmin(request, "series:write");
    return saveSeries(await jsonInput(request));
  });
}
