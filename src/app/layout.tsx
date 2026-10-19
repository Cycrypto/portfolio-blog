import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "Portfolio", template: "%s · Junha" },
  description: "경험과 역량을 소개하는 포트폴리오입니다.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Gowun+Batang:wght@400;700&family=Habibi&family=JetBrains+Mono:wght@400;500&family=Nanum+Myeongjo:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="fixed top-2 left-2 z-50 -translate-y-20 rounded bg-ink px-4 py-3 text-paper focus:translate-y-0"
        >
          본문으로 이동
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
