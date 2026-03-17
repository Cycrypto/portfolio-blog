import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, ExternalLink, Github } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { ProjectGallery } from '@/components/project/project-gallery';
import { RelatedProjects } from '@/components/project/related-projects';
import { getProject } from '@/lib/api';
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

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectOr404(slug);
  const description =
    project.description ||
    project.problem ||
    project.longDescription ||
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
  fallback,
}: {
  title: string;
  content?: string;
  fallback: string;
}) {
  return (
    <section className="rounded-2xl border border-brand-blue-200/70 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-neutral-slate-900">{title}</h2>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-slate-700">
        {content?.trim() || fallback}
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

            {images.length > 0 ? <ProjectGallery images={images} title={project.title} /> : null}

            <div className="grid gap-6 md:grid-cols-2">
              <DetailSection
                title="문제"
                content={project.problem || project.description}
                fallback="이 프로젝트가 해결하려던 문제를 정리 중입니다."
              />
              <DetailSection
                title="내 역할"
                content={project.role}
                fallback="프로젝트에서 맡았던 역할을 정리 중입니다."
              />
              <DetailSection
                title="접근"
                content={project.approach || project.longDescription}
                fallback="설계와 구현 접근 방식을 정리 중입니다."
              />
              <DetailSection
                title="성과"
                content={project.outcomes}
                fallback="결과와 회고를 정리 중입니다."
              />
            </div>

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

            {project.longDescription ? (
              <>
                <Separator />
                <section className="rounded-2xl border border-brand-blue-200/70 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-neutral-slate-900">
                    추가 설명
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-slate-700">
                    {project.longDescription}
                  </p>
                </section>
              </>
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
