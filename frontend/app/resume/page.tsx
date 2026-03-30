import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowLeft,
  ExternalLink,
  type LucideIcon,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  formatExperiencePeriod,
  getCareerDurationLabel,
  getExperienceTypeLabel,
} from '@/lib/experience/utils';
import { buildResumeSnapshot } from '@/lib/portfolio/build-resume-snapshot';
import {
  extractExperienceHighlights,
  normalizeResumeStringArray,
} from '@/lib/portfolio/resume-content';
import { absoluteUrl } from '@/lib/site';
import type { Experience, Project } from '@/lib/types/api';
import { normalizeImageUrl } from '@/lib/utils/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '이력서',
  description:
    '박준하의 경력, 프로젝트, 핵심 역량을 브라우저에서 바로 읽을 수 있는 공개 이력서입니다.',
  alternates: {
    canonical: absoluteUrl('/resume'),
  },
  openGraph: {
    title: '박준하 | 공개 이력서',
    description:
      '박준하의 경력, 프로젝트, 핵심 역량을 브라우저에서 바로 읽을 수 있는 공개 이력서입니다.',
    url: absoluteUrl('/resume'),
    siteName: '박준하 포트폴리오',
    locale: 'ko_KR',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: '박준하 | 공개 이력서',
    description:
      '박준하의 경력, 프로젝트, 핵심 역량을 브라우저에서 바로 읽을 수 있는 공개 이력서입니다.',
  },
};

interface ContactItem {
  label: string;
  value: string;
  href?: string;
  icon: LucideIcon;
}

function formatProjectDate(value?: string): string {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
  }).format(new Date(value));
}

function formatProjectPeriod(startDate?: string, endDate?: string): string {
  const start = formatProjectDate(startDate);
  const end = formatProjectDate(endDate);

  if (!start && !end) {
    return '';
  }

  if (!start) {
    return end;
  }

  return `${start} - ${end || '현재'}`;
}

function getExperienceHighlights(experience: Experience): string[] {
  const normalized = normalizeResumeStringArray(experience.resumeHighlights || [], 3);
  if (normalized.length > 0) {
    return normalized;
  }

  return extractExperienceHighlights([experience.description], 2);
}

function getProjectTitle(project: Project): string {
  return project.resumeTitle?.trim() || project.title;
}

function getProjectSummary(project: Project): string {
  return (
    project.resumeSummary?.trim() ||
    project.description?.trim() ||
    project.longDescription?.trim() ||
    ''
  );
}

function getProjectHighlights(project: Project): string[] {
  const explicitHighlights = normalizeResumeStringArray(project.resumeHighlights || [], 3);
  if (explicitHighlights.length > 0) {
    return explicitHighlights;
  }

  return normalizeResumeStringArray(project.features || [], 3);
}

function ContactRow({ item }: { item: ContactItem }) {
  const content = (
    <>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-blue-200 bg-white text-brand-blue-700">
        <item.icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-slate-500">
          {item.label}
        </p>
        <p className="mt-1 break-all text-sm font-medium text-neutral-slate-800">
          {item.value}
        </p>
      </div>
    </>
  );

  if (!item.href) {
    return <div className="flex items-start gap-3">{content}</div>;
  }

  return (
    <a
      href={item.href}
      target={item.href.startsWith('mailto:') ? undefined : '_blank'}
      rel={item.href.startsWith('mailto:') ? undefined : 'noreferrer'}
      className="flex items-start gap-3 rounded-2xl border border-transparent p-2 -m-2 transition-colors hover:border-brand-blue-200 hover:bg-white/80"
    >
      {content}
    </a>
  );
}

