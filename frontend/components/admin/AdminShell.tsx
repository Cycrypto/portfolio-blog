"use client"

import { ReactNode } from "react"
import { AdminSidebar, getAdminSidebarItem, type AdminSidebarActive } from "@/components/admin/AdminSidebar"
import { Sidebar, SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar"

interface AdminShellProps {
  active: AdminSidebarActive
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminShell({ active, title, description, actions, children }: AdminShellProps) {
  const activeItem = getAdminSidebarItem(active)

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50">
      <SidebarProvider className="min-h-screen">
        <Sidebar className="border-r border-sidebar-border">
          <AdminSidebar active={active} />
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-w-0 bg-transparent">
          <header className="sticky top-0 z-30 border-b border-brand-blue-100 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
              <div className="flex min-w-0 items-start gap-3">
                <SidebarTrigger className="mt-1 size-9 rounded-xl border border-brand-blue-200 bg-white text-neutral-slate-700 shadow-sm hover:bg-brand-blue-50 hover:text-brand-blue-700" />

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue-700">
                    관리자 / {activeItem?.label ?? "페이지"}
                  </p>
                  <h1 className="truncate text-2xl font-extrabold tracking-tight text-neutral-slate-800 md:text-3xl">{title}</h1>
                  {description && <p className="mt-1 text-sm text-neutral-slate-600 md:text-base">{description}</p>}
                </div>
              </div>

              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
