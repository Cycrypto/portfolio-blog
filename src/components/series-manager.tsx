"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Check,
  GripVertical,
  Layers,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Post, Series, SeriesInput } from "@/lib/types";
import { formatDate as dateLabel, slugify } from "@/lib/format";
import { isSeriesDraft } from "@/lib/draft";
import { useSessionDraft } from "./use-session-draft";
import { AdminShell } from "./admin-shell";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Modal,
  buttonClass,
  inputClass,
  request,
  useToast,
} from "./ui";

export function SeriesManager({
  initialSeries,
  posts,
}: {
  initialSeries: Series[];
  posts: Post[];
}) {
  const [items, setItems] = useState(initialSeries);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<Series | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const visible = items.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <AdminShell>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 font-mono text-[10px] text-accent">COLLECTIONS</p>
          <h1 className="font-heading text-[32px]">시리즈 관리</h1>
          <p className="mt-3 text-sm text-muted">
            여러 기록을 하나의 흐름으로 엮어 보세요.
          </p>
        </div>
        <Link href="/admin/series/new" className={buttonClass()}>
          <Plus size={16} />새 시리즈
        </Link>
      </div>
      <div className="relative mb-6 max-w-sm">
        <Search size={18} className="absolute top-3.5 left-3 text-muted" />
        <input
          aria-label="시리즈 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="시리즈 이름으로 검색"
          className={`${inputClass} pl-10`}
        />
      </div>
      {!visible.length ? (
        <EmptyState
          title={query ? "검색 결과가 없어요." : "첫 시리즈를 만들어 보세요."}
          description={
            query
              ? "다른 검색어로 찾아보거나 검색을 초기화해 주세요."
              : "함께 읽으면 좋은 글들을 모아 둘 수 있습니다."
          }
        >
          {query ? (
            <Button variant="secondary" onClick={() => setQuery("")}>
              검색 초기화
            </Button>
          ) : (
            <Link href="/admin/series/new" className={buttonClass()}>
              <Plus size={16} />새 시리즈 만들기
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {visible.map((s) => {
            const members = posts.filter((p) => p.seriesId === s.id);
            const published = members.filter(
              (p) => p.status === "published" && p.visibility === "public",
            ).length;
            return (
              <article
                key={s.id}
                className="flex flex-col gap-4 rounded border border-line bg-surface p-6"
              >
                <div className="flex justify-between">
                  <Layers size={22} className="text-coral" />
                  <span className="font-mono text-xs text-muted">
                    {String(members.length).padStart(2, "0")} POSTS
                  </span>
                </div>
                <h2 className="font-heading text-xl">
                  <Link
                    href={`/admin/series/${s.id}`}
                    className="hover:text-accent"
                  >
                    {s.name}
                  </Link>
                </h2>
                <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-muted">
                  {s.description || "시리즈 소개를 작성해 보세요."}
                </p>
                <p className="text-xs text-muted">
                  공개 글 {published}개 · 최근 수정 {dateLabel(s.updatedAt)}
                </p>
                <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
                  <Link
                    href={`/admin/series/${s.id}`}
                    className="text-sm text-accent"
                  >
                    편집 및 순서 관리 <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href={`/series/${s.slug}`}
                    target="_blank"
                    aria-label={`${s.name} 공개 페이지`}
                    className="ml-auto flex h-11 w-11 items-center justify-center"
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                  <button
                    onClick={() => {
                      setDeleteError("");
                      setDeleting(s);
                    }}
                    aria-label={`${s.name} 시리즈 삭제`}
                    className="flex h-11 w-11 items-center justify-center text-muted hover:text-danger"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Modal
        open={!!deleting}
        busy={busy}
        onClose={() => !busy && setDeleting(null)}
        title="시리즈를 삭제할까요?"
      >
        {deleteError && (
          <p
            role="alert"
            className="mb-4 rounded bg-danger-soft p-3 text-sm text-danger"
          >
            {deleteError}
          </p>
        )}
        <p className="mb-3 text-sm">{deleting?.name}</p>
        <p className="mb-6 text-sm leading-relaxed text-muted">
          시리즈의 구성과 순서가 삭제됩니다. 연결된 게시글은 그대로 보관되며,
          개별 글로 읽을 수 있습니다.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setDeleting(null)}
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
                await request(`/api/series/${deleting.id}`, {
                  method: "DELETE",
                  body: JSON.stringify({ revision: deleting.revision }),
                });
                setItems((v) => v.filter((s) => s.id !== deleting.id));
                setDeleting(null);
                toast("시리즈를 삭제했어요. 게시글은 보관됩니다.");
              } catch (e) {
                setDeleteError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            시리즈 삭제
          </Button>
        </div>
      </Modal>
    </AdminShell>
  );
}

export function SeriesEditor({
  initialSeries,
  posts,
}: {
  initialSeries: Series | null;
  posts: Post[];
}) {
  const router = useRouter();
  const toast = useToast();
  const initial: SeriesInput = {
    name: initialSeries?.name ?? "",
    slug: initialSeries?.slug ?? "",
    description: initialSeries?.description ?? "",
    revision: initialSeries?.revision,
    postIds: posts
      .filter((p) => p.seriesId === initialSeries?.id)
      .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0))
      .map((p) => p.id),
  };
  const [form, setForm] = useState(initial);
  const [snapshot, setSnapshot] = useState(JSON.stringify(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(!!initialSeries);
  const [attachOpen, setAttachOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [removing, setRemoving] = useState<Post | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const inFlight = useRef(false);
  const pendingLeave = useRef<() => void>(() => router.push("/admin/series"));
  const [announcement, setAnnouncement] = useState("");
  const dirty = JSON.stringify(form) !== snapshot;
  const draft = useSessionDraft(
    `portfolio:series:${initialSeries?.id || "new"}`,
    form,
    dirty,
    isSeriesDraft,
  );
  const ids = form.postIds ?? [];
  const requestLeave = (action: () => void) => {
    if (busy) return;
    if (!dirty) {
      action();
      return;
    }
    pendingLeave.current = action;
    setLeaveOpen(true);
  };
  const members = ids
    .map((id) => posts.find((p) => p.id === id)!)
    .filter(Boolean);
  const available = posts.filter(
    (p) =>
      !ids.includes(p.id) &&
      (!p.seriesId || p.seriesId === initialSeries?.id) &&
      `${p.title} ${p.slug}`.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const reorder = (from: number, to: number) => {
    if (busy || from < 0 || to < 0 || to >= ids.length || from === to) return;
    setAnnouncement(
      `${members[from].title}: ${to + 1}번째로 이동했습니다. 저장하면 적용됩니다.`,
    );
    setForm((f) => {
      const ordered = [...(f.postIds ?? [])];
      ordered.splice(to, 0, ordered.splice(from, 1)[0]);
      return { ...f, postIds: ordered };
    });
  };
  const save = async (leave = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const saved = await request<Series>(
        initialSeries ? `/api/series/${initialSeries.id}` : "/api/series",
        {
          method: initialSeries ? "PUT" : "POST",
          body: JSON.stringify({
            ...form,
            slug: form.slug || slugify(form.name),
          }),
        },
      );
      const next = { ...form, slug: saved.slug, revision: saved.revision };
      draft.clear();
      setForm(next);
      setSnapshot(JSON.stringify(next));
      toast("시리즈를 저장했어요.");
      if (leave) pendingLeave.current();
      else router.push(`/admin/series/${saved.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };
  return (
    <AdminShell onLeave={requestLeave}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => requestLeave(() => router.push("/admin/series"))}
        >
          <ArrowLeft size={16} />
          시리즈 관리
        </Button>
        <Button
          loading={busy}
          disabled={!form.name.trim()}
          onClick={() => void save()}
        >
          <Save size={16} />
          시리즈 저장
        </Button>
      </div>
      <p className="mb-3 font-mono text-[10px] text-accent">SERIES EDITOR</p>
      <h1 className="mb-8 font-heading text-[32px]">
        {initialSeries ? "시리즈 편집" : "새 시리즈 만들기"}
      </h1>
      <p role="status" aria-live="polite" className="mb-6 text-xs text-muted">
        {busy
          ? "저장 중…"
          : dirty
            ? "저장하지 않은 변경이 있어요."
            : initialSeries
              ? "모든 변경 사항 저장됨"
              : "새 시리즈"}
      </p>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {draft.recovery && (
        <div className="mb-6 space-y-3 rounded border border-line bg-warning-soft p-4">
          <p className="font-medium">
            이 탭에 저장하지 않은 시리즈 변경이 있어요.
          </p>
          <p className="text-sm text-muted">
            이름, 소개와 게시글 구성을 복구한 뒤 확인하고 저장해 주세요.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setForm(draft.recovery!);
                setSlugTouched(true);
                draft.clear();
              }}
            >
              시리즈 변경 복구
            </Button>
            <Button variant="ghost" onClick={draft.clear}>
              복구 사본 버리기
            </Button>
          </div>
        </div>
      )}
      {draft.unavailable && (
        <p role="status" className="mb-4 text-sm text-warning">
          이 브라우저에서는 복구 사본을 보관할 수 없어요. 자주 저장해 주세요.
        </p>
      )}
      {error && (
        <p role="alert" className="mb-6 bg-danger-soft p-4 text-sm text-danger">
          {error} 작성한 내용은 유지됩니다.
        </p>
      )}
      <fieldset
        disabled={busy}
        className="grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <section className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-heading text-2xl">
              게시글 구성{" "}
              <span className="font-mono text-sm text-muted">{ids.length}</span>
            </h2>
            <Button
              variant="secondary"
              onClick={() => {
                setChosen([]);
                setQuery("");
                setAttachOpen(true);
              }}
            >
              <Plus size={16} />
              게시글 추가
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted">
            드래그하거나 위·아래 버튼으로 읽는 순서를 변경하세요. 변경한 구성은
            저장할 때 적용됩니다.
          </p>
          {!members.length ? (
            <EmptyState
              title="아직 연결된 글이 없어요."
              description="기존 게시글을 추가해 시리즈를 시작하세요."
            >
              <Button variant="secondary" onClick={() => setAttachOpen(true)}>
                <Plus size={16} />
                게시글 추가
              </Button>
            </EmptyState>
          ) : (
            <ol className="space-y-3">
              {members.map((post, index) => (
                <li
                  key={post.id}
                  draggable={!busy}
                  onDragStart={(e) => {
                    setDragging(post.id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", post.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    reorder(
                      ids.indexOf(e.dataTransfer.getData("text/plain")),
                      index,
                    );
                    setDragging(null);
                  }}
                  className={`grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3 rounded border border-line bg-surface p-4 sm:flex ${dragging === post.id ? "opacity-50" : ""}`}
                >
                  <GripVertical
                    size={18}
                    className="hidden shrink-0 cursor-grab text-muted sm:block"
                  />
                  <span className="font-mono text-sm text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      onNavigate={(event) => {
                        event.preventDefault();
                        requestLeave(() =>
                          router.push(`/admin/posts/${post.id}`),
                        );
                      }}
                      className="line-clamp-2 text-sm leading-relaxed hover:text-accent"
                    >
                      {post.title}
                    </Link>
                    <div className="mt-2">
                      <Badge
                        status={post.status}
                        visibility={post.visibility}
                      />
                    </div>
                  </div>
                  <div className="col-start-2 flex shrink-0 items-center justify-end">
                    <button
                      type="button"
                      disabled={index === 0 || busy}
                      aria-label={`${post.title} 위로 이동`}
                      onClick={() => reorder(index, index - 1)}
                      className="flex h-11 w-11 items-center justify-center text-muted disabled:opacity-25"
                    >
                      <ArrowUp size={17} />
                    </button>
                    <button
                      type="button"
                      disabled={index === members.length - 1 || busy}
                      aria-label={`${post.title} 아래로 이동`}
                      onClick={() => reorder(index, index + 1)}
                      className="flex h-11 w-11 items-center justify-center text-muted disabled:opacity-25"
                    >
                      <ArrowDown size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label={`${post.title} 연결 해제`}
                      onClick={() => setRemoving(post)}
                      className="flex h-11 w-11 items-center justify-center text-muted hover:text-danger"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
        <aside className="space-y-6 border-t border-line pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6">
          <h2 className="font-heading text-xl">시리즈 설정</h2>
          <Field id="series-name" label="시리즈 이름">
            <input
              id="series-name"
              value={form.name}
              maxLength={100}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug: slugTouched ? f.slug : slugify(e.target.value),
                }))
              }
              className={inputClass}
            />
          </Field>
          <Field
            id="series-slug"
            label="URL 슬러그"
            help={`/series/${form.slug || "your-series"}`}
          >
            <input
              id="series-slug"
              value={form.slug}
              maxLength={100}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
              className={inputClass}
            />
          </Field>
          <Field
            id="series-description"
            label="시리즈 소개"
            help={`${form.description.length} / 300`}
          >
            <textarea
              id="series-description"
              value={form.description}
              maxLength={300}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className={`${inputClass} min-h-32 py-3`}
            />
          </Field>
          <p className="text-xs leading-relaxed text-muted">
            공개 페이지에서는 발행된 공개 글만 표시됩니다. 임시 저장과 비공개
            글도 구성에 추가할 수 있습니다.
          </p>
          {initialSeries && (
            <Link
              href={`/series/${initialSeries.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 text-sm text-accent"
            >
              공개 시리즈 보기 <ArrowUpRight size={16} />
            </Link>
          )}
        </aside>
      </fieldset>
      <Modal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="시리즈에 게시글 추가"
        wide
      >
        <div className="relative mb-5">
          <Search size={17} className="absolute top-3.5 left-3 text-muted" />
          <input
            aria-label="추가할 게시글 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목 또는 슬러그 검색"
            className={`${inputClass} pl-10`}
          />
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {available.length ? (
            available.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded border border-line p-4"
              >
                <input
                  type="checkbox"
                  checked={chosen.includes(p.id)}
                  onChange={(e) =>
                    setChosen((v) =>
                      e.target.checked
                        ? [...v, p.id]
                        : v.filter((id) => id !== p.id),
                    )
                  }
                  className="size-4 accent-accent"
                />
                <span className="min-w-0 flex-1 text-sm">{p.title}</span>
                <Badge status={p.status} visibility={p.visibility} />
              </label>
            ))
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              추가할 수 있는 게시글이 없어요.
            </p>
          )}
        </div>
        <p className="mt-4 text-xs text-muted">
          다른 시리즈에 속한 글은 글 편집 화면에서 시리즈를 변경할 수 있습니다.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAttachOpen(false)}>
            취소
          </Button>
          <Button
            disabled={!chosen.length}
            onClick={() => {
              setForm((f) => ({
                ...f,
                postIds: [...(f.postIds ?? []), ...chosen],
              }));
              setAttachOpen(false);
            }}
          >
            <Check size={16} />
            {chosen.length}개 글 추가
          </Button>
        </div>
      </Modal>
      <Modal
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="시리즈에서 글을 뺄까요?"
      >
        <p className="mb-3 text-sm">{removing?.title}</p>
        <p className="mb-6 text-sm text-muted">
          게시글은 보관됩니다. 시리즈를 저장하면 연결이 해제됩니다.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRemoving(null)}>
            취소
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setForm((f) => ({
                ...f,
                postIds: f.postIds?.filter((id) => id !== removing?.id),
              }));
              setRemoving(null);
            }}
          >
            연결 해제
          </Button>
        </div>
      </Modal>
      <Modal
        open={leaveOpen}
        busy={busy}
        onClose={() => setLeaveOpen(false)}
        title="저장하지 않은 변경이 있어요."
      >
        <p className="mb-6 text-sm text-muted">
          시리즈 이름과 구성을 저장하고 나갈 수 있습니다.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => {
              draft.clear();
              setLeaveOpen(false);
              pendingLeave.current();
            }}
          >
            저장하지 않고 나가기
          </Button>
          <Button loading={busy} onClick={() => void save(true)}>
            저장 후 나가기
          </Button>
        </div>
      </Modal>
    </AdminShell>
  );
}
