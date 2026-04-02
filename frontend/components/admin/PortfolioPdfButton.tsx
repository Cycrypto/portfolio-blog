"use client"

import { useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { downloadPortfolioPdf } from "@/lib/portfolio/download-portfolio-pdf"

export function PortfolioPdfButton() {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      await downloadPortfolioPdf()
      toast({
        title: "다운로드 시작",
        description: "제출용 포트폴리오 PDF를 내려받고 있습니다.",
      })
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description:
          error instanceof Error
            ? error.message
            : "포트폴리오 PDF를 생성하지 못했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownload}
      disabled={isDownloading}
      className="border-brand-blue-200 bg-white"
    >
      <Download className="h-4 w-4" />
      {isDownloading ? "생성 중..." : "포트폴리오 PDF"}
    </Button>
  )
}
