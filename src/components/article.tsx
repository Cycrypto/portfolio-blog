import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Post, Series } from "@/lib/types";
import { SiteHeader, SiteFooter } from "./site-shell";
import {
  Author,
  PostMeta,
  PostNavigation,
  PostTags,
  SeriesNavigator,
} from "./content";
import { ImageFigure, Markdown, TableOfContents } from "./markdown";
export function Article({
  post,
  series,
  seriesPosts = [],
  preview = false,
}: {
  post: Post;
  series: Series | null;
  seriesPosts?: Post[];
  preview?: boolean;
}) {
  const index = seriesPosts.findIndex((p) => p.id === post.id);
  return (
    <>
      <SiteHeader />
      {preview && (
        <div className="border-b border-line bg-warning-soft px-6 py-3 text-center text-sm text-warning">
          작성자 미리보기 ·{" "}
          {post.status === "draft"
            ? "아직 발행되지 않은 글입니다."
            : "현재 공개 범위를 확인해 주세요."}{" "}
          <Link href={`/admin/posts/${post.id}`} className="ml-3 underline">
            편집으로 돌아가기
          </Link>
        </div>
      )}
      <main
        id="main"
        className="mx-auto max-w-[1248px] px-6 py-8 md:px-16 md:py-14"
      >
        <Link
          href="/blog"
          className="mb-10 inline-flex items-center gap-2 text-[13px] text-muted"
        >
          <ArrowLeft size={16} />
          모든 글
        </Link>
        <header className="mb-10 max-w-[800px] space-y-5">
          {series && (
            <Link
              href={`/series/${series.slug}`}
              className="text-xs text-accent"
            >
              {series.name} / {String(index + 1).padStart(2, "0")}
            </Link>
          )}
          <h1 className="font-heading text-[30px] leading-[1.3] font-bold tracking-tight md:text-[42px] md:leading-[1.25]">
            {post.title}
          </h1>
          <p className="text-lg leading-relaxed text-muted md:text-xl">
            {post.excerpt}
          </p>
          <PostMeta post={post} />
          <Author />
        </header>
        {post.coverUrl && (
          <div className="mb-10">
            <ImageFigure src={post.coverUrl} alt={post.coverAlt} cover />
          </div>
        )}
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,680px)_240px] lg:gap-20">
          <div className="min-w-0 space-y-7">
            <div className="lg:hidden">
              <TableOfContents content={post.bodyMarkdown} />
            </div>
            <Markdown content={post.bodyMarkdown} />
            <PostTags tags={post.tags} />
            {series && seriesPosts.length > 0 && (
              <SeriesNavigator
                series={series}
                posts={seriesPosts}
                currentId={post.id}
              />
            )}
            <PostNavigation
              previous={seriesPosts[index - 1]}
              next={seriesPosts[index + 1]}
            />
          </div>
          <aside className="sticky top-28 hidden space-y-6 lg:block">
            <TableOfContents content={post.bodyMarkdown} />
            {series && (
              <p className="font-mono text-xs leading-loose text-muted">
                SERIES / {index + 1} OF {seriesPosts.length}
                <br />
                {series.name}
              </p>
            )}
          </aside>
        </div>
      </main>
      <div className="mx-auto max-w-[1248px] px-6 md:px-16">
        <SiteFooter />
      </div>
    </>
  );
}
