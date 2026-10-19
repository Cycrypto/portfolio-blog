"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Asterisk,
  ExternalLink,
  FileText,
  Image,
  Layers,
  LogOut,
} from "lucide-react";
import { Button, request, useToast } from "./ui";
export function AdminShell({
  children,
  onLeave,
}: {
  children: React.ReactNode;
  onLeave?: (action: () => void) => void;
}) {
  const path = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = (href: string, event: { preventDefault: () => void }) => {
    if (!onLeave) return;
    event.preventDefault();
    onLeave(() => router.push(href));
  };
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await request("/api/auth", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, true);
      setLoggingOut(false);
    }
  };
  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-soft px-5 py-4 md:sticky md:top-0 md:h-screen md:border-r md:border-b-0 md:px-7 md:py-6">
        <Link
          href="/"
          onNavigate={(event) => navigate("/", event)}
          className="mb-4 flex items-center gap-2 font-display text-2xl md:mb-8"
        >
          <Asterisk size={24} className="text-coral" />
          junha.
        </Link>
        <p className="mb-4 hidden font-mono text-[10px] text-muted md:block">
          WORKSPACE
        </p>
        <nav
          aria-label="관리 메뉴"
          className="flex flex-wrap gap-2 md:flex-col"
        >
          {[
            ["/admin", "게시글", FileText],
            ["/admin/series", "시리즈", Layers],
            ["/admin/media", "이미지", Image],
          ].map(([href, label, Icon]) => {
            const I = Icon as typeof FileText;
            const active =
              href === "/admin"
                ? path === "/admin" || path.startsWith("/admin/posts/")
                : path.startsWith(String(href));
            return (
              <Link
                key={String(href)}
                href={String(href)}
                onNavigate={(event) => navigate(String(href), event)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2.5 rounded px-3 text-sm ${active ? "bg-surface text-accent" : "text-muted hover:bg-surface"}`}
              >
                <I size={18} />
                {String(label)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-2 flex gap-2 md:mt-12 md:flex-col">
          <Link
            href="/blog"
            onNavigate={(event) => navigate("/blog", event)}
            className="inline-flex min-h-11 items-center gap-2 px-3 text-xs text-muted"
          >
            <ExternalLink size={16} />
            사이트 보기
          </Link>
          <Button
            variant="ghost"
            loading={loggingOut}
            onClick={() =>
              onLeave ? onLeave(() => void logout()) : void logout()
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
