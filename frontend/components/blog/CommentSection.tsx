"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Edit, MessageCircle, Reply, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ApiError,
  Comment,
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from "@/lib/api"
import { TokenManager } from "@/lib/auth/token-manager"

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [replyToReply, setReplyToReply] = useState<string | null>(null)
  const [replyToReplyContent, setReplyToReplyContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    loadComments()
    const token = TokenManager.getToken()
    setIsAuthed(!!token)
  }, [postId])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const response = await getComments(postId)
      const fetchedComments = response?.data?.data || []

      if (Array.isArray(fetchedComments)) {
        setComments(fetchedComments)
      } else {
        setComments([])
      }
    } catch (error) {
      toast.error("댓글을 불러오는데 실패했습니다.")
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  const maskEmail = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    const [localPart, domainPart] = normalizedEmail.split("@")

    if (!localPart || !domainPart || localPart.length <= 2) {
      return "***"
    }

    return `${localPart.slice(0, 2)}***@${domainPart}`
  }

  const getDeleteAuthorEmail = (comment: Comment) => {
    if (isAuthed) {
      return undefined
    }

    const normalizedEmail = authorEmail.trim().toLowerCase()
    if (!normalizedEmail) {
      return null
    }

    return maskEmail(normalizedEmail) === comment.authorEmail.toLowerCase() ? normalizedEmail : null
  }

  const canDeleteComment = (comment: Comment) => isAuthed || getDeleteAuthorEmail(comment) !== null

  const handleDelete = async (comment: Comment, label: string) => {
    const deleteAuthorEmail = getDeleteAuthorEmail(comment)

    if (!isAuthed && !deleteAuthorEmail) {
      toast.error("작성할 때 사용한 이메일을 입력하면 본인 댓글을 삭제할 수 있습니다.")
      return
    }

    if (!window.confirm(`${label}을 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteComment(postId, comment.id, deleteAuthorEmail ?? undefined)
      toast.success(`${label}이 삭제되었습니다.`)
      loadComments()
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        toast.error("본인이 작성한 댓글 또는 관리자만 삭제할 수 있습니다.")
        return
      }

      toast.error(`${label} 삭제에 실패했습니다.`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authorName.trim() || !authorEmail.trim() || !newComment.trim()) {
      toast.error("이름, 이메일, 댓글을 모두 입력해주세요.")
      return
    }

    setIsSubmitting(true)

    try {
      await createComment({
        postId,
        content: newComment,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
      })

      toast.success("댓글이 등록되었습니다!")
      setNewComment("")
      loadComments()
    } catch (error) {
      toast.error("댓글 등록에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-neutral-slate-600" />
        <h3 className="text-xl font-semibold text-neutral-slate-800">댓글 {comments?.length || 0}개</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input placeholder="이름" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          <Input
            placeholder="이메일"
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
          />
        </div>
        <Textarea
          placeholder="댓글을 작성해주세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px] bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600"
        />
        <p className="text-xs text-neutral-slate-500">
          작성할 때 사용한 이메일을 입력하면 본인 댓글의 삭제 버튼이 표시됩니다.
        </p>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!newComment.trim() || !authorName.trim() || !authorEmail.trim() || isSubmitting}
            className="bg-brand-blue-500 hover:bg-brand-blue-600"
          >
            {isSubmitting ? "등록 중..." : "댓글 등록"}
          </Button>
        </div>
      </form>

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="text-neutral-slate-500">댓글을 불러오는 중...</div>
          </div>
        ) : comments && Array.isArray(comments) && comments.length > 0 ? (
          comments
            .filter((comment) => !comment.isDeleted)
            .map((comment) => (
              <div key={comment.id} className="space-y-4">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-slate-800">{comment.authorName}</span>
                      <span className="text-sm text-neutral-slate-500">
                        {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>

                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await updateComment(postId, comment.id, { content: editContent })
                                toast.success("댓글이 수정되었습니다.")
                                setEditingComment(null)
                                setEditContent("")
                                loadComments()
                              } catch (error) {
                                toast.error("댓글 수정에 실패했습니다.")
                              }
                            }}
                          >
                            저장
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingComment(null)
                              setEditContent("")
                            }}
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-neutral-slate-700">{comment.content}</p>
                    )}

                    <div className="flex items-center gap-4">
                      <Button
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
                      {isAuthed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neutral-slate-500 hover:text-brand-blue-500"
                          onClick={() => {
                            setEditingComment(comment.id)
                            setEditContent(comment.content)
                          }}
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          수정
                        </Button>
                      )}
                      {canDeleteComment(comment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neutral-slate-500 hover:text-red-500"
                          onClick={() => handleDelete(comment, "댓글")}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {replyTo === comment.id && (
                  <div className="ml-12 space-y-4">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        if (!authorName.trim() || !authorEmail.trim() || !replyContent.trim()) {
                          toast.error("이름, 이메일, 답글을 모두 입력해주세요.")
                          return
                        }

                        try {
                          await createComment({
                            postId,
                            parentId: comment.id,
                            content: replyContent,
                            authorName: authorName.trim(),
                            authorEmail: authorEmail.trim(),
                          })

                          toast.success("답글이 등록되었습니다!")
                          setReplyTo(null)
                          setReplyContent("")
                          loadComments()
                        } catch (error) {
                          if (error instanceof Error && error.message?.includes("삭제된 댓글")) {
                            toast.error("삭제된 댓글에는 답글을 작성할 수 없습니다.")
                            loadComments()
                          } else {
                            toast.error("답글 등록에 실패했습니다.")
                          }
                        }
                      }}
                    >
                      <Textarea
                        placeholder="답글을 작성해주세요..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[80px] bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600"
                      />
                      <div className="mt-2 flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={!replyContent.trim() || !authorName.trim() || !authorEmail.trim()}
                        >
                          답글 등록
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
                  </div>
                )}

                {comment.replies && comment.replies.filter((reply) => !reply.isDeleted).length > 0 && (
                  <div className="ml-12 space-y-4">
                    {comment.replies
                      .filter((reply) => !reply.isDeleted)
                      .map((reply) => (
                        <div key={reply.id} className="space-y-4">
                          <div className="flex gap-4">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{reply.authorName[0]}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-neutral-slate-800">{reply.authorName}</span>
                                <span className="text-sm text-neutral-slate-500">
                                  {new Date(reply.createdAt).toLocaleDateString("ko-KR")}
                                </span>
                              </div>

                              <p className="text-neutral-slate-700">{reply.content}</p>

                              <div className="flex items-center gap-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-neutral-slate-500 hover:text-brand-blue-500"
                                  onClick={() => {
                                    setReplyToReply(reply.id)
                                    setReplyToReplyContent("")
                                  }}
                                >
                                  <Reply className="mr-1 h-4 w-4" />
                                  답글
                                </Button>
                                {canDeleteComment(reply) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-neutral-slate-500 hover:text-red-500"
                                    onClick={() => handleDelete(reply, "답글")}
                                  >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    삭제
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {replyToReply === reply.id && (
                            <div className="ml-8 space-y-4">
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault()
                                  if (!authorName.trim() || !authorEmail.trim() || !replyToReplyContent.trim()) {
                                    toast.error("이름, 이메일, 답글을 모두 입력해주세요.")
                                    return
                                  }

                                  try {
                                    await createComment({
                                      postId,
                                      parentId: reply.id,
                                      content: replyToReplyContent,
                                      authorName: authorName.trim(),
                                      authorEmail: authorEmail.trim(),
                                    })

                                    toast.success("답글이 등록되었습니다!")
                                    setReplyToReply(null)
                                    setReplyToReplyContent("")
                                    loadComments()
                                  } catch (error) {
                                    if (error instanceof Error && error.message?.includes("삭제된 댓글")) {
                                      toast.error("삭제된 댓글에는 답글을 작성할 수 없습니다.")
                                      loadComments()
                                    } else {
                                      toast.error("답글 등록에 실패했습니다.")
                                    }
                                  }
                                }}
                              >
                                <Textarea
                                  placeholder="답글에 대한 답글을 작성해주세요..."
                                  value={replyToReplyContent}
                                  onChange={(e) => setReplyToReplyContent(e.target.value)}
                                  className="min-h-[80px] bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600"
                                />
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    type="submit"
                                    size="sm"
                                    disabled={
                                      !replyToReplyContent.trim() || !authorName.trim() || !authorEmail.trim()
                                    }
                                  >
                                    답글 등록
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setReplyToReply(null)
                                      setReplyToReplyContent("")
                                    }}
                                  >
                                    취소
                                  </Button>
                                </div>
                              </form>
                            </div>
                          )}

                          {reply.replies && reply.replies.filter((nestedReply) => !nestedReply.isDeleted).length > 0 && (
                            <div className="ml-8 space-y-4">
                              {reply.replies
                                .filter((nestedReply) => !nestedReply.isDeleted)
                                .map((nestedReply) => (
                                  <div key={nestedReply.id} className="flex gap-4">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">{nestedReply.authorName[0]}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-neutral-slate-800">
                                          {nestedReply.authorName}
                                        </span>
                                        <span className="text-xs text-neutral-slate-500">
                                          {new Date(nestedReply.createdAt).toLocaleDateString("ko-KR")}
                                        </span>
                                      </div>

                                      <p className="text-sm text-neutral-slate-700">{nestedReply.content}</p>

                                      <div className="flex items-center gap-4">
                                        {canDeleteComment(nestedReply) && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-neutral-slate-500 hover:text-red-500"
                                            onClick={() => handleDelete(nestedReply, "답글")}
                                          >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            삭제
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))
        ) : (
          <div className="py-8 text-center">
            <div className="text-neutral-slate-500">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</div>
          </div>
        )}
      </div>
    </div>
  )
}
