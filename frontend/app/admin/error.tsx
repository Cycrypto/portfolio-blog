"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RotateCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Admin area error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50 p-6">
      <div className="max-w-md w-full space-y-6 bg-white/80 backdrop-blur-sm border border-brand-blue-200/60 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <h1 className="text-xl font-semibold">관리자 영역 오류</h1>
        </div>
        <p className="text-neutral-slate-600 text-sm leading-relaxed">
          요청을 처리하는 중 문제가 발생했습니다. 토큰 만료 또는 네트워크 오류일 수 있습니다. 다시 시도하거나 홈으로 이동하세요.
        </p>
        <div className="space-y-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md p-3">
          <div className="font-semibold">오류 메시지</div>
          <div className="break-words">{error.message}</div>
        </div>
        <div className="flex gap-3">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            다시 시도
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/admin/login">
              <Home className="h-4 w-4" />
              관리자 로그인
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
