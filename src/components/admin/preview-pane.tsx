"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import type { HomeContent } from "@/lib/types";

const widths = { desktop: 1100, mobile: 390 };
export type Device = keyof typeof widths;
// Shows the unsaved draft exactly as the public page would render it. The
// iframe keeps real viewport breakpoints; it is scaled to fit the pane.
export function PreviewPane({
  content,
  anchor,
  device,
  onDevice,
  invalid,
}: {
  content: HomeContent;
  anchor: string;
  device: Device;
  onDevice: (device: Device) => void;
  invalid: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "portfolio-preview-ready"
      )
        setReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const post = (message: object) =>
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  useEffect(() => {
    if (!ready || invalid) return;
    const timer = setTimeout(
      () => post({ type: "portfolio-preview", content }),
      150,
    );
    return () => clearTimeout(timer);
  }, [content, ready, invalid]);
  useEffect(() => {
    if (ready) post({ type: "portfolio-scroll", target: anchor });
  }, [anchor, ready]);
  const frameWidth = widths[device];
  const scale = size.width ? Math.min(1, size.width / frameWidth) : 1;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {invalid
            ? "필수 항목을 채우면 미리보기가 다시 갱신됩니다."
            : "저장 전 모습입니다. 입력하면 바로 반영됩니다."}
        </p>
        <div
          role="group"
          aria-label="미리보기 크기"
          className="flex rounded border border-line"
        >
          {(
            [
              ["desktop", Monitor, "데스크톱"],
              ["mobile", Smartphone, "모바일"],
            ] as const
          ).map(([key, Icon, name]) => (
            <button
              key={key}
              type="button"
              aria-label={name}
              aria-pressed={device === key}
              onClick={() => onDevice(key)}
              className={`flex size-9 items-center justify-center ${device === key ? "bg-ink text-paper" : "text-muted hover:bg-soft"}`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>
      <div
        ref={box}
        className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-line bg-surface"
      >
        {size.width > 0 && (
          <div
            className="mx-auto"
            style={{ width: Math.min(size.width, frameWidth) }}
          >
            <iframe
              ref={frame}
              src="/admin/preview"
              title="메인 화면 미리보기"
              style={{
                width: frameWidth,
                height: size.height / scale,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
              className="block border-0 bg-paper"
            />
          </div>
        )}
        {!ready && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            미리보기를 불러오는 중…
          </p>
        )}
      </div>
    </div>
  );
}
