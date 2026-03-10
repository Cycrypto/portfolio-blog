"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, X, PenSquare, LayoutDashboard, FileText, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function FloatingNav() {
  const [isVisible, setIsVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const isAdmin = useAdminAuth()
  const isMobile = useMobile()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])

  const navItems = [
    { name: "소개", href: "#about" },
    { name: "프로젝트", href: "#projects" },
    { name: "블로그", href: "#blog" },
    { name: "연락", href: "#contact" },
  ]

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  return (
    <>
      <motion.div
        className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 ${isVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        initial={{ y: -100 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.25 }}
      >
        <div className="surface-default relative rounded-full px-3 py-2 shadow-lg">

          {isMobile ? (
            <div className="relative">
              <div className="flex items-center justify-between gap-2">
                <Link href="/" className="px-2 font-semibold text-neutral-slate-800">
                  박준하 블로그
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-neutral-slate-600 hover:bg-brand-blue-50 hover:text-neutral-slate-800"
                  onClick={() => setIsOpen((prev) => !prev)}
                >
                  {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
              {isOpen && (
                <div className="surface-default absolute right-0 top-full mt-2 w-44 p-2 shadow-lg">
                  <nav className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-slate-700 hover:bg-brand-blue-50 hover:text-brand-blue-700"
                        onClick={handleNavClick}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  {isAdmin && (
                    <div className="mt-2 border-t border-neutral-slate-200 pt-2">
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-blue-700 hover:bg-brand-blue-50"
                        onClick={handleNavClick}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        관리자
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex items-center gap-1">
              <Link href="/" className="mr-2 px-2 font-semibold text-neutral-slate-800">
                박준하 블로그
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="rounded-full px-3 py-1 text-sm font-medium text-neutral-slate-600 transition-colors hover:bg-brand-blue-50 hover:text-brand-blue-700"
                  onClick={handleNavClick}
                >
                  {item.name}
                </Link>
              ))}
              {isAdmin && (
                <>
                  <div className="w-px h-6 bg-neutral-slate-300 mx-2" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-1 border-brand-blue-200 bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        관리
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/admin/posts/new" className="flex items-center cursor-pointer">
                          <PenSquare className="h-4 w-4 mr-2" />
                          새 글 작성
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/posts" className="flex items-center cursor-pointer">
                          <FileText className="h-4 w-4 mr-2" />
                          글 목록
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          대시보드
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
