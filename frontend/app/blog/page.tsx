"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, PenSquare, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BlogCard } from "@/components/blog/blog-card"
import { SectionHeading } from "@/components/common/section-heading"
import { BlogFilter } from "@/components/blog/blog-filter"
import { Pagination } from "@/components/common/pagination"
import { AdvancedSearch } from "@/components/common/advanced-search"
import { Post } from "@/lib/api"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { trackEvent } from "@/lib/analytics/track"
import { normalizeImageUrl } from "@/lib/utils/image"

interface BlogPost {
  title: string
  excerpt: string
  date: string
  readTime: string
  tags: string[]
  image?: string
  slug: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedTag, setSelectedTag] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const lastTrackedSearchKeyRef = useRef("")
  const lastTrackedFilterKeyRef = useRef("")

  const isAdmin = useAdminAuth()
  const postsPerPage = 9

  useEffect(() => {
    const controller = new AbortController()

    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: postsPerPage.toString(),
        })

        if (selectedTag) {
          params.append("tags", selectedTag)
        }

        if (searchKeyword) {
          params.append("keyword", searchKeyword.trim())
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/posts?${params}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to fetch posts")
        }

        const result = await response.json()
        const { data: nextPosts, totalCount } = result.data
        const normalizedKeyword = searchKeyword.trim()
        const normalizedTag = selectedTag.trim()
        const nextPostList = Array.isArray(nextPosts) ? nextPosts : []
        const resultCount = typeof totalCount === "number" ? totalCount : nextPostList.length

        setPosts(nextPostList)
        setTotalPages(Math.max(1, Math.ceil(resultCount / postsPerPage)))

        if (normalizedKeyword && currentPage === 1) {
          const trackingKey = `${normalizedKeyword.toLowerCase()}:${resultCount}`
          if (lastTrackedSearchKeyRef.current !== trackingKey) {
            trackEvent("blog_search", {
              query_length: normalizedKeyword.length,
              result_count: resultCount,
            })
            lastTrackedSearchKeyRef.current = trackingKey
          }
        }

        if (normalizedTag && currentPage === 1) {
          const trackingKey = `${normalizedTag.toLowerCase()}:${resultCount}`
          if (lastTrackedFilterKeyRef.current !== trackingKey) {
            trackEvent("blog_filter", {
              filter_type: "tag",
              filter_value: normalizedTag,
              result_count: resultCount,
            })
            lastTrackedFilterKeyRef.current = trackingKey
          }
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }
        setError("게시물을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.")
        setPosts([])
        console.error("Error fetching posts:", err)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchPosts()

    return () => controller.abort()
  }, [currentPage, selectedTag, searchKeyword, refreshKey])

  useEffect(() => {
    if (!searchKeyword.trim()) {
      lastTrackedSearchKeyRef.current = ""
    }
  }, [searchKeyword])

  useEffect(() => {
    if (!selectedTag.trim()) {
      lastTrackedFilterKeyRef.current = ""
    }
  }, [selectedTag])

  const transformToBlogPost = (post: Post): BlogPost => {
    const slug = post.slug && post.slug !== "null" ? post.slug : post.id.toString()
    return {
      title: post.title,
      excerpt: post.excerpt || `${post.category} 카테고리의 게시물입니다.`,
      date: new Date(post.publishDate).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      readTime: `${post.readTime}분`,
      tags: post.tags || [post.category],
      image: normalizeImageUrl(post.image),
      slug,
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const clearSearchState = () => {
    setSearchKeyword("")
    setSelectedTag("")
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50">
      <header className="sticky top-0 z-40 border-b border-neutral-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="container py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 md:gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Link href="/" className="truncate text-lg font-bold text-neutral-slate-800 md:text-xl">
                박준하 블로그
              </Link>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden border-brand-blue-200 bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100 sm:inline-flex"
              >
                <Link href="/admin/posts/new">
                  <PenSquare className="mr-1 h-4 w-4" />
                  새 글 작성
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <AdvancedSearch
              onSearch={(value) => {
                setCurrentPage(1)
                setSearchKeyword(value)
              }}
              onTagSearch={(value) => {
                setCurrentPage(1)
                setSelectedTag(value)
              }}
              placeholder="제목, 내용, 태그로 검색"
              className="w-full sm:w-80"
            />
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full border-brand-blue-200 bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100 sm:hidden"
              >
                <Link href="/admin/posts/new">
                  <PenSquare className="mr-1 h-4 w-4" />
                  새 글 작성
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container py-10 md:py-12">
        <SectionHeading title="블로그" subtitle="문제 해결 과정과 구현 기록" />

        <div className="mb-6 mt-10">
          <BlogFilter
            onTagSelect={(value) => {
              setCurrentPage(1)
              setSelectedTag(value)
            }}
          />
        </div>

        {(searchKeyword || selectedTag) && (
          <div className="surface-default mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-brand-blue-700">
              <span className="font-medium">검색 결과</span>
              {searchKeyword && (
                <Badge variant="outline" className="bg-brand-blue-50">
                  키워드: "{searchKeyword}"
                </Badge>
              )}
              {selectedTag && (
                <Badge variant="outline" className="bg-brand-blue-50">
                  태그: "{selectedTag}"
                </Badge>
              )}
              <span className="text-sm text-brand-blue-600">{posts.length}개</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearSearchState} className="w-fit text-brand-blue-700 hover:bg-brand-blue-50">
              필터 해제
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-14 text-center text-neutral-slate-500">글을 불러오는 중입니다...</div>
          ) : error ? (
            <div className="col-span-full">
              <div className="surface-default py-10 text-center">
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4 border-brand-blue-200 bg-white text-brand-blue-700 hover:bg-brand-blue-50"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  다시 시도
                </Button>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="col-span-full">
              <div className="surface-default py-10 text-center text-neutral-slate-500">
                {searchKeyword || selectedTag ? "조건에 맞는 글이 없습니다." : "아직 공개한 글이 없습니다."}
              </div>
            </div>
          ) : (
            posts.map((post) => <BlogCard key={post.id} {...transformToBlogPost(post)} trackingLocation="blog_list_card" />)
          )}
        </div>

        {!loading && !error && posts.length > 0 && totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </div>
  )
}
