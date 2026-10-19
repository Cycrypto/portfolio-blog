import { requireOwnerPage } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { PostsManager } from "@/components/posts-manager";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  await requireOwnerPage();
  return (
    <PostsManager
      initialPosts={repository().listPosts()}
      series={repository().listSeries()}
    />
  );
}
