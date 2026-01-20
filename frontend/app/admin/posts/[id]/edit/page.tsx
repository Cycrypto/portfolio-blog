"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Save, Upload, X, Plus, Settings2 } from "lucide-react"
import Link from "next/link"
import { getPostForEdit, updatePost, PostEdit, UpdatePostRequest, uploadMedia } from "@/lib/api"
import { use } from "react"
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { TiptapViewer } from "@/components/editor/TiptapViewer"
import { JSONContent } from "@tiptap/react"

const EMPTY_CONTENT: JSONContent = { type: "doc", content: [{ type: "paragraph" }] }

interface EditPostPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [post, setPost] = useState<PostEdit | null>(null)
  const [title, setTitle] = useState("")
  const [contentJson, setContentJson] = useState<JSONContent>(EMPTY_CONTENT)
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [status, setStatus] = useState("draft")
  const [featuredImage, setFeaturedImage] = useState("")
  const [readTime, setReadTime] = useState(8)
  const [author, setAuthor] = useState("")
  const [contentType, setContentType] = useState<"tiptap" | "markdown">("tiptap")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newTag, setNewTag] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
        setStatus(postData.status)
        setFeaturedImage(postData.image || "")
        setReadTime(postData.readTime)
        setAuthor(postData.author || "")
      } catch (err) {
        setError('포스트를 불러오는데 실패했습니다.')
        console.error('Error fetching post:', err)
      }
    }

    fetchPost()
  }, [id])

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSave = async (saveStatus: string) => {
    console.log('handleSave called with status:', saveStatus)
    console.log('Current id:', id)

    if (!title.trim()) {
      setError("제목을 입력해주세요.")
      return
    }

    if (!category) {
      setError("카테고리를 선택해주세요.")
      return
    }

    if (!author.trim()) {
      setError("작성자를 입력해주세요.")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      
      // 실제로 변경된 필드만 포함하는 객체 생성
      const postData: UpdatePostRequest = {}
      
      // 제목이 변경되었는지 확인
      if (title.trim() !== post?.title) {
        postData.title = title.trim()
      }

      if (contentType === "tiptap") {
        const nextContentJson = contentJson || EMPTY_CONTENT
        const previousJson = post?.contentJson || null
        if (JSON.stringify(nextContentJson) !== JSON.stringify(previousJson)) {
          postData.contentType = "tiptap"
          postData.contentJson = nextContentJson
        }
      }

      
      // 이미지가 변경되었는지 확인
      if (featuredImage.trim() !== (post?.image || '')) {
        postData.image = featuredImage.trim() || undefined
      }

      if (author.trim() !== (post?.author || '')) {
        postData.author = author.trim()
      }
      
      // 태그가 변경되었는지 확인
      const currentTags = post?.tags || []
      const newTags = tags
      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        postData.tags = newTags.length > 0 ? newTags : undefined
      }
      
      // 상태가 변경되었는지 확인
      if (saveStatus !== post?.status) {
        postData.status = saveStatus
      }
      
      // 카테고리가 변경되었는지 확인
      if (category !== post?.category) {
        postData.category = category
      }
      
      // 읽는 시간이 변경되었는지 확인
      if (readTime !== post?.readTime) {
        postData.readTime = readTime
      }
      
      // 변경된 필드가 없으면 에러 메시지 표시
      if (Object.keys(postData).length === 0) {
        setError('변경된 내용이 없습니다.')
        setIsLoading(false)
        return
      }
      
      console.log('Changed fields:', Object.keys(postData))
      console.log('Original post:', post)
      console.log('Current form values:', { title, featuredImage, tags, status: saveStatus, category, readTime })

      console.log('Sending postData:', postData)
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/posts/${id}`)
      console.log('Environment check - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)

      const result = await updatePost(id, postData)
      console.log('Update result:', result)
      
      setSuccess('포스트가 성공적으로 수정되었습니다!')
      console.log('Update successful, redirecting...')
      // 성공 메시지 표시 후 포스트 목록으로 이동
      setTimeout(() => {
        router.push('/admin/posts')
      }, 1000)
    } catch (err) {
      console.error('Error in handleSave:', err)
      setError('포스트 수정에 실패했습니다.')
      console.error('Error updating post:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">포스트를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full">
        <div className="sticky top-0 z-20 bg-white border-b border-brand-indigo-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/posts">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  나가기
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
            <Button
              onClick={() => handleSave("draft")}
              variant="outline"
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "저장 중..." : "임시저장"}
            </Button>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings2 className="w-4 h-4 mr-2" />
                  게시 설정
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>게시 설정</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="author">작성자</Label>
                      <Input
                        id="author"
                        placeholder="작성자 이름을 입력하세요"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="read-time">예상 읽기 시간(분)</Label>
                      <Input
                        id="read-time"
                        type="number"
                        min={1}
                        value={readTime}
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          setReadTime(Number.isNaN(value) ? 1 : Math.max(1, value))
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">상태</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">임시저장</SelectItem>
                        <SelectItem value="published">게시</SelectItem>
                        <SelectItem value="scheduled">예약 게시</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div>
                    <Label htmlFor="category">카테고리</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
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
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="태그 입력"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                      />
                      <Button onClick={addTag} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label htmlFor="featured-image">대표 이미지</Label>
                    <div className="space-y-2">
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
                            setIsLoading(true)
                            const url = await uploadMedia(file)
                            setFeaturedImage(url)
                          } catch (err) {
                            setError('이미지 업로드에 실패했습니다.')
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isLoading ? '업로드 중...' : '이미지 업로드'}
                      </Button>
                      {featuredImage && (
                        <div className="border rounded-lg p-2">
                          <img
                            src={featuredImage || "/placeholder.svg"}
                            alt="대표 이미지 미리보기"
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {error && (
                    <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
                      {success}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave("published")}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? "수정 중..." : "수정하기"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto px-8 py-12">
          <textarea
            id="title"
            placeholder="제목 없음"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
            className="w-full text-7xl font-black border-0 px-0 py-0 mb-8 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-slate-700 leading-tight resize-none overflow-hidden"
            style={{ fontSize: '4.5rem' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = target.scrollHeight + 'px'
            }}
          />

          {contentType === "markdown" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                이 글은 Markdown 레거시 포스트입니다. JSON 변환 후 편집할 수 있습니다.
              </p>
              {post?.contentHtml ? (
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
            />
          )}
        </div>
      </div>
    </div>
  )
} 
