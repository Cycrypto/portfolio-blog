import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Download,
  Github,
  Linkedin,
  Mail,
  MapPin,
} from 'lucide-react';

import { TrackedLink } from '@/components/analytics/TrackedLink';
import { BlogCard } from '@/components/blog/blog-card';
import { ContactForm } from '@/components/common/contact-form';
import { FloatingNav } from '@/components/common/layout/floating-nav';
import { SectionHeading } from '@/components/common/section-heading';
import { SkillBadge } from '@/components/common/skill-badge';
import { ProjectCard } from '@/components/project/project-card';
import { Button } from '@/components/ui/button';
import { buildPortfolioSnapshot } from '@/lib/portfolio/build-portfolio-snapshot';
import { absoluteUrl } from '@/lib/site';
import { normalizeImageUrl } from '@/lib/utils/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '박준하 | 백엔드 포트폴리오',
  description:
    '문제를 구조화하고 안정적인 백엔드 시스템을 설계하는 개발자 박준하의 포트폴리오와 기술 기록입니다.',
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    title: '박준하 | 백엔드 포트폴리오',
    description:
      '대표 프로젝트, 기술 기록, 경력과 함께 보는 채용형 포트폴리오입니다.',
    url: absoluteUrl('/'),
    siteName: '박준하 포트폴리오',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '박준하 | 백엔드 포트폴리오',
    description:
      '대표 프로젝트, 기술 기록, 경력과 함께 보는 채용형 포트폴리오입니다.',
  },
};

function formatMonthRange(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) {
    return '기간 정리 중';
  }

  const formatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
  });
  const format = (value?: string) =>
    value ? formatter.format(new Date(value)) : '현재';

  if (startDate && endDate) {
    return `${format(startDate)} - ${format(endDate)}`;
  }

  if (startDate) {
    return `${format(startDate)} - 현재`;
  }

  return `${format(endDate)} 종료`;
}

