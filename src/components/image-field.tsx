"use client";
import { useState } from "react";
import {
  portfolioAssets,
  type PortfolioAssetKey,
} from "@/data/portfolio-assets";
import { safeHref } from "@/lib/validation";
import { Field, inputClass } from "./ui";

export function ImageField({
  id,
  label,
  value,
  onChange,
  onUploading,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUploading: (delta: number) => void;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const source =
    portfolioAssets[value as PortfolioAssetKey]?.[0] ??
    (safeHref(value) ? value : "");
  const upload = async (file: File) => {
    setMessage("");
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("PNG, JPG, WebP 이미지를 선택해 주세요.");
      return;
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      setError("이미지는 0바이트보다 크고 10MB 이하여야 합니다.");
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
        throw new Error("관리자 로그인을 확인한 뒤 다시 올려 주세요.");
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "이미지 업로드에 실패했습니다.");
      onChange(result.url);
      setMessage("업로드 완료. 변경사항을 저장하면 메인 화면에 반영됩니다.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      onUploading(-1);
    }
  };
  return (
    <div className="space-y-3 rounded border border-line p-3">
      {source && (
        <img
          src={source}
          alt={`${label} 미리보기`}
          className="max-h-32 max-w-full rounded bg-ink/5 object-contain"
        />
      )}
      <Field
        id={id}
        label={label}
        help="이미지 주소 또는 기존 에셋 이름. 비우면 숨깁니다."
      >
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          list="portfolio-assets"
          className={inputClass}
        />
      </Field>
      <Field
        id={`${id}-file`}
        label={`${label} 파일 업로드`}
        help="PNG, JPG, WebP · 10MB 이하. 업로드 후 변경사항을 저장해 주세요."
      >
        <input
          id={`${id}-file`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={uploading}
          className={`${inputClass} py-2 text-sm`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
      </Field>
      <p role="status" className="text-xs text-muted">
        {uploading ? "이미지를 업로드하고 있습니다…" : message}
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
