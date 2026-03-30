"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { TokenManager } from "@/lib/auth/token-manager"

type LoginFieldErrors = {
  password?: string
  username?: string
}

export default function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})

  const clearFieldError = (field: keyof LoginFieldErrors) => {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextFieldErrors: LoginFieldErrors = {}

    if (!username.trim()) {
      nextFieldErrors.username = "사용자명을 입력해주세요."
    }

    if (!password.trim()) {
      nextFieldErrors.password = "비밀번호를 입력해주세요."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setError("사용자명과 비밀번호를 모두 입력해주세요.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setFieldErrors({})

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '로그인에 실패했습니다.')
      }

      const result = await response.json()
      // 표준 응답 형식: { success, timestamp, data: { access_token, user } }
      const accessToken = result?.data?.access_token || result?.access_token
      if (!accessToken) {
        throw new Error('응답에 토큰이 없습니다.')
      }

      TokenManager.setToken(accessToken)
      const nextPath = new URLSearchParams(window.location.search).get("next")
      router.push(nextPath && nextPath.startsWith("/") ? nextPath : '/admin')
    } catch (err: any) {
      setError(err?.message || '로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50 p-4">
      <Card className="surface-default w-full max-w-md shadow-none">
        <CardHeader className="border-b border-brand-blue-100">
          <CardTitle className="text-2xl font-bold text-neutral-slate-800">관리자 로그인</CardTitle>
          <CardDescription>
            관리자 계정으로 로그인하세요.
            <br />
            <span className="text-xs text-neutral-slate-500 mt-1 block">
              기본 계정 - ID: admin, PW: admin123
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <FieldGroup>
              <Field invalid={Boolean(fieldErrors.username)} disabled={loading}>
                <FieldLabel htmlFor="username">사용자명</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="사용자명을 입력하세요"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    clearFieldError("username")
                  }}
                  disabled={loading}
                  autoComplete="username"
                  aria-invalid={Boolean(fieldErrors.username)}
                />
                <FieldError>{fieldErrors.username}</FieldError>
              </Field>

              <Field invalid={Boolean(fieldErrors.password)} disabled={loading}>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearFieldError("password")
                  }}
                  disabled={loading}
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <FieldError>{fieldErrors.password}</FieldError>
              </Field>
            </FieldGroup>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-brand-blue-600 text-white hover:bg-brand-blue-700"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
