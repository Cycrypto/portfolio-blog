import type { Metadata } from 'next';
import Image from 'next/image';
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
import { GlassmorphicCard } from '@/components/common/glassmorphic-card';
import { ContactForm } from '@/components/common/contact-form';
import { FloatingNav } from '@/components/common/layout/floating-nav';
import { SectionHeading } from '@/components/common/section-heading';
import { SkillBadge } from '@/components/common/skill-badge';
import { Timeline } from '@/components/home/timeline';
import { ProjectList } from '@/components/project/project-list';
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
      '대표 프로젝트, 기술 기록, 경험과 함께 보는 채용형 포트폴리오입니다.',
    url: absoluteUrl('/'),
    siteName: '박준하 포트폴리오',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '박준하 | 백엔드 포트폴리오',
    description:
      '대표 프로젝트, 기술 기록, 경험과 함께 보는 채용형 포트폴리오입니다.',
  },
};

function formatPostDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function PortfolioPage() {
  const snapshot = await buildPortfolioSnapshot();
  const {
    profile,
    featuredPosts,
    featuredProjects,
    experiences,
    careerDurationLabel,
    metrics,
    availableForWork,
  } = snapshot;

  const heroHeadline =
    profile.subtitle ||
    '문제를 구조화하고 안정적인 백엔드 시스템을 설계합니다.';
  const heroDescriptionSource = profile.description || profile.about || '';
  const heroDescription =
    heroDescriptionSource && heroDescriptionSource !== heroHeadline
      ? heroDescriptionSource.length > 140
        ? `${heroDescriptionSource.slice(0, 140).trimEnd()}...`
        : heroDescriptionSource
      : '대표 프로젝트와 기술 기록으로 문제 해결 과정과 구현 선택을 정리합니다.';
  const normalizedProfileImage = normalizeImageUrl(profile.profileImage);
  const heroSkills = (profile.skills || []).slice(0, 3);
  const visibleSkills = (profile.skills || []).slice(0, 8);
  const heroSkillSummary =
    heroSkills.length > 0
      ? heroSkills.map((skill) => skill.name).join(' · ')
      : '기술 스택 정리 중';
  const supportPosts = featuredPosts.slice(0, 2);
  const supportMetrics = metrics.slice(0, 3);
  const aboutParagraphs = [profile.about, profile.description].filter(
    (value, index, array) => Boolean(value) && array.indexOf(value) === index,
  );
  const [featuredBlogPost, ...recentBlogPosts] = featuredPosts;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50 text-neutral-slate-900">
      <FloatingNav />

      <section className="relative overflow-hidden px-0 pb-14 pt-24 md:pb-20 md:pt-28">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(148,180,193,0.28),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(220,232,239,0.85),transparent_38%),linear-gradient(180deg,rgba(245,248,250,0.32),rgba(255,255,255,0))]" />
          <div className="absolute left-4 top-6 h-56 w-56 rounded-full bg-brand-blue-100/70 blur-3xl md:left-12 md:top-12 md:h-72 md:w-72" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand-indigo-50/90 blur-3xl md:bottom-6 md:right-12 md:h-80 md:w-80" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white/80" />
        </div>

        <div className="container relative z-10 grid min-h-[calc(100svh-6.5rem)] grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:gap-14">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-brand-blue-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-brand-blue-700 shadow-sm shadow-brand-blue-100/40 backdrop-blur">
                {profile.name}
                <span className="mx-2 text-brand-blue-300">/</span>
                {profile.title || 'Backend Engineer'}
              </div>

              <h1 className="max-w-[11ch] text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-neutral-slate-900 sm:text-6xl md:text-7xl">
                {heroHeadline}
              </h1>

              <p className="max-w-[36rem] text-base leading-relaxed text-neutral-slate-600 md:text-lg">
                {heroDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Button variant="brand" asChild>
                <TrackedLink
                  href="/api/resume"
                  eventName="cta_click"
                  eventPayload={{ location: 'home_hero', target: 'resume' }}
                >
                  이력서 다운로드 <Download className="ml-2 h-4 w-4" />
                </TrackedLink>
              </Button>
              <Button variant="brand-outline" asChild>
                <TrackedLink
                  href="#contact"
                  eventName="cta_click"
                  eventPayload={{ location: 'home_hero', target: 'contact' }}
                >
                  문의 남기기
                </TrackedLink>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue-200/80 bg-white/90 px-3 py-1.5 shadow-sm shadow-brand-blue-100/30">
                <MapPin className="h-3.5 w-3.5 text-brand-blue-600" />
                {profile.location || '위치 정보 없음'}
              </span>
              <span
                className={`rounded-full border px-3 py-1.5 ${
                  availableForWork
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-neutral-slate-200 bg-white/90 text-neutral-slate-500'
                }`}
              >
                {availableForWork
                  ? '현재 협업 가능'
                  : profile.status || '상태 업데이트 예정'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
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
                  className="inline-flex"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-brand-blue-200 bg-white/90 text-neutral-slate-700 hover:bg-brand-blue-50"
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
                  className="inline-flex"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-brand-blue-200 bg-white/90 text-neutral-slate-700 hover:bg-brand-blue-50"
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
                  className="inline-flex"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-brand-blue-200 bg-white/90 text-neutral-slate-700 hover:bg-brand-blue-50"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">이메일</span>
                  </Button>
                </TrackedLink>
              ) : null}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[520px] lg:justify-self-end">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/60 bg-brand-blue-900 shadow-[0_35px_90px_-40px_rgba(33,52,72,0.55)]">
              {normalizedProfileImage ? (
                <Image
                  src={normalizedProfileImage}
                  alt={profile.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(148,180,193,0.65),transparent_28%),linear-gradient(145deg,rgba(84,119,146,1),rgba(33,52,72,1))]" />
              )}

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(33,52,72,0.06),rgba(33,52,72,0.18)_30%,rgba(33,52,72,0.82)_68%,rgba(33,52,72,0.96))]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/10 to-transparent" />

              <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.16em] text-white/90 backdrop-blur">
                {availableForWork ? 'OPEN TO WORK' : 'PORTFOLIO'}
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                <p className="text-xs font-semibold tracking-[0.22em] text-white/70">
                  BACKEND PORTFOLIO
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                  {profile.name}
                </p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/78 md:text-base">
                  {profile.statusMessage ||
                    profile.title ||
                    '포트폴리오 정보를 정리하고 있습니다.'}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/15 pt-5 text-sm text-white/82 sm:grid-cols-2">
                  <div>
                    <p className="text-white/55">실무 경력</p>
                    <p className="mt-1 font-medium text-white">
                      {careerDurationLabel || '정리 중'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/55">주요 기술</p>
                    <p className="mt-1 font-medium text-white">
                      {heroSkillSummary}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10 md:pb-14">
        <div className="container">
          <div className="overflow-hidden rounded-[1.75rem] border border-brand-blue-200/70 bg-white/85 shadow-[0_20px_70px_-50px_rgba(33,52,72,0.45)] backdrop-blur">
            <div className="grid gap-8 px-6 py-6 lg:grid-cols-[0.85fr_1fr_1fr] lg:px-8 lg:py-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-brand-blue-600">
                  QUICK FACTS
                </p>
                <dl className="mt-4 space-y-4">
                  {supportMetrics.map((metric) => (
                    <div key={metric.label}>
                      <dt className="text-sm text-neutral-slate-500">
                        {metric.label}
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-neutral-slate-900">
                        {metric.value}
                      </dd>
                      <p className="mt-1 text-sm text-neutral-slate-500">
                        {metric.description}
                      </p>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="border-t border-brand-blue-100 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-brand-blue-600">
                      RECENT WRITING
                    </p>
                    <p className="mt-2 text-lg font-semibold text-neutral-slate-900">
                      구현 기록과 문제 해결 메모
                    </p>
                  </div>
                  <TrackedLink
                    href="/blog"
                    className="hidden text-sm font-medium text-brand-blue-700 transition-colors hover:text-brand-blue-800 sm:inline-flex"
                    eventName="cta_click"
                    eventPayload={{
                      location: 'home_highlight_band',
                      target: 'blog',
                    }}
                  >
                    글 전체 보기
                  </TrackedLink>
                </div>

                <div className="mt-5 space-y-3">
                  {supportPosts.length > 0 ? (
                    supportPosts.map((post) => {
                      const postIdentifier = post.slug || String(post.id);
                      return (
                        <TrackedLink
                          key={post.id}
                          href={`/blog/${postIdentifier}`}
                          className="group flex items-start justify-between gap-4 border-b border-brand-blue-100/80 pb-3 last:border-b-0 last:pb-0"
                          eventName="cta_click"
                          eventPayload={{
                            location: 'home_highlight_band_recent_post',
                            target: 'blog',
                            content_id: postIdentifier,
                          }}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-slate-900 transition-colors group-hover:text-brand-blue-700">
                              {post.title}
                            </p>
                            <p className="mt-1 text-sm text-neutral-slate-500">
                              {formatPostDate(post.publishDate)}
                            </p>
                          </div>
                          <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-blue-500 transition-transform duration-200 group-hover:translate-x-1" />
                        </TrackedLink>
                      );
                    })
                  ) : (
                    <p className="text-sm text-neutral-slate-500">
                      새 글을 준비 중입니다.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-brand-blue-100 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="text-xs font-semibold tracking-[0.18em] text-brand-blue-600">
                  STACK SNAPSHOT
                </p>
                <p className="mt-2 text-lg font-semibold text-neutral-slate-900">
                  자주 사용하는 기술
                </p>
                {visibleSkills.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {visibleSkills.map((skill) => (
                      <SkillBadge
                        key={skill.name}
                        name={skill.name}
                        level={skill.level}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-neutral-slate-500">
                    기술 스택을 정리 중입니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section-spacing">
        <div className="container">
          <SectionHeading title="소개" subtitle="핵심 정보만 빠르게" />

          <div className="mt-14 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
            <div className="surface-default relative aspect-square overflow-hidden">
              {normalizedProfileImage ? (
                <Image
                  src={normalizedProfileImage}
                  alt={profile.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-blue-50 text-center">
                  <div>
                    <p className="text-lg font-semibold text-brand-blue-700">
                      {profile.name}
                    </p>
                    <p className="mt-1 text-sm text-brand-blue-600">
                      프로필 이미지를 준비 중입니다.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <GlassmorphicCard>
              {(aboutParagraphs.length > 0
                ? aboutParagraphs
                : ['소개를 정리 중입니다.']
              ).map((paragraph, index) => (
                <p
                  key={`${paragraph}-${index}`}
                  className={`text-lg text-neutral-slate-700 ${index > 0 ? 'mt-4' : ''}`}
                >
                  {paragraph}
                </p>
              ))}

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-neutral-slate-500">이름</div>
                  <div className="font-medium">{profile.name}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-slate-500">이메일</div>
                  <div className="break-all font-medium">
                    {profile.email || '비공개'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-slate-500">위치</div>
                  <div className="font-medium">
                    {profile.location || '미등록'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-slate-500">상태</div>
                  <div className="font-medium text-brand-blue-700">
                    {profile.status || '확인 필요'}
                  </div>
                </div>
              </div>
            </GlassmorphicCard>
          </div>

          <div className="mt-12">
            <h3 className="text-xl font-bold text-neutral-slate-800">
              핵심 기술
            </h3>
            {visibleSkills.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {visibleSkills.map((skill) => (
                  <SkillBadge
                    key={skill.name}
                    name={skill.name}
                    level={skill.level}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-neutral-slate-500">
                기술 스택을 정리 중입니다.
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="experience" className="section-spacing">
        <div className="container">
          <SectionHeading title="경험" subtitle="어떤 역할을 맡아왔는지" />

          <div className="mt-12">
            <Timeline initialExperiences={experiences} />
          </div>
        </div>
      </section>

      <section id="projects" className="section-spacing">
        <div className="container">
          <SectionHeading
            title="대표 프로젝트"
            subtitle="프로젝트 제목과 연결된 기술 글로 보는 구현 기록"
          />

          {featuredProjects.length > 0 ? (
            <>
              <ProjectList
                projects={featuredProjects}
                trackingLocation="home_projects"
              />
              <div className="mt-10 text-center">
                <Button variant="brand" asChild>
                  <TrackedLink
                    href="/projects"
                    eventName="cta_click"
                    eventPayload={{
                      location: 'home_projects_section',
                      target: 'project',
                    }}
                  >
                    프로젝트 전체 보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </TrackedLink>
                </Button>
              </div>
            </>
          ) : (
            <GlassmorphicCard className="mt-12 text-center">
              <p className="text-neutral-slate-600">
                공개할 프로젝트를 준비 중입니다.
              </p>
              <Button variant="brand" className="mt-4" asChild>
                <TrackedLink
                  href="/projects"
                  eventName="cta_click"
                  eventPayload={{
                    location: 'home_projects_section',
                    target: 'project',
                  }}
                >
                  프로젝트 목록 보기
                </TrackedLink>
              </Button>
            </GlassmorphicCard>
          )}
        </div>
      </section>

      <section id="blog" className="section-spacing">
        <div className="container">
          <SectionHeading
            title="최신 글"
            subtitle="문제 해결 과정과 구현 기록"
          />

          {featuredPosts.length > 0 ? (
            <>
              <div className="mt-12">
                {featuredBlogPost ? (
                  <BlogCard
                    key={featuredBlogPost.id}
                    title={featuredBlogPost.title}
                    excerpt={
                      featuredBlogPost.excerpt ||
                      `${featuredBlogPost.category} 주제에서 해결 과정을 정리한 글입니다.`
                    }
                    date={formatPostDate(featuredBlogPost.publishDate)}
                    readTime={`${featuredBlogPost.readTime}분`}
                    tags={featuredBlogPost.tags || [featuredBlogPost.category]}
                    image={featuredBlogPost.image}
                    slug={featuredBlogPost.slug || String(featuredBlogPost.id)}
                    eyebrow={featuredBlogPost.category}
                    variant="featured"
                    trackingLocation="home_blog_featured"
                  />
                ) : null}
                {recentBlogPosts.map((post) => (
                  <BlogCard
                    key={post.id}
                    title={post.title}
                    excerpt={
                      post.excerpt ||
                      `${post.category} 주제에서 해결 과정을 정리한 글입니다.`
                    }
                    date={formatPostDate(post.publishDate)}
                    readTime={`${post.readTime}분`}
                    tags={post.tags || [post.category]}
                    image={post.image}
                    slug={post.slug || String(post.id)}
                    eyebrow={post.category}
                    trackingLocation="home_blog_row"
                  />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Button variant="brand" asChild>
                  <TrackedLink
                    href="/blog"
                    eventName="cta_click"
                    eventPayload={{
                      location: 'home_blog_section',
                      target: 'blog',
                    }}
                  >
                    글 전체 보기 <BookOpen className="ml-2 h-4 w-4" />
                  </TrackedLink>
                </Button>
              </div>
            </>
          ) : (
            <GlassmorphicCard className="mt-12 text-center">
              <p className="text-neutral-slate-600">새 글을 준비 중입니다.</p>
              <Button variant="brand" className="mt-4" asChild>
                <TrackedLink
                  href="/blog"
                  eventName="cta_click"
                  eventPayload={{
                    location: 'home_blog_section',
                    target: 'blog',
                  }}
                >
                  글 목록 보기
                </TrackedLink>
              </Button>
            </GlassmorphicCard>
          )}
        </div>
      </section>

      <section id="contact" className="section-spacing">
        <div className="container">
          <SectionHeading title="연락하기" subtitle="협업 문의는 여기서" />

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <GlassmorphicCard>
              <h3 className="mb-4 text-xl font-bold text-neutral-slate-800">
                연락처
              </h3>
              <p className="mb-6 text-neutral-slate-600">
                협업이나 채용 관련 문의를 남겨주시면 확인 후 답변드리겠습니다.
                필요한 경우 이력서 PDF도 바로 내려받을 수 있습니다.
              </p>

              <div className="space-y-4">
                {profile.email ? (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-brand-blue-50 p-3">
                      <Mail className="h-5 w-5 text-brand-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-slate-500">
                        이메일
                      </div>
                      <div className="break-all font-medium">
                        {profile.email}
                      </div>
                    </div>
                  </div>
                ) : null}

                {profile.github ? (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-brand-blue-50 p-3">
                      <Github className="h-5 w-5 text-brand-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-slate-500">
                        GitHub
                      </div>
                      <div className="break-all font-medium">
                        {profile.github}
                      </div>
                    </div>
                  </div>
                ) : null}

                {profile.linkedin ? (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-brand-blue-50 p-3">
                      <Linkedin className="h-5 w-5 text-brand-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-slate-500">
                        LinkedIn
                      </div>
                      <div className="break-all font-medium">
                        {profile.linkedin}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-8 border-t border-neutral-slate-200 pt-6">
                <h4 className="mb-2 text-base font-medium">현재 상태</h4>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      availableForWork ? 'bg-brand-blue-500' : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-sm text-neutral-slate-700">
                    {profile.statusMessage ||
                      '새로운 프로젝트와 협업 기회를 찾고 있습니다'}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="brand" asChild>
                  <TrackedLink
                    href="/api/resume"
                    eventName="cta_click"
                    eventPayload={{
                      location: 'home_contact',
                      target: 'resume',
                    }}
                  >
                    이력서 다운로드 <Download className="ml-2 h-4 w-4" />
                  </TrackedLink>
                </Button>
                <Button variant="brand-outline" asChild>
                  <TrackedLink
                    href="/projects"
                    eventName="cta_click"
                    eventPayload={{
                      location: 'home_contact',
                      target: 'projects',
                    }}
                  >
                    대표 프로젝트 보기
                  </TrackedLink>
                </Button>
              </div>
            </GlassmorphicCard>

            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-slate-200 bg-white py-10">
        <div className="container flex flex-col items-center justify-between gap-5 md:flex-row">
          <div>
            <p className="text-xl font-bold text-neutral-slate-800">
              {profile.name} 블로그
            </p>
            <p className="mt-2 text-sm text-neutral-slate-500">
              © {new Date().getFullYear()} {profile.name}. 모든 권리 보유.
            </p>
          </div>
          <div className="flex gap-3">
            {profile.github ? (
              <TrackedLink
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                eventName="social_click"
                eventPayload={{ channel: 'github', location: 'footer_social' }}
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
                  location: 'footer_social',
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
                eventPayload={{ channel: 'email', location: 'footer_social' }}
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
      </footer>
    </div>
  );
}
