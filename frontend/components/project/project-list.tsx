import { ArrowUpRight, ExternalLink, Github } from 'lucide-react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getPostPath } from '@/lib/posts/post-url';
import { getProjectPath } from '@/lib/projects/project-url';
import { cn } from '@/lib/utils';
import type { LinkedPostSummary, Project } from '@/lib/types/api';

interface ProjectListProps {
  projects: Project[];
  trackingLocation: string;
  className?: string;
  emptyMessage?: string;
}

function formatProjectDate(date?: string) {
  if (!date) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
  }).format(new Date(date));
}

function formatProjectPeriod(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return '';
  if (startDate && endDate) {
    return `${formatProjectDate(startDate)} - ${formatProjectDate(endDate)}`;
  }
  if (startDate) {
    return `${formatProjectDate(startDate)}부터`;
  }

  return `${formatProjectDate(endDate)} 종료`;
}

function getStatusLabel(status?: string) {
  switch (status) {
    case 'completed':
      return '완료';
    case 'active':
    case 'in-progress':
      return '진행중';
    case 'planned':
      return '계획';
    default:
      return status || '';
  }
}

function getPublishedPosts(posts?: LinkedPostSummary[]) {
  return [...(posts || [])]
    .filter((post) => post.status === 'published')
    .sort(
      (a, b) =>
        new Date(b.publishDate || 0).getTime() -
        new Date(a.publishDate || 0).getTime(),
    );
}

function getProjectNarrative(project: Project) {
  return project.description?.trim() || project.problem?.trim() || '';
}

