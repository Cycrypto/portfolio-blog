"use client"

import { useEffect, useState } from "react"
import { Download, Eye, Globe, MoreHorizontal, RefreshCcw } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { RESUME_PREVIEW_REFRESH_EVENT } from "@/lib/resume/preview-events"
import { cn } from "@/lib/utils"

interface ResumePreviewButtonProps {
  className?: string
  containerClassName?: string
  stretch?: boolean
  label?: string
  size?: "default" | "sm"
}

export function ResumePreviewButton({
  className,
  containerClassName,
  stretch = false,
  label = "빠른 프리뷰",
  size = "sm",
}: ResumePreviewButtonProps) {
  const [open, setOpen] = useState(false)
  const [previewKey, setPreviewKey] = useState(() => Date.now())
  const [hasPendingRefresh, setHasPendingRefresh] = useState(false)

  const refreshPreview = () => {
    setPreviewKey(Date.now())
    setHasPendingRefresh(false)
  }

  useEffect(() => {
    if (!open) {
      return
    }

    refreshPreview()
  }, [open])

  useEffect(() => {
    const handleRefresh = () => {
      if (open) {
        refreshPreview()
        return
      }

      setHasPendingRefresh(true)
    }

    window.addEventListener(RESUME_PREVIEW_REFRESH_EVENT, handleRefresh)
    return () => window.removeEventListener(RESUME_PREVIEW_REFRESH_EVENT, handleRefresh)
  }, [open])

  return (
    <>
      <div className={cn("flex items-center gap-2", stretch && "w-full", containerClassName)}>
        <Button
          type="button"
          size={size}
          className={cn(
            "bg-brand-blue-600 text-white hover:bg-brand-blue-700",
            stretch && "flex-1 justify-center",
            className,
          )}
          onClick={() => setOpen(true)}
        >
          <Eye className="h-4 w-4" />
          {label}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size={size} className={cn(stretch && "shrink-0")}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">이력서 액션 열기</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>이력서 액션</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              <Eye className="h-4 w-4" />
              빠른 프리뷰
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/resume" target="_blank" rel="noreferrer">
                <Globe className="h-4 w-4" />
                웹 보기
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/api/resume">
                <Download className="h-4 w-4" />
                PDF 다운로드
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col gap-0 border-l border-brand-blue-100 bg-[#f7f5ef] p-0 sm:max-w-4xl"
        >
          <div className="border-b border-brand-blue-100 bg-white px-5 py-4">
            <SheetHeader className="pr-10 text-left">
              <SheetTitle>이력서 프리뷰</SheetTitle>
              <SheetDescription>
                빠른 수정 확인은 여기서 하고, 전체 페이지 확인은 웹 보기, 최종 산출물은 PDF 다운로드를 사용하세요.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={refreshPreview}>
                <RefreshCcw className="h-4 w-4" />
                새로고침
              </Button>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/resume" target="_blank" rel="noreferrer">
                  <Globe className="h-4 w-4" />
                  웹 보기
                </Link>
              </Button>
              <Button type="button" variant="outline" size="sm" asChild>
                <a href="/api/resume">
                  <Download className="h-4 w-4" />
                  PDF 다운로드
                </a>
              </Button>
            </div>

            {hasPendingRefresh ? (
              <p className="mt-3 text-xs text-brand-blue-700">
                최근 저장된 변경이 있습니다. 프리뷰를 열면 최신 상태로 다시 로드됩니다.
              </p>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 p-4">
            <div className="h-full overflow-hidden rounded-[24px] border border-neutral-slate-200 bg-white shadow-sm">
              <iframe
                key={previewKey}
                src={`/resume?preview=1&v=${previewKey}`}
                title="이력서 빠른 프리뷰"
                className="h-full w-full bg-white"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
