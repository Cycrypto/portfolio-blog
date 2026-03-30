import { ArrowUpRight, ExternalLink, Github } from 'lucide-react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { getProjectPath } from '@/lib/projects/project-url';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/types/api';

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

function getProjectNarrative(project: Project) {
  return project.description?.trim() || project.problem?.trim() || '';
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
  const narrative = getProjectNarrative(project);
  const meta = [
    formatProjectPeriod(project.startDate, project.endDate),
    project.category,
    getStatusLabel(project.status),
  ].filter(Boolean);
  const techSummary = (project.techStack || []).slice(0, 6).join(' · ');

  return (
    <article className="border-y border-brand-blue-100 py-8">
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
          {narrative || '프로젝트 개요와 구현 내용을 정리했습니다.'}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-slate-500">
          {techSummary ? <span>Stack · {techSummary}</span> : null}
          <ExternalProjectLinks
            project={project}
            projectId={projectId}
            location={`${trackingLocation}_featured`}
          />
        </div>
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

        {narrative ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-slate-600">
            {narrative}
          </p>
        ) : (
          <p className="mt-4 text-sm text-neutral-slate-500">
            프로젝트 설명을 정리 중입니다.
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
