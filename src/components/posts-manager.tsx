"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Eye,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  Trash2,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Post, Series } from "@/lib/types";
import { isPublic } from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  buttonClass,
  inputClass,
  request,
  useToast,
} from "./ui";
import { AdminShell } from "./admin-shell";
export function PostsManager({
  initialPosts,
  series,
}: {
  initialPosts: Post[];
  series: Series[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const updating = useRef(false);
  const filtered = useMemo(
    () =>
      [...posts]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .filter(
          (p) =>
            (filter === "all" ||
              (filter === "draft" && p.status === "draft") ||
              (filter === "published" && isPublic(p)) ||
              (filter === "private" &&
                p.status === "published" &&
                p.visibility === "private")) &&
            (seriesFilter === "all" || p.seriesId === seriesFilter) &&
            `${p.title} ${p.slug}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        ),
    [posts, filter, query, seriesFilter],
  );
  const pages = Math.ceil(filtered.length / 6);
  const safePage = Math.min(page, pages || 1);
  const changeVisibility = async (p: Post) => {
    if (updating.current) return;
    updating.current = true;
    setUpdatingId(p.id);
    try {
      const saved = await request<Post>(`/api/posts/${p.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...p,
          visibility: p.visibility === "public" ? "private" : "public",
        }),
      });
      setPosts((previous) => previous.map((x) => (x.id === p.id ? saved : x)));
      toast(
        saved.visibility === "private"
          ? "비공개로 전환했어요."
          : "공개로 전환했어요.",
      );
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      updating.current = false;
      setUpdatingId(null);
    }
  };
  const postActions = (p: Post) => (
    <div className="flex gap-1">
      <Link
        href={isPublic(p) ? `/blog/${p.slug}` : `/admin/posts/${p.id}/preview`}
        aria-label={`${p.title} 보기`}
        className="flex h-11 w-11 items-center justify-center rounded hover:bg-soft disabled:opacity-40"
      >
        <Eye size={16} />
      </Link>
      <Link
        href={`/admin/posts/${p.id}`}
        aria-label={`${p.title} 수정`}
        className="flex h-11 w-11 items-center justify-center rounded hover:bg-soft disabled:opacity-40"
      >
        <Pencil size={16} />
      </Link>
      {p.status === "published" && (
        <button
          disabled={!!updatingId}
          aria-busy={updatingId === p.id}
          onClick={() => void changeVisibility(p)}
          aria-label={`${p.title} ${p.visibility === "public" ? "비공개" : "공개"} 전환`}
          className="flex h-11 w-11 items-center justify-center rounded hover:bg-soft disabled:opacity-40"
        >
          {p.visibility === "public" ? (
            <LockKeyhole size={16} />
          ) : (
            <Globe size={16} />
          )}
        </button>
      )}
      <button
        disabled={!!updatingId}
        onClick={() => {
          setDeleteError("");
          setDeleting(p);
        }}
        aria-label={`${p.title} 삭제`}
        className="flex h-11 w-11 items-center justify-center rounded text-danger hover:bg-danger-soft disabled:opacity-40"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
  const visible = filtered.slice((safePage - 1) * 6, safePage * 6);
  return (
    <AdminShell>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="mb-3 font-heading text-3xl">게시글 관리</h1>
          <p className="text-sm text-muted">
            작성한 기록을 살펴보고, 수정하고, 발행합니다.
          </p>
        </div>
        <Link href="/admin/posts/new" className={buttonClass()}>
          <Plus size={16} />새 게시글
        </Link>
      </header>
      <div className="mb-8 flex gap-7 overflow-x-auto">
        {[
          ["all", "전체", posts.length],
          ["published", "발행됨", posts.filter(isPublic).length],
          [
            "draft",
            "임시 저장",
            posts.filter((p) => p.status === "draft").length,
          ],
          [
            "private",
            "비공개",
            posts.filter(
              (p) => p.status === "published" && p.visibility === "private",
            ).length,
          ],
        ].map(([key, label, count]) => (
          <button
            key={key}
            aria-pressed={filter === key}
            onClick={() => {
              setFilter(String(key));
              setPage(1);
            }}
            className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 text-sm ${filter === key ? "border-accent text-accent" : "border-transparent text-muted"}`}
          >
            {label}
            <span className="font-mono text-xs text-muted">{count}</span>
          </button>
        ))}
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <label className="relative flex-1">
          <Search size={18} className="absolute top-3.5 left-3 text-muted" />
          <span className="sr-only">게시글 검색</span>
          <input
            type="search"
            className={`${inputClass} pl-10`}
            placeholder="게시글 검색"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          aria-label="시리즈 필터"
          className={`${inputClass} sm:w-[220px]`}
          value={seriesFilter}
          onChange={(e) => {
            setSeriesFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">모든 시리즈</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {filtered.length ? (
        <>
          <div className="space-y-4 lg:hidden">
            {visible.map((p) => (
              <article
                key={p.id}
                className="rounded-lg border border-line bg-surface p-4"
              >
                <div className="mb-3">
                  <Badge status={p.status} visibility={p.visibility} />
                </div>
                <h2 className="font-heading text-lg leading-relaxed">
                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="hover:text-accent"
                  >
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 break-all font-mono text-[11px] text-muted">
                  /blog/{p.slug}
                </p>
                <div className="mt-4 space-y-2 text-xs text-muted">
                  <p>
                    {series.find((s) => s.id === p.seriesId)?.name ||
                      "시리즈 없음"}
                  </p>
                  <p>수정일 {formatDate(p.updatedAt)}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-xs text-muted">글 관리</span>
                  {postActions(p)}
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded border border-line bg-surface lg:block">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="bg-soft text-xs text-muted">
                <tr>
                  <th className="px-5 py-4 font-normal">게시글</th>
                  <th className="px-4 py-4 font-normal">상태</th>
                  <th className="px-4 py-4 font-normal">시리즈</th>
                  <th className="px-4 py-4 font-normal">수정일</th>
                  <th className="px-4 py-4 font-normal">관리</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="max-w-[360px] px-5 py-5">
                      <Link
                        href={`/admin/posts/${p.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {p.title}
                      </Link>
                      <p className="mt-2 font-mono text-[10px] text-muted">
                        /blog/{p.slug}
                      </p>
                    </td>
                    <td className="px-4">
                      <Badge status={p.status} visibility={p.visibility} />
                    </td>
                    <td className="max-w-40 px-4 text-xs leading-relaxed text-muted">
                      {series.find((s) => s.id === p.seriesId)?.name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 text-xs text-muted">
                      {formatDate(p.updatedAt)}
                    </td>
                    <td className="px-3">{postActions(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <span>
              {filtered.length}개 중 {(safePage - 1) * 6 + 1}–
              {Math.min(safePage * 6, filtered.length)}개 표시
            </span>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                  aria-label="이전 페이지"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span>
                  {safePage} / {pages}
                </span>
                <Button
                  variant="ghost"
                  disabled={safePage === pages}
                  onClick={() => setPage(safePage + 1)}
                  aria-label="다음 페이지"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          title={
            posts.length ? "검색 결과가 없어요." : "첫 번째 기록을 남겨보세요."
          }
          description={
            posts.length
              ? "다른 검색어나 상태를 선택해 주세요."
              : "새 게시글을 작성하면 이곳에 표시됩니다."
          }
        >
          {posts.length ? (
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setFilter("all");
                setSeriesFilter("all");
                setPage(1);
              }}
            >
              필터 초기화
            </Button>
          ) : (
            <Link href="/admin/posts/new" className={buttonClass()}>
              <Plus size={16} />
              게시글 작성
            </Link>
          )}
        </EmptyState>
      )}
      <Modal
        open={!!deleting}
        busy={busy}
        onClose={() => !busy && setDeleting(null)}
        title="게시글을 삭제할까요?"
      >
        {deleteError && (
          <p
            role="alert"
            className="mb-4 rounded bg-danger-soft p-3 text-sm text-danger"
          >
            {deleteError}
          </p>
        )}
        <p className="mb-4 font-medium">“{deleting?.title}”</p>
        <p className="mb-7 text-sm leading-relaxed text-muted">
          글과 시리즈 연결이 제거됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setDeleting(null)}
            disabled={busy}
          >
            취소
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={async () => {
              if (!deleting) return;
              setBusy(true);
              try {
                await request(`/api/posts/${deleting.id}`, {
                  method: "DELETE",
                  body: JSON.stringify({ revision: deleting.revision }),
                });
                setPosts(posts.filter((p) => p.id !== deleting.id));
                setDeleting(null);
                toast("게시글을 삭제했어요.");
              } catch (e) {
                setDeleteError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Trash2 size={16} />
            삭제하기
          </Button>
        </div>
      </Modal>
    </AdminShell>
  );
}
