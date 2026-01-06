"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Search, Edit, Trash2, Eye, Calendar, User, RefreshCw, FileText } from "lucide-react"
import Link from "next/link"
import { getPosts, deletePost, Post } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

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
      const { posts, totalCount } = await getPosts()
      setPosts(posts)
    } catch (err) {
      setError('게시물을 불러오는데 실패했습니다.')
      console.error('Error fetching posts:', err)
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
      console.error('Error deleting post:', err)
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const filteredPosts = posts.filter((post) => {
    const matchSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === "all" ? true : post.status === statusFilter
    return matchSearch && matchStatus
  })

  useEffect(() => {
    const handleFocus = () => {
      fetchPosts()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <div className="flex">
        <AdminSidebar active="posts" />

        <div className="flex-1 p-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-700 to-brand-blue-900">
                  블로그 포스트 관리
                </h1>
                <p className="text-neutral-slate-600 mt-2 text-lg">블로그 포스트를 생성, 수정, 삭제할 수 있습니다</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchPosts}
                  disabled={loading}
                  className="border-brand-indigo-500"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  새로고침
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0 shadow-md"
                >
                  <Link href="/admin/posts/new">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    새 포스트 작성
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-brand-blue-900">포스트 목록</CardTitle>
                  <CardDescription className="text-neutral-slate-600 mt-1">
                    총 {filteredPosts.length}개의 포스트
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-slate-400 w-4 h-4" />
                    <Input
                      placeholder="포스트 검색..."
                      className="pl-10 border-brand-indigo-500/50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 border-brand-indigo-500/50">
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
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mb-4"></div>
                  <div className="text-neutral-slate-500">게시물을 불러오는 중...</div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-neutral-slate-300 mb-4" />
                  <p className="text-neutral-slate-500 text-lg">등록된 게시물이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-brand-blue-50/50 border-brand-indigo-500/20">
                        <TableHead className="font-bold text-brand-blue-900">제목</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">상태</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">카테고리</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">게시일</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">조회수</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">댓글</TableHead>
                        <TableHead className="text-right font-bold text-brand-blue-900">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPosts.map((post) => (
                        <TableRow
                          key={post.id}
                          className="hover:bg-brand-blue-50/30 transition-colors border-brand-indigo-500/10"
                        >
                          <TableCell>
                            <div>
                              <div className="font-semibold text-brand-blue-900">{post.title}</div>
                              <div className="text-sm text-neutral-slate-500 flex items-center mt-1">
                                <User className="w-3 h-3 mr-1" />
                                {post.author}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                post.status === "published" ? "default" : post.status === "draft" ? "secondary" : "outline"
                              }
                              className={
                                post.status === "published"
                                  ? "bg-green-500 hover:bg-green-600 text-white"
                                  : post.status === "draft"
                                    ? "bg-neutral-slate-200 text-neutral-slate-700"
                                    : "border-neutral-slate-300 text-neutral-slate-600"
                              }
                            >
                              {post.status === "published" ? "게시됨" : post.status === "draft" ? "임시저장" : "예약"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-brand-indigo-500 text-brand-blue-700 bg-brand-blue-50/50"
                            >
                              {post.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-neutral-slate-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              {post.publishDate}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-neutral-slate-600">
                              <Eye className="w-3 h-3 mr-1" />
                              {post.views.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-neutral-slate-600">
                              <Edit className="w-3 h-3 mr-1" />
                              {post.comments}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <div className="flex justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
                                    >
                                      <Link href={`/blog/${post.id}`}>
                                        <Eye className="w-3 h-3 mr-1" />
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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
                                    >
                                      <Link href={`/admin/posts/${post.id}/edit`}>
                                        <Edit className="w-3 h-3 mr-1" />
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
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                                    >
                                      {deletingId === post.id ? (
                                        "삭제 중..."
                                      ) : (
                                        <>
                                          <Trash2 className="w-3 h-3 mr-1" />
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
        </div>
      </div>
    </div>
  )
}
