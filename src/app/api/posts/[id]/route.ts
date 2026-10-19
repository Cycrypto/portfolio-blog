import { api, jsonInput } from "@/lib/api";
import { requireOwner, isOwner } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { isPublic } from "@/lib/types";
import { AppError } from "@/lib/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  return api(async () => {
    const p = repository().getPost((await params).id);
    if (!p || (!isPublic(p) && !(await isOwner())))
      throw new AppError("게시글을 찾을 수 없습니다.", 404);
    return p;
  });
}
export async function PUT(request: Request, { params }: Context) {
  return api(async () => {
    await requireOwner(request);
    return repository().savePost(await jsonInput(request), (await params).id);
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return api(async () => {
    await requireOwner(request);
    const { revision } = await jsonInput(request);
    if (!Number.isInteger(revision))
      throw new AppError("게시글 버전을 확인해 주세요.");
    repository().deletePost((await params).id, revision);
    return { deleted: true };
  });
}
