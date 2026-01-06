"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MessageCircle, Heart, Reply, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Comment, getComments, createComment, updateComment, deleteComment } from "@/lib/api"
import { TokenManager } from "@/lib/auth/token-manager"
import { Input } from "@/components/ui/input"

interface CommentSectionProps {
  postId: string;
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

  // 댓글 목록 로드
  useEffect(() => {
    loadComments()
    const token = TokenManager.getToken()
    setIsAuthed(!!token)
  }, [postId])

  const loadComments = async () => {
    setIsLoading(true)
    try {
      const response = await getComments(postId)
      
      // API 응답에서 data 프로퍼티 추출 (중첩된 구조)
      const fetchedComments = response?.data?.data || []
      
      // 추출된 데이터가 배열인지 확인하고 안전하게 설정
      if (Array.isArray(fetchedComments)) {
        setComments(fetchedComments)
      } else {
        setComments([])
      }
    } catch (error) {
      toast.error("댓글을 불러오는데 실패했습니다.")
      setComments([]) // 에러 시 빈 배열로 설정
    } finally {
      setIsLoading(false)
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
        authorEmail: authorEmail.trim()
      })
      
      toast.success("댓글이 등록되었습니다!")
      setNewComment("")
      setAuthorName("")
      setAuthorEmail("")
      loadComments() // 댓글 목록 새로고침
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

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="이름"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
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

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-neutral-slate-500">댓글을 불러오는 중...</div>
          </div>
        ) : comments && Array.isArray(comments) && comments.length > 0 ? (
          comments.filter(comment => !comment.isDeleted).map((comment) => (
            <div key={comment.id} className="space-y-4">
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg" alt={comment.authorName} />
                <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-slate-800">{comment.authorName}</span>
                  <span className="text-sm text-neutral-slate-500">
                    {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
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
                    <Reply className="h-4 w-4 mr-1" />
                    답글
                  </Button>
                  {isAuthed && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-neutral-slate-500 hover:text-brand-blue-500"
                        onClick={() => {
                          setEditingComment(comment.id)
                          setEditContent(comment.content)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        수정
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-neutral-slate-500 hover:text-red-500"
                        onClick={async () => {
                          if (confirm("댓글을 삭제하시겠습니까?")) {
                            try {
                              await deleteComment(postId, comment.id)
                              toast.success("댓글이 삭제되었습니다.")
                              loadComments()
                            } catch (error) {
                              toast.error("댓글 삭제에 실패했습니다.")
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Reply Form */}
            {replyTo === comment.id && (
              <div className="ml-12 space-y-4">
                <form onSubmit={async (e) => {
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
                      authorEmail: authorEmail.trim()
                    })
                    
                    toast.success("답글이 등록되었습니다!")
                    setReplyTo(null)
                    setReplyContent("")
                    loadComments()
                  } catch (error) {
                    if (error instanceof Error && error.message?.includes('삭제된 댓글')) {
                      toast.error("삭제된 댓글에는 답글을 작성할 수 없습니다.")
                      loadComments() // 댓글 목록 새로고침
                    } else {
                      toast.error("답글 등록에 실패했습니다.")
                    }
                  }
                }}>
                  <Textarea
                    placeholder="답글을 작성해주세요..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px] bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button type="submit" size="sm" disabled={!replyContent.trim() || !authorName.trim() || !authorEmail.trim()}>
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

            {/* Replies */}
            {comment.replies && comment.replies.filter(reply => !reply.isDeleted).length > 0 && (
              <div className="ml-12 space-y-4">
                {comment.replies.filter(reply => !reply.isDeleted).map((reply) => (
                  <div key={reply.id} className="space-y-4">
                    <div className="flex gap-4">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/placeholder.svg" alt={reply.authorName} />
                        <AvatarFallback className="text-xs">{reply.authorName[0]}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-slate-800">{reply.authorName}</span>
                          <span className="text-sm text-neutral-slate-500">
                            {new Date(reply.createdAt).toLocaleDateString('ko-KR')}
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
                            <Reply className="h-4 w-4 mr-1" />
                            답글
                          </Button>
                          {isAuthed && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-neutral-slate-500 hover:text-red-500"
                              onClick={async () => {
                                if (confirm("답글을 삭제하시겠습니까?")) {
                                  try {
                                    await deleteComment(postId, reply.id)
                                    toast.success("답글이 삭제되었습니다.")
                                    loadComments()
                                  } catch (error) {
                                    toast.error("답글 삭제에 실패했습니다.")
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              삭제
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reply to Reply Form */}
                    {replyToReply === reply.id && (
                      <div className="ml-8 space-y-4">
                        <form onSubmit={async (e) => {
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
                              authorEmail: authorEmail.trim()
                            })
                            
                            toast.success("답글이 등록되었습니다!")
                            setReplyToReply(null)
                            setReplyToReplyContent("")
                            loadComments()
                          } catch (error) {
                            if (error instanceof Error && error.message?.includes('삭제된 댓글')) {
                              toast.error("삭제된 댓글에는 답글을 작성할 수 없습니다.")
                              loadComments() // 댓글 목록 새로고침
                            } else {
                              toast.error("답글 등록에 실패했습니다.")
                            }
                          }
                        }}>
                          <Textarea
                            placeholder="답글에 대한 답글을 작성해주세요..."
                            value={replyToReplyContent}
                            onChange={(e) => setReplyToReplyContent(e.target.value)}
                            className="min-h-[80px] bg-white/50 border-brand-blue-200 focus:border-brand-indigo-600"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button type="submit" size="sm" disabled={!replyToReplyContent.trim() || !authorName.trim() || !authorEmail.trim()}>
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

                    {/* Replies to Reply (대대댓글) */}
                    {reply.replies && reply.replies.filter(replyToReply => !replyToReply.isDeleted).length > 0 && (
                      <div className="ml-8 space-y-4">
                        {reply.replies.filter(replyToReply => !replyToReply.isDeleted).map((replyToReply) => (
                          <div key={replyToReply.id} className="flex gap-4">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src="/placeholder.svg" alt={replyToReply.authorName} />
                              <AvatarFallback className="text-xs">{replyToReply.authorName[0]}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-neutral-slate-800 text-sm">{replyToReply.authorName}</span>
                                <span className="text-xs text-neutral-slate-500">
                                  {new Date(replyToReply.createdAt).toLocaleDateString('ko-KR')}
                                </span>
                              </div>

                              <p className="text-neutral-slate-700 text-sm">{replyToReply.content}</p>

                              <div className="flex items-center gap-4">
                                {isAuthed && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-neutral-slate-500 hover:text-red-500"
                                    onClick={async () => {
                                      if (confirm("답글을 삭제하시겠습니까?")) {
                                        try {
                                          await deleteComment(postId, replyToReply.id)
                                          toast.success("답글이 삭제되었습니다.")
                                          loadComments()
                                        } catch (error) {
                                          toast.error("답글 삭제에 실패했습니다.")
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
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
          <div className="text-center py-8">
            <div className="text-neutral-slate-500">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</div>
          </div>
        )}
      </div>
    </div>
  )
}
