"use client"

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { TiptapViewer } from "@/components/editor/TiptapViewer"
import { getPostForEdit, updatePost, type PostEdit, type UpdatePostRequest, uploadMedia } from "@/lib/api"
import { normalizeImageUrl } from "@/lib/utils/image"
import { calculateEditorMetrics } from "@/lib/posts/editor-metrics"

const EMPTY_CONTENT: JSONContent = { type: "doc", content: [{ type: "paragraph" }] }
const DEFAULT_AUTHOR = "박준하"

type SaveStatus = "draft" | "published"

interface EditPostPageProps {
  params: Promise<{
    id: string
  }>
}

const getActionLabel = (status: SaveStatus, isSaving: boolean) => {
  if (!isSaving) {
    return status === "draft" ? "임시저장" : "게시 반영"
  }

  return status === "draft" ? "저장 중..." : "반영 중..."
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter()
  const { id } = use(params)

  const [post, setPost] = useState<PostEdit | null>(null)
  const [title, setTitle] = useState("")
  const [contentJson, setContentJson] = useState<JSONContent>(EMPTY_CONTENT)
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [featuredImage, setFeaturedImage] = useState("")
  const [readTime, setReadTime] = useState<number | "">(8)
  const [isReadTimeManual, setIsReadTimeManual] = useState(false)
  const [contentType, setContentType] = useState<"tiptap" | "markdown">("tiptap")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newTag, setNewTag] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const metrics = useMemo(() => calculateEditorMetrics(contentJson), [contentJson])
  const normalizedFeaturedImage = useMemo(() => normalizeImageUrl(featuredImage), [featuredImage])
  const normalizedOriginalImage = useMemo(() => normalizeImageUrl(post?.image), [post?.image])

  const originalTagsKey = useMemo(() => [...(post?.tags || [])].sort().join("|"), [post?.tags])
  const currentTagsKey = useMemo(() => [...tags].sort().join("|"), [tags])

  const isContentChanged = useMemo(() => {
    if (!post || contentType !== "tiptap") {
      return false
    }

    const previousJson = (post.contentJson as JSONContent) || EMPTY_CONTENT
    return JSON.stringify(contentJson || EMPTY_CONTENT) !== JSON.stringify(previousJson)
  }, [post, contentType, contentJson])

  const resolvedReadTime = typeof readTime === "number" && !Number.isNaN(readTime) ? readTime : metrics.estimatedReadTime

  const hasUnsavedChanges =
    !!post &&
    (title.trim() !== post.title ||
      category !== post.category ||
      currentTagsKey !== originalTagsKey ||
      normalizedFeaturedImage !== normalizedOriginalImage ||
      resolvedReadTime !== post.readTime ||
      isContentChanged)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostForEdit(id)
        setPost(postData)
        setTitle(postData.title)
        setContentType(postData.contentType)
        setContentJson((postData.contentJson as JSONContent) || EMPTY_CONTENT)
        setCategory(postData.category)
        setTags(postData.tags || [])
        setFeaturedImage(normalizeImageUrl(postData.image) || "")
        setReadTime(postData.readTime)
      } catch (err) {
        setError("포스트를 불러오는데 실패했습니다.")
        console.error("Error fetching post:", err)
      }
    }

    fetchPost()
  }, [id])

  useEffect(() => {
    if (hasUnsavedChanges && success) {
      setSuccess(null)
    }
  }, [hasUnsavedChanges, success])

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

  const handleExit = () => {
    if (hasUnsavedChanges && !confirm("저장되지 않은 변경사항이 있습니다. 나가시겠습니까?")) {
      return
    }
    router.push("/admin/posts")
  }

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

  const buildPostUpdatePayload = useCallback(
    (saveStatus: SaveStatus): UpdatePostRequest => {
      if (!post) return {}

      const payload: UpdatePostRequest = {}

      if (title.trim() !== post.title) {
        payload.title = title.trim()
      }

      if (contentType === "tiptap" && isContentChanged) {
        payload.contentType = "tiptap"
        payload.contentJson = contentJson || EMPTY_CONTENT
      }

      if (category !== post.category) {
        payload.category = category
      }

      if (currentTagsKey !== originalTagsKey) {
        payload.tags = tags.length > 0 ? tags : undefined
      }

      if (normalizedFeaturedImage !== normalizedOriginalImage) {
        payload.image = normalizedFeaturedImage
      }

      if (resolvedReadTime !== post.readTime) {
        payload.readTime = resolvedReadTime
      }

      if (saveStatus !== post.status) {
        payload.status = saveStatus
      }

      if (!post.author?.trim()) {
        payload.author = DEFAULT_AUTHOR
      }

      return payload
    },
    [
      post,
      title,
      contentType,
      isContentChanged,
      contentJson,
      category,
      currentTagsKey,
      originalTagsKey,
      tags,
      normalizedFeaturedImage,
      normalizedOriginalImage,
      resolvedReadTime,
    ],
  )

  const handleSave = useCallback(
    async (saveStatus: SaveStatus) => {
      if (!post) return

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

        const postData = buildPostUpdatePayload(saveStatus)

        if (Object.keys(postData).length === 0) {
          setError("변경된 내용이 없습니다.")
          return
        }

        await updatePost(id, postData)

        setPost((prev) => {
          if (!prev) return prev

          return {
            ...prev,
            title: title.trim(),
            contentType,
            contentJson: contentType === "tiptap" ? (contentJson || EMPTY_CONTENT) : prev.contentJson,
            category,
            tags: [...tags],
            image: normalizedFeaturedImage || "",
            readTime: resolvedReadTime,
            status: saveStatus,
            author: prev.author || DEFAULT_AUTHOR,
          }
        })

        setSuccess(saveStatus === "draft" ? "임시저장을 완료했습니다." : "게시 반영을 완료했습니다.")
      } catch (err) {
        console.error("Error updating post:", err)
        setError("포스트 수정에 실패했습니다.")
      } finally {
        setIsSaving(false)
      }
    },
    [
      post,
      title,
      category,
      buildPostUpdatePayload,
      id,
      contentType,
      contentJson,
      tags,
      normalizedFeaturedImage,
      resolvedReadTime,
    ],
  )

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

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">포스트를 불러오는 중...</div>
      </div>
    )
  }

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
                {hasUnsavedChanges ? "저장 필요" : "동기화됨"}
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
                      작성자는 <strong>{post.author || DEFAULT_AUTHOR}</strong>로 고정됩니다.
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
                      {isReadTimeManual && <p className="mt-2 text-xs text-neutral-slate-500">수동 값이 적용되어 있습니다.</p>}
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

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button onClick={() => void handleSave("draft")} variant="outline" disabled={isSaving || isUploadingImage}>
                        {getActionLabel("draft", isSaving)}
                      </Button>
                      <Button onClick={() => void handleSave("published")} disabled={isSaving || isUploadingImage}>
                        {getActionLabel("published", isSaving)}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl px-8 py-8">
          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>}
          {success && <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>}

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

          {contentType === "markdown" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">이 글은 Markdown 레거시 포스트입니다. JSON 변환 후 편집할 수 있습니다.</p>
              {post.contentHtml ? (
                <div className="mt-4 rounded-lg bg-white p-4">
                  <TiptapViewer contentHtml={post.contentHtml} />
                </div>
              ) : null}
            </div>
          ) : (
            <TiptapEditor content={contentJson} onChange={setContentJson} className="notion-fullscreen" />
          )}
        </div>
      </div>
    </div>
  )
}
