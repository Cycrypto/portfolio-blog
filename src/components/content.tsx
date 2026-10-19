import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Layers } from "lucide-react";
import type { Post, Series } from "@/lib/types";
import { formatDate, readingMinutes } from "@/lib/format";
import { Tag } from "./ui";
export function PostMeta({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-muted">
      <time dateTime={post.publishedAt || post.createdAt}>
        {formatDate(post.publishedAt || post.createdAt)}
      </time>
      <span>·</span>
      <span>{readingMinutes(post.bodyMarkdown)}분 읽기</span>
    </div>
  );
}
export function Author() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[13px] text-accent">
        JP
      </div>
      <div>
        <p className="text-sm font-medium">박준하</p>
        <p className="mt-1 text-xs text-muted">
          만들고 배우는 과정을 기록합니다.
        </p>
      </div>
    </div>
  );
}
export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  return (
    <article className="group border-b border-line py-7 first:border-t">
      <Link
        href={`/blog/${post.slug}`}
        className="flex items-start gap-4 md:gap-6"
      >
        <div className="min-w-0 flex-1">
          <p className="mb-3 font-mono text-[10px] tracking-wide text-accent">
            {post.tags.includes("일상") ? "LIFE" : "DEVELOPMENT"} /{" "}
            {String(index + 1).padStart(2, "0")}
          </p>
          <h2 className="mb-3 font-heading text-lg leading-snug group-hover:text-accent md:text-[22px]">
            {post.title}
          </h2>
          <p className="mb-4 text-[13px] leading-relaxed text-muted md:text-sm">
            {post.excerpt}
          </p>
          <PostMeta post={post} />
        </div>
        {post.coverUrl && (
          <img
            src={post.coverUrl}
            alt={post.coverAlt}
            loading="lazy"
            className="h-[88px] w-[88px] shrink-0 rounded bg-soft object-cover md:h-[114px] md:w-[152px]"
          />
        )}
      </Link>
    </article>
  );
}
export function SeriesCard({
  series,
  count,
}: {
  series: Series;
  count: number;
}) {
  return (
    <Link
      href={`/series/${series.slug}`}
      className="group block border-y border-line py-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-wide text-accent">
          SERIES / JOURNAL
        </span>
        <Layers size={20} className="text-coral" />
      </div>
      <h2 className="mb-4 font-heading text-2xl leading-snug group-hover:text-accent">
        {series.name}
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        {series.description}
      </p>
      <p className="mb-5 text-xs text-muted">공개 글 {count}개</p>
      <span className="flex items-center justify-between text-[13px]">
        처음부터 읽기
        <ArrowRight size={18} />
      </span>
    </Link>
  );
}
export function SeriesNavigator({
  series,
  posts,
  currentId,
}: {
  series: Series;
  posts: Post[];
  currentId: string;
}) {
  return (
    <details open className="bg-soft p-5">
      <summary className="cursor-pointer font-medium">{series.name}</summary>
      <p className="mt-3 text-xs text-muted">
        {posts.findIndex((p) => p.id === currentId) + 1} / {posts.length}번째 글
      </p>
      <ol className="mt-5 space-y-3">
        {posts.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/blog/${p.slug}`}
              className={`flex items-start gap-3 text-[13px] leading-relaxed ${p.id === currentId ? "font-medium text-accent" : "text-muted hover:text-accent"}`}
              aria-current={p.id === currentId ? "page" : undefined}
            >
              <span className="font-mono text-[11px]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {p.title}
            </Link>
          </li>
        ))}
      </ol>
    </details>
  );
}
export function PostNavigation({
  previous,
  next,
}: {
  previous?: Post;
  next?: Post;
}) {
  return (
    <div className="border-b border-line">
      {[
        [previous, "이전 글", ArrowLeft],
        [next, "다음 글", ArrowRight],
      ].map(([value, label, Icon]) => {
        const p = value as Post | undefined;
        const Arrow = Icon as typeof ArrowRight;
        return p ? (
          <Link
            key={String(label)}
            href={`/blog/${p.slug}`}
            className="flex min-h-24 items-center gap-4 border-t border-line py-5"
          >
            <Arrow size={20} className="shrink-0 text-muted" />
            <div>
              <p className="mb-2 text-xs text-muted">{String(label)}</p>
              <p className="font-heading text-base leading-relaxed">
                {p.title}
              </p>
            </div>
            <ArrowUpRight size={16} className="ml-auto shrink-0 text-muted" />
          </Link>
        ) : null;
      })}
    </div>
  );
}
export function PostTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <Link href={`/blog?tag=${encodeURIComponent(t)}`} key={t}>
          <Tag>{t}</Tag>
        </Link>
      ))}
    </div>
  );
}
