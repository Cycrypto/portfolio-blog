import { notFound } from "next/navigation";
import { requireOwnerPage } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { PostEditor } from "@/components/post-editor";
export const dynamic = "force-dynamic";
export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwnerPage();
  const { id } = await params;
  const post = id === "new" ? null : repository().getPost(id);
  if (id !== "new" && !post) notFound();
  return (
    <PostEditor
      key={id}
      initialPost={post}
      series={repository().listSeries()}
    />
  );
}
