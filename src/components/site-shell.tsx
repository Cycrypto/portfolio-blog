"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Asterisk,
  ArrowUpRight,
  Menu,
  X,
  UserCircle,
  Send,
} from "lucide-react";
export function SiteHeader({ reference = false }: { reference?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);
  const isCurrent = (href: string) =>
    href === "/"
      ? pathname === "/"
      : !href.includes("#") &&
        (pathname === href || pathname.startsWith(`${href}/`));
  const links = reference
    ? [
        ["About", "/#about"],
        ["Experience", "/#experience"],
        ["Education", "/#education"],
        ["Skills", "/#skills"],
        ["Blog", "/blog"],
      ]
    : [
        ["소개", "/"],
        ["작업", "/#experience"],
        ["블로그", "/blog"],
        ["시리즈", "/series"],
      ];
  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur ${reference ? "font-reference" : ""}`}
    >
      <nav
        aria-label="주 내비게이션"
        className={`mx-auto flex h-[72px] max-w-[1248px] items-center justify-between gap-5 px-6 ${reference ? "md:h-[68px] md:px-8 lg:px-16" : "md:px-16"}`}
      >
        <Link
          href="/"
          aria-label="포트폴리오 홈"
          onClick={() => setOpen(false)}
          className="flex shrink-0 items-center gap-2.5"
        >
          {reference ? (
            <UserCircle size={32} className="text-coral" />
          ) : (
            <>
              <Asterisk size={28} className="text-coral" />
              <span className="font-display text-2xl">junha.</span>
            </>
          )}
        </Link>
        <div
          className={`hidden items-center ${reference ? "gap-4" : "gap-8"} md:flex`}
        >
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              aria-current={
                (
                  href === "/"
                    ? pathname === "/"
                    : !href.includes("#") &&
                      (pathname === href || pathname.startsWith(`${href}/`))
                )
                  ? "page"
                  : undefined
              }
              className={`inline-flex min-h-11 items-center text-sm transition-colors hover:text-accent ${isCurrent(href) ? "text-accent underline underline-offset-8" : "text-muted"}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <Link
          href="/#contact"
          className={`hidden shrink-0 items-center gap-2 md:inline-flex ${reference ? "bg-ink px-4 py-2 text-xs text-paper" : "text-[13px]"}`}
        >
          {reference ? <Send size={14} /> : null}
          {reference ? "Contact Me" : "연락하기"}
          {reference ? null : <ArrowUpRight size={16} />}
        </Link>
        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="flex h-11 w-11 items-center justify-center md:hidden"
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
          {links.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={isCurrent(href) ? "page" : undefined}
              className={`rounded px-3 py-3 ${isCurrent(href) ? "bg-accent-soft text-accent" : "text-muted hover:bg-soft"}`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/#contact"
            onClick={() => setOpen(false)}
            className="py-3"
          >
            {reference ? "Contact Me" : "연락하기"}
          </Link>
        </nav>
      )}
    </header>
  );
}
export function SiteFooter({ reference = false }: { reference?: boolean }) {
  return (
    <footer
      className={`mx-auto flex min-h-20 flex-wrap items-center justify-between gap-4 border-t border-line py-4 text-xs text-muted ${reference ? "font-reference" : "max-w-[1120px]"}`}
    >
      <span>© 2026 {reference ? "Rowland" : "Junha Park"}</span>
      <div className="flex items-center gap-5">
        <Link href="/admin" className="hover:text-accent">
          관리
        </Link>
        {reference ? (
          <a href="#top" className="flex items-center gap-1">
            Back to top <ArrowUpRight size={14} />
          </a>
        ) : (
          <Link href="/" className="flex items-center gap-1">
            Portfolio <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </footer>
  );
}
