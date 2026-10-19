import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { repository } from "@/lib/repository";
import { formatDate } from "@/lib/format";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { Author, PostMeta } from "@/components/content";
import { EmptyState } from "@/components/ui";
import { buttonClass } from "@/components/ui-styles";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  return {
    title: repository().getSeriesBySlug((await params).slug)?.name ?? "시리즈",
  };
}
export default async function SeriesDetail({ params }: Props) {
  const repo = repository();
  const series = repo.getSeriesBySlug((await params).slug);
  if (!series) notFound();
  const posts = repo.seriesPosts(series.id, true);
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1008px] px-6 py-14 md:px-6">
        <Link
          href="/series"
          className="mb-10 inline-flex items-center gap-2 text-[13px] text-muted"
        >
          <ArrowLeft size={16} />
          모든 시리즈
        </Link>
        <header className="space-y-5">
          <p className="font-mono text-xs tracking-wide text-accent">
            A SERIES OF NOTES
          </p>
          <h1 className="font-heading text-3xl leading-relaxed md:text-[42px]">
            {series.name}
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted">
            {series.description}
          </p>
          <Author />
          {posts[0] && (
            <Link href={`/blog/${posts[0].slug}`} className={buttonClass()}>
              <ArrowRight size={16} />첫 글부터 읽기
            </Link>
          )}
        </header>
        <div className="mt-10 mb-8 flex flex-wrap justify-between gap-3 border-y border-line py-4 text-xs text-muted">
          <span>공개 글 {posts.length}개 · 순서대로 읽기</span>
          <span>업데이트 {formatDate(series.updatedAt)}</span>
        </div>
        {posts.length ? (
          <ol>
            {posts.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex items-start gap-5 border-b border-line py-6"
                >
                  <span className="font-display text-2xl text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <h2 className="font-heading text-lg group-hover:text-accent">
                      {p.title}
                    </h2>
                    <p className="text-sm text-muted">{p.excerpt}</p>
                    <PostMeta post={p} />
                  </div>
                  <ArrowUpRight size={18} className="text-muted" />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="아직 공개된 글이 없어요."
            description="시리즈의 첫 번째 기록을 기다려 주세요."
          />
        )}
      </main>
      <div className="mx-auto max-w-[1248px] px-6 md:px-16">
        <SiteFooter />
      </div>
    </>
  );
}
