"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ExternalLink,
  GripVertical,
  Plus,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";
import {
  byPublication,
  type BlogSeries,
  type SeriesPost,
  type SeriesWorkspace,
} from "@/lib/series-types";
import { AdminShell } from "../admin-shell";
import { Button, Field, inputClass, Modal, request, useToast } from "../ui";

type Form = Pick<BlogSeries, "name" | "description" | "order" | "postIds">;
const asForm = (series?: BlogSeries): Form => ({
  name: series?.name || "",
  description: series?.description || "",
  order: series?.order || "publication",
  postIds: series?.postIds || [],
});
const dateLabel = (post: SeriesPost) =>
  post.status === "published" && post.publishedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(post.publishedAt))
    : post.status === "scheduled"
      ? "예약 · 발행 후 공개"
      : "초안 · 발행 후 공개";

export function SeriesManager({
  initial,
  email,
}: {
  initial: SeriesWorkspace;
  email: string;
}) {
  const toast = useToast();
  const [saved, setSaved] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.series[0]?.id || "");
  const selected = saved.series.find((series) => series.id === selectedId);
  const [form, setForm] = useState<Form>(asForm(initial.series[0]));
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createError, setCreateError] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const pending = useRef<() => void>(() => {});
  const inFlight = useRef(false);
  const dragging = useRef<string | null>(null);
  const dirty =
    !!selected && JSON.stringify(form) !== JSON.stringify(asForm(selected));
  const posts = useMemo(
    () => new Map(saved.posts.map((post) => [post.id, post])),
    [saved.posts],
  );
  const members = form.postIds
    .map((id) => posts.get(id))
    .filter((post): post is SeriesPost => !!post);
  const included = new Set(form.postIds);
  const candidates = saved.posts.filter(
    (post) =>
      !included.has(post.id) &&
      post.title
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty || busy) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);

  function leave(action: () => void) {
    if (inFlight.current) return;
    if (!dirty) {
      action();
      return;
    }
    pending.current = action;
    setLeaveOpen(true);
  }
  function choose(id: string, workspace = saved) {
    setSelectedId(id);
    setForm(asForm(workspace.series.find((series) => series.id === id)));
    setSearch("");
    setFailure("");
  }
  function accept(workspace: SeriesWorkspace, id = selectedId) {
    setSaved(workspace);
    choose(id, workspace);
  }
  function chronological(ids: string[]) {
    return [...ids].sort((a, b) => byPublication(posts.get(a)!, posts.get(b)!));
  }
  function add(id: string) {
    setForm((current) => {
      if (current.postIds.includes(id)) return current;
      const ids = [...current.postIds, id];
      return {
        ...current,
        postIds: current.order === "publication" ? chronological(ids) : ids,
      };
    });
  }
  function move(id: string, index: number) {
    setForm((current) => {
      const from = current.postIds.indexOf(id);
      if (
        from < 0 ||
        from === index ||
        index < 0 ||
        index >= current.postIds.length
      )
        return current;
      const ids = [...current.postIds];
      ids.splice(from, 1);
      ids.splice(index, 0, id);
      return { ...current, postIds: ids, order: "manual" };
    });
  }
  async function save() {
    if (!selected || inFlight.current || !dirty) return;
    inFlight.current = true;
    setBusy(true);
    setFailure("");
    try {
      accept(
        await request<SeriesWorkspace>("/api/admin/series", {
          method: "PUT",
          body: JSON.stringify({
            ...form,
            id: selected.id,
            revision: saved.revision,
          }),
        }),
      );
      toast("시리즈를 저장했습니다.");
    } catch (error) {
      setFailure((error as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function reload() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const workspace = await request<SeriesWorkspace>("/api/admin/series");
      accept(
        workspace,
        workspace.series.some((series) => series.id === selectedId)
          ? selectedId
          : workspace.series[0]?.id || "",
      );
      toast("최신 내용을 불러왔습니다.");
    } catch (error) {
      setFailure((error as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function create() {
    if (inFlight.current || !newName.trim()) return;
    inFlight.current = true;
    setBusy(true);
    setCreateError("");
    try {
      const workspace = await request<SeriesWorkspace & { selectedId: string }>(
        "/api/admin/series",
        {
          method: "POST",
          body: JSON.stringify({ name: newName, description: newDescription }),
        },
      );
      accept(workspace, workspace.selectedId);
      setCreateOpen(false);
      toast("시리즈를 만들었습니다. 글을 추가해 보세요.");
    } catch (error) {
      setCreateError((error as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const nav = (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 px-2">
        <p className="text-xs text-muted">내 시리즈 · {saved.series.length}</p>
        <button
          type="button"
          aria-label="새 시리즈 만들기"
          disabled={busy}
          className="flex min-h-11 min-w-11 items-center justify-center rounded hover:bg-surface disabled:opacity-40"
          onClick={() =>
            leave(() => {
              setNewName("");
              setNewDescription("");
              setCreateError("");
              setCreateOpen(true);
            })
          }
        >
          <Plus size={18} />
        </button>
      </div>
      <nav
        aria-label="시리즈 선택"
        className="flex gap-1 overflow-x-auto md:flex-col"
      >
        {saved.series.map((series) => (
          <button
            type="button"
            key={series.id}
            disabled={busy}
            aria-current={series.id === selectedId ? "page" : undefined}
            onClick={() => {
              if (series.id !== selectedId) leave(() => choose(series.id));
            }}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded px-3 text-left text-sm md:w-full ${series.id === selectedId ? "bg-surface text-accent shadow-sm" : "hover:bg-surface/70"}`}
          >
            <BookOpen size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 break-words">{series.name}</span>
            <span className="text-xs text-muted">{series.postIds.length}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <AdminShell email={email} onLeave={leave} nav={nav}>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 px-4 py-4 backdrop-blur md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl">시리즈 관리</h1>
            <p role="status" className="mt-1 text-xs text-muted">
              {busy
                ? "처리 중…"
                : dirty
                  ? "저장되지 않은 변경사항이 있습니다."
                  : "글을 모으고, 읽을 순서를 정하세요."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() =>
                leave(() => {
                  void reload();
                })
              }
            >
              <RotateCcw size={15} />
              <span className="hidden sm:inline">새로 불러오기</span>
              <span className="sm:hidden">새로고침</span>
            </Button>
            <Button
              loading={busy}
              disabled={!dirty || !form.name.trim()}
              onClick={save}
            >
              <Save size={15} />
              저장
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        {failure && (
          <div
            role="alert"
            className="rounded border border-danger/30 bg-danger/5 p-4 text-sm leading-relaxed text-danger"
          >
            {failure}
          </div>
        )}
        {!selected ? (
          <section className="rounded-lg border border-dashed border-line px-6 py-20 text-center">
            <BookOpen size={32} className="mx-auto mb-4 text-muted" />
            <h2 className="font-heading text-xl">첫 시리즈를 만들어 보세요.</h2>
            <p className="mt-3 mb-6 text-sm text-muted">
              이름을 정하고 글을 추가하면 발행일순으로 묶입니다.
            </p>
            <Button
              onClick={() => {
                setNewName("");
                setNewDescription("");
                setCreateError("");
                setCreateOpen(true);
              }}
            >
              <Plus size={16} />
              시리즈 만들기
            </Button>
          </section>
        ) : (
          <>
            <section
              className="space-y-4 rounded-lg border border-line bg-surface p-5 md:p-6"
              aria-label="시리즈 정보"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted">시리즈 정보</p>
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 text-sm text-accent"
                >
                  블로그에서 보기
                  <ExternalLink size={14} />
                </a>
              </div>
              <Field label="시리즈 이름" id="series-name">
                <input
                  id="series-name"
                  className={`${inputClass} font-medium`}
                  value={form.name}
                  maxLength={150}
                  disabled={busy}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </Field>
              <Field label="소개" id="series-description">
                <textarea
                  id="series-description"
                  className={`${inputClass} min-h-20 py-3`}
                  value={form.description}
                  maxLength={500}
                  disabled={busy}
                  placeholder="어떤 이야기를 담은 시리즈인가요?"
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </Field>
            </section>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <section
                className="min-w-0 rounded-lg border border-line bg-surface"
                aria-labelledby="series-contents-title"
              >
                <div className="border-b border-line p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2
                      id="series-contents-title"
                      className="font-heading text-lg"
                    >
                      시리즈에 담긴 글{" "}
                      <span className="text-muted">{members.length}</span>
                    </h2>
                    <span className="rounded-full bg-soft px-3 py-1 text-xs text-muted">
                      {form.order === "publication"
                        ? "발행일순 · 자동"
                        : "직접 정한 순서"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    먼저 발행한 글부터 보여요. 드래그하거나 화살표로 순서를 바꿀
                    수 있어요.
                  </p>
                  {form.order === "manual" && (
                    <Button
                      variant="ghost"
                      disabled={busy}
                      className="mt-2 -ml-3 text-xs"
                      onClick={() =>
                        setForm({
                          ...form,
                          order: "publication",
                          postIds: chronological(form.postIds),
                        })
                      }
                    >
                      <RotateCcw size={14} />
                      발행일순으로 되돌리기
                    </Button>
                  )}
                </div>
                {members.length === 0 ? (
                  <p className="px-5 py-16 text-center text-sm text-muted">
                    아래 글 목록에서 추가해 주세요.
                  </p>
                ) : (
                  <ol
                    aria-label="시리즈 글 순서"
                    className="divide-y divide-line"
                  >
                    {members.map((post, index) => (
                      <li
                        key={post.id}
                        className="flex items-center gap-2 px-3 py-4 sm:gap-3 sm:px-4"
                        onDragOver={(event) => {
                          if (!busy && dragging.current) event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (!busy && dragging.current)
                            move(dragging.current, index);
                          dragging.current = null;
                        }}
                      >
                        <button
                          type="button"
                          draggable={!busy}
                          disabled={busy}
                          aria-label={`${post.title} 순서 드래그`}
                          title="끌어서 순서 바꾸기"
                          onDragStart={(event) => {
                            dragging.current = post.id;
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", post.id);
                          }}
                          onDragEnd={() => {
                            dragging.current = null;
                          }}
                          className="hidden min-h-11 min-w-6 cursor-grab items-center justify-center text-muted sm:flex"
                        >
                          <GripVertical size={18} />
                        </button>
                        <span className="w-5 shrink-0 text-center font-mono text-xs text-muted">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium leading-relaxed">
                            {post.title}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {dateLabel(post)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            disabled={busy || index === 0}
                            aria-label={`${post.title} 위로`}
                            onClick={() => move(post.id, index - 1)}
                            className="flex min-h-11 min-w-9 items-center justify-center rounded hover:bg-soft disabled:opacity-25"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={busy || index === members.length - 1}
                            aria-label={`${post.title} 아래로`}
                            onClick={() => move(post.id, index + 1)}
                            className="flex min-h-11 min-w-9 items-center justify-center rounded hover:bg-soft disabled:opacity-25"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            aria-label={`${post.title} 시리즈에서 빼기`}
                            onClick={() =>
                              setForm({
                                ...form,
                                postIds: form.postIds.filter(
                                  (id) => id !== post.id,
                                ),
                              })
                            }
                            className="flex min-h-11 min-w-9 items-center justify-center rounded text-muted hover:bg-soft disabled:opacity-25"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              <section
                className="min-w-0 rounded-lg border border-line bg-surface"
                aria-labelledby="series-add-title"
              >
                <div className="space-y-4 border-b border-line p-5">
                  <h2 id="series-add-title" className="font-heading text-lg">
                    글 추가
                  </h2>
                  <label className="relative block">
                    <span className="sr-only">추가할 글 검색</span>
                    <Search
                      size={16}
                      className="pointer-events-none absolute top-3.5 left-3 text-muted"
                    />
                    <input
                      type="search"
                      className={`${inputClass} pl-10`}
                      placeholder="글 제목으로 검색"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <p className="text-xs text-muted">
                    초안도 미리 담아둘 수 있어요. 글을 발행하면 블로그에
                    나타납니다.
                  </p>
                </div>
                <ul
                  aria-label="추가할 글"
                  className="max-h-[640px] divide-y divide-line overflow-y-auto"
                >
                  {candidates.map((post) => (
                    <li key={post.id} className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm leading-relaxed">
                          {post.title}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {dateLabel(post)}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        className="px-3 text-xs"
                        aria-label={`${post.title} 시리즈에 추가`}
                        onClick={() => add(post.id)}
                      >
                        <Plus size={14} />
                        추가
                      </Button>
                    </li>
                  ))}
                </ul>
                {candidates.length === 0 && (
                  <p className="px-5 py-12 text-center text-sm text-muted">
                    {search ? "검색 결과가 없습니다." : "추가할 글이 없습니다."}
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </div>
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="새 시리즈"
        busy={busy}
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void create();
          }}
        >
          <Field label="시리즈 이름" id="new-series-name">
            <input
              autoFocus
              required
              id="new-series-name"
              maxLength={150}
              disabled={busy}
              className={inputClass}
              placeholder="예: 홈서버 구축"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
          </Field>
          <Field label="소개 (선택)" id="new-series-description">
            <textarea
              id="new-series-description"
              maxLength={500}
              disabled={busy}
              className={`${inputClass} min-h-24 py-3`}
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
            />
          </Field>
          {createError && (
            <p role="alert" className="text-sm text-danger">
              {createError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setCreateOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" loading={busy} disabled={!newName.trim()}>
              만들기
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="변경사항을 버릴까요?"
      >
        <p className="mb-6 text-sm leading-relaxed text-muted">
          저장하지 않은 시리즈 변경사항이 사라집니다.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setLeaveOpen(false)}>
            계속 편집
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setLeaveOpen(false);
              setForm(asForm(selected));
              pending.current();
            }}
          >
            버리고 계속
          </Button>
        </div>
      </Modal>
    </AdminShell>
  );
}