export default async function ResumePage() {
  const snapshot = await buildResumeSnapshot();
  const { settings, profile, summaryBullets, featuredSkills, selectedExperiences, selectedProjects } =
    snapshot;

  const name = settings.name || profile.name || '박준하';
  const title = settings.title || profile.title || '백엔드 개발자';
  const headline =
    settings.headline || profile.subtitle || profile.description || profile.about || '';
  const photoUrl = normalizeImageUrl(settings.photoUrl || profile.profileImage);
  const showPhoto = settings.showPhoto !== false;
  const location = settings.location || profile.location;
  const careerLabel = getCareerDurationLabel(selectedExperiences);
  const aboutParagraphs = [profile.about, profile.description].filter((value, index, array) => {
    if (!value || value === headline) {
      return false;
    }

    return array.indexOf(value) === index;
  });

  const contactItems: ContactItem[] = [
    settings.email
      ? {
          label: 'Email',
          value: settings.email,
          href: `mailto:${settings.email}`,
          icon: Mail,
        }
      : null,
    location
      ? {
          label: 'Location',
          value: location,
          icon: MapPin,
        }
      : null,
    settings.github
      ? {
          label: 'GitHub',
          value: settings.github.replace(/^https?:\/\//, ''),
          href: settings.github,
          icon: Github,
        }
      : null,
    settings.linkedin
      ? {
          label: 'LinkedIn',
          value: settings.linkedin.replace(/^https?:\/\//, ''),
          href: settings.linkedin,
          icon: Linkedin,
        }
      : null,
  ].filter((item): item is ContactItem => Boolean(item));

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(237,242,246,0.9)_0%,rgba(255,255,255,1)_26%,rgba(245,243,240,0.55)_100%)] text-neutral-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <header className="border-b border-brand-blue-200/70 pb-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-slate-600 transition-colors hover:text-brand-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              포트폴리오로 돌아가기
            </Link>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-brand-blue-200 bg-white/90 text-brand-blue-700 hover:bg-brand-blue-50"
                asChild
              >
                <a href="/api/resume" target="_blank" rel="noreferrer">
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  PDF 다운로드
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_320px] lg:gap-12">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-brand-blue-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-blue-700">
                Public Resume
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-neutral-slate-900 md:text-6xl">
                  {name}
                </h1>
                <p className="text-xl text-brand-blue-700 md:text-2xl">{title}</p>
                {headline ? (
                  <p className="max-w-3xl text-base leading-8 text-neutral-slate-700 md:text-lg">
                    {headline}
                  </p>
                ) : null}
              </div>

              {summaryBullets.length > 0 ? (
                <ul className="grid gap-3 md:grid-cols-2">
                  {summaryBullets.map((item) => (
                    <li
                      key={item}
                      className="rounded-3xl border border-brand-blue-200/70 bg-white/85 px-5 py-4 text-sm leading-7 text-neutral-slate-700 shadow-sm shadow-brand-blue-100/30"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="grid gap-4 border-t border-brand-blue-200/70 pt-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-slate-500">
                    실무 경력
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-slate-900">
                    {careerLabel || '정리 중'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-slate-500">
                    대표 프로젝트
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-slate-900">
                    {selectedProjects.length}개
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-slate-500">
                    핵심 기술
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-slate-900">
                    {featuredSkills.length}개
                  </p>
                </div>
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[2rem] border border-brand-blue-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-45px_rgba(33,52,72,0.45)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-blue-50/90 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-4">
                  {showPhoto ? (
                    <div className="relative h-20 w-20 overflow-hidden rounded-[1.5rem] border border-brand-blue-200 bg-brand-blue-50">
                      {photoUrl ? (
                        <Image
                          src={photoUrl}
                          alt={name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-brand-blue-700">
                          {name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-slate-900">{name}</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-slate-600">{title}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {contactItems.map((item) => (
                    <ContactRow key={`${item.label}-${item.value}`} item={item} />
                  ))}
                </div>

                {featuredSkills.length > 0 ? (
                  <div className="mt-8 border-t border-brand-blue-200/70 pt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-slate-500">
                      핵심 역량
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {featuredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-brand-blue-200 bg-brand-blue-50 px-3 py-1 text-sm text-brand-blue-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </header>

        <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1.5fr)_320px] lg:gap-12">
          <div className="space-y-12">
            <section>
              <div className="flex items-end justify-between gap-4 border-b border-brand-blue-200/70 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-slate-500">
                    Experience
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-neutral-slate-900">
                    경력과 활동
                  </h2>
                </div>
              </div>

              <div className="mt-8 space-y-8">
                {selectedExperiences.length > 0 ? (
                  selectedExperiences.map((experience) => {
                    const highlights = getExperienceHighlights(experience);

                    return (
                      <article
                        key={experience.id}
                        className="grid gap-4 border-l border-brand-blue-200 pl-5 md:grid-cols-[minmax(0,1fr)_180px] md:items-start md:gap-8"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-brand-blue-200 bg-white px-3 py-1 text-xs font-semibold text-brand-blue-700">
                              {getExperienceTypeLabel(experience.type)}
                            </span>
                            <span className="text-sm text-neutral-slate-500">
                              {formatExperiencePeriod(experience.startDate, experience.endDate) || '기간 정보 없음'}
                            </span>
                          </div>
                          <h3 className="mt-4 text-xl font-semibold text-neutral-slate-900">
                            {experience.title}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-neutral-slate-600">
                            {experience.organization}
                          </p>

                          {highlights.length > 0 ? (
                            <ul className="mt-4 space-y-2 text-sm leading-7 text-neutral-slate-700">
                              {highlights.map((highlight) => (
                                <li key={highlight} className="flex gap-3">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-blue-500" />
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          ) : experience.description ? (
                            <p className="mt-4 text-sm leading-7 text-neutral-slate-700">
                              {experience.description}
                            </p>
                          ) : null}
                        </div>

                        {experience.linkedProjects && experience.linkedProjects.length > 0 ? (
                          <div className="rounded-[1.5rem] border border-brand-blue-200/70 bg-white/85 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-slate-500">
                              관련 프로젝트
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-neutral-slate-700">
                              {experience.linkedProjects.map((project) => (
                                <li key={project.id}>{project.title}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-slate-600">표시할 경력 항목이 없습니다.</p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between gap-4 border-b border-brand-blue-200/70 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-slate-500">
                    Projects
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-neutral-slate-900">
                    대표 프로젝트
                  </h2>
                </div>
              </div>

              <div className="mt-8 space-y-8">
                {selectedProjects.length > 0 ? (
                  selectedProjects.map((project) => {
                    const projectSummary = getProjectSummary(project);
                    const projectHighlights = getProjectHighlights(project);
                    const projectLinks = [
                      project.slug
                        ? {
                            href: `/projects/${project.slug}`,
                            label: '상세 보기',
                            internal: true,
                          }
                        : null,
                      project.liveUrl
                        ? {
                            href: project.liveUrl,
                            label: '라이브 보기',
                            internal: false,
                          }
                        : null,
                      project.githubUrl
                        ? {
                            href: project.githubUrl,
                            label: 'GitHub',
                            internal: false,
                          }
                        : null,
                    ].filter(
                      (
                        item,
                      ): item is { href: string; label: string; internal: boolean } => Boolean(item),
                    );

                    return (
                      <article
                        key={project.id}
                        className="rounded-[2rem] border border-brand-blue-200/70 bg-white/85 p-6 shadow-sm shadow-brand-blue-100/20"
                      >
                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-slate-500">
                          {project.category ? <span>{project.category}</span> : null}
                          {project.category && formatProjectPeriod(project.startDate, project.endDate) ? (
                            <span>·</span>
                          ) : null}
                          {formatProjectPeriod(project.startDate, project.endDate) ? (
                            <span>{formatProjectPeriod(project.startDate, project.endDate)}</span>
                          ) : null}
                        </div>

                        <h3 className="mt-3 text-2xl font-semibold text-neutral-slate-900">
                          {getProjectTitle(project)}
                        </h3>

                        {projectSummary ? (
                          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-slate-700">
                            {projectSummary}
                          </p>
                        ) : null}

                        {projectHighlights.length > 0 ? (
                          <ul className="mt-5 grid gap-3 md:grid-cols-2">
                            {projectHighlights.map((highlight) => (
                              <li
                                key={highlight}
                                className="rounded-2xl border border-brand-blue-200/70 bg-brand-blue-50/50 px-4 py-3 text-sm leading-6 text-neutral-slate-700"
                              >
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {(project.techStack || []).length > 0 ? (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {(project.techStack || []).slice(0, 6).map((tech) => (
                              <span
                                key={tech}
                                className="rounded-full border border-neutral-slate-200 bg-white px-3 py-1 text-xs font-medium text-neutral-slate-600"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {projectLinks.length > 0 ? (
                          <div className="mt-6 flex flex-wrap gap-3">
                            {projectLinks.map((item) =>
                              item.internal ? (
                                <Button key={`${project.id}-${item.href}`} variant="outline" asChild>
                                  <Link href={item.href}>
                                    {item.label}
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                              ) : (
                                <Button key={`${project.id}-${item.href}`} variant="outline" asChild>
                                  <a href={item.href} target="_blank" rel="noreferrer">
                                    {item.label}
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                  </a>
                                </Button>
                              ),
                            )}
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-slate-600">표시할 대표 프로젝트가 없습니다.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">
            {aboutParagraphs.length > 0 ? (
              <section className="rounded-[2rem] border border-brand-blue-200/70 bg-white/85 p-6 shadow-sm shadow-brand-blue-100/20">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-slate-500">
                  About
                </p>
                <div className="mt-4 space-y-4 text-sm leading-7 text-neutral-slate-700">
                  {aboutParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-brand-blue-200/70 bg-brand-blue-900 px-6 py-7 text-white shadow-[0_24px_70px_-45px_rgba(33,52,72,0.8)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue-100">
                Quick Actions
              </p>
              <h2 className="mt-3 text-2xl font-semibold">브라우저에서 읽고, 필요하면 바로 내려받기</h2>
              <p className="mt-3 text-sm leading-7 text-brand-blue-50/90">
                이 페이지는 웹에서 빠르게 훑어보기 위한 공개 이력서입니다. 제출용 파일이 필요하면 PDF를 함께 사용할 수 있습니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-white/30 bg-white text-brand-blue-900 hover:bg-brand-blue-50"
                  asChild
                >
                  <a href="/api/resume" target="_blank" rel="noreferrer">
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                    PDF 다운로드
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/">
                    포트폴리오 보기
                    <Globe className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
