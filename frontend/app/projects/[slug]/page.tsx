import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, ExternalLink, Github } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { ProjectGallery } from '@/components/project/project-gallery';
import { RelatedProjects } from '@/components/project/related-projects';
import { getProject } from '@/lib/api';
import {
  formatExperiencePeriod,
  getExperienceTypeLabel,
} from '@/lib/experience/utils';
import { getPostPath } from '@/lib/posts/post-url';
import { getProjectPath } from '@/lib/projects/project-url';
import { absoluteUrl } from '@/lib/site';
import { normalizeImageUrl } from '@/lib/utils/image';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

function formatProjectDate(date?: string) {
  if (!date) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
  }).format(new Date(date));
}

function formatProjectPeriod(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) {
    return '일정 조율 중';
  }

  if (startDate && endDate) {
    return `${formatProjectDate(startDate)} - ${formatProjectDate(endDate)}`;
  }

  if (startDate) {
    return `${formatProjectDate(startDate)}부터 진행`;
  }

  return `${formatProjectDate(endDate)} 종료`;
}

async function getProjectOr404(identifier: string) {
  try {
    return await getProject(identifier);
  } catch (error) {
    notFound();
  }
}

function getLinkedPostSummary(project: Awaited<ReturnType<typeof getProject>>) {
  return (project.linkedPosts || [])
    .filter((post) => post.status === 'published')
    .slice(0, 2)
    .map((post) => post.title)
    .join(', ');
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectOr404(slug);
  const linkedPostSummary = getLinkedPostSummary(project);
  const description =
    project.description ||
    project.problem ||
    linkedPostSummary ||
    `${project.title} 프로젝트 소개`;
  const image = normalizeImageUrl(project.images?.[0]);
  const canonicalPath = getProjectPath(project);

  return {
    title: `${project.title} | 프로젝트`,
    description,
    alternates: {
      canonical: absoluteUrl(canonicalPath),
    },
    openGraph: {
      title: `${project.title} | 프로젝트`,
      description,
      url: absoluteUrl(canonicalPath),
      type: 'article',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${project.title} | 프로젝트`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function DetailSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="rounded-2xl border border-brand-blue-200/70 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-neutral-slate-900">{title}</h2>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-slate-700">
        {content}
      </p>
    </section>
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectOr404(slug);

  if (!project) {
    notFound();
  }

  const images = (project.images || [])
    .map((image) => normalizeImageUrl(image))
    .filter((image): image is string => Boolean(image));
  const canonicalProjectPath = getProjectPath(project);
  const relatedKey = project.slug || slug;
  const projectId = String(project.id ?? slug);
  const linkedPublishedPosts = (project.linkedPosts || []).filter(
    (post) => post.status === 'published',
  );
  const detailSections = [
    {
      title: '문제',
      content: project.problem?.trim() || '',
    },
    {
      title: '내 역할',
      content: project.role?.trim() || '',
    },
    {
      title: '접근',
      content: project.approach?.trim() || '',
    },
    {
      title: '성과',
      content: project.outcomes?.trim() || '',
    },
  ].filter(
    (section): section is { title: string; content: string } =>
      section.content.length > 0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <header className="sticky top-0 z-40 border-b border-neutral-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="font-bold text-xl text-neutral-slate-900">
              박준하 포트폴리오
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {project.githubUrl ? (
              <Button variant="outline" size="sm" asChild>
                <TrackedLink
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  eventName="project_outbound_click"
                  eventPayload={{
                    project_id: projectId,
                    target: 'repo',
                    location: 'project_detail',
                  }}
                >
                  <Github className="mr-2 h-4 w-4" />
                  코드 보기
                </TrackedLink>
              </Button>
            ) : null}
            {project.liveUrl ? (
              <Button
                size="sm"
                className="bg-brand-blue-600 text-white hover:bg-brand-blue-700"
                asChild
              >
                <TrackedLink
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  eventName="project_outbound_click"
                  eventPayload={{
                    project_id: projectId,
                    target: 'demo',
                    location: 'project_detail',
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  서비스 보기
                </TrackedLink>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          <div className="space-y-8 lg:col-span-3">
            <section className="rounded-[28px] border border-brand-blue-200/70 bg-white/90 p-8 shadow-sm backdrop-blur">
              <div className="mb-4 flex flex-wrap gap-2">
                {(project.techStack || []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-brand-blue-100 text-brand-blue-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-neutral-slate-900 md:text-5xl">
                {project.title}
              </h1>
              {project.description ? (
                <p className="mt-4 text-lg leading-8 text-neutral-slate-600">
                  {project.description}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue-200 bg-brand-blue-50 px-3 py-1">
                  <Calendar className="h-4 w-4" />
                  {formatProjectPeriod(project.startDate, project.endDate)}
                </span>
                <span className="rounded-full border border-brand-blue-200 bg-white px-3 py-1">
                  상태: {project.status || '정리 중'}
                </span>
                {project.category ? (
                  <span className="rounded-full border border-brand-blue-200 bg-white px-3 py-1">
                    카테고리: {project.category}
                  </span>
                ) : null}
              </div>
            </section>

            {linkedPublishedPosts.length > 0 ? (
              <section className="rounded-2xl border border-brand-blue-200/70 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-blue-500">
                      Readings
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-neutral-slate-900">
                      이 프로젝트를 설명하는 글
                    </h2>
                  </div>
                  <p className="text-sm text-neutral-slate-500">
                    공개 글 {linkedPublishedPosts.length}개
                  </p>
                </div>
                <div className="mt-5 divide-y divide-brand-blue-100">
                  {linkedPublishedPosts.map((post) => (
                    <TrackedLink
                      key={post.id}
                      href={getPostPath({ id: post.id, slug: post.slug })}
                      className="group flex items-start justify-between gap-4 py-4"
                      eventName="cta_click"
                      eventPayload={{
                        location: 'project_detail_post',
                        target: 'blog',
                        content_id: post.slug || String(post.id),
                      }}
                    >
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-neutral-slate-900 transition-colors group-hover:text-brand-blue-700">
                          {post.title}
                        </h3>
                        {post.excerpt ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-slate-600">
                            {post.excerpt}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-2 text-xs text-neutral-slate-400">
                        {post.publishDate ? (
                          <span>
                            {new Date(post.publishDate).toLocaleDateString(
                              'ko-KR',
                            )}
                          </span>
                        ) : null}
                        {post.readTime ? <span>{post.readTime}분 읽기</span> : null}
                      </div>
                    </TrackedLink>
                  ))}
                </div>
              </section>
            ) : null}

            {images.length > 0 ? (
              <ProjectGallery
                projectId={projectId}
                images={images}
                title={project.title}
              />
            ) : null}

            {detailSections.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {detailSections.map((section) => (
                  <DetailSection
                    key={section.title}
                    title={section.title}
                    content={section.content}
                  />
                ))}
              </div>
            ) : null}

            {(project.impactMetrics || []).length > 0 ? (
              <section className="rounded-2xl border border-brand-blue-200/70 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-neutral-slate-900">
                  성과 지표
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.impactMetrics.map((metric) => (
                    <Badge
                      key={metric}
                      variant="secondary"
                      className="bg-brand-blue-50 px-3 py-1 text-brand-blue-700"
                    >
                      {metric}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}

            {project.experience ? (
              <section className="rounded-2xl border border-brand-blue-200/70 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-neutral-slate-900">
                  연결된 경험
                </h2>
                <p className="mt-3 text-sm leading-7 text-neutral-slate-600">
                  이 프로젝트가 속한 경력 또는 활동 경험입니다.
                </p>
                <div className="mt-5 rounded-xl border border-brand-blue-200/70 bg-brand-blue-50/40 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="bg-white text-brand-blue-700"
                    >
                      {getExperienceTypeLabel(project.experience.type)}
                    </Badge>
                    <span className="text-sm text-neutral-slate-500">
                      {formatExperiencePeriod(
                        project.experience.startDate,
                        project.experience.endDate,
                      )}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-neutral-slate-900">
                    {project.experience.title}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-slate-600">
                    {project.experience.organization}
                  </p>
                  <Link
                    href="/#experience"
                    className="mt-4 inline-flex text-sm font-medium text-brand-blue-700 transition-colors hover:text-brand-blue-800"
                  >
                    홈 타임라인에서 보기
                  </Link>
                </div>
              </section>
            ) : null}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div className="rounded-2xl border border-brand-blue-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <h3 className="text-lg font-semibold text-neutral-slate-900">
                  한눈에 보기
                </h3>
                <div className="mt-4 space-y-3 text-sm text-neutral-slate-600">
                  <div>
                    <span className="text-neutral-slate-500">공개 경로:</span>
                    <p className="mt-1 break-all font-medium text-neutral-slate-800">
                      {canonicalProjectPath}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-slate-500">대표 프로젝트:</span>
                    <p className="mt-1 font-medium text-neutral-slate-800">
                      {project.isFeatured
                        ? `예, 순서 ${project.featuredOrder}`
                        : '아니오'}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-slate-500">사용 기술:</span>
                    <p className="mt-1 font-medium text-neutral-slate-800">
                      {(project.techStack || []).join(', ') || '정리 중'}
                    </p>
                  </div>
                </div>
              </div>

              <RelatedProjects currentSlug={relatedKey} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
