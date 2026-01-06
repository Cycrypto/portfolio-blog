"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, RefreshCw } from "lucide-react"
import { Comment, getComments, deleteComment } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default function AdminComments() {
  const [postId, setPostId] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadComments = async () => {
    if (!postId.trim()) return
    try {
      setLoading(true)
      const res = await getComments(postId.trim())
      const items = res?.data?.data || []
      setComments(Array.isArray(items) ? items : [])
    } catch (err) {
      toast({ title: '불러오기 실패', description: '댓글 조회에 실패했습니다.', variant: 'destructive' })
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 초기 자동 로드 없음
  }, [])

  const handleDelete = async (commentId: string) => {
    if (!postId.trim()) return
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await deleteComment(postId.trim(), commentId)
      toast({ title: '삭제 완료', description: '댓글이 삭제되었습니다.' })
      loadComments()
    } catch (err) {
      toast({ title: '삭제 실패', description: '댓글 삭제 중 오류가 발생했습니다.', variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <div className="flex">
        <AdminSidebar active="comments" />

        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-700 to-brand-blue-900">
              댓글 관리
            </h1>
            <p className="text-neutral-slate-600 mt-2 text-lg">포스트 ID로 댓글을 조회하고 삭제할 수 있습니다</p>
          </div>

          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <CardTitle className="text-xl font-bold text-brand-blue-900">댓글 조회</CardTitle>
              <CardDescription className="text-neutral-slate-600 mt-1">포스트 ID를 입력 후 조회하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="포스트 ID"
                  value={postId}
                  onChange={(e) => setPostId(e.target.value)}
                  className="border-brand-indigo-500/50"
                />
                <Button
                  onClick={loadComments}
                  disabled={!postId.trim() || loading}
                  className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0 shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  조회
                </Button>
              </div>

              {loading ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mb-4"></div>
                  <div className="text-neutral-slate-500">댓글을 불러오는 중...</div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-slate-500 text-lg">댓글이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-brand-blue-50/50 border-brand-indigo-500/20">
                        <TableHead className="font-bold text-brand-blue-900">작성자</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">내용</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">작성일</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">상태</TableHead>
                        <TableHead className="text-right font-bold text-brand-blue-900">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comments.map((comment) => (
                        <TableRow key={comment.id} className="hover:bg-brand-blue-50/30 transition-colors border-brand-indigo-500/10">
                          <TableCell>
                            <div className="font-semibold text-brand-blue-900">{comment.authorName}</div>
                            <div className="text-xs text-neutral-slate-500">{comment.authorEmail}</div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate text-neutral-slate-700">{comment.content}</div>
                          </TableCell>
                          <TableCell className="text-sm text-neutral-slate-600">
                            {new Date(comment.createdAt).toLocaleString('ko-KR')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={comment.isDeleted ? 'secondary' : 'default'}
                              className={comment.isDeleted
                                ? 'bg-neutral-slate-200 text-neutral-slate-700'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                              }
                            >
                              {comment.isDeleted ? '삭제됨' : '활성'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(comment.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              삭제
                            </Button>
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
