import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Heart, MessageCircle, Edit, PenSquare } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TableOfContents } from "@/components/blog/table-of-contents"
import { ShareButtons } from "@/components/common/share-buttons"
import { RelatedPosts } from "@/components/blog/related-posts"
import { CommentSection } from "@/components/blog/CommentSection"
import { AuthorCard } from "@/components/blog/author-card"
import { getPost, Post } from "@/lib/api"
import { DeletePostButton } from "@/components/admin/DeletePostButton"
import { TiptapViewer } from "@/components/editor/TiptapViewer"
import { use } from "react"

interface BlogPostPageProps {
  params: {
    id: string
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  let post: Post;
  
  try {
    post = await getPost(resolvedParams.id);
  } catch (error) {
    console.error('Failed to fetch post:', error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      {/* Header */}
      <header className="border-b border-neutral-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/blog">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="font-bold text-xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-900">박준하</span>
              <span className="text-neutral-slate-800"> 블로그</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ShareButtons title={post.title} />
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/posts/new">
                <PenSquare className="h-4 w-4 mr-1" />
                새 글
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/posts/${post.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                편집
              </Link>
            </Button>
            <DeletePostButton
              postId={post.id.toString()}
              postTitle={post.title}
              variant="outline"
              size="sm"
            />
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Hero Image */}
            <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-8">
              <img src={post.image || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            {/* Post Header */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-brand-blue-100 text-brand-blue-700">
                  {post.category}
                </Badge>
                {post.tags?.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="bg-gray-100 text-gray-700">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-slate-800">{post.title}</h1>

              {post.excerpt && (
                <p className="text-xl text-neutral-slate-600 mb-6">{post.excerpt}</p>
              )}

              <div className="flex items-center gap-6 text-sm text-neutral-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.publishDate).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime}분</span>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="text-neutral-slate-500 hover:text-red-500">
                    <Heart className="h-4 w-4 mr-1" />
                    {post.views}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-neutral-slate-500 hover:text-brand-blue-500">
                    <MessageCircle className="h-4 w-4 mr-1" />{post.comments}
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Post Content */}
            <div className="max-w-none">
              {post.contentHtml ? (
                <div className="bg-white p-8 rounded-lg shadow-sm">
                  <TiptapViewer contentHtml={post.contentHtml} />
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">포스트 내용</h2>
                  <p className="text-gray-600 mb-4">
                    이 포스트는 ID {post.id}로 생성되었습니다.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <strong>제목:</strong> {post.title}
                    </div>
                    <div>
                      <strong>작성자:</strong> {post.author}
                    </div>
                    <div>
                      <strong>카테고리:</strong> {post.category}
                    </div>
                    <div>
                      <strong>상태:</strong> {post.status}
                    </div>
                    <div>
                      <strong>조회수:</strong> {post.views}
                    </div>
                    <div>
                      <strong>댓글수:</strong> {post.comments}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-12" />

            {/* Author Card */}
            <AuthorCard author={{
              name: post.author,
              avatar: "/placeholder.svg?height=100&width=100",
              bio: "블로그 작성자"
            }} />

            <Separator className="my-12" />

            {/* Comments */}
            <CommentSection postId={post.id.toString()} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <TableOfContents headings={post.headings} />
              <RelatedPosts currentSlug={resolvedParams.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
