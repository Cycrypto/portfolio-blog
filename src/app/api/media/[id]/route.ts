import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { api } from "@/lib/api";
import { isOwner, requireOwner } from "@/lib/auth";
import { dataDirectory, repository } from "@/lib/repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  const id = (await params).id;
  const media = repository().getMedia(id);
  if (!media || (!repository().mediaIsPublic(id) && !(await isOwner())))
    return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(
      join(dataDirectory(), "uploads", media.filename),
    );
    return new Response(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
export async function DELETE(request: Request, { params }: Context) {
  return api(async () => {
    await requireOwner(request);
    const media = repository().deleteMedia((await params).id);
    await unlink(join(dataDirectory(), "uploads", media.filename)).catch(
      () => {},
    );
    return { deleted: true };
  });
}
