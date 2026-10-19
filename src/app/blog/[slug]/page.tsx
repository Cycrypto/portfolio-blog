import { notFound } from "next/navigation";
import { repository } from "@/lib/repository";
import { Article } from "@/components/article";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const post = repository().getPostBySlug((await params).slug);
  return { title: post?.title ?? "게시글", description: post?.excerpt };
}
export default async function PostPage({ params }: Props) {
  const repo = repository();
  const post = repo.getPostBySlug((await params).slug);
  if (!post) notFound();
  const series = post.seriesId ? repo.getSeries(post.seriesId) : null;
  return (
    <Article
      post={post}
      series={series}
      seriesPosts={series ? repo.seriesPosts(series.id, true) : []}
    />
  );
}
