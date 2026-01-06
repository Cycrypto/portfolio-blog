"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TokenManager } from "@/lib/auth/token-manager"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    TokenManager.clearToken()
    router.push('/admin/login')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      로그아웃
    </Button>
  )
}
