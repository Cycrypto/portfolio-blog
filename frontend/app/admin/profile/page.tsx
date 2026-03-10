import { Metadata } from "next"
import { User } from "lucide-react"
import { ProfileEditor } from "@/components/admin/ProfileEditor"
import { AdminShell } from "@/components/admin/AdminShell"

export const metadata: Metadata = {
  title: "프로필 편집 - 관리자",
  description: "랜딩 페이지의 프로필 정보를 편집합니다.",
}

export default function ProfilePage() {
  return (
    <AdminShell
      active="profile"
      title="프로필 편집"
      description="랜딩 페이지에 노출되는 프로필 정보를 관리합니다"
      actions={
        <div className="hidden items-center gap-2 rounded-md border border-brand-blue-100 bg-white px-3 py-1.5 text-sm text-neutral-slate-600 md:flex">
          <User className="h-4 w-4" />
          프로필 관리
        </div>
      }
    >
      <div className="max-w-6xl">
        <ProfileEditor />
      </div>
    </AdminShell>
  )
}
