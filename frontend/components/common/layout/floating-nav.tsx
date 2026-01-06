"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, X, PenSquare, LayoutDashboard, FileText, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
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
  const [isAdmin, setIsAdmin] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // 관리자 로그인 상태 확인
    const token = localStorage.getItem("token")
    setIsAdmin(!!token)
  }, [])

  const navItems = [
    { name: "소개", href: "#about" },
    { name: "기술", href: "#skills" },
    { name: "블로그", href: "#blog" },
    { name: "프로젝트", href: "#projects" },
    { name: "경력", href: "#experience" },
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
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        initial={{ y: -100 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative px-4 py-3 rounded-full bg-white/80 backdrop-blur-md border border-brand-blue-200/50 shadow-lg">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur opacity-50"></div>

          {isMobile ? (
            <div className="relative flex items-center justify-between">
              <Link href="/" className="font-bold text-lg">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-900">
                  박준하
                </span>
                <span className="text-neutral-slate-800"> 블로그</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-neutral-slate-600 hover:text-neutral-slate-800 hover:bg-brand-blue-50"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          ) : (
            <div className="relative flex items-center gap-1">
              <Link href="/" className="font-bold text-lg mr-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-900">
                  박준하
                </span>
                <span className="text-neutral-slate-800"> 블로그</span>
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-3 py-1 text-sm font-medium text-neutral-slate-600 hover:text-brand-blue-600 transition-colors"
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
                        className="ml-2 border-brand-blue-200 bg-brand-blue-50 hover:bg-brand-blue-100 text-brand-blue-700"
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
              <Button
                size="sm"
                className="ml-2 bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0"
              >
                이력서
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile menu */}
      {isMobile && (
        <motion.div
          className={`fixed inset-0 z-40 bg-white/90 backdrop-blur-md ${isOpen ? "block" : "hidden"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-8 py-4 text-2xl font-medium text-neutral-slate-800 hover:text-brand-blue-600 transition-colors"
                onClick={handleNavClick}
              >
                {item.name}
              </Link>
            ))}
            {isAdmin && (
              <>
                <div className="w-32 h-px bg-neutral-slate-300 my-4" />
                <Link
                  href="/admin/posts/new"
                  className="px-8 py-3 text-lg font-medium text-brand-blue-700 hover:text-brand-blue-900 transition-colors flex items-center gap-2"
                  onClick={handleNavClick}
                >
                  <PenSquare className="h-5 w-5" />
                  새 글 작성
                </Link>
                <Link
                  href="/admin/posts"
                  className="px-8 py-3 text-lg font-medium text-brand-blue-700 hover:text-brand-blue-900 transition-colors flex items-center gap-2"
                  onClick={handleNavClick}
                >
                  <FileText className="h-5 w-5" />
                  글 목록
                </Link>
                <Link
                  href="/admin"
                  className="px-8 py-3 text-lg font-medium text-brand-blue-700 hover:text-brand-blue-900 transition-colors flex items-center gap-2"
                  onClick={handleNavClick}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  대시보드
                </Link>
              </>
            )}
            <Button className="mt-6 bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0">
              이력서
            </Button>
          </div>
        </motion.div>
      )}
    </>
  )
}
