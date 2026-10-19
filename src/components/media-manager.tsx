"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import type { Media } from "@/lib/types";
import {
  Button,
  EmptyState,
  Field,
  Modal,
  inputClass,
  request,
  useToast,
} from "./ui";
import { AdminShell } from "./admin-shell";
export type MediaAsset = Media & { url: string };
export function MediaUpload({
  onComplete,
  onBusy,
}: {
  onComplete: (asset: MediaAsset) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const choose = (selected: File | null) => {
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setError("10 MB 이하의 이미지를 선택해 주세요.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setFile(null);
      setError("JPG, PNG, WebP 이미지를 선택해 주세요.");
      return;
    }
    setFile(selected);
    setError("");
  };
  const upload = async () => {
    if (!file || !alt.trim()) {
      setError("이미지와 대체 텍스트를 입력해 주세요.");
      return;
    }
    setBusy(true);
    onBusy?.(true);
    setError("");
    const data = new FormData();
    data.set("file", file);
    data.set("alt", alt.trim());
    data.set("caption", caption.trim());
    try {
      onComplete(
        await request<MediaAsset>("/api/media", { method: "POST", body: data }),
      );
      setFile(null);
      setAlt("");
      setCaption("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  };
  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy) choose(e.dataTransfer.files[0] ?? null);
        }}
        className="flex flex-col items-center gap-3 rounded border border-dashed border-line bg-paper p-6 text-center"
      >
        {preview ? (
          <img
            src={preview}
            alt="선택한 이미지 미리보기"
            className="max-h-44 max-w-full rounded object-contain"
          />
        ) : (
          <ImagePlus size={28} className="text-coral" />
        )}
        <p className="text-sm">{file?.name || "이미지를 여기에 놓아주세요."}</p>
        <p className="text-xs text-muted">JPG, PNG, WebP · 최대 10 MB</p>
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            choose(e.target.files?.[0] ?? null);
            e.currentTarget.value = "";
          }}
        />
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => ref.current?.click()}
        >
          <Upload size={16} />
          파일 선택
        </Button>
      </div>
      <Field
        label="대체 텍스트 · 필수"
        id="media-alt"
        help="사진을 보지 못해도 내용을 이해할 수 있게 작성합니다."
      >
        <input
          id="media-alt"
          maxLength={300}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          className={inputClass}
          disabled={busy}
        />
      </Field>
      <Field label="캡션 · 선택" id="media-caption">
        <input
          id="media-caption"
          maxLength={500}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={inputClass}
          disabled={busy}
        />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button onClick={upload} loading={busy} disabled={!file || !alt.trim()}>
        <Upload size={16} />
        이미지 업로드
      </Button>
      {busy && (
        <p role="status" className="text-xs text-muted">
          업로드하고 이미지를 최적화하는 중입니다.
        </p>
      )}
    </div>
  );
}
export function MediaPicker({
  onSelect,
  onBusy,
}: {
  onSelect: (asset: MediaAsset, mode: "body" | "cover") => void;
  onBusy: (busy: boolean) => void;
}) {
  const [assets, setAssets] = useState<Media[]>([]);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [tab, setTab] = useState("upload");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const toast = useToast();
  const loadAssets = () => {
    setLoading(true);
    setLoadError("");
    request<Media[]>("/api/media")
      .then(setAssets)
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadAssets, []);
  return (
    <div className="space-y-6">
      <div className="flex gap-6 border-b border-line">
        {[
          ["upload", "새 이미지"],
          ["library", "이미지 보관함"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            disabled={busy}
            onClick={() => setTab(key)}
            className={`min-h-11 border-b-2 text-sm ${key === tab ? "border-accent text-accent" : "border-transparent text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="space-y-5">
          <img
            src={selected.url}
            alt={selected.alt}
            className="mx-auto max-h-64 rounded object-contain"
          />
          <p className="text-sm text-muted">{selected.alt}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onSelect(selected, "body")}>
              <Plus size={16} />
              본문에 삽입
            </Button>
            <Button
              variant="secondary"
              onClick={() => onSelect(selected, "cover")}
            >
              대표 이미지로
            </Button>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              다른 이미지
            </Button>
          </div>
        </div>
      ) : tab === "upload" ? (
        <MediaUpload
          onBusy={(value) => {
            setBusy(value);
            onBusy(value);
          }}
          onComplete={(asset) => {
            setSelected(asset);
            setAssets([asset, ...assets]);
            toast("이미지를 업로드했어요.");
          }}
        />
      ) : loading ? (
        <p role="status" className="py-8 text-center text-sm text-muted">
          이미지를 불러오는 중입니다.
        </p>
      ) : loadError ? (
        <div className="space-y-4 rounded border border-line p-5">
          <p role="alert" className="text-sm text-danger">
            {loadError}
          </p>
          <Button variant="secondary" onClick={loadAssets}>
            다시 불러오기
          </Button>
        </div>
      ) : assets.length ? (
        <div className="grid max-h-96 grid-cols-2 gap-4 overflow-y-auto">
          {assets.map((asset) => (
            <button
              key={asset.id}
              onClick={() =>
                setSelected({ ...asset, url: `/api/media/${asset.id}` })
              }
              className="space-y-2 rounded border border-line p-2 text-left hover:border-accent"
            >
              <img
                src={`/api/media/${asset.id}`}
                alt={asset.alt}
                className="aspect-video w-full rounded object-cover"
              />
              <p className="truncate text-xs text-muted">{asset.alt}</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted">
          아직 업로드한 이미지가 없습니다.
        </p>
      )}
    </div>
  );
}
export function MediaManager({ initialMedia }: { initialMedia: Media[] }) {
  const [assets, setAssets] = useState(initialMedia);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Media | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const toast = useToast();
  return (
    <AdminShell>
      <header className="mb-10 flex flex-wrap justify-between gap-5">
        <div>
          <h1 className="mb-3 font-heading text-3xl">이미지 보관함</h1>
          <p className="text-sm text-muted">
            본문과 대표 이미지에 사용할 사진을 관리합니다.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          이미지 업로드
        </Button>
      </header>
      {assets.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((a) => (
            <article
              key={a.id}
              className="overflow-hidden rounded border border-line bg-surface"
            >
              <img
                src={`/api/media/${a.id}`}
                alt={a.alt}
                className="aspect-video w-full bg-soft object-cover"
              />
              <div className="p-4">
                <p className="mb-2 text-sm">{a.alt}</p>
                <p className="mb-4 text-xs text-muted">
                  {a.width} × {a.height} · {Math.ceil(a.byteSize / 1024)} KB
                </p>
                {a.caption && (
                  <p className="mb-4 text-xs text-muted">{a.caption}</p>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDeleteError("");
                    setDeleting(a);
                  }}
                  className="text-danger"
                >
                  <Trash2 size={16} />
                  삭제
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="사진을 담아보세요."
          description="업로드한 이미지는 게시글 작성 화면에서도 선택할 수 있습니다."
        >
          <Button onClick={() => setOpen(true)}>이미지 업로드</Button>
        </EmptyState>
      )}
      <Modal
        open={open}
        busy={busy}
        onClose={() => !busy && setOpen(false)}
        title="이미지 업로드"
      >
        <MediaUpload
          onBusy={setBusy}
          onComplete={(a) => {
            setAssets([a, ...assets]);
            setOpen(false);
            toast("이미지를 업로드했어요.");
          }}
        />
      </Modal>
      <Modal
        open={!!deleting}
        busy={busy}
        onClose={() => !busy && setDeleting(null)}
        title="이미지를 삭제할까요?"
      >
        <p className="mb-6 text-sm text-muted">
          사용 중인 이미지는 삭제할 수 없습니다. 글에서 제거한 뒤 다시 시도해
          주세요.
        </p>
        {deleteError && (
          <p
            role="alert"
            className="mb-5 rounded bg-danger-soft p-3 text-sm text-danger"
          >
            {deleteError}
          </p>
        )}
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
              setDeleteError("");
              try {
                await request(`/api/media/${deleting.id}`, {
                  method: "DELETE",
                });
                setAssets(assets.filter((a) => a.id !== deleting.id));
                setDeleting(null);
                toast("이미지를 삭제했어요.");
              } catch (e) {
                setDeleteError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            삭제하기
          </Button>
        </div>
      </Modal>
    </AdminShell>
  );
}
