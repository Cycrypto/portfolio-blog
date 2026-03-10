"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Edit, Eye, FileText, PlusCircle, RefreshCw, Search, Trash2, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getPosts, deletePost, Post } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { AdminShell } from "@/components/admin/AdminShell"

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const { posts: list } = await getPosts()
      setPosts(list)
    } catch (err) {
      setError("게시물을 불러오는데 실패했습니다.")
      console.error("Error fetching posts:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId: number, postTitle: string) => {
    if (!confirm(`"${postTitle}" 포스트를 정말 삭제하시겠습니까?`)) {
      return
    }

    try {
      setDeletingId(postId)
      await deletePost(postId.toString())

      toast({
        title: "삭제 성공",
        description: "포스트가 성공적으로 삭제되었습니다.",
      })

      await fetchPosts()
    } catch (err) {
      toast({
        title: "삭제 실패",
        description: "포스트 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      console.error("Error deleting post:", err)
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    const handleFocus = () => {
      fetchPosts()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])

  const filteredPosts = posts.filter((post) => {
    const matchSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === "all" ? true : post.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <AdminShell
      active="posts"
      title="블로그 포스트 관리"
      description="포스트 생성, 수정, 삭제를 관리합니다"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={fetchPosts} disabled={loading} className="border-brand-blue-200">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
          <Button asChild className="bg-brand-blue-600 text-white hover:bg-brand-blue-700">
            <Link href="/admin/posts/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              새 포스트 작성
            </Link>
          </Button>
        </div>
      }
    >
      <Card className="surface-default shadow-none">
        <CardHeader className="border-b border-brand-blue-100">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-xl text-neutral-slate-800">포스트 목록</CardTitle>
              <CardDescription>총 {filteredPosts.length}개의 포스트</CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-slate-400" />
                <Input
                  placeholder="포스트 검색..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="published">게시됨</SelectItem>
                  <SelectItem value="draft">임시저장</SelectItem>
                  <SelectItem value="scheduled">예약</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-brand-blue-600" />
              <div className="text-neutral-slate-500">게시물을 불러오는 중...</div>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-14 w-14 text-neutral-slate-300" />
              <p className="text-neutral-slate-500">등록된 게시물이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>게시일</TableHead>
                    <TableHead>조회수</TableHead>
                    <TableHead>댓글</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-neutral-slate-800">{post.title}</div>
                          <div className="mt-1 flex items-center text-xs text-neutral-slate-500">
                            <User className="mr-1 h-3 w-3" />
                            {post.author}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={post.status === "published" ? "default" : post.status === "draft" ? "secondary" : "outline"}>
                          {post.status === "published" ? "게시됨" : post.status === "draft" ? "임시저장" : "예약"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-neutral-slate-600">
                          <Calendar className="mr-1 h-3 w-3" />
                          {post.publishDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-neutral-slate-600">
                          <Eye className="mr-1 h-3 w-3" />
                          {post.views.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-neutral-slate-600">
                          <Edit className="mr-1 h-3 w-3" />
                          {post.comments}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/blog/${post.id}`}>
                                    <Eye className="mr-1 h-3 w-3" />
                                    보기
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>포스트 상세 보기</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/admin/posts/${post.id}/edit`}>
                                    <Edit className="mr-1 h-3 w-3" />
                                    수정
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>포스트 수정</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(post.id, post.title)}
                                  disabled={deletingId === post.id}
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  {deletingId === post.id ? (
                                    "삭제 중..."
                                  ) : (
                                    <>
                                      <Trash2 className="mr-1 h-3 w-3" />
                                      삭제
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>포스트 삭제</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  )
}
