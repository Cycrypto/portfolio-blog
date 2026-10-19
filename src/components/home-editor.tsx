"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, Plus, Save, Trash2 } from "lucide-react";
import type { HomeContent, HomeDocument } from "@/lib/types";
import { defaultHome } from "@/data/portfolio";
import { portfolioAssets } from "@/data/portfolio-assets";
import { homeSchema } from "@/lib/validation";
import { isHomeDraft } from "@/lib/draft";
import { useSessionDraft } from "./use-session-draft";
import { AdminShell } from "./admin-shell";
import { Portfolio } from "./portfolio";
import { ImageField } from "./image-field";
import { Button, Field, Modal, inputClass, request, useToast } from "./ui";

type Value = string | Value[] | { [key: string]: Value };
const labels: Record<string, string> = {
  navigation: "내비게이션",
  intro: "첫 화면·프로필",
  about: "About",
  experience: "Experience",
  education: "Education",
  certifications: "Certifications",
  skills: "Skills",
  languages: "Languages",
  recommendations: "Recommendations",
  contact: "Contact",
  footer: "푸터",
  logo: "로고 이미지",
  items: "항목",
  section: "이동할 섹션",
  label: "표시 문구",
  title: "제목",
  description: "설명",
  illustration: "일러스트 이미지",
  experienceLink: "경험 보기 버튼",
  imageKeys: "버튼 이미지",
  arrow: "화살표 이미지",
  profile: "프로필 카드",
  name: "이름",
  role: "역할",
  avatar: "프로필 이미지",
  signature: "서명 이미지",
  facts: "프로필 정보",
  text: "내용",
  icon: "아이콘 이미지",
  downloadCv: "이력서 버튼",
  href: "링크",
  keySkillsLabel: "주요 역량 제목",
  keySkills: "주요 역량",
  companies: "경력·프로젝트",
  roles: "직무",
  employmentType: "근무 형태",
  period: "기간",
  highlights: "주요 성과",
  degree: "학위·과정",
  institution: "학교·기관",
  issuer: "발급 기관",
  issued: "발급일",
  technologiesLabel: "기술 도구 제목",
  technologies: "기술 도구",
  proficiency: "숙련도",
  flag: "국기 이미지",
  quote: "추천 내용",
  channels: "연락 수단",
  kind: "연락 방식",
  value: "연락처",
  networkLabel: "소셜 링크 제목",
  networks: "소셜 링크",
  copyright: "저작권 문구",
  backToTop: "맨 위로 버튼",
};
const sectionOptions = [
  "about",
  "experience",
  "education",
  "certifications",
  "skills",
  "languages",
  "recommendations",
  "contact",
];
const imageFields = new Set([
  "logo",
  "illustration",
  "avatar",
  "signature",
  "icon",
  "flag",
  "arrow",
]);
const maxItems: Record<string, number> = {
  "navigation.items": 8,
  "intro.experienceLink.imageKeys": 4,
  "intro.profile.facts": 6,
  "about.keySkills": 20,
  "experience.companies": 12,
  "experience.companies.roles": 8,
  "experience.companies.roles.highlights": 12,
  "education.items": 12,
  "certifications.items": 16,
  "skills.items": 30,
  "skills.technologies": 24,
  "languages.items": 12,
  "recommendations.items": 12,
  "contact.channels": 4,
  "contact.networks": 8,
};
const blank = (sample: Value, key = ""): Value =>
  typeof sample === "string"
    ? key === "kind"
      ? "email"
      : key === "section"
        ? "about"
        : ""
    : Array.isArray(sample)
      ? key === "roles"
        ? [blank(sample[0])]
        : []
      : Object.fromEntries(
          Object.entries(sample).map(([k, v]) => [k, blank(v, k)]),
        );
