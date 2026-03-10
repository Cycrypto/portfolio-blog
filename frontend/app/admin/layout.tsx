"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { TokenManager } from "@/lib/auth/token-manager"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // 로그인 페이지는 예외 처리
    if (pathname === "/admin/login") {
      setAuthorized(true)
      return
    }

    const token = TokenManager.getToken()
    if (!token) {
      router.replace("/admin/login")
      return
    }
    setAuthorized(true)
  }, [pathname, router])

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50 text-neutral-slate-600">
        관리자 인증 확인 중...
      </div>
    )
  }

  return children
}
