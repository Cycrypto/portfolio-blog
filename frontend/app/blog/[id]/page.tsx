import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AuthorCard } from '@/components/blog/author-card';
import { BlogPostAdminActions } from '@/components/blog/blog-post-admin-actions';
import { CommentSection } from '@/components/blog/CommentSection';
import { RelatedPosts } from '@/components/blog/related-posts';
import { TableOfContents } from '@/components/blog/table-of-contents';
import {
  PostEngagementStats,
  PostLikeButton,
} from '@/components/blog/post-like-card';
import { ShareButtons } from '@/components/common/share-buttons';
import { TiptapViewer } from '@/components/editor/TiptapViewer';
import { getPost, Post } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/utils/image';
import { PostViewCount } from '@/components/blog/post-view-count';

interface BlogPostPageProps {
  params: Promise<{
    id: string;
  }>;
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

  const heroImage = normalizeImageUrl(post.image);
  const currentPostSlug =
    post.slug && post.slug !== 'null' ? post.slug : undefined;
  const postReactionId =
    post.slug && post.slug !== 'null' ? post.slug : post.id.toString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <header className="sticky top-0 z-40 border-b border-neutral-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/blog">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="font-bold text-xl">
              <span className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-900 bg-clip-text text-transparent">
                박준하
              </span>
              <span className="text-neutral-slate-800"> 블로그</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ShareButtons title={post.title} />
            <BlogPostAdminActions
              postId={post.id.toString()}
              postTitle={post.title}
            />
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          <div className="lg:col-span-3">
            {heroImage && (
              <div className="relative mb-8 h-64 overflow-hidden rounded-xl md:h-96">
                <Image
                  src={heroImage}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            )}

            <div className="mb-8">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-brand-blue-100 text-brand-blue-700"
                >
                  {post.category}
                </Badge>
                {post.tags?.map((tag: string, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-neutral-gray-100 text-neutral-gray-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="mb-4 text-4xl font-bold text-neutral-slate-800 md:text-5xl">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="mb-6 text-xl text-neutral-slate-600">
                  {post.excerpt}
                </p>
              )}

              <PostEngagementStats
                postId={postReactionId}
                initialLikes={post.likes}
                commentCount={post.comments}
                className="mb-6"
              />

              <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(post.publishDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime}분</span>
                </div>
                <PostViewCount
                  postId={postReactionId}
                  initialViews={post.views}
                />
              </div>
            </div>

            <Separator className="mb-8" />

            <div className="max-w-none">
              {post.contentHtml ? (
                <div className="rounded-lg bg-white p-8 shadow-sm">
                  <TiptapViewer contentHtml={post.contentHtml} />
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-slate-200 bg-white p-8 shadow-sm">
                  <h2 className="mb-3 text-2xl font-bold text-neutral-slate-800">
                    본문 준비 중
                  </h2>
                  <p className="text-neutral-slate-600">
                    이 글의 본문을 아직 불러오지 못했습니다. 잠시 후 다시
                    확인해주세요.
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-12" />

            <div className="flex justify-center">
              <PostLikeButton
                postId={postReactionId}
                initialLikes={post.likes}
              />
            </div>

            <Separator className="my-12" />

            <AuthorCard
              author={{
                name: post.author,
                avatar: undefined,
                bio: '개발 과정에서 확인한 내용과 구현 경험을 기록합니다.',
              }}
            />

            <Separator className="my-12" />

            <CommentSection postId={post.id.toString()} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <TableOfContents headings={post.headings} />
              <RelatedPosts
                currentPostId={post.id}
                currentPostSlug={currentPostSlug}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