function ContentFields({
  value,
  sample,
  path,
  onChange,
  onUploading,
}: {
  value: Value;
  sample: Value;
  path: string[];
  onChange: (next: Value) => void;
  onUploading: (delta: number) => void;
}) {
  const key = path.at(-1) ?? "";
  const name = /^\d+$/.test(key)
    ? `${labels[path.at(-2) ?? ""] ?? "항목"} ${Number(key) + 1}`
    : (labels[key] ?? key);
  const id = `home-${path.join("-")}`;
  if (typeof value === "string") {
    const options =
      key === "kind"
        ? ["email", "phone"]
        : key === "section"
          ? sectionOptions
          : null;
    const isImage = imageFields.has(key) || path.includes("imageKeys");
    if (isImage)
      return (
        <ImageField
          id={id}
          label={name}
          value={value}
          onChange={onChange}
          onUploading={onUploading}
        />
      );
    return (
      <Field
        id={id}
        label={name}
        help={
          key === "href"
            ? "사이트 내부 경로 또는 https:// 주소. 비우면 링크를 비활성화합니다."
            : undefined
        }
      >
        {options ? (
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {labels[option] ?? option}
              </option>
            ))}
          </select>
        ) : ["description", "quote"].includes(key) ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className={`${inputClass} resize-y py-3 leading-relaxed`}
          />
        ) : (
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        )}
      </Field>
    );
  }
  if (Array.isArray(value)) {
    const template = (sample as Value[])[0];
    const kind = path.filter((p) => !/^\d+$/.test(p)).join(".");
    const maximum = maxItems[kind] ?? 20;
    return (
      <fieldset className="space-y-4 rounded border border-line p-4">
        <legend className="px-2 font-heading text-sm">
          {name} ({value.length}/{maximum})
        </legend>
        {value.map((item, index) => (
          <div
            key={`${id}-${index}`}
            className="space-y-4 border-b border-line pb-4 last:border-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">
                {name} {index + 1}
              </span>
              <div className="flex gap-1">
                {[-1, 1].map((direction) => (
                  <Button
                    key={direction}
                    variant="ghost"
                    disabled={
                      index + direction < 0 || index + direction >= value.length
                    }
                    aria-label={`${name} ${index + 1} ${direction < 0 ? "위로" : "아래로"} 이동`}
                    onClick={() => {
                      const next = [...value];
                      [next[index], next[index + direction]] = [
                        next[index + direction],
                        next[index],
                      ];
                      onChange(next);
                    }}
                    className="px-2"
                  >
                    {direction < 0 ? (
                      <ArrowUp size={16} />
                    ) : (
                      <ArrowDown size={16} />
                    )}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  aria-label={`${name} ${index + 1} 삭제`}
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  className="px-2 text-danger"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <ContentFields
              value={item}
              sample={template}
              path={[...path, String(index)]}
              onUploading={onUploading}
              onChange={(next) =>
                onChange(value.map((old, i) => (i === index ? next : old)))
              }
            />
          </div>
        ))}
        <Button
          variant="secondary"
          disabled={value.length >= maximum || !template}
          onClick={() => onChange([...value, blank(template)])}
        >
          <Plus size={14} />
          {name} 추가
        </Button>
      </fieldset>
    );
  }
  return (
    <div className="grid gap-5">
      {Object.entries(value).map(([k, v]) => (
        <div key={k}>
          {typeof v === "object" && !Array.isArray(v) ? (
            <details
              className="rounded border border-line p-4"
              open={key === "intro" && k === "profile"}
            >
              <summary className="cursor-pointer font-heading text-sm">
                {labels[k] ?? k}
              </summary>
              <div className="pt-5">
                <ContentFields
                  value={v}
                  sample={(sample as Record<string, Value>)[k]}
                  path={[...path, k]}
                  onUploading={onUploading}
                  onChange={(next) => onChange({ ...value, [k]: next })}
                />
              </div>
            </details>
          ) : (
            <ContentFields
              value={v}
              sample={(sample as Record<string, Value>)[k]}
              path={[...path, k]}
              onUploading={onUploading}
              onChange={(next) => onChange({ ...value, [k]: next })}
            />
          )}
        </div>
      ))}
    </div>
  );
}
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
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const onUploading = (delta: number) => setUploads((count) => count + delta);
  const inFlight = useRef(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const pending = useRef<() => void>(() => {});
  const dirty = JSON.stringify(form) !== JSON.stringify(saved.content);
  const draft = useSessionDraft(
    `portfolio:home:v2:${email}`,
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
  const leave = (action: () => void) => {
    if (busy || uploads > 0) return;
    if (!dirty) {
      action();
      return;
    }
    pending.current = action;
    setLeaveOpen(true);
  };
  const save = async (thenLeave = false) => {
    if (inFlight.current || uploads > 0) return;
    const parsed = homeSchema.safeParse(form);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(
        `${issue.path.map((p) => labels[String(p)] ?? p).join(" → ")}: ${issue.message}`,
      );
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await request<HomeDocument>("/api/admin/home", {
        method: "PUT",
        body: JSON.stringify({
          content: parsed.data,
          revision: saved.revision,
        }),
      });
      draft.clear();
      setForm(next.content);
      setSaved(next);
      toast("저장했습니다. 메인 화면에 바로 반영됩니다.");
      router.refresh();
      if (thenLeave) {
        setLeaveOpen(false);
        pending.current();
      }
    } catch (e) {
      setError((e as Error).message);
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };
  const validated = homeSchema.safeParse(form);
  return (
    <AdminShell email={email} onLeave={leave}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 font-mono text-xs text-accent">PORTFOLIO</p>
          <h1 className="font-heading text-3xl">홈 화면 편집</h1>
          <p className="mt-3 text-sm text-muted">
            내용을 편집하고 저장하면 메인 화면에 반영됩니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
          >
            <Eye size={16} />
            미리보기
          </Button>
          <Button
            onClick={() => void save()}
            loading={busy}
            disabled={!dirty || uploads > 0}
          >
            <Save size={16} />
            변경사항 저장
          </Button>
        </div>
      </div>
      <p role="status" className="mb-5 text-xs text-muted">
        {uploads > 0
          ? "이미지 업로드 중…"
          : busy
            ? "저장 중…"
            : dirty
              ? "저장하지 않은 변경사항이 있습니다."
              : `저장 완료 · 버전 ${saved.revision}`}
      </p>
      {error && (
        <p role="alert" className="mb-6 rounded bg-danger-soft p-4 text-danger">
          {error}
        </p>
      )}
      {draft.recovery && (
        <div className="mb-6 rounded border border-line p-4">
          <p className="mb-3 text-sm">
            이 탭에 저장하지 않은 수정 내용이 있습니다.
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
        <p className="mb-4 text-sm text-warning">
          브라우저 임시 저장을 사용할 수 없습니다. 페이지를 나가기 전에 저장해
          주세요.
        </p>
      )}
      {showPreview && (
        <section
          aria-label="메인 화면 미리보기"
          className="mb-8 overflow-hidden rounded border border-line"
        >
          {validated.success ? (
            <div className="pointer-events-none" inert>
              <Portfolio content={validated.data} preview />
            </div>
          ) : (
            <p className="p-6 text-sm text-muted">
              입력 오류를 수정하면 미리보기가 표시됩니다.
            </p>
          )}
        </section>
      )}
      <datalist id="portfolio-assets">
        {Object.keys(portfolioAssets).map((asset) => (
          <option key={asset} value={asset} />
        ))}
      </datalist>
      <fieldset disabled={busy || uploads > 0} className="max-w-4xl space-y-5">
        {Object.entries(form).map(([section, value]) => (
          <details
            key={section}
            open={section === "intro"}
            className="rounded-lg border border-line bg-surface p-5 md:p-7"
          >
            <summary className="cursor-pointer font-heading text-xl">
              {labels[section]}
            </summary>
            <div className="pt-6">
              <ContentFields
                value={value as Value}
                sample={defaultHome[section as keyof HomeContent] as Value}
                path={[section]}
                onUploading={onUploading}
                onChange={(next) =>
                  setForm((current) => ({ ...current, [section]: next }))
                }
              />
            </div>
          </details>
        ))}
      </fieldset>
      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/95 py-4 backdrop-blur">
        <span className="text-sm text-muted">
          {dirty
            ? "변경사항을 저장해 주세요."
            : "모든 변경사항이 저장됐습니다."}
        </span>
        <Button
          onClick={() => void save()}
          loading={busy}
          disabled={!dirty || uploads > 0}
        >
          변경사항 저장
        </Button>
      </div>
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
              pending.current();
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
  );
}
