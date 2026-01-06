import { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, User } from "lucide-react"
import { ProfileEditor } from "@/components/admin/ProfileEditor"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export const metadata: Metadata = {
  title: "프로필 편집 - 관리자",
  description: "랜딩 페이지의 프로필 정보를 편집합니다.",
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <div className="flex">
        <AdminSidebar active="profile" />

        <div className="flex-1 p-8">
          <div className="max-w-4xl">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-neutral-slate-600 mb-6">
              <Link href="/admin" className="hover:text-brand-blue-700 transition-colors">
                관리자
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-brand-blue-900 font-semibold">프로필 편집</span>
            </nav>

            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-blue-500 to-brand-blue-700 flex items-center justify-center shadow-md">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-700 to-brand-blue-900">
                    프로필 편집
                  </h1>
                  <p className="text-neutral-slate-600 mt-2 text-lg">
                    랜딩 페이지에 표시되는 프로필 정보를 편집할 수 있습니다
                  </p>
                </div>
              </div>
            </div>

            <ProfileEditor />
          </div>
        </div>
      </div>
    </div>
  )
}
