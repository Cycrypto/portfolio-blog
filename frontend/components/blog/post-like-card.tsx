"use client"

import { useEffect, useState } from "react"
import { Heart, LoaderCircle, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { likePost } from "@/lib/api"
import { cn } from "@/lib/utils"

const LIKED_POSTS_STORAGE_KEY = "blog-liked-posts"

interface PostLikeCardProps {
  postId: string
  initialLikes: number
  commentCount: number
}

function readLikedPosts(): string[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(LIKED_POSTS_STORAGE_KEY)
    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue)
    return Array.isArray(parsedValue) ? parsedValue.filter((value): value is string => typeof value === "string") : []
  } catch {
    return []
  }
}

function persistLikedPost(postId: string) {
  const likedPosts = readLikedPosts()
  if (likedPosts.includes(postId)) {
    return
  }

  window.localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify([...likedPosts, postId]))
}

export function PostLikeCard({ postId, initialLikes, commentCount }: PostLikeCardProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setLikes(initialLikes)
    setLiked(readLikedPosts().includes(postId))
  }, [initialLikes, postId])

  const handleLike = async () => {
    if (liked) {
      toast.message("이미 좋아요를 남겼습니다.")
      return
    }

    const previousLikes = likes

    setIsSubmitting(true)
    setLiked(true)
    setLikes(previousLikes + 1)

    try {
      const result = await likePost(postId)
      setLikes(result.likes)
      persistLikedPost(postId)
      toast.success("좋아요가 반영되었습니다.")
    } catch {
      setLiked(false)
      setLikes(previousLikes)
      toast.error("좋아요를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mb-8 overflow-hidden rounded-[28px] border border-rose-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(251,113,133,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.16),_transparent_42%),linear-gradient(135deg,#fff7f7_0%,#ffffff_56%,#fff8ef_100%)] p-5 shadow-[0_24px_60px_-34px_rgba(225,29,72,0.45)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">Reader Reaction</p>
          <div>
            <h2 className="text-xl font-semibold text-neutral-slate-900">이 글이 유용했다면 좋아요를 남겨주세요.</h2>
            <p className="mt-1 text-sm text-neutral-slate-600">좋아요는 브라우저 기준으로 한 번만 반영됩니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1">
              <Heart className={cn("h-4 w-4", liked ? "fill-rose-500 text-rose-500" : "text-rose-400")} />
              좋아요 {likes.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1">
              <MessageCircle className="h-4 w-4 text-brand-blue-500" />
              댓글 {commentCount.toLocaleString()}
            </span>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleLike}
          disabled={isSubmitting || liked}
          aria-pressed={liked}
          className={cn(
            "min-w-40 rounded-full px-6 text-base shadow-sm transition-transform duration-200 md:self-end",
            liked
              ? "bg-rose-500 text-white hover:bg-rose-500"
              : "bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700",
          )}
        >
          {isSubmitting ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Heart className={cn("h-5 w-5", liked && "fill-current")} />
          )}
          {liked ? "좋아요 완료" : "좋아요 누르기"}
        </Button>
      </div>
    </section>
  )
}
