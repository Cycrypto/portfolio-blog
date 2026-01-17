"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, PenSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BlogCard } from "@/components/blog/blog-card"
import { SectionHeading } from "@/components/common/section-heading"
import { BlogFilter } from "@/components/blog/blog-filter"
import { Pagination } from "@/components/common/pagination"
import { AdvancedSearch } from "@/components/common/advanced-search"
import { getPosts, Post } from "@/lib/api"

interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  image: string;
  slug: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedTag, setSelectedTag] = useState<string>("")
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState(false)
  const postsPerPage = 9

  useEffect(() => {
    // 관리자 로그인 상태 확인
    const token = localStorage.getItem("token")
    setIsAdmin(!!token)
  }, [])

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: currentPage.toString(),
          pageSize: postsPerPage.toString()
        })
        
        if (selectedTag) {
          params.append('tags', selectedTag)
        }
        
        if (searchKeyword) {
          params.append('keyword', searchKeyword.trim())
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/posts?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }
        const result = await response.json()
        const { data: posts, totalCount } = result.data
        
        setPosts(posts || [])
        setTotalPages(Math.ceil(totalCount / postsPerPage))
      } catch (err) {
        setError('게시물을 불러오는데 실패했습니다.')
        console.error('Error fetching posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [currentPage, selectedTag, searchKeyword])

  // 백엔드 Post 데이터를 BlogPost 형태로 변환
  const transformToBlogPost = (post: Post): BlogPost => {
    const slug = (post.slug && post.slug !== 'null') ? post.slug : post.id.toString()
    return {
      title: post.title,
      excerpt: post.excerpt || `${post.category} 카테고리의 게시물입니다.`,
      date: new Date(post.publishDate).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      readTime: `${post.readTime}분`,
      tags: post.tags || [post.category],
      image: post.image || "/placeholder.svg?height=200&width=400",
      slug: slug
    }
  }

  // 현재 페이지의 포스트 (이미 백엔드에서 published 상태만 반환됨)
  const getCurrentPagePosts = () => {
    return posts
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      {/* Header */}
      <header className="border-b border-neutral-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="font-bold text-xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-900">박준하</span>
              <span className="text-neutral-slate-800"> 블로그</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <AdvancedSearch
              onSearch={setSearchKeyword}
              onTagSearch={setSelectedTag}
              placeholder="제목, 내용, 요약에서 검색..."
              className="w-64"
            />
            {isAdmin && (
              <Button variant="outline" size="sm" asChild className="border-brand-blue-200 bg-brand-blue-50 hover:bg-brand-blue-100 text-brand-blue-700">
                <Link href="/admin/posts/new">
                  <PenSquare className="h-4 w-4 mr-1" />
                  새 글 작성
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container py-12">
        <SectionHeading title="블로그" subtitle="개발 경험과 지식을 공유합니다" />

        {/* Filter and Search */}
        <div className="mt-12 mb-8">
          <BlogFilter onTagSelect={setSelectedTag} />
        </div>

        {/* 검색 결과 표시 */}
        {(searchKeyword || selectedTag) && (
          <div className="mb-6 p-4 bg-brand-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-blue-700">
                <span className="font-medium">검색 결과:</span>
                {searchKeyword && (
                  <Badge variant="outline" className="bg-brand-blue-100">
                    키워드: "{searchKeyword}"
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="outline" className="bg-brand-blue-100">
                    태그: "{selectedTag}"
                  </Badge>
                )}
                <span className="text-sm text-brand-blue-600">
                  ({posts.length}개의 포스트)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchKeyword("")
                  setSelectedTag("")
                }}
                className="text-brand-blue-600 hover:text-brand-blue-900"
              >
                검색 초기화
              </Button>
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-gray-500">게시물을 불러오는 중...</div>
            </div>
          ) : error ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-red-500">{error}</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-gray-500">
                {searchKeyword || selectedTag ? "검색 결과가 없습니다." : "등록된 게시물이 없습니다."}
              </div>
            </div>
          ) : (
            Array.isArray(posts) ? 
              getCurrentPagePosts().map((post) => (
                <BlogCard key={post.id} {...transformToBlogPost(post)} />
              ))
              : (
                <div className="col-span-full flex justify-center items-center py-12">
                  <div className="text-red-500">데이터 형식이 올바르지 않습니다.</div>
                </div>
              )
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && posts.length > 0 && totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
