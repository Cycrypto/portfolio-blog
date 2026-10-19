import { api, jsonInput } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { repository } from "@/lib/repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return api(() => repository().listSeries());
}
export async function POST(request: Request) {
  return api(async () => {
    await requireOwner(request);
    return repository().saveSeries(await jsonInput(request));
  }, 201);
}
