"use client"

import { useEffect, useState } from "react"

import { trackEventOncePerSession } from "@/lib/analytics/track"

interface PostEngagementTrackerProps {
  postId: string
  readTime: number
  wordCount?: number
}

const ENGAGED_TIME_MS = 45_000
const MIN_SCROLL_PROGRESS = 0.7

function getScrollProgress() {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  if (scrollHeight <= 0) {
    return 1
  }

  return window.scrollY / scrollHeight
}

export function PostEngagementTracker({ postId, readTime, wordCount }: PostEngagementTrackerProps) {
  const [hasReachedTimeThreshold, setHasReachedTimeThreshold] = useState(false)
  const [hasReachedScrollThreshold, setHasReachedScrollThreshold] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasReachedTimeThreshold(true)
    }, ENGAGED_TIME_MS)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (getScrollProgress() >= MIN_SCROLL_PROGRESS) {
        setHasReachedScrollThreshold(true)
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!hasReachedTimeThreshold || !hasReachedScrollThreshold) {
      return
    }

    trackEventOncePerSession("post_engaged", `post-engaged:${postId}`, {
      post_id: postId,
      read_time: readTime,
      word_count: wordCount,
    })
  }, [hasReachedScrollThreshold, hasReachedTimeThreshold, postId, readTime, wordCount])

  return null
}