export default async function PortfolioPage() {
  const snapshot = await buildPortfolioSnapshot();
  const {
    profile,
    featuredPosts,
    featuredProjects,
    experiences,
    metrics,
    yearsOfExperience,
    availableForWork,
  } = snapshot;

  const heroDescription =
    profile.subtitle || profile.description || profile.about || '';
  const profileImage = normalizeImageUrl(profile.profileImage);
  const heroSkills = (profile.skills || []).slice(0, 4);
  const visibleSkills = (profile.skills || []).slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50 text-neutral-slate-900">
      <FloatingNav />

      <section className="relative overflow-hidden pb-12 pt-20 md:pb-16 md:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(148,180,193,0.22),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(220,232,239,0.7),transparent_42%)]" />
          <div className="absolute left-12 top-12 h-48 w-48 rounded-full bg-brand-blue-100/70 blur-3xl" />
          <div className="absolute bottom-12 right-12 h-60 w-60 rounded-full bg-brand-indigo-50/90 blur-3xl" />
        </div>

        <div className="container relative z-10 grid items-start gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-brand-blue-200 bg-brand-blue-50 px-4 py-2 text-sm font-medium text-brand-blue-700">
              {profile.title}
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-neutral-slate-900 md:text-6xl">
                구조를 단순하게 만들고
                <span className="block text-brand-blue-700">
                  운영 가능한 백엔드를 설계합니다
                </span>
              </h1>
              <p className="max-w-3xl text-base leading-8 text-neutral-slate-600 md:text-lg">
                {heroDescription}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="surface-default bg-white/85 p-4 backdrop-blur"
                >
                  <p className="text-xs font-semibold tracking-[0.14em] text-brand-blue-600">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-neutral-slate-900">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-neutral-slate-500">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-brand-blue-600 text-white hover:bg-brand-blue-700"
              >
                <TrackedLink
                  href="/api/resume"
                  eventName="cta_click"
                  eventPayload={{ location: 'home_hero', target: 'resume' }}
                >
                  이력서 PDF 다운로드 <Download className="ml-2 h-4 w-4" />
                </TrackedLink>
              </Button>
              <Button
                variant="outline"
                className="border-brand-blue-200 bg-white text-brand-blue-700 hover:bg-brand-blue-50"
                asChild
              >
                <TrackedLink
                  href="#projects"
                  eventName="cta_click"
                  eventPayload={{ location: 'home_hero', target: 'projects' }}
                >
                  대표 프로젝트 보기 <ArrowRight className="ml-2 h-4 w-4" />
                </TrackedLink>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue-200/80 bg-white px-3 py-1">
                <MapPin className="h-3.5 w-3.5 text-brand-blue-600" />
                {profile.location || '위치 정보 정리 중'}
              </span>
              <span className="rounded-full border border-brand-blue-200/80 bg-white px-3 py-1">
                {profile.status || '상태 정리 중'}
              </span>
              <span
                className={`rounded-full border px-3 py-1 ${
                  availableForWork
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-neutral-slate-200 bg-white text-neutral-slate-500'
                }`}
              >
                {availableForWork ? '협업 가능' : '상태 업데이트 예정'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {heroSkills.length > 0 ? (
                heroSkills.map((skill) => (
                  <span
                    key={skill.name}
                    className="rounded-full border border-brand-blue-200/80 bg-brand-blue-50 px-3 py-1 text-xs font-medium text-brand-blue-700"
                  >
                    {skill.name}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-brand-blue-200/80 bg-brand-blue-50 px-3 py-1 text-xs font-medium text-brand-blue-700">
                  기술 스택 정리 중
                </span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="surface-default overflow-hidden bg-white/90 p-6 backdrop-blur md:p-8">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-brand-blue-200 bg-brand-blue-50">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={profile.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-brand-blue-700">
                      {profile.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.16em] text-brand-blue-600">
                    CANDIDATE SNAPSHOT
                  </p>
                  <p className="mt-2 text-2xl font-bold text-neutral-slate-900">
                    {profile.name}
                  </p>
                  <p className="mt-1 text-sm text-neutral-slate-600">
                    {profile.title}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-brand-blue-200/80 bg-white px-4 py-3">
                  <p className="text-xs text-neutral-slate-500">경력 포인트</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-slate-900">
                    {yearsOfExperience > 0
                      ? `${yearsOfExperience}+년 실무 경험`
                      : '이력 정보 정리 중'}
                  </p>
                </div>
                <div className="rounded-xl border border-brand-blue-200/80 bg-white px-4 py-3">
                  <p className="text-xs text-neutral-slate-500">대표 프로젝트</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-slate-900">
                    {featuredProjects.length}건
                  </p>
                </div>
                <div className="rounded-xl border border-brand-blue-200/80 bg-white px-4 py-3 sm:col-span-2">
                  <p className="text-xs text-neutral-slate-500">현재 포커스</p>
                  <p className="mt-1 text-sm font-medium text-neutral-slate-700">
                    {profile.statusMessage || '현재 포커스 정보를 정리 중입니다.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {profile.github ? (
                  <TrackedLink
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    eventName="social_click"
                    eventPayload={{
                      channel: 'github',
                      location: 'home_hero_social',
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full border border-brand-blue-200 bg-white text-neutral-slate-700 hover:bg-brand-blue-50"
                    >
                      <Github className="h-5 w-5" />
                      <span className="sr-only">GitHub</span>
                    </Button>
                  </TrackedLink>
                ) : null}
                {profile.linkedin ? (
                  <TrackedLink
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    eventName="social_click"
                    eventPayload={{
                      channel: 'linkedin',
                      location: 'home_hero_social',
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full border border-brand-blue-200 bg-white text-neutral-slate-700 hover:bg-brand-blue-50"
                    >
                      <Linkedin className="h-5 w-5" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TrackedLink>
                ) : null}
                {profile.email ? (
                  <TrackedLink
                    href={`mailto:${profile.email}`}
                    eventName="social_click"
                    eventPayload={{
                      channel: 'email',
                      location: 'home_hero_social',
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full border border-brand-blue-200 bg-white text-neutral-slate-700 hover:bg-brand-blue-50"
                    >
                      <Mail className="h-5 w-5" />
                      <span className="sr-only">이메일</span>
                    </Button>
                  </TrackedLink>
                ) : null}
              </div>
            </div>

            <div className="surface-default bg-white/85 p-6 backdrop-blur">
              <p className="text-xs font-semibold tracking-[0.16em] text-brand-blue-600">
                WHAT I BRING
              </p>
              <p className="mt-3 text-base leading-7 text-neutral-slate-700">
                {profile.about || profile.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section-spacing">
        <div className="container">
          <SectionHeading
            title="소개"
            subtitle="무엇을 잘 만들고 어떤 방식으로 일하는지 빠르게 확인할 수 있도록 정리했습니다."
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="surface-default overflow-hidden bg-white/90 p-6">
              <h3 className="text-xl font-bold text-neutral-slate-900">
                요약
              </h3>
              <p className="mt-4 text-base leading-8 text-neutral-slate-700">
                {profile.description || profile.about}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-brand-blue-200/80 bg-brand-blue-50 px-4 py-3">
                  <p className="text-xs text-neutral-slate-500">연락처</p>
                  <p className="mt-1 break-all text-sm font-medium text-neutral-slate-800">
                    {profile.email || '비공개'}
                  </p>
                </div>
                <div className="rounded-xl border border-brand-blue-200/80 bg-brand-blue-50 px-4 py-3">
                  <p className="text-xs text-neutral-slate-500">희망 상태</p>
                  <p className="mt-1 text-sm font-medium text-neutral-slate-800">
                    {profile.status || '업데이트 예정'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-neutral-slate-900">
                핵심 기술
              </h3>
              {visibleSkills.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {visibleSkills.map((skill) => (
                    <SkillBadge
                      key={skill.name}
                      name={skill.name}
                      level={skill.level}
                    />
                  ))}
                </div>
              ) : (
                <div className="surface-default mt-4 bg-white/90 px-6 py-8 text-center text-neutral-slate-500">
                  기술 스택을 정리 중입니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="section-spacing">
        <div className="container">
          <SectionHeading
            title="대표 프로젝트"
            subtitle="문제 정의, 내 역할, 구현 접근, 성과를 기준으로 추려낸 대표 작업입니다."
          />

          {featuredProjects.length > 0 ? (
            <>
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {featuredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    slug={project.slug}
                    title={project.title}
                    description={project.description || project.problem || ''}
                    tags={project.techStack || []}
                    image={project.images?.[0]}
                    demoUrl={project.liveUrl}
                    repoUrl={project.githubUrl}
                  />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Button
                  asChild
                  className="bg-brand-blue-600 text-white hover:bg-brand-blue-700"
                >
                  <TrackedLink
                    href="/projects"
                    eventName="cta_click"
                    eventPayload={{ location: 'home_projects', target: 'projects' }}
                  >
                    프로젝트 전체 보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </TrackedLink>
                </Button>
              </div>
            </>
          ) : (
            <div className="surface-default mt-12 bg-white/90 px-6 py-10 text-center text-neutral-slate-500">
              공개할 프로젝트를 준비 중입니다.
            </div>
          )}
        </div>
      </section>

      <section id="experience" className="section-spacing">
        <div className="container">
          <SectionHeading
            title="경력"
            subtitle="어떤 환경에서 어떤 역할을 맡아왔는지 핵심 흐름만 남겼습니다."
          />

          {experiences.length > 0 ? (
            <div className="mt-12 space-y-4">
              {experiences.map((experience) => (
                <div
                  key={experience.id}
                  className="surface-default bg-white/90 p-6"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-slate-900">
                        {experience.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-brand-blue-700">
                        {experience.company}
                      </p>
                    </div>
                    <div className="rounded-full border border-brand-blue-200 bg-brand-blue-50 px-3 py-1 text-xs font-medium text-brand-blue-700">
                      {formatMonthRange(
                        experience.startDate,
                        experience.endDate,
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-neutral-slate-600">
                    {experience.description || '상세 역할을 정리 중입니다.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface-default mt-12 bg-white/90 px-6 py-10 text-center text-neutral-slate-500">
              등록된 경력 정보가 없습니다.
            </div>
          )}
        </div>
      </section>

      <section id="blog" className="section-spacing">
        <div className="container">
          <SectionHeading
            title="대표 기술 글"
            subtitle="문제 해결 방식과 구현 판단을 확인할 수 있는 글만 우선 노출합니다."
          />

          {featuredPosts.length > 0 ? (
            <>
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {featuredPosts.map((post) => (
                  <BlogCard
                    key={post.id}
                    title={post.title}
                    excerpt={
                      post.excerpt ||
                      `${post.category} 주제에서 해결 과정을 정리한 글입니다.`
                    }
                    date={new Date(post.publishDate).toLocaleDateString(
                      'ko-KR',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
                    )}
                    readTime={`${post.readTime}분`}
                    tags={post.tags || [post.category]}
                    image={post.image}
                    slug={post.slug || String(post.id)}
                  />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Button
                  asChild
                  className="bg-brand-blue-600 text-white hover:bg-brand-blue-700"
                >
                  <TrackedLink
                    href="/blog"
                    eventName="cta_click"
                    eventPayload={{ location: 'home_blog', target: 'blog' }}
                  >
                    글 전체 보기 <BookOpen className="ml-2 h-4 w-4" />
                  </TrackedLink>
                </Button>
              </div>
            </>
          ) : (
            <div className="surface-default mt-12 bg-white/90 px-6 py-10 text-center text-neutral-slate-500">
              공개한 기술 글을 준비 중입니다.
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="section-spacing">
        <div className="container">
          <SectionHeading
            title="연락하기"
            subtitle="채용, 협업, 기술 관련 문의를 남길 수 있습니다."
          />

          <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="surface-default bg-white/90 p-6">
              <h3 className="text-xl font-bold text-neutral-slate-900">
                연락 전 확인할 자료
              </h3>
              <p className="mt-4 text-sm leading-7 text-neutral-slate-600">
                대표 프로젝트와 기술 글, 그리고 랜딩 내용을 재구성한 이력서
                PDF를 함께 제공합니다.
              </p>

              <div className="mt-6 grid gap-3">
                <Button
                  asChild
                  className="bg-brand-blue-600 text-white hover:bg-brand-blue-700"
                >
                  <TrackedLink
                    href="/api/resume"
                    eventName="cta_click"
                    eventPayload={{ location: 'home_contact', target: 'resume' }}
                  >
                    이력서 PDF 다운로드 <Download className="ml-2 h-4 w-4" />
                  </TrackedLink>
                </Button>
                <Button
                  variant="outline"
                  className="border-brand-blue-200 bg-white text-brand-blue-700 hover:bg-brand-blue-50"
                  asChild
                >
                  <TrackedLink
                    href="/projects"
                    eventName="cta_click"
                    eventPayload={{ location: 'home_contact', target: 'projects' }}
                  >
                    대표 프로젝트 확인
                  </TrackedLink>
                </Button>
              </div>

              <div className="mt-6 space-y-4 text-sm text-neutral-slate-600">
                {profile.email ? (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-brand-blue-600" />
                    <span>{profile.email}</span>
                  </div>
                ) : null}
                {profile.github ? (
                  <div className="flex items-center gap-3">
                    <Github className="h-4 w-4 text-brand-blue-600" />
                    <span className="break-all">{profile.github}</span>
                  </div>
                ) : null}
                {profile.linkedin ? (
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-4 w-4 text-brand-blue-600" />
                    <span className="break-all">{profile.linkedin}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
