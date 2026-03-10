"use client"

import { ReactNode, useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AdminSidebar, type AdminSidebarActive } from "@/components/admin/AdminSidebar"

interface AdminShellProps {
  active: AdminSidebarActive
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminShell({ active, title, description, actions, children }: AdminShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <AdminSidebar active={active} />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-brand-blue-100 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="outline" size="icon" className="border-brand-blue-200">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
                    <SheetHeader className="border-b border-brand-blue-100 px-4 py-3 text-left">
                      <SheetTitle>관리자 메뉴</SheetTitle>
                    </SheetHeader>
                    <AdminSidebar active={active} mode="mobile" onNavigate={() => setOpen(false)} />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-extrabold tracking-tight text-neutral-slate-800 md:text-3xl">{title}</h1>
                  {description && <p className="mt-1 text-sm text-neutral-slate-600 md:text-base">{description}</p>}
                </div>
              </div>

              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          </header>

          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
