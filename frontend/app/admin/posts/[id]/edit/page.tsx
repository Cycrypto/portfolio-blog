"use client"

import { use, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { JSONContent } from "@tiptap/react"
import { ArrowLeft, Clock3, FileText, Save, Settings2 } from "lucide-react"

import { AutoResizeTitleTextarea } from "@/components/admin/post-editor/AutoResizeTitleTextarea"
import { PostSettingsDialog } from "@/components/admin/post-editor/PostSettingsDialog"
import { Button } from "@/components/ui/button"
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { TiptapViewer } from "@/components/editor/TiptapViewer"
import { convertPostToTiptap, getPostForEdit, updatePost, type PostEdit, type UpdatePostRequest, uploadMedia } from "@/lib/api"
import { normalizeImageUrl } from "@/lib/utils/image"
import { calculateEditorMetrics } from "@/lib/posts/editor-metrics"

const EMPTY_CONTENT: JSONContent = { type: "doc", content: [{ type: "paragraph" }] }
const DEFAULT_AUTHOR = "박준하"

type SaveStatus = "draft" | "published" | "scheduled"

interface EditPostPageProps {
  params: Promise<{
    id: string
  }>
}

const getActionLabel = (status: SaveStatus, isSaving: boolean) => {
  if (!isSaving) {
    if (status === "draft") {
      return "임시저장"
    }

    if (status === "published") {
      return "게시 반영"
    }

    return "저장"
  }

  if (status === "draft") {
    return "저장 중..."
  }

  if (status === "published") {
    return "반영 중..."
  }

  return "저장 중..."
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
  const [isUploadingFeaturedImage, setIsUploadingFeaturedImage] = useState(false)
  const [isUploadingEditorMedia, setIsUploadingEditorMedia] = useState(false)
  const [isConvertingMarkdown, setIsConvertingMarkdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const metrics = useMemo(() => calculateEditorMetrics(contentJson), [contentJson])
  const normalizedFeaturedImage = useMemo(() => normalizeImageUrl(featuredImage), [featuredImage])
  const normalizedOriginalImage = useMemo(() => normalizeImageUrl(post?.image), [post?.image])
  const isUploadingMedia = isUploadingFeaturedImage || isUploadingEditorMedia
  const isBusy = isSaving || isUploadingMedia || isConvertingMarkdown

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

  const applyPostState = useCallback((postData: PostEdit) => {
    const nextContentJson = (postData.contentJson as JSONContent) || EMPTY_CONTENT
    const nextMetrics = calculateEditorMetrics(nextContentJson)

    setPost(postData)
    setTitle(postData.title)
    setContentType(postData.contentType)
    setContentJson(nextContentJson)
    setCategory(postData.category)
    setTags(postData.tags || [])
    setFeaturedImage(normalizeImageUrl(postData.image) || "")
    setReadTime(postData.readTime)
    setIsReadTimeManual(postData.readTime !== nextMetrics.estimatedReadTime)
  }, [])

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostForEdit(id)
        applyPostState(postData)
      } catch (err) {
        setError("포스트를 불러오는데 실패했습니다.")
        console.error("Error fetching post:", err)
      }
    }

    fetchPost()
  }, [id, applyPostState])

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

  const handleFeaturedImageUpload = useCallback(async (file: File) => {
    try {
      setIsUploadingFeaturedImage(true)
      setError(null)
      const url = await uploadMedia(file)
      setFeaturedImage(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.")
    } finally {
      setIsUploadingFeaturedImage(false)
    }
  }, [])

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

      if (isUploadingMedia) {
        setError("이미지 업로드가 끝난 뒤 다시 시도해주세요.")
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
        const refreshedPost = await getPostForEdit(id)
        applyPostState(refreshedPost)

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
      isUploadingMedia,
      applyPostState,
    ],
  )

  const editorDocumentActions = useMemo(
    () => ({
      openSettings: () => setSettingsOpen(true),
      saveDraft: () => void handleSave("draft"),
    }),
    [handleSave],
  )

  const handleConvertMarkdown = useCallback(async () => {
    if (!post || contentType !== "markdown") {
      return
    }

    if (!confirm("Markdown 레거시 글을 Tiptap 에디터 형식으로 변환하시겠습니까?")) {
      return
    }

    try {
      setIsConvertingMarkdown(true)
      setError(null)
      setSuccess(null)

      const metadataPayload = buildPostUpdatePayload(post.status as SaveStatus)
      const convertedPost = await convertPostToTiptap(id, metadataPayload)
      applyPostState(convertedPost)
      setSuccess("Markdown 글을 Tiptap 에디터 형식으로 변환했습니다.")
    } catch (err) {
      console.error("Error converting markdown post:", err)
      setError(err instanceof Error ? err.message : "Markdown 글 변환에 실패했습니다.")
    } finally {
      setIsConvertingMarkdown(false)
    }
  }, [post, contentType, buildPostUpdatePayload, id, applyPostState])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault()
        if (!isSaving && !isUploadingMedia && !isConvertingMarkdown) {
          void handleSave("draft")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave, isSaving, isUploadingMedia, isConvertingMarkdown])

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
              <Button onClick={() => void handleSave("draft")} variant="outline" disabled={isBusy}>
                <Save className="mr-2 h-4 w-4" />
                {getActionLabel("draft", isSaving)}
              </Button>

              <Button variant="outline" disabled={isBusy} onClick={() => setSettingsOpen(true)}>
                <Settings2 className="mr-2 h-4 w-4" />
                게시 설정
              </Button>
              <PostSettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                authorMessage={
                  <>
                    작성자는 <strong>{post.author || DEFAULT_AUTHOR}</strong>로 고정됩니다.
                  </>
                }
                readTime={readTime}
                estimatedReadTime={metrics.estimatedReadTime}
                isReadTimeManual={isReadTimeManual}
                onReadTimeChange={(value) => {
                  setIsReadTimeManual(true)
                  setReadTime(value)
                }}
                onReadTimeReset={() => {
                  setReadTime(metrics.estimatedReadTime)
                  setIsReadTimeManual(false)
                }}
                category={category}
                onCategoryChange={setCategory}
                tags={tags}
                onTagsChange={setTags}
                featuredImage={featuredImage}
                featuredImagePreview={normalizedFeaturedImage}
                onFeaturedImageChange={setFeaturedImage}
                onFeaturedImageUpload={handleFeaturedImageUpload}
                isUploadingImage={isUploadingFeaturedImage}
                isSaving={isBusy}
                error={error}
                footer={
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button onClick={() => void handleSave("draft")} variant="outline" disabled={isBusy}>
                      {getActionLabel("draft", isSaving)}
                    </Button>
                    <Button onClick={() => void handleSave("published")} disabled={isBusy}>
                      {getActionLabel("published", isSaving)}
                    </Button>
                  </div>
                }
              />
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

          <AutoResizeTitleTextarea value={title} onChange={setTitle} />

          {contentType === "markdown" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-900">이 글은 Markdown 레거시 포스트입니다.</p>
                  <p className="text-sm text-amber-800">
                    현재 화면에서 바로 Tiptap 에디터 형식으로 변환할 수 있습니다. 제목, 태그, 대표 이미지 같은 메타데이터 변경도 함께 반영됩니다.
                  </p>
                </div>
                <Button onClick={() => void handleConvertMarkdown()} disabled={isBusy}>
                  {isConvertingMarkdown ? "변환 중..." : "변환 후 계속 편집"}
                </Button>
              </div>
              {post.contentHtml ? (
                <div className="mt-4 rounded-lg bg-white p-4">
                  <TiptapViewer contentHtml={post.contentHtml} />
                </div>
              ) : null}
            </div>
          ) : (
            <TiptapEditor
              content={contentJson}
              onChange={setContentJson}
              className="notion-fullscreen"
              onError={setError}
              onUploadStateChange={setIsUploadingEditorMedia}
              documentActions={editorDocumentActions}
            />
          )}
        </div>
      </div>
    </div>
  )
}
