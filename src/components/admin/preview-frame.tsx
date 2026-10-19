"use client";
import { useEffect, useState } from "react";
import type { HomeContent } from "@/lib/types";
import { homeSchema } from "@/lib/validation";
import { Portfolio } from "../portfolio";

// Runs inside the editor's preview iframe. Only the parent document on the
// same origin can replace the content; nothing shown here is ever saved.
export function PreviewFrame({ initial }: { initial: HomeContent }) {
  const [content, setContent] = useState(initial);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent
      )
        return;
      const data = event.data as {
        type?: string;
        content?: unknown;
        target?: string;
      };
      if (data?.type === "portfolio-preview") {
        const parsed = homeSchema.safeParse(data.content);
        if (parsed.success) setContent(parsed.data);
      } else if (data?.type === "portfolio-scroll" && data.target) {
        document
          .getElementById(data.target)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest("a");
      if (!link) return;
      event.preventDefault();
      const hash = link.getAttribute("href")?.split("#")[1];
      if (hash)
        document
          .getElementById(hash)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    window.parent.postMessage(
      { type: "portfolio-preview-ready" },
      window.location.origin,
    );
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
  return <Portfolio content={content} />;
}
