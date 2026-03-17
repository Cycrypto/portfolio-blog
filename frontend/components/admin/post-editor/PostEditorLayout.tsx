"use client"

import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { AutoResizeTitleTextarea } from "@/components/admin/post-editor/AutoResizeTitleTextarea"
import { Button } from "@/components/ui/button"

interface PostEditorLayoutProps {
  actions: ReactNode
  children: ReactNode
  metrics: {
    characterCount: number
    estimatedReadTime: number
    wordCount: number
  }
  notices?: ReactNode
  onExit: () => void
  secondaryMeta?: ReactNode
  statusLabel: string
  statusTone?: "neutral" | "accent"
  title: string
  onTitleChange: (value: string) => void
}

function getStatusToneClass(statusTone: "neutral" | "accent") {
  if (statusTone === "accent") {
    return "border-brand-blue-200 bg-brand-blue-50 text-brand-blue-700"
  }

  return "border-neutral-slate-200 bg-white text-neutral-slate-600"
}

export function PostEditorLayout({
  actions,
  children,
  metrics,
  notices,
  onExit,
  onTitleChange,
  secondaryMeta,
  statusLabel,
  statusTone = "accent",
  title,
}: PostEditorLayoutProps) {
  const statusToneClass = getStatusToneClass(statusTone)

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-neutral-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Button variant="ghost" size="sm" onClick={onExit} className="shrink-0 text-neutral-slate-600">
            <ArrowLeft className="h-4 w-4" />
            나가기
          </Button>

          <div className="hidden min-w-0 items-center justify-center md:flex">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusToneClass}`}>
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-12 pt-6 md:px-6 md:pt-8">
        {notices ? <div className="mb-5 space-y-3">{notices}</div> : null}

        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-neutral-slate-500">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-medium md:hidden ${statusToneClass}`}>
            {statusLabel}
          </span>
          <span className="inline-flex items-center rounded-full border border-brand-blue-200 bg-white px-2.5 py-1 text-brand-blue-700">
            단어 {metrics.wordCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-brand-blue-200 bg-white px-2.5 py-1 text-brand-blue-700">
            글자 {metrics.characterCount}
          </span>
          <span className="inline-flex items-center rounded-full border border-brand-blue-200 bg-white px-2.5 py-1 text-brand-blue-700">
            예상 {metrics.estimatedReadTime}분
          </span>
          {secondaryMeta}
        </div>

        <AutoResizeTitleTextarea value={title} onChange={onTitleChange} />

        <div className="mt-6">{children}</div>
      </main>
    </div>
  )
}
