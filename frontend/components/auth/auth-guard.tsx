"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { TokenManager } from "@/lib/auth/token-manager"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = TokenManager.getToken()

      if (!token) {
        setIsAuthenticated(false)
        router.replace('/admin/login')
        return
      }

      try {
        // 토큰 유효성 확인 (백엔드에 요청)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          TokenManager.clearToken()
          setIsAuthenticated(false)
          router.replace('/admin/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        TokenManager.clearToken()
        setIsAuthenticated(false)
        router.replace('/admin/login')
      }
    }

    // 로그인 페이지가 아닐 때만 체크
    if (!pathname.includes('/admin/login')) {
      checkAuth()
    } else {
      setIsAuthenticated(true)
    }
  }, [pathname, router])

  // 인증 체크 중
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // 인증 실패
  if (!isAuthenticated) {
    return null
  }

  // 인증 성공
  return <>{children}</>
}
