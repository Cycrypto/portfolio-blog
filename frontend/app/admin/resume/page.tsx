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
      description="프리뷰, 웹 보기, PDF 다운로드를 나눠 이력서 편집 결과를 더 빠르게 확인합니다"
      actions={<ResumePreviewButton />}
    >
      <ResumeSettingsEditor />
    </AdminShell>
  )
}
