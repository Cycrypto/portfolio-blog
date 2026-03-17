import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PostEngagementTracker } from '@/components/analytics/PostEngagementTracker';
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
import { buildPortfolioSnapshot } from '@/lib/portfolio/build-portfolio-snapshot';
import { getPost, type Post } from '@/lib/api';
import { PostViewCount } from '@/components/blog/post-view-count';
import { absoluteUrl } from '@/lib/site';
import { normalizeImageUrl } from '@/lib/utils/image';
import { getPostPath } from '@/lib/posts/post-url';
import { getProjectPath } from '@/lib/projects/project-url';

export const dynamic = 'force-dynamic';

interface BlogPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getPostOr404(identifier: string): Promise<Post> {
  try {
    return await getPost(identifier);
  } catch (error) {
    return notFound();
  }
}

function findRelatedProjects(post: Post, snapshot: Awaited<ReturnType<typeof buildPortfolioSnapshot>>) {
  const tagSet = new Set([...(post.tags || []), post.category].filter(Boolean).map((tag) => tag.toLowerCase()));

  const scoredProjects = snapshot.allProjects
    .map((project) => {
      const projectKeywords = [
        ...(project.techStack || []),
        project.category || '',
        project.title,
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase());

      const score = projectKeywords.filter((keyword) => tagSet.has(keyword)).length;
      return { project, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (a.project.featuredOrder || Number.MAX_SAFE_INTEGER) - (b.project.featuredOrder || Number.MAX_SAFE_INTEGER);
    })
    .map(({ project }) => project);

  if (scoredProjects.length > 0) {
    return scoredProjects.slice(0, 3);
  }

  return snapshot.featuredProjects.slice(0, 2);
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostOr404(resolvedParams.id);
  const description =
    post.excerpt ||
    post.plainText?.slice(0, 140) ||
    `${post.title} 글 상세`;
  const image = normalizeImageUrl(post.image);
  const canonicalPath = getPostPath(post);

  return {
    title: `${post.title} | 기술 글`,
    description,
    alternates: {
      canonical: absoluteUrl(canonicalPath),
    },
    openGraph: {
      title: `${post.title} | 기술 글`,
      description,
      url: absoluteUrl(canonicalPath),
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${post.title} | 기술 글`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const post = await getPostOr404(resolvedParams.id);
  const snapshot = await buildPortfolioSnapshot();
  const heroImage = normalizeImageUrl(post.image);
  const profileImage = normalizeImageUrl(snapshot.profile.profileImage);
  const currentPostSlug =
    post.slug && post.slug !== 'null' ? post.slug : undefined;
  const postReactionId =
    post.slug && post.slug !== 'null' ? post.slug : post.id.toString();
  const evidenceTags = [...new Set([...(post.tags || []), post.category])].slice(
    0,
    6,
  );
  const relatedProjects = findRelatedProjects(post, snapshot);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <header className="sticky top-0 z-40 border-b border-neutral-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/blog">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="font-bold text-xl text-neutral-slate-900">
              박준하 포트폴리오
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ShareButtons title={post.title} contentId={postReactionId} />
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
            {heroImage ? (
              <div className="relative mb-8 h-64 overflow-hidden rounded-3xl md:h-96">
                <Image
                  src={heroImage}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              </div>
            ) : null}

            <div className="mb-8 rounded-[28px] border border-brand-blue-200/70 bg-white/90 p-8 shadow-sm backdrop-blur">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-brand-blue-100 text-brand-blue-700"
                >
                  {post.category}
                </Badge>
                {post.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-neutral-gray-100 text-neutral-gray-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-neutral-slate-900 md:text-5xl">
                {post.title}
              </h1>

              {post.excerpt ? (
                <p className="mt-4 text-xl leading-8 text-neutral-slate-600">
                  {post.excerpt}
                </p>
              ) : null}

              <PostEngagementStats
                postId={postReactionId}
                initialLikes={post.likes}
                commentCount={post.comments}
                className="mt-6"
              />

              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-neutral-slate-500">
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
              <PostEngagementTracker
                postId={postReactionId}
                readTime={post.readTime}
                wordCount={post.wordCount}
              />
              {post.contentHtml ? (
                <div className="rounded-2xl bg-white p-8 shadow-sm">
                  <TiptapViewer contentHtml={post.contentHtml} />
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-slate-200 bg-white p-8 shadow-sm">
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

            <section className="rounded-2xl border border-brand-blue-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-slate-900">
                이 글이 증명하는 역량
              </h2>
              <p className="mt-3 text-sm leading-7 text-neutral-slate-600">
                태그와 카테고리를 기준으로, 이 글이 보여주는 기술 키워드를
                추렸습니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {evidenceTags.length > 0 ? (
                  evidenceTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-brand-blue-50 text-brand-blue-700"
                    >
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-neutral-slate-500">
                    역량 키워드를 정리 중입니다.
                  </span>
                )}
              </div>
            </section>

            {relatedProjects.length > 0 ? (
              <>
                <Separator className="my-12" />
                <section className="rounded-2xl border border-brand-blue-200/70 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-neutral-slate-900">
                    관련 프로젝트
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-neutral-slate-600">
                    이 글에서 다루는 기술과 문제 맥락이 이어지는 대표
                    프로젝트입니다.
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {relatedProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={getProjectPath(project)}
                        className="rounded-xl border border-brand-blue-200/70 p-4 transition-colors hover:bg-brand-blue-50/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-neutral-slate-900">
                            {project.title}
                          </h3>
                          {project.isFeatured ? (
                            <Badge
                              variant="secondary"
                              className="bg-brand-blue-100 text-brand-blue-700"
                            >
                              대표
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-slate-600">
                          {project.problem || project.description || '프로젝트 설명을 정리 중입니다.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(project.techStack || []).slice(0, 4).map((tech) => (
                            <Badge key={tech} variant="outline">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

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
                name: snapshot.profile.name || post.author,
                avatar: profileImage || undefined,
                bio:
                  snapshot.profile.about ||
                  '개발 과정에서 확인한 내용과 구현 경험을 기록합니다.',
                githubUrl: snapshot.profile.github || undefined,
                linkedinUrl: snapshot.profile.linkedin || undefined,
                email: snapshot.profile.email || undefined,
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
