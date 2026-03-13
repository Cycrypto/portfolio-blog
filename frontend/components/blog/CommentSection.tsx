"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Edit, MessageCircle, Reply, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Comment, createComment, deleteComment, getComments, updateComment } from "@/lib/api"
import { trackEvent } from "@/lib/analytics/track"
import { TokenManager } from "@/lib/auth/token-manager"

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [authorPassword, setAuthorPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasAdminSession, setHasAdminSession] = useState(false)

  const hasAdminRole = (token: string | null) => {
    if (!token || !TokenManager.isTokenValid(token)) {
      return false
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      return Array.isArray(payload.roles) && payload.roles.includes("admin")
    } catch {
      return false
    }
  }

  useEffect(() => {
    void loadComments()
    setHasAdminSession(hasAdminRole(TokenManager.getToken()))
  }, [postId])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const response = await getComments(postId)
      const fetchedComments = response?.data?.data || []
      setComments(Array.isArray(fetchedComments) ? fetchedComments : [])
    } catch {
      toast.error("댓글을 불러오는데 실패했습니다.")
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  const resetEditor = () => {
    setEditingComment(null)
    setEditContent("")
    setEditPassword("")
  }

  const hasWriterCredentials = () => {
    if (!authorName.trim() || !authorPassword.trim()) {
      toast.error("이름과 비밀번호를 입력해주세요.")
      return false
    }

    return true
  }

  const handleCreate = async (content: string, parentId?: string) => {
    if (!hasWriterCredentials() || !content.trim()) {
      toast.error(parentId ? "이름, 비밀번호, 답글을 모두 입력해주세요." : "이름, 비밀번호, 댓글을 모두 입력해주세요.")
      return
    }

    setIsSubmitting(true)

    try {
      await createComment({
        postId,
        parentId,
        content: content.trim(),
        authorName: authorName.trim(),
        password: authorPassword.trim(),
      })

      trackEvent("comment_submit_success", {
        post_id: postId,
        is_reply: Boolean(parentId),
      })

      toast.success(parentId ? "답글이 등록되었습니다." : "댓글이 등록되었습니다.")

      if (parentId) {
        setReplyTo(null)
        setReplyContent("")
      } else {
        setNewComment("")
      }

      setAuthorPassword("")
      await loadComments()
    } catch (error) {
      if (error instanceof Error && error.message.includes("삭제된 댓글")) {
        toast.error("삭제된 댓글에는 답글을 작성할 수 없습니다.")
        await loadComments()
        return
      }

      toast.error(error instanceof Error ? error.message : "댓글 등록에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSave = async (commentId: string) => {
    if (!editContent.trim() || !editPassword.trim()) {
      toast.error("수정할 내용과 비밀번호를 입력해주세요.")
      return
    }

    setIsSavingEdit(true)

    try {
      await updateComment(postId, commentId, {
        content: editContent.trim(),
        password: editPassword.trim(),
      })

      toast.success("댓글이 수정되었습니다.")
      resetEditor()
      await loadComments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "댓글 수정에 실패했습니다.")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async (commentId: string, label: string) => {
    if (!confirm(`${label}을 삭제하시겠습니까?`)) {
      return
    }

    let password: string | undefined

    if (!hasAdminSession) {
      const providedPassword = window.prompt("댓글 작성 시 설정한 비밀번호를 입력해주세요.")

      if (providedPassword === null) {
        return
      }

      password = providedPassword.trim()
      if (!password) {
        toast.error("비밀번호를 입력해주세요.")
        return
      }
    }

    try {
      await deleteComment(postId, commentId, password)
      toast.success(`${label}이 삭제되었습니다.`)

      if (editingComment === commentId) {
        resetEditor()
      }
      if (replyTo === commentId) {
        setReplyTo(null)
        setReplyContent("")
      }

      await loadComments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${label} 삭제에 실패했습니다.`)
    }
  }

  const renderComment = (comment: Comment, depth = 0): React.ReactNode => {
    const indent = Math.min(depth, 4) * 24

    return (
      <div key={comment.id} className="space-y-4" style={{ marginLeft: indent }}>
        <div className="flex gap-4">
          <Avatar className={depth > 1 ? "h-7 w-7" : depth > 0 ? "h-8 w-8" : "h-10 w-10"}>
            <AvatarFallback className={depth > 0 ? "text-xs" : undefined}>
              {comment.authorName?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`font-medium text-neutral-slate-800 ${depth > 1 ? "text-sm" : ""}`}>
                {comment.authorName}
              </span>
              <span className={`text-neutral-slate-500 ${depth > 1 ? "text-xs" : "text-sm"}`}>
                {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-3 rounded-xl border border-brand-blue-100 bg-white/70 p-4">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[96px]"
                  placeholder="수정할 내용을 입력해주세요."
                />
                <Input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="댓글 작성 때 입력한 비밀번호"
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => void handleEditSave(comment.id)} disabled={isSavingEdit}>
                    {isSavingEdit ? "저장 중..." : "저장"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resetEditor}>
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <p className={`text-neutral-slate-700 ${depth > 1 ? "text-sm" : ""}`}>{comment.content}</p>
            )}

            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-neutral-slate-500 hover:text-brand-blue-500"
                onClick={() => {
                  setReplyTo(comment.id)
                  setReplyContent("")
                }}
              >
                <Reply className="mr-1 h-4 w-4" />
                답글
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-neutral-slate-500 hover:text-brand-blue-500"
                onClick={() => {
                  setEditingComment(comment.id)
                  setEditContent(comment.content)
                  setEditPassword("")
                }}
              >
                <Edit className="mr-1 h-4 w-4" />
                수정
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-neutral-slate-500 hover:text-red-500"
                onClick={() => void handleDelete(comment.id, depth === 0 ? "댓글" : "답글")}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                삭제
              </Button>
            </div>

            {replyTo === comment.id && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleCreate(replyContent, comment.id)
                }}
                className="space-y-3 rounded-xl border border-brand-blue-100 bg-white/70 p-4"
              >
                <Textarea
                  placeholder="답글을 남겨보세요."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[88px] bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "등록 중..." : "답글 남기기"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyTo(null)
                      setReplyContent("")
                    }}
                  >
                    취소
                  </Button>
                </div>
              </form>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="space-y-4">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-neutral-slate-600" />
        <h3 className="text-xl font-semibold text-neutral-slate-800">댓글 {comments.length}개</h3>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleCreate(newComment)
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input placeholder="표시할 이름" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          <Input
            placeholder="수정/삭제용 비밀번호"
            type="password"
            value={authorPassword}
            onChange={(e) => setAuthorPassword(e.target.value)}
          />
        </div>
        <p className="text-sm text-neutral-slate-500">입력한 비밀번호는 댓글을 수정하거나 삭제할 때 다시 사용됩니다.</p>
        <Textarea
          placeholder="의견을 남겨보세요."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px] border-brand-blue-200 bg-white/50 focus:border-brand-indigo-600"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim() || !authorName.trim() || !authorPassword.trim() || isSubmitting}
            className="bg-brand-blue-500 hover:bg-brand-blue-600"
          >
            {isSubmitting ? "등록 중..." : "댓글 남기기"}
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="text-neutral-slate-500">댓글을 불러오는 중입니다...</div>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <div className="py-8 text-center">
            <div className="text-neutral-slate-500">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</div>
          </div>
        )}
      </div>
    </div>
  )
}
