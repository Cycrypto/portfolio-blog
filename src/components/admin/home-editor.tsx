"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  RotateCcw,
  Save,
} from "lucide-react";
import type { HomeContent, HomeDocument } from "@/lib/types";
import { homeSchema } from "@/lib/validation";
import { isHomeDraft } from "@/lib/draft";
import { useSessionDraft } from "../use-session-draft";
import { AdminShell } from "../admin-shell";
import { Button, Modal, request, useToast } from "../ui";
import { EditorContext, fieldId } from "./editor-context";
import { adminSections, type Mutate } from "./section-forms";
import { PreviewPane, type Device } from "./preview-pane";

const read = (value: unknown, path: string) =>
  path
    .split(".")
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown>)?.[key],
      value,
    );
const sameAt = (a: HomeContent, b: HomeContent, paths: string[]) =>
  paths.every((p) => JSON.stringify(read(a, p)) === JSON.stringify(read(b, p)));
const owns = (paths: string[], key: string) =>
  paths.some((p) => key === p || key.startsWith(`${p}.`));
export function HomeEditor({
  initial,
  email,
}: {
  initial: HomeDocument;
  email: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(initial.content);
  const [saved, setSaved] = useState(initial);
  const [active, setActive] = useState(adminSections[0].id);
  const [device, setDevice] = useState<Device>("desktop");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [failure, setFailure] = useState("");
  const inFlight = useRef(false);
  const pendingLeave = useRef<() => void>(() => {});
  const pendingFocus = useRef<string | null>(null);
  const onUploading = useCallback(
    (delta: number) => setUploads((count) => count + delta),
    [],
  );
  const update: Mutate = useCallback(
    (mutate) =>
      setForm((current) => {
        const draft = structuredClone(current);
        mutate(draft);
        return draft;
      }),
    [],
  );
  const dirty = JSON.stringify(form) !== JSON.stringify(saved.content);
  const validation = useMemo(() => homeSchema.safeParse(form), [form]);
  const errors = useMemo(() => {
    const map: Record<string, string> = {};
    if (!validation.success)
      for (const issue of validation.error.issues) {
        const key = issue.path.join(".");
        map[key] ??= issue.message;
      }
    return map;
  }, [validation]);
  const shownErrors = attempted ? errors : {};
  const sections = adminSections.map((section) => ({
    ...section,
    changed: !sameAt(form, saved.content, section.paths),
    errorCount: Object.keys(shownErrors).filter((key) =>
      owns(section.paths, key),
    ).length,
  }));
  const index = sections.findIndex((s) => s.id === active);
  const section = sections[index];
  const changedCount = sections.filter((s) => s.changed).length;
  const errorCount = Object.keys(shownErrors).length;
  const draft = useSessionDraft(
    `portfolio:home:v3:${email}`,
    form,
    dirty,
    isHomeDraft,
  );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || uploads > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, uploads]);
  useEffect(() => {
    const path = pendingFocus.current;
    if (!path) return;
    pendingFocus.current = null;
    const target =
      document.getElementById(fieldId(path)) ??
      document.getElementById(`${fieldId(path)}-file`)?.parentElement;
    target?.scrollIntoView({ block: "center" });
    (target as HTMLElement | null)?.focus?.({ preventScroll: true });
  });
  const goToError = (map: Record<string, string>) => {
    const first = Object.keys(map)[0];
    if (!first) return;
    const owner = adminSections.find((s) => owns(s.paths, first));
    if (owner) setActive(owner.id);
    pendingFocus.current = first;
  };
  const leave = (action: () => void) => {
    if (busy || uploads > 0) return;
    if (!dirty) {
      action();
      return;
    }
    pendingLeave.current = action;
    setLeaveOpen(true);
  };
  const save = async (thenLeave = false) => {
    if (inFlight.current || uploads > 0 || !dirty) return;
    if (!validation.success) {
      setAttempted(true);
      goToError(errors);
      toast(
        `입력 오류 ${Object.keys(errors).length}개를 고친 뒤 저장할 수 있습니다.`,
        true,
      );
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure("");
    try {
      const next = await request<HomeDocument>("/api/admin/home", {
        method: "PUT",
        body: JSON.stringify({
          content: validation.data,
          revision: saved.revision,
        }),
      });
      draft.clear();
      setForm(next.content);
      setSaved(next);
      setAttempted(false);
      toast("저장했습니다. 메인 화면에 바로 반영됩니다.");
      router.refresh();
      if (thenLeave) {
        setLeaveOpen(false);
        pendingLeave.current();
      }
    } catch (e) {
      setFailure((e as Error).message);
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const savedAt = new Date(saved.updatedAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const status =
    uploads > 0
      ? "이미지 업로드 중…"
      : busy
        ? "저장 중…"
        : dirty
          ? `변경된 영역 ${changedCount}개 · 저장되지 않음`
          : `모두 저장됨 · ${savedAt}`;
  const nav = (
    <nav aria-label="편집 영역">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:flex-col md:overflow-visible">
        {sections.map((s) => (
          <li key={s.id} className="shrink-0">
            <button
              type="button"
              onClick={() => setActive(s.id)}
              aria-current={s.id === active ? "page" : undefined}
              className={`flex min-h-11 w-full items-center gap-3 rounded px-3 text-left text-sm transition-colors ${s.id === active ? "bg-surface text-accent shadow-sm" : "text-ink hover:bg-surface/70"}`}
            >
              <s.icon size={16} className="shrink-0" />
              <span className="flex-1 whitespace-nowrap">{s.title}</span>
              {s.errorCount > 0 ? (
                <span
                  role="img"
                  aria-label={`오류 ${s.errorCount}개`}
                  className="flex size-5 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-paper"
                >
                  {s.errorCount}
                </span>
              ) : s.changed ? (
                <span
                  role="img"
                  aria-label="저장되지 않은 변경"
                  className="size-2 rounded-full bg-coral"
                />
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
  const preview = (
    <PreviewPane
      content={validation.success ? validation.data : saved.content}
      anchor={section.anchor}
      device={device}
      onDevice={setDevice}
      invalid={!validation.success}
    />
  );
  return (
    <EditorContext.Provider value={{ errors: shownErrors, onUploading }}>
      <AdminShell email={email} onLeave={leave} nav={nav}>
        <div className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2 md:px-8">
            <div className="min-w-0">
              <h1 className="font-heading text-lg leading-tight">
                {section.title}
              </h1>
              <p className="hidden truncate text-xs text-muted sm:block">
                {section.hint}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                role="status"
                suppressHydrationWarning
                className={`hidden text-xs md:inline ${dirty ? "text-accent" : "text-muted"}`}
              >
                {status}
              </span>
              {dirty && (
                <span className="hidden md:block">
                  <Button
                    variant="ghost"
                    disabled={busy || uploads > 0}
                    onClick={() => setDiscardOpen(true)}
                    className="min-h-9 px-3 text-xs"
                  >
                    <RotateCcw size={14} />
                    되돌리기
                  </Button>
                </span>
              )}
              <Button
                variant="secondary"
                onClick={() => setPreviewOpen(true)}
                aria-label="미리보기"
                className="min-h-9 px-3 text-xs xl:hidden"
              >
                <Eye size={14} />
                <span className="hidden sm:inline">미리보기</span>
              </Button>
              <Button
                onClick={() => void save()}
                loading={busy}
                disabled={!dirty || uploads > 0}
                title="⌘S / Ctrl+S"
                className="min-h-9 px-4 text-xs"
              >
                <Save size={14} />
                저장
              </Button>
            </div>
          </div>
          <div
            aria-hidden
            className="flex items-center justify-between gap-3 border-t border-line px-4 py-1.5 text-xs md:hidden"
          >
            <span
              suppressHydrationWarning
              className={dirty ? "text-accent" : "text-muted"}
            >
              {status}
            </span>
            {dirty && (
              <button
                type="button"
                tabIndex={-1}
                disabled={busy || uploads > 0}
                onClick={() => setDiscardOpen(true)}
                className="shrink-0 text-muted underline-offset-2 hover:underline"
              >
                되돌리기
              </button>
            )}
          </div>
        </div>
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="px-5 py-6 md:px-8 md:py-8">
            <div className="mx-auto max-w-3xl space-y-5">
              {errorCount > 0 && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded bg-danger-soft p-4 text-sm text-danger"
                >
                  <span className="flex items-center gap-2">
                    <CircleAlert size={16} />
                    입력 오류 {errorCount}개가 있어 저장할 수 없습니다.
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => goToError(shownErrors)}
                    className="min-h-9 px-3 text-xs"
                  >
                    첫 오류로 이동
                  </Button>
                </div>
              )}
              {failure && (
                <p
                  role="alert"
                  className="rounded bg-danger-soft p-4 text-sm text-danger"
                >
                  {failure}
                </p>
              )}
              {draft.recovery && (
                <div className="rounded border border-line bg-surface p-4">
                  <p className="mb-3 text-sm">
                    이 탭에 저장하지 않은 수정 내용이 남아 있습니다.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setForm(draft.recovery!);
                        draft.clear();
                      }}
                    >
                      수정 내용 복구
                    </Button>
                    <Button variant="ghost" onClick={draft.clear}>
                      버리기
                    </Button>
                  </div>
                </div>
              )}
              {draft.unavailable && (
                <p className="text-sm text-warning">
                  브라우저 임시 저장을 사용할 수 없습니다. 페이지를 나가기 전에
                  저장해 주세요.
                </p>
              )}
              <fieldset
                key={section.id}
                disabled={busy}
                className="grid gap-5"
                aria-label={`${section.title} 편집`}
              >
                <section.Form value={form} update={update} />
              </fieldset>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
                {index > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setActive(sections[index - 1].id)}
                  >
                    <ChevronLeft size={16} />
                    {sections[index - 1].title}
                  </Button>
                ) : (
                  <span />
                )}
                {index < sections.length - 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => setActive(sections[index + 1].id)}
                  >
                    {sections[index + 1].title}
                    <ChevronRight size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <aside
            aria-label="실시간 미리보기"
            className="hidden border-l border-line bg-soft/50 p-5 xl:sticky xl:top-16 xl:block xl:h-[calc(100vh-64px)] xl:self-start"
          >
            {preview}
          </aside>
        </div>
        <Modal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title="메인 화면 미리보기"
          wide
        >
          <div className="h-[70dvh]">{previewOpen && preview}</div>
        </Modal>
        <Modal
          open={discardOpen}
          onClose={() => setDiscardOpen(false)}
          title="변경사항을 되돌릴까요?"
        >
          <p className="mb-6 text-sm text-muted">
            변경된 영역 {changedCount}개의 수정 내용이 마지막으로 저장한 상태로
            돌아갑니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              onClick={() => {
                setForm(saved.content);
                setAttempted(false);
                draft.clear();
                setDiscardOpen(false);
                toast("마지막 저장 상태로 되돌렸습니다.");
              }}
            >
              되돌리기
            </Button>
            <Button variant="ghost" onClick={() => setDiscardOpen(false)}>
              계속 편집
            </Button>
          </div>
        </Modal>
        <Modal
          open={leaveOpen}
          onClose={() => setLeaveOpen(false)}
          title="변경사항을 저장할까요?"
        >
          <p className="mb-6 text-sm text-muted">
            저장하지 않고 나가면 수정 내용이 메인 화면에 반영되지 않습니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void save(true)} loading={busy}>
              저장 후 이동
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                draft.clear();
                setLeaveOpen(false);
                pendingLeave.current();
              }}
            >
              저장하지 않고 이동
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setLeaveOpen(false)}
            >
              계속 편집
            </Button>
          </div>
        </Modal>
      </AdminShell>
    </EditorContext.Provider>
  );
}
