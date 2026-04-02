import { Metadata } from "next"

import { AdminShell } from "@/components/admin/AdminShell"
import { PortfolioPdfButton } from "@/components/admin/PortfolioPdfButton"
import { ResumePreviewButton } from "@/components/admin/ResumePreviewButton"
import { ResumeSettingsEditor } from "@/components/admin/ResumeSettingsEditor"

export const metadata: Metadata = {
  title: "이력서 설정 - 관리자",
  description: "PDF 이력서와 제출용 포트폴리오 PDF 구성을 관리합니다.",
}

export default function ResumeSettingsPage() {
  return (
    <AdminShell
      active="resume"
      title="이력서 설정"
      description="프리뷰, 이력서 PDF, 제출용 포트폴리오 PDF를 한 곳에서 확인합니다"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ResumePreviewButton />
          <PortfolioPdfButton />
        </div>
      }
    >
      <ResumeSettingsEditor />
    </AdminShell>
  )
}
