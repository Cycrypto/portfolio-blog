"use client"

import { useEffect, useState } from "react"
import { Heart, LoaderCircle, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { likePost } from "@/lib/api"
import { trackEvent } from "@/lib/analytics/track"
import { cn } from "@/lib/utils"

const LIKED_POSTS_STORAGE_KEY = "blog-liked-posts"
const POST_LIKE_UPDATED_EVENT = "blog-post-like-updated"

interface PostLikeStatsProps {
  postId: string
  initialLikes: number
  commentCount: number
  className?: string
}

interface PostLikeButtonProps {
  postId: string
  initialLikes: number
  className?: string
}

interface PostLikeUpdatedDetail {
  postId: string
  likes: number
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

function dispatchLikeUpdated(postId: string, likes: number) {
  window.dispatchEvent(
    new CustomEvent<PostLikeUpdatedDetail>(POST_LIKE_UPDATED_EVENT, {
      detail: { postId, likes },
    }),
  )
}

function usePostLikeState(postId: string, initialLikes: number) {
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    const syncLikedState = () => {
      setLiked(readLikedPosts().includes(postId))
    }

    setLikes(initialLikes)
    syncLikedState()

    const handleLikeUpdated = (event: Event) => {
      const { detail } = event as CustomEvent<PostLikeUpdatedDetail>
      if (detail.postId !== postId) {
        return
      }

      setLikes(detail.likes)
      syncLikedState()
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== LIKED_POSTS_STORAGE_KEY) {
        return
      }

      syncLikedState()
    }

    window.addEventListener(POST_LIKE_UPDATED_EVENT, handleLikeUpdated as EventListener)
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener(POST_LIKE_UPDATED_EVENT, handleLikeUpdated as EventListener)
      window.removeEventListener("storage", handleStorage)
    }
  }, [initialLikes, postId])

  return {
    liked,
    likes,
    setLiked,
    setLikes,
  }
}

export function PostEngagementStats({ postId, initialLikes, commentCount, className }: PostLikeStatsProps) {
  const { liked, likes } = usePostLikeState(postId, initialLikes)

  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-neutral-slate-600", className)}>
      <span
        aria-label={`공감 ${likes.toLocaleString()}개`}
        className="inline-flex items-center gap-2"
      >
        <Heart className={cn("h-4 w-4", liked ? "fill-rose-500 text-rose-500" : "text-neutral-slate-400")} />
        <span className="text-neutral-slate-700">{likes.toLocaleString()}</span>
      </span>
      <span
        aria-label={`댓글 ${commentCount.toLocaleString()}개`}
        className="inline-flex items-center gap-2"
      >
        <MessageCircle className="h-4 w-4 text-neutral-slate-400" />
        <span className="text-neutral-slate-700">{commentCount.toLocaleString()}</span>
      </span>
    </div>
  )
}

export function PostLikeButton({ postId, initialLikes, className }: PostLikeButtonProps) {
  const { likes, liked, setLiked, setLikes } = usePostLikeState(postId, initialLikes)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      persistLikedPost(postId)
      setLikes(result.likes)
      dispatchLikeUpdated(postId, result.likes)
      trackEvent("post_like", {
        post_id: postId,
      })
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
    <Button
      type="button"
      size="lg"
      onClick={handleLike}
      disabled={isSubmitting || liked}
      aria-pressed={liked}
      className={cn(
        "min-w-36 rounded-full px-6 shadow-sm",
        liked
          ? "bg-rose-500 text-white hover:bg-rose-500"
          : "bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700",
        className,
      )}
    >
      {isSubmitting ? (
        <LoaderCircle className="h-5 w-5 animate-spin" />
      ) : (
        <Heart className={cn("h-5 w-5", liked && "fill-current")} />
      )}
      {liked ? "공감 완료" : "공감하기"}
    </Button>
  )
}
