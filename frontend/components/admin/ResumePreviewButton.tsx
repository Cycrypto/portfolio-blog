"use client"

import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ResumePreviewButtonProps {
  className?: string
}

export function ResumePreviewButton({ className }: ResumePreviewButtonProps) {
  return (
    <Button variant="outline" size="sm" className={className} asChild>
      <a href="/resume" target="_blank" rel="noreferrer">
        <FileText className="mr-2 h-4 w-4" />
        웹 미리보기
      </a>
    </Button>
  )
}
