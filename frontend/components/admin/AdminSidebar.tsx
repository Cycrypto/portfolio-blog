import Link from "next/link"
import { Eye, Edit, FolderOpen, MessageSquare, User, Briefcase, Mail, Home } from "lucide-react"

interface AdminSidebarProps {
  active?: 'dashboard' | 'posts' | 'projects' | 'comments' | 'profile' | 'experience' | 'contacts'
}

export function AdminSidebar({ active }: AdminSidebarProps) {
  const menuItems = [
    { key: 'dashboard', label: '대시보드', icon: Eye, href: '/admin' },
    { key: 'posts', label: '블로그 포스트', icon: Edit, href: '/admin/posts' },
    { key: 'projects', label: '프로젝트', icon: FolderOpen, href: '/admin/projects' },
    { key: 'experience', label: '경력 관리', icon: Briefcase, href: '/admin/experience' },
    { key: 'comments', label: '댓글 관리', icon: MessageSquare, href: '/admin/comments' },
    { key: 'contacts', label: '문의 메시지', icon: Mail, href: '/admin/contacts' },
    { key: 'profile', label: '프로필 편집', icon: User, href: '/admin/profile' },
  ]

  return (
    <div className="w-64 min-h-screen bg-white shadow-xl border-r border-brand-indigo-500/30 flex-shrink-0 flex flex-col">
      {/* 로고/헤더 */}
      <div className="p-6 border-b border-brand-indigo-500/20 bg-gradient-to-br from-brand-blue-50 to-brand-indigo-50">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-gradient-to-br from-brand-blue-500 to-brand-blue-700 shadow-md group-hover:shadow-lg transition-shadow">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-700 to-brand-blue-900">
              관리자
            </h2>
            <p className="text-xs text-neutral-slate-500">대시보드</p>
          </div>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="mt-4 px-3 space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${isActive
                  ? 'bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 text-white shadow-md'
                  : 'text-neutral-slate-600 hover:bg-brand-blue-50 hover:text-brand-blue-700'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-neutral-slate-500 group-hover:text-brand-blue-600'}`} />
              <span className={`font-medium text-sm ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* 하단 정보 */}
      <div className="p-4 border-t border-brand-indigo-500/20 bg-gradient-to-br from-brand-blue-50/50 to-brand-indigo-50/50">
        <div className="text-xs text-neutral-slate-500 space-y-1">
          <p className="font-medium text-brand-blue-700">포트폴리오 관리 시스템</p>
          <p>© 2024 박준하</p>
        </div>
      </div>
    </div>
  )
}
