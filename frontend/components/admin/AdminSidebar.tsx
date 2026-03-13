import Link from "next/link"
import { Eye, Edit, FolderOpen, MessageSquare, User, Briefcase, Mail, Home, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export type AdminSidebarActive =
  | "dashboard"
  | "analytics"
  | "posts"
  | "projects"
  | "comments"
  | "profile"
  | "experience"
  | "contacts"

interface AdminSidebarProps {
  active?: AdminSidebarActive
  mode?: "desktop" | "mobile"
  onNavigate?: () => void
}

export const ADMIN_MENU_ITEMS: Array<{
  key: AdminSidebarActive
  label: string
  icon: typeof Eye
  href: string
}> = [
  { key: "dashboard", label: "대시보드", icon: Eye, href: "/admin" },
  { key: "analytics", label: "행동 통계", icon: BarChart3, href: "/admin/analytics" },
  { key: "posts", label: "블로그 포스트", icon: Edit, href: "/admin/posts" },
  { key: "projects", label: "프로젝트", icon: FolderOpen, href: "/admin/projects" },
  { key: "experience", label: "경력 관리", icon: Briefcase, href: "/admin/experience" },
  { key: "comments", label: "댓글 관리", icon: MessageSquare, href: "/admin/comments" },
  { key: "contacts", label: "문의 메시지", icon: Mail, href: "/admin/contacts" },
  { key: "profile", label: "프로필 편집", icon: User, href: "/admin/profile" },
]

export function AdminSidebar({ active, mode = "desktop", onNavigate }: AdminSidebarProps) {
  const isMobile = mode === "mobile"

  return (
    <aside
      className={cn(
        "bg-white border-r border-brand-blue-100 flex shrink-0 flex-col",
        isMobile ? "h-full w-full" : "hidden min-h-screen w-64 lg:flex",
      )}
    >
      <div className="border-b border-brand-blue-100 p-5">
        <Link href="/" className="group flex items-center gap-2" onClick={onNavigate}>
          <div className="rounded-md bg-brand-blue-600 p-2 text-white">
            <Home className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-slate-800">관리자</h2>
            <p className="text-xs text-neutral-slate-500">콘텐츠 관리</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {ADMIN_MENU_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-brand-blue-600 text-white"
                  : "text-neutral-slate-600 hover:bg-brand-blue-50 hover:text-brand-blue-700",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-neutral-slate-500 group-hover:text-brand-blue-600")} />
              <span className={cn("font-medium", isActive ? "font-semibold" : "")}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-brand-blue-100 px-4 py-3 text-xs text-neutral-slate-500">
        <p className="font-medium text-brand-blue-700">포트폴리오 관리 시스템</p>
      </div>
    </aside>
  )
}
