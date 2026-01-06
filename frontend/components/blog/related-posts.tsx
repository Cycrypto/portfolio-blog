"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPosts, Post } from "@/lib/api"
import { useEffect, useState } from "react"

interface RelatedPostsProps {
  currentSlug: string
}

export function RelatedPosts({ currentSlug }: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        setLoading(true)
        const { posts: allPosts } = await getPosts()
        const currentPostId = parseInt(currentSlug)
        
        // 현재 포스트를 제외하고, ID 기준으로 주변 포스트 3개 선택
        const filteredPosts = allPosts.filter(post => post.id !== currentPostId)
        
        // 현재 포스트 ID 기준으로 주변 포스트 찾기
        let nearbyPosts: Post[] = []
        
        // 현재 포스트보다 작은 ID의 포스트들 (최대 2개)
        const beforePosts = filteredPosts
          .filter(post => post.id < currentPostId)
          .sort((a, b) => b.id - a.id)
          .slice(0, 2)
        
        // 현재 포스트보다 큰 ID의 포스트들 (최대 1개)
        const afterPosts = filteredPosts
          .filter(post => post.id > currentPostId)
          .sort((a, b) => a.id - b.id)
          .slice(0, 1)
        
        // 주변 포스트들을 합치고 최대 3개까지만
        nearbyPosts = [...beforePosts, ...afterPosts].slice(0, 3)
        
        // 만약 주변 포스트가 3개 미만이면 나머지를 랜덤하게 추가
        if (nearbyPosts.length < 3) {
          const remainingPosts = filteredPosts.filter(post => 
            !nearbyPosts.some(nearby => nearby.id === post.id)
          )
          const randomPosts = remainingPosts
            .sort(() => Math.random() - 0.5)
            .slice(0, 3 - nearbyPosts.length)
          nearbyPosts = [...nearbyPosts, ...randomPosts]
        }
        
        setRelatedPosts(nearbyPosts)
      } catch (error) {
        console.error('Failed to fetch related posts:', error)
        setRelatedPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedPosts()
  }, [currentSlug])

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
        <div className="relative">
          <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">관련 포스트</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg border border-neutral-slate-200 animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (relatedPosts.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
        <div className="relative">
          <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">관련 포스트</h3>
          <p className="text-neutral-slate-500 text-sm">관련 포스트가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>

      <div className="relative">
        <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">관련 포스트</h3>
        <div className="space-y-4">
          {relatedPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`} className="block group">
              <div className="p-3 rounded-lg border border-neutral-slate-200 hover:border-brand-blue-200 transition-colors">
                <h4 className="font-medium text-neutral-slate-800 group-hover:text-brand-blue-600 transition-colors mb-1 line-clamp-2">
                  {post.title}
                </h4>
                <p className="text-sm text-neutral-slate-500">{post.readTime}분</p>
              </div>
            </Link>
          ))}
        </div>

        <Button variant="ghost" className="w-full mt-4 text-brand-blue-600 hover:text-brand-blue-700 hover:bg-brand-blue-50" asChild>
          <Link href="/blog">
            모든 포스트 보기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
