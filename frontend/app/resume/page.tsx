import { Metadata } from "next"

import { ResumeWebView } from "@/components/resume/ResumeWebView"

export const metadata: Metadata = {
  title: "이력서",
  description: "웹에서 확인할 수 있는 박준하의 이력서입니다.",
}

interface ResumePageProps {
  searchParams?: Promise<{
    preview?: string
  }>
}

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const params = searchParams ? await searchParams : undefined

  return <ResumeWebView preview={params?.preview === "1"} />
}
