import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "sonner"

import { UmamiScript } from "@/components/analytics/UmamiScript"
import "./globals.css"
import { getSiteUrl } from "@/lib/site"

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "박준하 포트폴리오",
    template: "%s | 박준하 포트폴리오",
  },
  description:
    "문제를 구조화하고 안정적인 백엔드 시스템을 설계하는 개발자 박준하의 포트폴리오입니다.",
  applicationName: "박준하 포트폴리오",
  keywords: [
    "백엔드 개발자",
    "포트폴리오",
    "기술 블로그",
    "Spring",
    "NestJS",
    "Java",
  ],
  authors: [{ name: "박준하" }],
  creator: "박준하",
  openGraph: {
    title: "박준하 포트폴리오",
    description:
      "문제를 구조화하고 안정적인 백엔드 시스템을 설계하는 개발자 박준하의 포트폴리오입니다.",
    siteName: "박준하 포트폴리오",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "박준하 포트폴리오",
    description:
      "문제를 구조화하고 안정적인 백엔드 시스템을 설계하는 개발자 박준하의 포트폴리오입니다.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        <UmamiScript />
        {children}
        <Toaster position="top-right" richColors closeButton theme="light" />
      </body>
    </html>
  )
}
