import { api, jsonInput } from "@/lib/api";
import { requireOwner, isOwner } from "@/lib/auth";
import { repository } from "@/lib/repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return api(async () => repository().listPosts(!(await isOwner())));
}
export async function POST(request: Request) {
  return api(async () => {
    await requireOwner(request);
    return repository().savePost(await jsonInput(request));
  }, 201);
}
