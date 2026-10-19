"use client";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, ChevronDown, Copy, ImageOff, Maximize2 } from "lucide-react";
import { headingsFromMarkdown, headingSlug } from "@/lib/format";
import { Button, Modal, useToast } from "./ui";

function textContent(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textContent(child.props.children)
          : "",
    )
    .join("");
}
export function ImageFigure({
  src,
  alt,
  caption,
  cover = false,
}: {
  src: string;
  alt: string;
  caption?: string;
  cover?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => setFailed(false), [src]);
  if (!src) return null;
  if (failed)
    return (
      <figure className="rounded bg-soft p-5">
        <div className="flex items-center gap-3">
          <ImageOff className="shrink-0 text-muted" size={24} />
          <div>
            <p className="text-sm">이미지를 불러오지 못했어요.</p>
            <p className="mt-1 text-xs text-muted">{alt}</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setFailed(false);
              setRetry(retry + 1);
            }}
          >
            다시 시도
          </Button>
        </div>
      </figure>
    );
  return (
    <>
      <figure className="my-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${alt} 확대 보기`}
          className={`group relative block w-full overflow-hidden rounded ${cover ? "bg-soft" : ""}`}
        >
          <img
            key={`${src}-${retry}`}
            src={src}
            alt={alt}
            loading={cover ? "eager" : "lazy"}
            onError={() => setFailed(true)}
            className={`block w-full ${cover ? "aspect-video object-cover" : "h-auto object-contain"}`}
          />
          <span className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded bg-paper/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Maximize2 size={16} />
          </span>
        </button>
        {caption && (
          <figcaption className="mt-2.5 text-center text-xs leading-relaxed text-muted">
            {caption}
          </figcaption>
        )}
      </figure>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="이미지 확대 보기"
        wide
      >
        <img
          src={src}
          alt={alt}
          className="mx-auto max-h-[65dvh] max-w-full object-contain"
        />
        {caption && (
          <p className="mt-4 text-center text-sm text-muted">{caption}</p>
        )}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block text-center text-xs text-accent underline"
        >
          원본 보기 ↗
        </a>
      </Modal>
    </>
  );
}
function CodePanel({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const code = Children.toArray(children).find((child) =>
    isValidElement(child),
  );
  const cls = isValidElement<{ className?: string }>(code)
    ? (code.props.className ?? "")
    : "";
  const language = cls.match(/language-([\w+-]+)/)?.[1] ?? "text";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textContent(children));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("코드를 복사하지 못했어요.", true);
    }
  };
  return (
    <div className="overflow-hidden rounded bg-code text-code-text">
      <div className="flex min-h-[42px] items-center justify-between border-b border-white/15 px-4 font-mono text-[11px]">
        <span>{language}</span>
        <button
          onClick={copy}
          type="button"
          className="flex min-h-11 items-center gap-1.5"
          aria-label="코드 복사"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "복사됨" : "복사"}</span>
        </button>
      </div>
      <pre
        tabIndex={0}
        aria-label={`${language} 코드. 가로로 스크롤할 수 있습니다.`}
      >
        {children}
      </pre>
    </div>
  );
}
export function Markdown({ content }: { content: string }) {
  const headings = headingsFromMarkdown(content);
  const Heading = ({
    level,
    line,
    children,
  }: {
    level: number;
    line?: number;
    children: ReactNode;
  }) => {
    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    const id =
      headings.find((h) => h.line === line)?.id ??
      headingSlug(textContent(children));
    return <Tag id={id}>{children}</Tag>;
  };
  return (
    <div className="prose min-w-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        skipHtml
        components={{
          h1: ({ children, node }) => (
            <Heading level={1} line={node?.position?.start.line}>
              {children}
            </Heading>
          ),
          h2: ({ children, node }) => (
            <Heading level={2} line={node?.position?.start.line}>
              {children}
            </Heading>
          ),
          h3: ({ children, node }) => (
            <Heading level={3} line={node?.position?.start.line}>
              {children}
            </Heading>
          ),
          h4: ({ children, node }) => (
            <Heading level={4} line={node?.position?.start.line}>
              {children}
            </Heading>
          ),
          h5: ({ children, node }) => (
            <Heading level={5} line={node?.position?.start.line}>
              {children}
            </Heading>
          ),
          h6: ({ children, node }) => (
            <Heading level={6} line={node?.position?.start.line}>
              {children}
            </Heading>
          ),
          p: ({ children }) => (
            <div className="markdown-paragraph">{children}</div>
          ),
          li: ({ children, className }) => (
            <li className={className}>
              {Children.map(children, (child) =>
                isValidElement<{ type?: string; "aria-label"?: string }>(
                  child,
                ) && child.props.type === "checkbox"
                  ? cloneElement(child, {
                      "aria-label":
                        textContent(children).trim() || "체크리스트 항목",
                    })
                  : child,
              )}
            </li>
          ),
          pre: ({ children }) => <CodePanel>{children}</CodePanel>,
          table: ({ children }) => (
            <div
              className="w-full overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="본문 표. 가로로 스크롤할 수 있습니다."
            >
              <table>{children}</table>
            </div>
          ),
          img: ({ src, alt, title }) =>
            typeof src === "string" &&
            /^(https?:\/\/|\/api\/media\/|\/portfolio\/)/.test(src) ? (
              <ImageFigure
                src={src}
                alt={alt || "게시글 이미지"}
                caption={title}
              />
            ) : (
              <span className="text-sm text-danger">
                이미지 주소를 확인해 주세요.
              </span>
            ),
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
export function TableOfContents({ content }: { content: string }) {
  const headings = headingsFromMarkdown(content).filter((h) => h.level <= 3);
  const [active, setActive] = useState(headings[0]?.id);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-90px 0px -60% 0px" },
    );
    for (const h of headings) {
      const node = document.getElementById(h.id);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [content]);
  if (!headings.length) return null;
  const links = (
    <nav aria-label="이 글의 목차" className="flex flex-col gap-3">
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`text-sm leading-relaxed ${h.level === 3 ? "pl-3" : ""} ${active === h.id ? "text-accent" : "text-muted hover:text-accent"}`}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
  return (
    <>
      <details className="rounded bg-soft p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[13px]">
          이 글의 목차 <ChevronDown size={16} />
        </summary>
        <div className="mt-4">{links}</div>
      </details>
      <div className="hidden border-l border-line py-2 pl-5 lg:block">
        <p className="mb-5 text-[13px] text-muted">이 글의 목차</p>
        {links}
      </div>
    </>
  );
}
