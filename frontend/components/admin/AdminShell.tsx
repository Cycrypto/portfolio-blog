import { ReactNode } from "react"
import { AdminSidebar, type AdminSidebarActive } from "@/components/admin/AdminSidebar"

interface AdminShellProps {
  active: AdminSidebarActive
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminShell({ active, title, description, actions, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <div className="flex">
        <AdminSidebar active={active} />
        <div className="flex-1 p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-700 to-brand-blue-900">
                {title}
              </h1>
              {description && <p className="text-neutral-slate-600 mt-2 text-lg">{description}</p>}
            </div>
            {actions && <div className="flex items-center">{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
