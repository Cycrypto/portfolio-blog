"use client"

import { useEffect, useState } from "react"
import { TokenManager } from "@/lib/auth/token-manager"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"

export function useAdminAuth(): boolean {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let mounted = true

    const verifyAuth = async () => {
      const token = TokenManager.getToken()
      if (!token) {
        if (mounted) setIsAdmin(false)
        return
      }

      if (!TokenManager.isTokenValid(token)) {
        TokenManager.clearTokens()
        if (mounted) setIsAdmin(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          TokenManager.clearTokens()
        }

        if (mounted) {
          setIsAdmin(response.ok)
        }
      } catch {
        if (mounted) setIsAdmin(false)
      }
    }

    const handleAuthChange = () => {
      void verifyAuth()
    }

    void verifyAuth()
    window.addEventListener("storage", handleAuthChange)
    window.addEventListener("auth-token-changed", handleAuthChange as EventListener)

    return () => {
      mounted = false
      window.removeEventListener("storage", handleAuthChange)
      window.removeEventListener("auth-token-changed", handleAuthChange as EventListener)
    }
  }, [])

  return isAdmin
}
