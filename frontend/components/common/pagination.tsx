"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === 1}
        onClick={() => onPageChange?.(currentPage - 1)}
        className="border-brand-blue-200 text-brand-blue-600 hover:bg-brand-blue-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="icon"
          onClick={() => onPageChange?.(page)}
          className={
            currentPage === page ? "bg-brand-blue-500 hover:bg-brand-blue-600" : "border-brand-blue-200 text-brand-blue-600 hover:bg-brand-blue-50"
          }
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        size="icon"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        className="border-brand-blue-200 text-brand-blue-600 hover:bg-brand-blue-50"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
