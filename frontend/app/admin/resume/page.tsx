import { Metadata } from "next"
import { FileBadge2 } from "lucide-react"

import { AdminShell } from "@/components/admin/AdminShell"
import { ResumeSettingsEditor } from "@/components/admin/ResumeSettingsEditor"

export const metadata: Metadata = {
  title: "이력서 설정 - 관리자",
  description: "PDF 이력서 헤더와 선택 프로젝트를 관리합니다.",
}

export default function ResumeSettingsPage() {
  return (
    <AdminShell
      active="resume"
      title="이력서 설정"
      description="PDF 헤더 정보와 노출할 프로젝트를 한 화면에서 관리합니다"
      actions={
        <div className="hidden items-center gap-2 rounded-md border border-brand-blue-100 bg-white px-3 py-1.5 text-sm text-neutral-slate-600 md:flex">
          <FileBadge2 className="h-4 w-4" />
          Resume Settings
        </div>
      }
    >
      <ResumeSettingsEditor />
    </AdminShell>
  )
}
