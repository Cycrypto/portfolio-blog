"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Upload, X, Plus, Settings2 } from "lucide-react"
import Link from "next/link"
import { createPost, uploadMedia } from "@/lib/api"
import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { JSONContent } from "@tiptap/react"

const EMPTY_CONTENT: JSONContent = { type: "doc", content: [{ type: "paragraph" }] }

export default function NewPost() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [contentJson, setContentJson] = useState<JSONContent>(EMPTY_CONTENT)
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [status, setStatus] = useState("draft")
  const [featuredImage, setFeaturedImage] = useState("")
  const [author, setAuthor] = useState("")
  const [readTime, setReadTime] = useState<number | "">(8)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

      const postData = {
        title: title.trim(),
        contentType: "tiptap",
        contentJson,
        image: featuredImage.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        status: saveStatus,
        author: author.trim(),
        category,
        publishDate: new Date().toISOString(),
        readTime: typeof readTime === "number" && !Number.isNaN(readTime) ? readTime : 8,
      }

      console.log('Token in localStorage:', localStorage.getItem('token'))
      console.log('Sending post data:', JSON.stringify(postData, null, 2))
      await createPost(postData)

      // 성공 시 포스트 목록으로 이동
      router.push('/admin/posts')
    } catch (err) {
      console.error('Error creating post:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      setError(`게시물 저장에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
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
                          const value = e.target.value
                          setReadTime(value === "" ? "" : Math.max(1, parseInt(value)))
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
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave("published")}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? "게시 중..." : "게시하기"}
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

          <TiptapEditor
            content={contentJson}
            onChange={setContentJson}
            className="notion-fullscreen"
          />
        </div>
      </div>
    </div>
  )
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
