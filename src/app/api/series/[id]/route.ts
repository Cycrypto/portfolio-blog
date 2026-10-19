import { api, jsonInput } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { AppError } from "@/lib/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, { params }: Context) {
  return api(async () => {
    await requireOwner(request);
    return repository().saveSeries(await jsonInput(request), (await params).id);
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return api(async () => {
    await requireOwner(request);
    const { revision } = await jsonInput(request);
    if (!Number.isInteger(revision))
      throw new AppError("시리즈 버전을 확인해 주세요.");
    repository().deleteSeries((await params).id, revision);
    return { deleted: true };
  });
}
