"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { defaultHome } from "@/data/portfolio";
import {
  portfolioAssets,
  type PortfolioAssetKey,
} from "@/data/portfolio-assets";
import type { HomeContent } from "@/lib/types";
import type { SectionId } from "@/lib/validation";
const src = (name: string) =>
  portfolioAssets[name as PortfolioAssetKey]?.[0] ?? name;
export function SiteHeader({
  navigation = defaultHome.navigation,
  hidden = [],
}: {
  navigation?: HomeContent["navigation"];
  hidden?: SectionId[];
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const items = [
    ...navigation.items
      .filter((item) => !hidden.includes(item.section))
      .map((item) => ({ label: item.label, href: `/#${item.section}` })),
    { label: "블로그", href: "https://blog.junha.space" },
  ];
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const outside = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <header
      ref={header}
      className="sticky top-0 z-30 border-b border-ink/10 bg-paper/95 font-reference backdrop-blur"
    >
      <nav
        aria-label="주 내비게이션"
        className="mx-auto flex h-[68px] max-w-[768px] items-center justify-between gap-5 px-6 md:px-16"
      >
        <Link
          href="/"
          aria-label="포트폴리오 홈"
          onClick={() => setOpen(false)}
          className="flex size-9 shrink-0 items-center justify-center"
        >
          {navigation.logo && (
            <img
              src={src(navigation.logo)}
              alt=""
              width={32}
              height={32}
              className="size-8"
            />
          )}
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="inline-flex min-h-11 items-center whitespace-nowrap text-sm text-muted hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </div>
        <a
          href="/#contact"
          className="hidden min-h-9 shrink-0 items-center gap-2 bg-ink px-3 text-xs text-paper md:flex"
        >
          {navigation.contact.icon && (
            <img
              src={src(navigation.contact.icon)}
              alt=""
              width={16}
              height={16}
              className="size-4 brightness-0 invert dark:invert-0"
            />
          )}
          {navigation.contact.label}
        </a>
        <button
          ref={button}
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="flex size-11 items-center justify-center md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="모바일 내비게이션"
          className="flex flex-col border-t border-line px-6 py-4 md:hidden"
        >
          {[
            ...items,
            { label: navigation.contact.label, href: "/#contact" },
          ].map((item, index) => (
            <a
              key={index}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded px-3 py-3 text-muted hover:bg-soft"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[768px] border-t border-line px-6 py-6 text-xs text-muted">
      <Link href="/">포트폴리오로 돌아가기</Link>
    </footer>
  );
}
