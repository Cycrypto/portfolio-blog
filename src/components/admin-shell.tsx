"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Asterisk, ExternalLink, LogOut } from "lucide-react";
import { Button } from "./ui";
export function AdminShell({
  children,
  onLeave,
  email,
  nav,
}: {
  children: React.ReactNode;
  onLeave: (action: () => void) => void;
  email: string;
  nav: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4 border-b border-line bg-soft px-4 py-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto md:border-r md:border-b-0 md:px-5 md:py-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            onNavigate={(e) => {
              e.preventDefault();
              onLeave(() => router.push("/"));
            }}
            className="flex items-center gap-2 font-display text-2xl"
          >
            <Asterisk size={24} className="text-coral" />
            Portfolio
          </Link>
          <Link
            href="/"
            onNavigate={(e) => {
              e.preventDefault();
              onLeave(() => router.push("/"));
            }}
            className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded px-2 text-xs whitespace-nowrap text-muted hover:bg-surface"
          >
            <ExternalLink size={14} />
            사이트 보기
          </Link>
        </div>
        <nav
          aria-label="관리 메뉴"
          className="flex gap-1 border-b border-line pb-4 md:flex-col"
        >
          {[
            { href: "/admin", label: "홈 화면 편집" },
            { href: "/admin/series", label: "블로그 시리즈" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onNavigate={(event) => {
                event.preventDefault();
                if (pathname !== href) onLeave(() => router.push(href));
              }}
              className={`flex min-h-11 items-center rounded px-3 text-sm ${pathname === href ? "bg-surface font-medium text-accent" : "hover:bg-surface/70"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        {nav}
        <div className="mt-auto hidden md:block">
          <p className="text-xs break-all text-muted">{email}</p>
          <p className="mt-1 font-mono text-[10px] text-accent">
            ADMIN · CLOUDFLARE ACCESS
          </p>
          <Button
            variant="ghost"
            onClick={() =>
              onLeave(() => window.location.assign("/cdn-cgi/access/logout"))
            }
            className="mt-3 -ml-3 text-xs text-muted"
          >
            <LogOut size={14} />
            로그아웃
          </Button>
        </div>
      </aside>
      <main id="main" className="min-w-0">
        {children}
      </main>
    </div>
  );
}
