"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Search, X } from "lucide-react";
import type { Post, Series } from "@/lib/types";
import { Author, PostCard, SeriesCard } from "./content";
import { Button, EmptyState, inputClass } from "./ui";
import { Pagination } from "./pagination";
export function Journal({
  posts,
  series,
}: {
  posts: Post[];
  series: (Series & { count: number })[];
}) {
  const params = useSearchParams();
  const query = params.get("q") || "";
  const tag = params.get("tag") || "";
  const pageParam = Number(params.get("page"));
  const page = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const tags = ["", ...new Set(posts.flatMap((p) => p.tags))];
  const updateFilters = (values: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const url = next.size ? `/blog?${next}` : "/blog";
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  };
  const clearFilters = () => updateFilters({ q: "", tag: "", page: "" });
  const filtered = posts.filter(
    (p) =>
      (!tag || p.tags.includes(tag)) &&
      `${p.title} ${p.excerpt} ${p.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const pages = Math.ceil(filtered.length / 5);
  const safePage = Math.min(page, pages || 1);
  const visible = filtered.slice((safePage - 1) * 5, safePage * 5);
  return (
    <>
      <div className="mb-5 flex flex-col-reverse gap-4 border-b border-line lg:flex-row lg:items-end lg:justify-between">
        <div
          className="flex min-w-0 flex-wrap gap-x-5 gap-y-1"
          role="group"
          aria-label="게시글 주제"
        >
          <Link
            href="/series"
            className="order-2 flex min-h-11 shrink-0 items-center text-sm text-muted hover:text-accent"
          >
            시리즈
          </Link>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => updateFilters({ tag: t, page: "" })}
              aria-pressed={t === tag}
              className={`min-h-11 shrink-0 border-b-2 text-sm ${t === tag ? "border-accent text-accent" : "border-transparent text-muted hover:text-accent"}`}
            >
              {t || "전체 글"}
            </button>
          ))}
        </div>
        <label className="relative mb-4 w-full shrink-0 lg:w-[280px]">
          <Search size={18} className="absolute top-3.5 left-3 text-muted" />
          <span className="sr-only">게시글 검색</span>
          <input
            type="search"
            ref={searchRef}
            value={query}
            onChange={(e) =>
              updateFilters({ q: e.target.value, page: "" }, true)
            }
            placeholder="게시글 검색"
            className={`${inputClass} pl-10`}
          />
        </label>
      </div>
      <div
        ref={resultsRef}
        tabIndex={-1}
        className="mb-6 flex min-h-11 flex-wrap items-center justify-between gap-2 rounded focus-visible:outline-offset-4"
      >
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="text-sm text-muted"
        >
          {tag ? `${tag} · ` : ""}
          {query.trim() ? `“${query.trim()}” 검색 결과 ` : ""}
          <span className="font-medium text-ink">
            {filtered.length}개의 기록
          </span>
        </p>
        {(query || tag) && (
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() => {
              clearFilters();
              searchRef.current?.focus();
            }}
          >
            <X size={14} />
            필터 초기화
          </Button>
        )}
      </div>
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {visible.length ? (
            visible.map((p, i) => (
              <PostCard key={p.id} post={p} index={(safePage - 1) * 5 + i} />
            ))
          ) : (
            <EmptyState
              title={
                posts.length ? "검색 결과가 없어요." : "아직 기록이 없어요."
              }
              description={
                posts.length
                  ? "다른 검색어나 주제를 선택해 주세요."
                  : "첫 번째 글을 기다리고 있습니다."
              }
            ></EmptyState>
          )}
          <Pagination
            page={safePage}
            pages={pages}
            onChange={(next) => {
              updateFilters({ page: next === 1 ? "" : String(next) });
              resultsRef.current?.focus({ preventScroll: true });
              resultsRef.current?.scrollIntoView({ block: "start" });
            }}
          />
        </div>
        <aside className="space-y-8">
          {series[0] && (
            <SeriesCard series={series[0]} count={series[0].count} />
          )}
          <div className="space-y-5">
            <p className="font-mono text-[10px] text-muted">
              ABOUT THIS JOURNAL
            </p>
            <Author />
            <p className="text-sm leading-relaxed text-muted">
              코드와 디자인, 제품을 만들며 마주한 문제와 선택의 이유를 담습니다.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
