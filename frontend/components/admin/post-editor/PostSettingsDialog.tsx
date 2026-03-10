"use client"

import { ReactNode, useRef, useState } from "react"
import { Plus, Upload, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { POST_CATEGORY_OPTIONS } from "@/lib/posts/post-editor-config"

interface PostSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authorMessage: ReactNode
  readTime: number | ""
  estimatedReadTime: number
  isReadTimeManual: boolean
  onReadTimeChange: (value: number | "") => void
  onReadTimeReset: () => void
  category: string
  onCategoryChange: (value: string) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
  featuredImage: string
  featuredImagePreview?: string
  onFeaturedImageChange: (value: string) => void
  onFeaturedImageUpload: (file: File) => Promise<void>
  isUploadingImage: boolean
  isSaving: boolean
  error?: string | null
  footer: ReactNode
}

export function PostSettingsDialog({
  open,
  onOpenChange,
  authorMessage,
  readTime,
  estimatedReadTime,
  isReadTimeManual,
  onReadTimeChange,
  onReadTimeReset,
  category,
  onCategoryChange,
  tags,
  onTagsChange,
  featuredImage,
  featuredImagePreview,
  onFeaturedImageChange,
  onFeaturedImageUpload,
  isUploadingImage,
  isSaving,
  error,
  footer,
}: PostSettingsDialogProps) {
  const [newTag, setNewTag] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const addTag = () => {
    const trimmed = newTag.trim()
    if (!trimmed || tags.includes(trimmed)) {
      return
    }

    onTagsChange([...tags, trimmed])
    setNewTag("")
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>게시 설정</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="rounded-md border border-brand-blue-100 bg-brand-blue-50 p-3 text-sm text-brand-blue-800">
            {authorMessage}
          </div>

          <div>
            <Label htmlFor="read-time">예상 읽기 시간(분)</Label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                id="read-time"
                type="number"
                min={1}
                value={readTime}
                onChange={(event) => {
                  const value = event.target.value
                  onReadTimeChange(value === "" ? "" : Math.max(1, Number.parseInt(value, 10) || 1))
                }}
              />
              <Button type="button" variant="outline" onClick={onReadTimeReset}>
                자동값 {estimatedReadTime}분
              </Button>
            </div>
            {isReadTimeManual && <p className="mt-2 text-xs text-neutral-slate-500">수동 값이 적용되어 있습니다.</p>}
          </div>

          <div>
            <Label htmlFor="category">카테고리</Label>
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger id="category" className="mt-2">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {POST_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>태그</Label>
            <div className="mb-2 mt-2 flex gap-2">
              <Input
                placeholder="태그 입력"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="featured-image">대표 이미지 (선택)</Label>
            <div className="mt-2 space-y-2">
              <Input
                id="featured-image"
                placeholder="https://example.com/image.jpg"
                value={featuredImage}
                onChange={(event) => onFeaturedImageChange(event.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return

                  try {
                    await onFeaturedImageUpload(file)
                  } finally {
                    event.currentTarget.value = ""
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving || isUploadingImage}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploadingImage ? "업로드 중..." : "이미지 업로드"}
              </Button>
              {featuredImagePreview && (
                <div className="rounded-lg border p-2">
                  <img src={featuredImagePreview} alt="대표 이미지 미리보기" className="h-32 w-full rounded object-cover" />
                </div>
              )}
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>}

          {footer}
        </div>
      </DialogContent>
    </Dialog>
  )
}
