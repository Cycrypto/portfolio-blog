import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "박준하 - 백엔드 개발자 블로그",
  description:
    "백엔드 개발자 박준하의 기술 블로그입니다. Java, Spring, 데이터베이스, 클라우드 등 다양한 백엔드 기술을 다룹니다.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton theme="light" />
      </body>
    </html>
  )
}
