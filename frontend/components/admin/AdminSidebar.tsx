"use client"

import Link from "next/link"
import { Eye, Edit, FolderOpen, MessageSquare, User, Briefcase, Mail, Home, BarChart3, FileBadge2 } from "lucide-react"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type AdminSidebarActive =
  | "dashboard"
  | "analytics"
  | "posts"
  | "projects"
  | "comments"
  | "profile"
  | "experience"
  | "resume"
  | "contacts"

interface AdminSidebarProps {
  active?: AdminSidebarActive
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
  { key: "resume", label: "이력서", icon: FileBadge2, href: "/admin/resume" },
  { key: "experience", label: "경험 관리", icon: Briefcase, href: "/admin/experience" },
  { key: "comments", label: "댓글 관리", icon: MessageSquare, href: "/admin/comments" },
  { key: "contacts", label: "문의 메시지", icon: Mail, href: "/admin/contacts" },
  { key: "profile", label: "프로필 편집", icon: User, href: "/admin/profile" },
]

export function getAdminSidebarItem(active?: AdminSidebarActive) {
  return ADMIN_MENU_ITEMS.find((item) => item.key === active)
}

export function AdminSidebar({ active, onNavigate }: AdminSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const activeItem = getAdminSidebarItem(active)

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false)
    }

    onNavigate?.()
  }

  return (
    <>
      <SidebarHeader className="gap-4 border-b border-sidebar-border px-4 py-5">
        <Link href="/" className="flex items-center gap-3 rounded-lg outline-none transition-colors hover:text-sidebar-primary focus-visible:ring-2 focus-visible:ring-sidebar-ring" onClick={handleNavigate}>
          <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Home />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">관리자</p>
            <p className="truncate text-xs text-sidebar-foreground opacity-70">콘텐츠 관리 워크스페이스</p>
          </div>
        </Link>

        <div className="rounded-xl border border-sidebar-border bg-white/70 px-3 py-2 text-xs text-sidebar-foreground opacity-70 shadow-sm">
          현재 메뉴 정보 구조는 유지하고, 공용 sidebar primitive 위에서 표시만 재구성한다.
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground opacity-60">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_MENU_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = active === item.key

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-11 rounded-xl px-3 text-sm",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Link href={item.href} onClick={handleNavigate} aria-current={isActive ? "page" : undefined}>
                        <Icon />
                        <span className={cn("font-medium", isActive && "font-semibold")}>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
        <div className="rounded-xl bg-sidebar-accent px-3 py-3 text-xs text-sidebar-accent-foreground shadow-sm">
          <p className="font-semibold">현재 위치</p>
          <p className="mt-1 text-sidebar-accent-foreground opacity-75">
            {activeItem ? activeItem.label : "관리자"}
          </p>
        </div>
      </SidebarFooter>
    </>
  )
}
