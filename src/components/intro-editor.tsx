"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RotateCcw, Save } from "lucide-react";
import type { Intro } from "@/lib/types";
import { defaultIntro } from "@/data/portfolio";
import { AdminShell } from "./admin-shell";
import { IntroHero } from "./intro-hero";
import { Button, Field, Modal, inputClass, request, useToast } from "./ui";

const limits = { eyebrow: 60, name: 40, headline: 160, description: 400 };

export function IntroEditor({ initial }: { initial: Intro }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [snapshot, setSnapshot] = useState(JSON.stringify(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const inFlight = useRef(false);
  const pendingLeave = useRef<() => void>(() => router.push("/admin"));
  const dirty = JSON.stringify(form) !== snapshot;
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
  const requestLeave = (action: () => void) => {
    if (busy) return;
    if (!dirty) {
      action();
      return;
    }
    pendingLeave.current = action;
    setLeaveOpen(true);
  };
  const update = (key: keyof Intro, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const save = async (leave = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const saved = await request<Intro>("/api/intro", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setForm(saved);
      setSnapshot(JSON.stringify(saved));
      toast("소개를 저장했어요. 홈 화면에 바로 반영됩니다.");
      router.refresh();
      if (leave) {
        setLeaveOpen(false);
        pendingLeave.current();
      }
    } catch (e) {
      setError((e as Error).message);
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };
  const valid = form.name.trim() && form.headline.trim();
  const counter = (key: keyof typeof limits) =>
    `${form[key].length} / ${limits[key]}`;
  return (
    <AdminShell onLeave={requestLeave}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 font-mono text-[10px] text-accent">PORTFOLIO</p>
          <h1 className="font-heading text-[32px]">소개 편집</h1>
          <p className="mt-3 text-sm text-muted">
            홈 첫 화면의 이름, 헤드라인, 소개 문장을 수정합니다. 프로젝트와
            연락처는 코드에서 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded px-3 text-sm text-muted hover:bg-soft"
          >
            <ExternalLink size={16} />홈 보기
          </a>
          <Button
            loading={busy}
            disabled={!valid || !dirty}
            onClick={() => void save()}
          >
            <Save size={16} />
            소개 저장
          </Button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="mb-6 text-xs text-muted">
        {busy
          ? "저장 중…"
          : dirty
            ? "저장하지 않은 변경이 있어요."
            : "모든 변경 사항 저장됨"}
      </p>
      {error && (
        <p role="alert" className="mb-6 bg-danger-soft p-4 text-sm text-danger">
          {error} 작성한 내용은 유지됩니다.
        </p>
      )}
      <fieldset
        disabled={busy}
        className="grid min-w-0 gap-10 xl:grid-cols-[400px_minmax(0,1fr)]"
      >
        <section className="min-w-0 space-y-6">
          <Field id="intro-eyebrow" label="상단 라벨" help={counter("eyebrow")}>
            <input
              id="intro-eyebrow"
              className={inputClass}
              value={form.eyebrow}
              maxLength={limits.eyebrow}
              placeholder="예: BACKEND · INFRA · PRODUCT ENGINEER"
              onChange={(e) => update("eyebrow", e.target.value)}
            />
          </Field>
          <Field id="intro-name" label="이름" help={counter("name")}>
            <input
              id="intro-name"
              className={inputClass}
              value={form.name}
              maxLength={limits.name}
              required
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>
          <Field
            id="intro-headline"
            label="헤드라인"
            help={`줄바꿈은 그대로 표시됩니다. ${counter("headline")}`}
          >
            <textarea
              id="intro-headline"
              className={`${inputClass} min-h-28 resize-y py-3 leading-relaxed`}
              value={form.headline}
              maxLength={limits.headline}
              required
              onChange={(e) => update("headline", e.target.value)}
            />
          </Field>
          <Field
            id="intro-description"
            label="소개 문장"
            help={counter("description")}
          >
            <textarea
              id="intro-description"
              className={`${inputClass} min-h-40 resize-y py-3 leading-relaxed`}
              value={form.description}
              maxLength={limits.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <Button
            variant="ghost"
            className="text-xs text-muted"
            onClick={() => setForm(defaultIntro)}
          >
            <RotateCcw size={14} />
            기본 문구로 되돌리기
          </Button>
        </section>
        <section
          aria-label="미리보기"
          className="min-w-0 rounded-lg border border-line bg-paper px-6 py-8 md:px-10"
        >
          <p className="mb-6 font-mono text-[10px] tracking-widest text-muted">
            PREVIEW
          </p>
          <IntroHero intro={form} preview />
        </section>
      </fieldset>
      <Modal
        open={leaveOpen}
        busy={busy}
        onClose={() => setLeaveOpen(false)}
        title="저장하지 않은 변경이 있어요."
      >
        <p className="mb-6 text-sm text-muted">
          소개 문구를 저장하고 나갈 수 있습니다.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setLeaveOpen(false);
              pendingLeave.current();
            }}
          >
            저장하지 않고 나가기
          </Button>
          <Button
            loading={busy}
            disabled={!valid}
            onClick={() => void save(true)}
          >
            저장 후 나가기
          </Button>
        </div>
      </Modal>
    </AdminShell>
  );
}
