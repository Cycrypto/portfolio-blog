"use client"

import { useState } from "react"
import { RefreshCw, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Comment, getComments, deleteComment } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { AdminShell } from "@/components/admin/AdminShell"

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
    } catch {
      toast({ title: "불러오기 실패", description: "댓글 조회에 실패했습니다.", variant: "destructive" })
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!postId.trim()) return
    if (!confirm("댓글을 삭제하시겠습니까?")) return
    try {
      await deleteComment(postId.trim(), commentId)
      toast({ title: "삭제 완료", description: "댓글이 삭제되었습니다." })
      loadComments()
    } catch {
      toast({ title: "삭제 실패", description: "댓글 삭제 중 오류가 발생했습니다.", variant: "destructive" })
    }
  }

  return (
    <AdminShell active="comments" title="댓글 관리" description="포스트 ID 기준으로 댓글을 조회하고 삭제합니다">
      <Card className="surface-default shadow-none">
        <CardHeader className="border-b border-brand-blue-100">
          <CardTitle className="text-xl text-neutral-slate-800">댓글 조회</CardTitle>
          <CardDescription>포스트 ID를 입력 후 조회하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="포스트 ID" value={postId} onChange={(e) => setPostId(e.target.value)} />
            <Button
              onClick={loadComments}
              disabled={!postId.trim() || loading}
              className="bg-brand-blue-600 text-white hover:bg-brand-blue-700"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              조회
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-brand-blue-600" />
              <div className="text-neutral-slate-500">댓글을 불러오는 중...</div>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-neutral-slate-500">댓글이 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>작성자</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <div className="font-semibold text-neutral-slate-800">{comment.authorName}</div>
                        <div className="text-xs text-neutral-slate-500">{comment.authorEmail}</div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate text-neutral-slate-700">{comment.content}</div>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-slate-600">{new Date(comment.createdAt).toLocaleString("ko-KR")}</TableCell>
                      <TableCell>
                        <Badge variant={comment.isDeleted ? "secondary" : "default"}>{comment.isDeleted ? "삭제됨" : "활성"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
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
    </AdminShell>
  )
}
