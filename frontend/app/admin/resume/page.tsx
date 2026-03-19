import { Metadata } from "next"

import { AdminShell } from "@/components/admin/AdminShell"
import { ResumePreviewButton } from "@/components/admin/ResumePreviewButton"
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
      actions={<ResumePreviewButton />}
    >
      <ResumeSettingsEditor />
    </AdminShell>
  )
}