function RelatedPostList({
  posts,
  trackingLocation,
}: {
  posts: LinkedPostSummary[];
  trackingLocation: string;
}) {
  return (
    <div className="mt-3 space-y-3">
      {posts.map((post) => (
        <TrackedLink
          key={post.id}
          href={getPostPath({ id: post.id, slug: post.slug })}
          className="group flex items-start justify-between gap-4 border-l border-brand-blue-200 pl-4 text-sm text-neutral-slate-600 transition-colors hover:border-brand-blue-400 hover:text-brand-blue-700"
          eventName="cta_click"
          eventPayload={{
            location: trackingLocation,
            target: 'blog',
            content_id: post.slug || String(post.id),
          }}
        >
          <span className="leading-6">{post.title}</span>
          {post.publishDate ? (
            <span className="mt-0.5 flex-shrink-0 text-xs text-neutral-slate-400 transition-colors group-hover:text-brand-blue-500">
              {new Date(post.publishDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </span>
          ) : null}
        </TrackedLink>
      ))}
    </div>
  );
}

function ExternalProjectLinks({
  project,
  projectId,
  location,
}: {
  project: Project;
  projectId: string;
  location: string;
}) {
  return (
    <>
      {project.githubUrl ? (
        <TrackedLink
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-neutral-slate-900"
          eventName="project_outbound_click"
          eventPayload={{
            project_id: projectId,
            target: 'repo',
            location,
          }}
        >
          코드
          <Github className="h-3.5 w-3.5" />
        </TrackedLink>
      ) : null}
      {project.liveUrl ? (
        <TrackedLink
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-neutral-slate-900"
          eventName="project_outbound_click"
          eventPayload={{
            project_id: projectId,
            target: 'demo',
            location,
          }}
        >
          서비스
          <ExternalLink className="h-3.5 w-3.5" />
        </TrackedLink>
      ) : null}
    </>
  );
}

export function ProjectList({
  projects,
  trackingLocation,
  className,
  emptyMessage = '공개할 프로젝트를 준비 중입니다.',
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="border-t border-brand-blue-100 py-10 text-sm text-neutral-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const [featuredProject, ...listProjects] = projects;

  return (
    <div className={cn('mt-12', className)}>
      {featuredProject ? (
        <FeaturedProjectEntry
          project={featuredProject}
          trackingLocation={trackingLocation}
        />
      ) : null}

      {listProjects.map((project) => (
        <ProjectRow
          key={project.id}
          project={project}
          trackingLocation={trackingLocation}
        />
      ))}
    </div>
  );
}

function FeaturedProjectEntry({
  project,
  trackingLocation,
}: {
  project: Project;
  trackingLocation: string;
}) {
  const projectPath = getProjectPath(project);
  const projectId = String(project.id);
  const linkedPosts = getPublishedPosts(project.linkedPosts).slice(0, 3);
  const narrative = getProjectNarrative(project);
  const meta = [
    formatProjectPeriod(project.startDate, project.endDate),
    project.category,
    getStatusLabel(project.status),
  ].filter(Boolean);
  const techSummary = (project.techStack || []).slice(0, 6).join(' · ');

  return (
    <article className="grid gap-6 border-y border-brand-blue-100 py-8 md:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
      <div className="min-w-0">
        {meta.length > 0 ? (
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-slate-400">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}

        <TrackedLink
          href={projectPath}
          className="group mt-4 inline-flex max-w-full items-start gap-2 text-3xl font-semibold tracking-tight text-neutral-slate-900 transition-colors hover:text-brand-blue-700 md:text-[2.25rem]"
          eventName="cta_click"
          eventPayload={{
            location: `${trackingLocation}_featured`,
            target: 'project',
            content_id: projectId,
          }}
        >
          <span className="text-balance">{project.title}</span>
          <ArrowUpRight className="mt-1 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </TrackedLink>

        <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-slate-600 md:text-lg">
          {narrative || '연결된 글과 구현 결과를 중심으로 프로젝트 기록을 정리했습니다.'}
        </p>

        {techSummary ? (
          <p className="mt-5 text-sm text-neutral-slate-500">Stack · {techSummary}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-5 border-t border-brand-blue-100 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-slate-500">
          <ExternalProjectLinks
            project={project}
            projectId={projectId}
            location={`${trackingLocation}_featured`}
          />
        </div>

        {linkedPosts.length > 0 ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-slate-400">
              관련 글
            </p>
            <RelatedPostList
              posts={linkedPosts}
              trackingLocation={`${trackingLocation}_featured_post`}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-slate-500">
            연결된 기술 글을 정리 중입니다.
          </p>
        )}
      </div>
    </article>
  );
}

function ProjectRow({
  project,
  trackingLocation,
}: {
  project: Project;
  trackingLocation: string;
}) {
  const projectPath = getProjectPath(project);
  const projectId = String(project.id);
  const linkedPosts = getPublishedPosts(project.linkedPosts).slice(0, 2);
  const narrative = getProjectNarrative(project);
  const meta = [
    formatProjectPeriod(project.startDate, project.endDate),
    project.category,
    getStatusLabel(project.status),
  ].filter(Boolean);
  const techSummary = (project.techStack || []).slice(0, 5).join(' · ');

  return (
    <article className="border-b border-brand-blue-100/80 py-6">
      <div className="min-w-0">
        {meta.length > 0 ? (
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-slate-400">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}

        <TrackedLink
          href={projectPath}
          className="group mt-3 inline-flex max-w-full items-start gap-2 text-2xl font-semibold tracking-tight text-neutral-slate-900 transition-colors hover:text-brand-blue-700"
          eventName="cta_click"
          eventPayload={{
            location: `${trackingLocation}_row`,
            target: 'project',
            content_id: projectId,
          }}
        >
          <span className="text-balance">{project.title}</span>
          <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </TrackedLink>

        {linkedPosts.length > 0 ? (
          <RelatedPostList
            posts={linkedPosts}
            trackingLocation={`${trackingLocation}_row_post`}
          />
        ) : narrative ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-slate-600">
            {narrative}
          </p>
        ) : (
          <p className="mt-4 text-sm text-neutral-slate-500">
            연결된 글을 정리 중입니다.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-slate-500">
          {techSummary ? <span>Stack · {techSummary}</span> : null}
          <ExternalProjectLinks
            project={project}
            projectId={projectId}
            location={`${trackingLocation}_row`}
          />
        </div>
      </div>
    </article>
  );
}
