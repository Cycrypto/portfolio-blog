"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { JSONContent } from "@tiptap/react"
import { ArrowLeft, Clock3, FileText, Plus, Save, Settings2, Upload, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { createPost, uploadMedia } from "@/lib/api"
import { normalizeImageUrl } from "@/lib/utils/image"
import { calculateEditorMetrics } from "@/lib/posts/editor-metrics"
import { CreatePostRequest } from "@/lib/types/api"

const EMPTY_CONTENT: JSONContent = { type: "doc", content: [{ type: "paragraph" }] }
const DRAFT_STORAGE_KEY = "blog:new-post-draft-v2"
const DEFAULT_AUTHOR = "박준하"
const DEFAULT_CATEGORY = "backend"

type SaveStatus = "draft" | "published"

interface StoredDraft {
  title: string
  contentJson: JSONContent
  category: string
  tags: string[]
  featuredImage: string
  readTime: number | ""
  isReadTimeManual: boolean
  updatedAt: string
}

const getActionLabel = (status: SaveStatus, isSaving: boolean) => {
  if (!isSaving) {
    return status === "draft" ? "임시저장" : "게시하기"
  }

  return status === "draft" ? "저장 중..." : "게시 중..."
}

export default function NewPost() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [contentJson, setContentJson] = useState<JSONContent>(EMPTY_CONTENT)
  const [category, setCategory] = useState(DEFAULT_CATEGORY)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")
  const [readTime, setReadTime] = useState<number | "">(8)
  const [isReadTimeManual, setIsReadTimeManual] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const metrics = useMemo(() => calculateEditorMetrics(contentJson), [contentJson])
  const normalizedFeaturedImage = useMemo(() => normalizeImageUrl(featuredImage), [featuredImage])

  const hasUnsavedChanges =
    title.trim().length > 0 ||
    metrics.characterCount > 0 ||
    category !== DEFAULT_CATEGORY ||
    tags.length > 0 ||
    !!normalizedFeaturedImage ||
    (typeof readTime === "number" && readTime !== metrics.estimatedReadTime)

  const addTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleExit = () => {
    if (hasUnsavedChanges && !confirm("저장되지 않은 변경사항이 있습니다. 나가시겠습니까?")) {
      return
    }
    router.push("/admin/posts")
  }

  const handleSave = useCallback(
    async (saveStatus: SaveStatus) => {
      if (!title.trim()) {
        setError("제목을 입력해주세요.")
        return
      }

      if (!category.trim()) {
        setError("카테고리를 선택해주세요.")
        return
      }

      try {
        setIsSaving(true)
        setError(null)

        const postData: CreatePostRequest = {
          title: title.trim(),
          contentType: "tiptap",
          contentJson,
          image: normalizedFeaturedImage,
          tags: tags.length > 0 ? tags : undefined,
          status: saveStatus,
          author: DEFAULT_AUTHOR,
          category,
          publishDate: new Date().toISOString(),
          readTime: typeof readTime === "number" && !Number.isNaN(readTime) ? readTime : metrics.estimatedReadTime,
        }

        const createdPost = await createPost(postData)
        localStorage.removeItem(DRAFT_STORAGE_KEY)

        if (saveStatus === "draft") {
          router.push(`/admin/posts/${createdPost.id}/edit`)
          return
        }

        router.push("/admin/posts")
      } catch (err) {
        console.error("Error creating post:", err)
        setError(`게시물 저장에 실패했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`)
      } finally {
        setIsSaving(false)
      }
    },
    [title, category, contentJson, normalizedFeaturedImage, tags, readTime, metrics.estimatedReadTime, router],
  )

  useEffect(() => {
    if (!isReadTimeManual) {
      setReadTime(metrics.estimatedReadTime)
    }
  }, [isReadTimeManual, metrics.estimatedReadTime])

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as StoredDraft
      setTitle(parsed.title || "")
      setContentJson(parsed.contentJson || EMPTY_CONTENT)
      setCategory(parsed.category || DEFAULT_CATEGORY)
      setTags(Array.isArray(parsed.tags) ? parsed.tags : [])
      setFeaturedImage(parsed.featuredImage || "")
      if (typeof parsed.readTime === "number" || parsed.readTime === "") {
        setReadTime(parsed.readTime)
      }
      setIsReadTimeManual(Boolean(parsed.isReadTimeManual))
      setLastDraftSavedAt(parsed.updatedAt || null)
      setRestoredDraft(true)
    } catch (e) {
      console.error("Failed to parse local draft", e)
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (!hasUnsavedChanges) {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      return
    }

    const timer = window.setTimeout(() => {
      const payload: StoredDraft = {
        title,
        contentJson,
        category,
        tags,
        featuredImage,
        readTime,
        isReadTimeManual,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload))
      setLastDraftSavedAt(payload.updatedAt)
    }, 600)

    return () => window.clearTimeout(timer)
  }, [title, contentJson, category, tags, featuredImage, readTime, isReadTimeManual, hasUnsavedChanges])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || isSaving) {
        return
      }
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges, isSaving])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault()
        if (!isSaving && !isUploadingImage) {
          void handleSave("draft")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave, isSaving, isUploadingImage])

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        <div className="sticky top-0 z-20 border-b border-brand-indigo-500 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" onClick={handleExit}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              나가기
            </Button>

            <div className="hidden items-center gap-3 text-xs text-neutral-slate-500 md:flex">
              <span className="inline-flex items-center rounded-full border border-brand-blue-200 bg-brand-blue-50 px-2 py-1 text-brand-blue-700">
                {hasUnsavedChanges ? "작성 중" : "초안 비어있음"}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> {metrics.characterCount}자
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" /> 예상 {metrics.estimatedReadTime}분
              </span>
              <span>Ctrl/Cmd+S</span>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => void handleSave("draft")} variant="outline" disabled={isSaving || isUploadingImage}>
                <Save className="mr-2 h-4 w-4" />
                {getActionLabel("draft", isSaving)}
              </Button>

              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={isSaving || isUploadingImage}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    게시 설정
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>게시 설정</DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-6">
                    <div className="rounded-md border border-brand-blue-100 bg-brand-blue-50 p-3 text-sm text-brand-blue-800">
                      작성자는 <strong>{DEFAULT_AUTHOR}</strong>로 자동 지정됩니다.
                    </div>

                    <div>
                      <Label htmlFor="read-time">예상 읽기 시간(분)</Label>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <Input
                          id="read-time"
                          type="number"
                          min={1}
                          value={readTime}
                          onChange={(e) => {
                            const value = e.target.value
                            setIsReadTimeManual(true)
                            setReadTime(value === "" ? "" : Math.max(1, Number.parseInt(value, 10) || 1))
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setReadTime(metrics.estimatedReadTime)
                            setIsReadTimeManual(false)
                          }}
                        >
                          자동값 {metrics.estimatedReadTime}분
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">카테고리</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" className="mt-2">
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="frontend">Frontend</SelectItem>
                          <SelectItem value="backend">Backend</SelectItem>
                          <SelectItem value="devops">DevOps</SelectItem>
                          <SelectItem value="cloud">Cloud</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>태그</Label>
                      <div className="mb-2 mt-2 flex gap-2">
                        <Input
                          placeholder="태그 입력"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
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
                          onChange={(e) => setFeaturedImage(e.target.value)}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            try {
                              setIsUploadingImage(true)
                              const url = await uploadMedia(file)
                              setFeaturedImage(url)
                            } catch (err) {
                              setError("이미지 업로드에 실패했습니다.")
                            } finally {
                              setIsUploadingImage(false)
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
                        {normalizedFeaturedImage && (
                          <div className="rounded-lg border p-2">
                            <img src={normalizedFeaturedImage} alt="대표 이미지 미리보기" className="h-32 w-full rounded object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>}

                    <Button
                      onClick={() => void handleSave("published")}
                      className="w-full"
                      disabled={isSaving || isUploadingImage}
                    >
                      {getActionLabel("published", isSaving)}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl px-8 py-8">
          {restoredDraft && (
            <div className="mb-4 rounded-md border border-brand-blue-200 bg-brand-blue-50 p-3 text-sm text-brand-blue-700">
              브라우저 임시 저장본을 복구했습니다.
            </div>
          )}

          {error && !settingsOpen && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>}

          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-neutral-slate-500">
            <span className="inline-flex items-center rounded-full border border-brand-blue-200 bg-white px-2 py-1 text-brand-blue-700">
              단어 {metrics.wordCount}
            </span>
            <span className="inline-flex items-center rounded-full border border-brand-blue-200 bg-white px-2 py-1 text-brand-blue-700">
              글자 {metrics.characterCount}
            </span>
            <span className="inline-flex items-center rounded-full border border-brand-blue-200 bg-white px-2 py-1 text-brand-blue-700">
              예상 {metrics.estimatedReadTime}분
            </span>
            {lastDraftSavedAt && (
              <span className="text-neutral-slate-400">
                브라우저 임시저장 {new Date(lastDraftSavedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          <textarea
            id="title"
            placeholder="제목 없음"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
            className="mb-8 w-full resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-7xl font-black leading-tight placeholder:text-neutral-slate-700 focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ fontSize: "4.5rem" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = "auto"
              target.style.height = `${target.scrollHeight}px`
            }}
          />

          <TiptapEditor content={contentJson} onChange={setContentJson} className="notion-fullscreen" />
        </div>
      </div>
    </div>
  )
}
