"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Asterisk, ExternalLink, LayoutTemplate, LogOut } from "lucide-react";
import { Button } from "./ui";
export function AdminShell({
  children,
  onLeave,
  email,
}: {
  children: React.ReactNode;
  onLeave: (action: () => void) => void;
  email: string;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-soft px-5 py-4 md:sticky md:top-0 md:h-screen md:border-r md:border-b-0 md:px-7 md:py-6">
        <Link
          href="/"
          onNavigate={(e) => {
            e.preventDefault();
            onLeave(() => router.push("/"));
          }}
          className="mb-5 flex items-center gap-2 font-display text-2xl"
        >
          <Asterisk size={24} className="text-coral" />
          Portfolio
        </Link>
        <nav aria-label="관리 메뉴">
          <span
            aria-current="page"
            className="flex min-h-11 items-center gap-2 rounded bg-surface px-3 text-sm text-accent"
          >
            <LayoutTemplate size={18} />홈 화면 편집
          </span>
        </nav>
        <p className="mt-6 text-xs break-all text-muted">{email}</p>
        <p className="mt-2 font-mono text-[10px] text-accent">
          ADMIN · CLOUDFLARE ACCESS
        </p>
        <div className="mt-6 flex flex-wrap gap-2 md:flex-col">
          <Link
            href="/"
            onNavigate={(e) => {
              e.preventDefault();
              onLeave(() => router.push("/"));
            }}
            className="inline-flex min-h-11 items-center gap-2 px-3 text-xs text-muted"
          >
            <ExternalLink size={16} />
            사이트 보기
          </Link>
          <Button
            variant="ghost"
            onClick={() =>
              onLeave(() => window.location.assign("/cdn-cgi/access/logout"))
            }
            className="justify-start text-xs text-muted"
          >
            <LogOut size={16} />
            로그아웃
          </Button>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-6 py-8 md:p-12">
        {children}
      </main>
    </div>
  );
}
