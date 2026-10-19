"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bold,
  Check,
  Cloud,
  CloudOff,
  Code,
  Copy,
  Eye,
  Heading2,
  Image,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  LoaderCircle,
  Quote,
  Save,
  Table,
  X,
} from "lucide-react";
import type { Post, PostInput, Series } from "@/lib/types";
import { readingMinutes, slugify } from "@/lib/format";
import { isPostDraft } from "@/lib/draft";
import { useSessionDraft } from "./use-session-draft";
import { Markdown } from "./markdown";
import { MediaPicker, type MediaAsset } from "./media-manager";
import { Button, Field, Modal, Tag, inputClass, request, useToast } from "./ui";
const blank: PostInput = {
  title: "",
  slug: "",
  excerpt: "",
  bodyMarkdown: "",
  coverUrl: "",
  coverAlt: "",
  tags: [],
  status: "draft",
  visibility: "public",
  seriesId: null,
};
const postInput = (p: Post): PostInput => ({
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt,
  bodyMarkdown: p.bodyMarkdown,
  coverUrl: p.coverUrl,
  coverAlt: p.coverAlt,
  tags: p.tags,
  status: p.status,
  visibility: p.visibility,
  seriesId: p.seriesId,
  revision: p.revision,
});
export function PostEditor({
  initialPost,
  series,
}: {
  initialPost: Post | null;
  series: Series[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [postId, setPostId] = useState(initialPost?.id);
  const [form, setForm] = useState<PostInput>(
    initialPost ? postInput(initialPost) : blank,
  );
  const [snapshot, setSnapshot] = useState(JSON.stringify(form));
  const [mode, setMode] = useState("split");
  const [wideEditor, setWideEditor] = useState(false);
  const visibleMode = mode === "split" && !wideEditor ? "edit" : mode;
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(initialPost?.updatedAt);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(!!initialPost);
  const [publishOpen, setPublishOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [tagText, setTagText] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const updateWidth = () => setWideEditor(query.matches);
    updateWidth();
    query.addEventListener("change", updateWidth);
    return () => query.removeEventListener("change", updateWidth);
  }, []);
  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    const resize = () => {
      title.style.height = "auto";
      title.style.height = `${title.scrollHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [form.title]);
  const inFlight = useRef(false);
  const dirty = JSON.stringify(form) !== snapshot;
  const draft = useSessionDraft(
    `portfolio:post:${postId || "new"}`,
    form,
    dirty,
    isPostDraft,
  );
  const update = <K extends keyof PostInput>(key: K, value: PostInput[K]) => {
    if (inFlight.current) return;
    setForm((previous) => ({ ...previous, [key]: value }));
  };
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
  const save = useCallback(
    async (status = form.status, leave = false) => {
      if (inFlight.current || uploading) return false;
      inFlight.current = true;
      setSaving(true);
      setError("");
      try {
        const payload = {
          ...form,
          slug: form.slug || slugify(form.title),
          status,
        };
        const saved = await request<Post>(
          postId ? `/api/posts/${postId}` : "/api/posts",
          { method: postId ? "PUT" : "POST", body: JSON.stringify(payload) },
        );
        const next = postInput(saved);
        draft.clear();
        setPostId(saved.id);
        setForm(next);
        setSnapshot(JSON.stringify(next));
        setSavedAt(saved.updatedAt);
        setPublishOpen(false);
        setLeaveOpen(false);
        toast(
          status === "published"
            ? "게시글을 저장하고 발행했어요."
            : "게시글을 임시 저장했어요.",
        );
        if (leave) {
          router.push("/admin");
          router.refresh();
        } else if (!postId) {
          window.history.replaceState(null, "", `/admin/posts/${saved.id}`);
        }
        return true;
      } catch (e) {
        setError((e as Error).message);
        toast((e as Error).message, true);
        return false;
      } finally {
        setSaving(false);
        inFlight.current = false;
      }
    },
    [form, postId, uploading, router, toast],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "p"
      ) {
        e.preventDefault();
        setMode((m) => (m === "preview" ? "edit" : "preview"));
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [save]);
  const insert = (before: string, after = "", placeholder = "") => {
    const textarea = textRef.current;
    const start = textarea?.selectionStart ?? form.bodyMarkdown.length;
    const end = textarea?.selectionEnd ?? start;
    const selection = form.bodyMarkdown.slice(start, end) || placeholder;
    update(
      "bodyMarkdown",
      form.bodyMarkdown.slice(0, start) +
        before +
        selection +
        after +
        form.bodyMarkdown.slice(end),
    );
    setMode(mode === "preview" ? "edit" : mode);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(
        start + before.length,
        start + before.length + selection.length,
      );
    });
  };
  const addTag = () => {
    const t = tagText.trim().replace(/,$/, "");
    if (t && t.length <= 32 && form.tags.length < 12) {
      update("tags", [...new Set([...form.tags, t])]);
      setTagText("");
    }
  };
  const imageChosen = (asset: MediaAsset, target: "body" | "cover") => {
    if (target === "cover") {
      setForm((f) => ({ ...f, coverUrl: asset.url, coverAlt: asset.alt }));
    } else {
      const alt = asset.alt.replace(/[\\[\]]/g, "\\$&");
      const title = asset.caption
        ? ` "${asset.caption.replace(/[\\"]/g, "\\$&")}"`
        : "";
      insert(`\n\n![${alt}](${asset.url}${title})\n\n`);
    }
    setMediaOpen(false);
  };
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2 md:flex-nowrap md:gap-3 md:px-10">
        <Button
          variant="ghost"
          onClick={() => (dirty ? setLeaveOpen(true) : router.push("/admin"))}
          aria-label="게시글 관리로 돌아가기"
          className="w-11 px-0"
        >
          <ArrowLeft size={18} />
        </Button>
        <span className="hidden text-xs text-muted sm:block">
          게시글 / {postId ? "글 수정" : "새 글 작성"}
        </span>
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="order-last flex w-full items-center gap-1.5 px-2 pb-1 text-xs text-muted md:order-none md:ml-auto md:w-auto md:p-0"
        >
          {saving ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : error ? (
            <CloudOff size={16} className="text-danger" />
          ) : dirty ? (
            <span className="text-warning">●</span>
          ) : (
            <Cloud size={16} className="text-success" />
          )}
          {saving
            ? "저장 중…"
            : error
              ? "저장 실패"
              : dirty
                ? "변경 사항 있음"
                : savedAt
                  ? "모든 변경 사항 저장됨"
                  : "새로운 기록"}
        </span>
        <Button
          variant="secondary"
          disabled={uploading}
          loading={saving}
          onClick={() => void save()}
          className="ml-auto md:ml-0"
        >
          <Save size={16} />
          <span className="hidden sm:inline">
            {form.status === "published" ? "변경 사항 저장" : "임시 저장"}
          </span>
          <span className="sm:hidden">
            {form.status === "published" ? "저장" : "임시 저장"}
          </span>
        </Button>
        <Button
          disabled={
            !form.title.trim() ||
            !form.bodyMarkdown.trim() ||
            uploading ||
            saving
          }
          onClick={() => setPublishOpen(true)}
        >
          <ArrowUpRight size={16} />
          {form.status === "published" ? "발행 설정" : "발행하기"}
        </Button>
      </header>
      <main
        id="main"
        className={`grid min-w-0 items-start gap-8 p-6 md:p-8 xl:grid-cols-[minmax(0,1fr)_304px] ${saving ? "pointer-events-none opacity-70" : ""}`}
        aria-busy={saving}
      >
        <h1 className="sr-only">{postId ? "게시글 편집" : "새 게시글 작성"}</h1>
        <section className="min-w-0 space-y-6">
          {draft.recovery && (
            <div className="space-y-3 rounded border border-line bg-warning-soft p-4">
              <p className="font-medium">
                이 탭에 저장하지 않은 변경이 있어요.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                이전에 작성하던 내용을 복구할 수 있습니다. 복구 후 내용을
                확인하고 저장해 주세요.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setForm(draft.recovery!);
                    setSlugTouched(true);
                    draft.clear();
                  }}
                >
                  작성 내용 복구
                </Button>
                <Button variant="ghost" onClick={draft.clear}>
                  복구 사본 버리기
                </Button>
              </div>
            </div>
          )}
          {draft.unavailable && (
            <p role="status" className="text-sm text-warning">
              이 브라우저에서는 복구 사본을 보관할 수 없어요. 자주 저장해
              주세요.
            </p>
          )}
          <div className="space-y-4 border-b border-line pb-6">
            <label className="sr-only" htmlFor="post-title">
              게시글 제목
            </label>
            <textarea
              ref={titleRef}
              rows={1}
              id="post-title"
              placeholder="새로운 기록의 제목"
              value={form.title}
              maxLength={160}
              disabled={saving}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: slugTouched ? f.slug : slugify(e.target.value),
                }))
              }
              className="block w-full resize-none overflow-hidden rounded border-none bg-transparent font-heading text-[28px] leading-relaxed outline-none md:text-[32px]"
            />
            <label className="sr-only" htmlFor="post-excerpt">
              게시글 요약
            </label>
            <input
              id="post-excerpt"
              placeholder="이 글을 소개하는 짧은 문장"
              maxLength={160}
              value={form.excerpt}
              disabled={saving}
              onChange={(e) => update("excerpt", e.target.value)}
              className="w-full bg-transparent text-sm text-muted outline-none"
            />
          </div>
          {error && (
            <div
              role="alert"
              className="space-y-3 bg-danger-soft p-4 text-sm text-danger"
            >
              <p>{error}</p>
              <p className="text-xs">
                작성 내용은 유지됩니다. 오류를 확인하고 다시 저장해 주세요.
              </p>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(form.bodyMarkdown);
                    toast("현재 내용을 복사했어요.");
                  } catch {
                    toast(
                      "복사하지 못했어요. 본문을 직접 선택해 복사해 주세요.",
                      true,
                    );
                  }
                }}
              >
                <Copy size={14} />
                현재 내용 복사
              </Button>
            </div>
          )}
          <div className="flex gap-6 border-b border-line">
            {[
              ["split", "분할 보기"],
              ["edit", "작성"],
              ["preview", "미리보기"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={visibleMode === key}
                onClick={() => setMode(key)}
                className={`min-h-11 border-b-2 text-[13px] ${key === "split" ? "hidden md:block" : ""} ${visibleMode === key ? "border-accent text-accent" : "border-transparent text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="flex flex-wrap gap-1 border border-line bg-surface p-1.5"
            aria-label="Markdown 서식 도구"
          >
            {[
              [Heading2, "제목", "\n## ", "", "제목"],
              [Bold, "굵게", "**", "**", "굵은 글씨"],
              [Italic, "기울임", "*", "*", "기울임"],
              [Quote, "인용", "\n> ", "", "인용문"],
              [List, "목록", "\n- ", "", "항목"],
              [ListOrdered, "번호 목록", "\n1. ", "", "항목"],
              [LinkIcon, "링크", "[", "](https://example.com)", "링크 텍스트"],
              [
                Code,
                "코드",
                "\n\n```typescript\n",
                "\n```\n",
                "const value = 1;",
              ],
              [
                Table,
                "표",
                "\n\n| 제목 | 내용 |\n| --- | --- |\n| ",
                " | 값 |\n",
                "항목",
              ],
            ].map(([Icon, label, before, after, placeholder]) => {
              const I = Icon as typeof Bold;
              return (
                <button
                  type="button"
                  key={String(label)}
                  title={String(label)}
                  aria-label={String(label)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    insert(String(before), String(after), String(placeholder))
                  }
                  disabled={saving}
                  className="flex h-11 w-11 items-center justify-center rounded text-muted hover:bg-soft"
                >
                  <I size={17} />
                </button>
              );
            })}
            <button
              onClick={() => setMediaOpen(true)}
              aria-label="이미지 삽입"
              title="이미지 삽입"
              className="flex h-11 w-11 items-center justify-center rounded text-muted hover:bg-soft"
            >
              <Image size={17} />
            </button>
          </div>
          <div
            className={`grid min-w-0 gap-6 ${mode === "split" ? "md:grid-cols-2" : ""}`}
          >
            {mode !== "preview" && (
              <div className="min-w-0 border border-line bg-surface p-5">
                <div className="mb-5 flex justify-between font-mono text-[10px]">
                  <span className="text-accent">MARKDOWN</span>
                  <span className="text-muted">UTF-8</span>
                </div>
                <textarea
                  ref={textRef}
                  aria-label="Markdown 본문"
                  placeholder={
                    "오늘의 기록을 시작해 보세요.\n\n## 첫 번째 생각"
                  }
                  value={form.bodyMarkdown}
                  disabled={saving}
                  onChange={(e) => update("bodyMarkdown", e.target.value)}
                  className="min-h-[400px] w-full resize-y bg-transparent font-mono text-base leading-[1.85] outline-none md:min-h-[500px] md:text-[13px]"
                  spellCheck={false}
                />
                <div className="mt-3 flex justify-between border-t border-line pt-3 text-[10px] text-muted">
                  <span>본문 {form.bodyMarkdown.length}자</span>
                  <span>약 {readingMinutes(form.bodyMarkdown)}분 읽기</span>
                </div>
              </div>
            )}
            {mode !== "edit" && (
              <div
                className={`min-w-0 border border-line bg-surface p-5 ${mode === "split" ? "hidden md:block" : ""}`}
              >
                <p className="mb-5 font-mono text-[10px] text-accent">
                  PREVIEW
                </p>
                <h2 className="mb-5 font-heading text-2xl leading-relaxed">
                  {form.title || "새로운 기록의 제목"}
                </h2>
                <Markdown
                  content={
                    form.bodyMarkdown || "아직 본문을 작성하지 않았습니다."
                  }
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-between gap-3 text-[11px] text-muted">
            <span>⌘ / Ctrl S 저장 · ⌘ / Ctrl ⇧ P 미리보기</span>
            {postId && (
              <Link
                href={`/admin/posts/${postId}/preview`}
                target="_blank"
                className="inline-flex items-center gap-1"
              >
                <Eye size={14} />
                저장된 글 미리보기
              </Link>
            )}
          </div>
        </section>
        <aside className="space-y-6 border-t border-line pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6">
          <h2 className="font-heading text-[22px]">게시글 설정</h2>
          <Field
            label="URL 슬러그"
            id="post-slug"
            help={`/blog/${form.slug || "your-post"}`}
          >
            <input
              id="post-slug"
              value={form.slug}
              maxLength={100}
              disabled={saving}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", e.target.value);
              }}
              className={inputClass}
            />
          </Field>
          <Field
            label="요약"
            id="post-summary"
            help={`${form.excerpt.length} / 160`}
          >
            <textarea
              id="post-summary"
              value={form.excerpt}
              maxLength={160}
              onChange={(e) => update("excerpt", e.target.value)}
              className={`${inputClass} min-h-24 py-3`}
              disabled={saving}
            />
          </Field>
          <div className="space-y-2">
            <label htmlFor="post-tags" className="text-[13px]">
              태그
            </label>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((t) => (
                <Tag key={t}>
                  {t}
                  <button
                    aria-label={`${t} 태그 제거`}
                    className="ml-1 inline-flex min-h-6 min-w-6 items-center justify-center rounded hover:bg-line"
                    onClick={() =>
                      update(
                        "tags",
                        form.tags.filter((x) => x !== t),
                      )
                    }
                  >
                    <X size={12} />
                  </button>
                </Tag>
              ))}
            </div>
            <input
              id="post-tags"
              value={tagText}
              maxLength={32}
              onChange={(e) => setTagText(e.target.value)}
              onKeyDown={(e) => {
                if (
                  !e.nativeEvent.isComposing &&
                  (e.key === "Enter" || e.key === ",")
                ) {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="태그 입력 후 Enter"
              className={inputClass}
            />
          </div>
          <Field label="시리즈" id="post-series">
            <select
              id="post-series"
              value={form.seriesId || ""}
              onChange={(e) => update("seriesId", e.target.value || null)}
              disabled={saving}
              className={inputClass}
            >
              <option value="">시리즈 없음</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="space-y-3">
            <p className="text-[13px]">대표 이미지</p>
            {form.coverUrl && (
              <>
                <img
                  src={form.coverUrl}
                  alt={form.coverAlt}
                  className="aspect-video w-full rounded object-cover"
                />
                <Field label="대표 이미지 대체 텍스트" id="cover-alt">
                  <input
                    id="cover-alt"
                    value={form.coverAlt}
                    onChange={(e) => update("coverAlt", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setMediaOpen(true)}>
                <Image size={16} />
                {form.coverUrl ? "이미지 변경" : "이미지 선택"}
              </Button>
              {form.coverUrl && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    setForm((f) => ({ ...f, coverUrl: "", coverAlt: "" }))
                  }
                >
                  제거
                </Button>
              )}
            </div>
          </div>
          <Field label="발행 후 공개 범위" id="post-visibility">
            <select
              id="post-visibility"
              value={form.visibility}
              onChange={(e) =>
                update("visibility", e.target.value as PostInput["visibility"])
              }
              disabled={saving}
              className={inputClass}
            >
              <option value="public">전체 공개</option>
              <option value="private">비공개</option>
            </select>
          </Field>
          <p className="text-xs leading-relaxed text-muted">
            현재 상태:{" "}
            {form.status === "draft"
              ? "임시 저장. 발행 전에는 작성자에게만 보입니다."
              : form.visibility === "private"
                ? "발행됨 · 비공개"
                : "발행됨 · 전체 공개"}
          </p>
          {uploading && (
            <p role="status" className="text-xs text-warning">
              이미지 업로드 중에는 저장·발행할 수 없습니다.
            </p>
          )}
        </aside>
      </main>
      <Modal
        open={mediaOpen}
        busy={uploading}
        onClose={() => !uploading && setMediaOpen(false)}
        title="글에 이미지 추가"
        wide
      >
        <MediaPicker onSelect={imageChosen} onBusy={setUploading} />
      </Modal>
      <Modal
        open={publishOpen}
        busy={saving}
        onClose={() => !saving && setPublishOpen(false)}
        title="게시글을 발행할까요?"
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-muted">
            공개 범위와 주소를 확인해 주세요.
          </p>
          <Field label="공개 범위" id="publish-visibility">
            <select
              id="publish-visibility"
              value={form.visibility}
              onChange={(e) =>
                update("visibility", e.target.value as PostInput["visibility"])
              }
              className={inputClass}
            >
              <option value="public">전체 공개</option>
              <option value="private">비공개</option>
            </select>
          </Field>
          <p className="break-all rounded bg-soft p-3 font-mono text-xs">
            /blog/{form.slug || slugify(form.title)}
          </p>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => setPublishOpen(false)}
            >
              취소
            </Button>
            <Button loading={saving} onClick={() => void save("published")}>
              <Check size={16} />
              발행하기
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={leaveOpen}
        busy={saving}
        onClose={() => setLeaveOpen(false)}
        title="저장하지 않은 변경이 있어요."
      >
        <p className="mb-6 text-sm text-muted">
          페이지를 나가기 전에 변경 내용을 저장해 주세요.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => {
              draft.clear();
              setLeaveOpen(false);
              router.push("/admin");
            }}
          >
            저장하지 않고 나가기
          </Button>
          <Button loading={saving} onClick={() => void save(form.status, true)}>
            <Save size={16} />
            저장 후 나가기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
