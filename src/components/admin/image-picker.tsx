"use client";
import { useId, useRef, useState } from "react";
import { ImageOff, Images, Trash2, Upload } from "lucide-react";
import {
  portfolioAssets,
  type PortfolioAssetKey,
} from "@/data/portfolio-assets";
import { safeHref } from "@/lib/validation";
import { Button, Modal, inputClass } from "../ui";
import { fieldId, useEditor, useFieldError } from "./editor-context";

export const assetSource = (value: string) =>
  portfolioAssets[value as PortfolioAssetKey]?.[0] ??
  (value && safeHref(value) ? value : "");
const assetGroups: { prefix: string; title: string }[] = [
  { prefix: "illustration", title: "일러스트" },
  { prefix: "avatar", title: "프로필" },
  { prefix: "signature", title: "서명" },
  { prefix: "heroMark", title: "첫 화면 버튼" },
  { prefix: "certification", title: "자격증 로고" },
  { prefix: "tech", title: "기술 도구" },
  { prefix: "flag", title: "국기" },
  { prefix: "icon", title: "아이콘" },
];
const shapes = {
  square: "size-20 rounded",
  circle: "size-20 rounded-full",
  wide: "h-20 w-36 rounded",
  icon: "size-12 rounded",
};
export function ImagePicker({
  path,
  label,
  value,
  onChange,
  hint,
  shape = "square",
  suggest,
}: {
  path: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  shape?: keyof typeof shapes;
  suggest?: string;
}) {
  const id = fieldId(path);
  const error = useFieldError(path);
  const { onUploading } = useEditor();
  const fileInput = useRef<HTMLInputElement>(null);
  const describedBy = useId();
  const [uploading, setUploading] = useState(false);
  const [failure, setFailure] = useState("");
  const [over, setOver] = useState(false);
  const [picker, setPicker] = useState(false);
  const [manual, setManual] = useState(false);
  const source = assetSource(value);
  const upload = async (file: File) => {
    setFailure("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setFailure("PNG, JPG, WebP 이미지만 올릴 수 있습니다.");
      return;
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      setFailure("이미지는 10MB 이하여야 합니다.");
      return;
    }
    setUploading(true);
    onUploading(1);
    try {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/admin/images", {
        method: "POST",
        body: data,
      });
      if (!response.headers.get("content-type")?.includes("application/json"))
        throw new Error("로그인이 만료됐습니다. 다시 로그인한 뒤 올려 주세요.");
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "이미지를 올리지 못했습니다.");
      onChange(result.url);
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setUploading(false);
      onUploading(-1);
    }
  };
  const message = failure || error;
  const groups = assetGroups
    .map((group) => ({
      ...group,
      keys: (Object.keys(portfolioAssets) as PortfolioAssetKey[]).filter((k) =>
        k.startsWith(group.prefix),
      ),
    }))
    .sort((a, b) => (a.prefix === suggest ? -1 : b.prefix === suggest ? 1 : 0));
  return (
    <div className="@container space-y-2">
      <p className="text-[13px] font-medium" id={`${id}-label`}>
        {label}
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        className={`flex flex-col gap-3 rounded border p-3 @sm:flex-row @sm:items-center @sm:gap-4 ${over ? "border-accent bg-accent-soft/40" : message ? "border-danger" : "border-line"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
      >
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label={`${label} 파일 선택`}
          disabled={uploading}
          className={`flex shrink-0 items-center justify-center overflow-hidden bg-ink/5 ring-line hover:ring-2 ${shapes[shape]}`}
        >
          {uploading ? (
            <span className="text-xs text-muted">올리는 중…</span>
          ) : source ? (
            <img
              id={`${id}-preview`}
              src={source}
              alt=""
              className="size-full object-contain"
            />
          ) : (
            <ImageOff size={20} className="text-muted" />
          )}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="min-h-9 px-3 text-xs"
            >
              <Upload size={14} />
              {source ? "바꾸기" : "업로드"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPicker(true)}
              disabled={uploading}
              className="min-h-9 px-3 text-xs"
            >
              <Images size={14} />
              기본 이미지
            </Button>
            {source && (
              <Button
                variant="ghost"
                onClick={() => {
                  onChange("");
                  setFailure("");
                }}
                disabled={uploading}
                className="min-h-9 px-3 text-xs text-danger"
              >
                <Trash2 size={14} />
                제거
              </Button>
            )}
          </div>
          <p id={describedBy} className="text-xs text-muted">
            {hint ?? "PNG, JPG, WebP · 10MB 이하. 끌어다 놓아도 됩니다."}
          </p>
          <button
            type="button"
            onClick={() => setManual((v) => !v)}
            aria-expanded={manual}
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            {manual ? "주소 입력 닫기" : "주소로 직접 입력"}
          </button>
          {manual && (
            <input
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https:// 주소 또는 기본 이미지 이름"
              aria-label={`${label} 주소`}
              className={`${inputClass} min-h-9 text-xs`}
            />
          )}
        </div>
        <input
          ref={fileInput}
          id={`${id}-file`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label={`${label} 파일 업로드`}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
      </div>
      {message && (
        <p role="alert" className="text-xs text-danger">
          {message}
        </p>
      )}
      <Modal
        open={picker}
        onClose={() => setPicker(false)}
        title={`${label}: 기본 이미지 선택`}
        wide
      >
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.prefix}>
              <p className="mb-3 text-xs font-medium text-muted">
                {group.title}
                {group.prefix === suggest && " · 추천"}
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {group.keys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    title={key}
                    aria-pressed={value === key}
                    onClick={() => {
                      onChange(key);
                      setFailure("");
                      setPicker(false);
                    }}
                    className={`flex aspect-square items-center justify-center rounded border p-2 hover:bg-soft ${value === key ? "border-accent ring-2 ring-accent/30" : "border-line"}`}
                  >
                    <img
                      src={portfolioAssets[key][0]}
                      alt={key}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
