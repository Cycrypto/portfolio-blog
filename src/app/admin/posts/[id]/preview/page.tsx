import { notFound } from "next/navigation";
import { requireOwnerPage } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { Article } from "@/components/article";
export const dynamic = "force-dynamic";
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwnerPage();
  const repo = repository();
  const post = repo.getPost((await params).id);
  if (!post) notFound();
  const series = post.seriesId ? repo.getSeries(post.seriesId) : null;
  return (
    <Article
      preview
      post={post}
      series={series}
      seriesPosts={series ? repo.seriesPosts(series.id) : []}
    />
  );
}
