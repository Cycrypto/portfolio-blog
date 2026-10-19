"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui";

export function Pagination({
  page,
  pages,
  onChange,
  label = "게시글 페이지",
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  label?: string;
}) {
  if (pages <= 1) return null;
  const numbers = [...new Set([1, page - 1, page, page + 1, pages])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  return (
    <nav
      aria-label={label}
      className="mt-10 flex items-center justify-center gap-1 sm:gap-2"
    >
      <Button
        variant="ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="이전 페이지"
        className="min-w-11 px-3"
      >
        <ChevronLeft size={18} />
      </Button>
      <span className="px-5 text-sm text-muted sm:hidden" aria-live="polite">
        {page} / {pages} 페이지
      </span>
      <div className="hidden items-center gap-1 sm:flex">
        {numbers.map((n, i) => (
          <span key={n} className="inline-flex items-center gap-1">
            {i > 0 && n - numbers[i - 1] > 1 && (
              <span className="px-2 text-muted" aria-hidden="true">
                …
              </span>
            )}
            <Button
              variant={page === n ? "primary" : "ghost"}
              onClick={() => onChange(n)}
              aria-label={`${n}페이지`}
              aria-current={page === n ? "page" : undefined}
              className="min-w-11 px-3"
            >
              {n}
            </Button>
          </span>
        ))}
      </div>
      <Button
        variant="ghost"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label="다음 페이지"
        className="min-w-11 px-3"
      >
        <ChevronRight size={18} />
      </Button>
    </nav>
  );
}
