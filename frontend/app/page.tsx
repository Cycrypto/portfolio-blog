"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Github, Linkedin, Mail, BookOpen, MapPin, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/project/project-card"
import { SkillBadge } from "@/components/common/skill-badge"
import { ContactForm } from "@/components/common/contact-form"
import { FloatingNav } from "@/components/common/layout/floating-nav"
import { SectionHeading } from "@/components/common/section-heading"
import { GlassmorphicCard } from "@/components/common/glassmorphic-card"
import { BlogCard } from "@/components/blog/blog-card"
import { getPosts, Post, getProjects, Project } from "@/lib/api"
import { profileService, type ProfileData } from "@/lib/api/services/profile"

export default function Portfolio() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [latestPosts, setLatestPosts] = useState<Post[]>([])
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([])
  const [hasPartialDataError, setHasPartialDataError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const transformToBlogPost = (post: Post) => {
    const slug = post.slug && post.slug !== "null" ? post.slug : post.id.toString()
    return {
      title: post.title,
      excerpt: post.excerpt || `${post.category} 카테고리의 게시물입니다.`,
      date: new Date(post.publishDate).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      readTime: `${post.readTime}분`,
      tags: post.tags || [post.category],
      image: post.image || "/placeholder.svg?height=200&width=400",
      slug,
    }
  }

  const getPostSlug = (post: Post) => (post.slug && post.slug !== "null" ? post.slug : post.id.toString())

  useEffect(() => {
    const load = async () => {
      try {
        const [postsResult, projectsResult, profileResult] = await Promise.allSettled([
          getPosts(1, 6),
          getProjects(),
          profileService.getProfile(),
        ])

        setHasPartialDataError(
          postsResult.status === "rejected" || projectsResult.status === "rejected" || profileResult.status === "rejected",
        )

        if (postsResult.status === "fulfilled") {
          setLatestPosts((postsResult.value.posts || []).slice(0, 3))
        } else {
          console.error("Failed to load posts for landing:", postsResult.reason)
          setLatestPosts([])
        }

        if (projectsResult.status === "fulfilled") {
          setFeaturedProjects((projectsResult.value || []).slice(0, 3))
        } else {
          console.error("Failed to load projects for landing:", projectsResult.reason)
          setFeaturedProjects([])
        }

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value)
        } else {
          console.error("Failed to load profile:", profileResult.reason)
          setProfile(profileService.getDefaultProfile())
        }
      } catch (error) {
        console.error("Failed to load landing data:", error)
        setHasPartialDataError(true)
        setLatestPosts([])
        setFeaturedProjects([])
        setProfile(profileService.getDefaultProfile())
      }
    }
    load()
  }, [reloadKey])

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50">
        <div className="text-neutral-slate-600">로딩 중...</div>
      </div>
    )
  }

  const heroSubtitle =
    profile.subtitle.length > 92 ? `${profile.subtitle.slice(0, 92).trimEnd()}...` : profile.subtitle
  const heroSkills = (profile.skills || []).slice(0, 3)
  const heroRecentPosts = latestPosts.slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50 text-neutral-slate-900">
      <FloatingNav />

      <section className="relative overflow-hidden pb-12 pt-20 md:pb-14 md:pt-24">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(148,180,193,0.2),transparent_38%),radial-gradient(circle_at_85%_16%,rgba(220,232,239,0.6),transparent_42%)]" />
          <div className="absolute left-8 top-10 h-56 w-56 rounded-full bg-brand-blue-100/70 blur-3xl" />
          <div className="absolute bottom-10 right-12 h-56 w-56 rounded-full bg-brand-indigo-50/80 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white/80" />
        </div>

        <div className="container relative z-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-5 md:space-y-6 lg:order-2">
            <div className="inline-flex items-center rounded-full border border-brand-blue-200 bg-brand-blue-50 px-4 py-2 text-sm font-medium text-brand-blue-700">
              {profile.title}
            </div>

            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-neutral-slate-800 md:text-6xl">
              안녕하세요,
              <span className="block text-brand-blue-700">{profile.name}입니다</span>
            </h1>

            <p className="max-w-[620px] text-base leading-relaxed text-neutral-slate-600 md:text-lg">{heroSubtitle}</p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button className="bg-brand-blue-600 text-white hover:bg-brand-blue-700" asChild>
                <Link href="/blog">
                  블로그 보기 <BookOpen className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-brand-blue-200 bg-white text-brand-blue-700 hover:bg-brand-blue-50"
                asChild
              >
                <Link href="#contact">연락하기</Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue-200/80 bg-white px-3 py-1">
                <MapPin className="h-3.5 w-3.5 text-brand-blue-600" />
                {profile.location || "위치 정보 없음"}
              </span>
              <span className="rounded-full border border-brand-blue-200/80 bg-white px-3 py-1">
                {profile.status || "상태 확인 필요"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link href={profile.github || "https://github.com"} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white border border-brand-blue-200 text-neutral-slate-700 hover:bg-brand-blue-50"
                >
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </Link>
              <Link href={profile.linkedin || "https://linkedin.com"} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white border border-brand-blue-200 text-neutral-slate-700 hover:bg-brand-blue-50"
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Button>
              </Link>
              {profile.email && (
                <Link href={`mailto:${profile.email}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white border border-brand-blue-200 text-neutral-slate-700 hover:bg-brand-blue-50"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">이메일</span>
                  </Button>
                </Link>
              )}
            </div>

            {hasPartialDataError && (
              <div className="surface-default flex flex-wrap items-center justify-between gap-3 p-4 text-sm md:max-w-[620px]">
                <p className="text-neutral-slate-700">데이터 연결 상태가 불안정해 일부 정보가 기본값으로 표시됩니다.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-brand-blue-200 bg-white text-brand-blue-700 hover:bg-brand-blue-50"
                  onClick={() => setReloadKey((prev) => prev + 1)}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  다시 시도
                </Button>
              </div>
            )}
          </div>

          <div className="mx-auto w-full max-w-[560px] lg:order-1">
            <div className="surface-default relative overflow-hidden border-brand-blue-200/80 bg-white/95 p-6 shadow-xl shadow-brand-blue-100/40 backdrop-blur md:p-8">
              <div className="pointer-events-none absolute -right-16 -top-14 h-44 w-44 rounded-full bg-brand-blue-100/80 blur-3xl" />
              <div className="pointer-events-none absolute -left-20 bottom-4 h-32 w-32 rounded-full bg-brand-indigo-50/90 blur-3xl" />

              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-brand-blue-200/80 bg-brand-blue-50">
                    <Image
                      src={profile.profileImage || "/placeholder.svg?height=200&width=200"}
                      alt={profile.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue-600">Snapshot</p>
                    <p className="mt-1 text-xl font-bold text-neutral-slate-800">{profile.name}</p>
                    <p className="mt-1 text-sm text-neutral-slate-600">{profile.title}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-brand-blue-200/80 bg-white px-4 py-3">
                    <p className="text-xs text-neutral-slate-500">최신 글</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-slate-800">{latestPosts.length}개</p>
                  </div>
                  <div className="rounded-xl border border-brand-blue-200/80 bg-white px-4 py-3">
                    <p className="text-xs text-neutral-slate-500">대표 프로젝트</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-slate-800">{featuredProjects.length}개</p>
                  </div>
                  <div className="rounded-xl border border-brand-blue-200/80 bg-white px-4 py-3">
                    <p className="text-xs text-neutral-slate-500">활동 지역</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-slate-800">{profile.location || "미등록"}</p>
                  </div>
                  <div className="rounded-xl border border-brand-blue-200/80 bg-white px-4 py-3">
                    <p className="text-xs text-neutral-slate-500">현재 상태</p>
                    <p className="mt-1 text-sm font-semibold text-brand-blue-700">{profile.status || "확인 필요"}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold text-neutral-slate-500">최근 글 미리보기</p>
                  <div className="mt-3 space-y-2">
                    {heroRecentPosts.length > 0 ? (
                      heroRecentPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/blog/${getPostSlug(post)}`}
                          className="group flex items-start justify-between rounded-lg border border-brand-blue-200/70 bg-white px-3 py-2.5 transition-colors hover:bg-brand-blue-50/60"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-neutral-slate-800 group-hover:text-brand-blue-700">
                              {post.title}
                            </p>
                            <p className="mt-1 text-xs text-neutral-slate-500">
                              {new Date(post.publishDate).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-blue-500 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-lg border border-brand-blue-200/70 bg-white px-3 py-3 text-sm text-neutral-slate-500">
                        아직 게시된 글이 없습니다. 곧 업데이트됩니다.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
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
                      핵심 기술 준비 중
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section-spacing">
        <div className="container">
          <SectionHeading title="소개" subtitle="저를 빠르게 파악할 수 있도록" />

          <div className="mt-14 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
            <div className="surface-default relative aspect-square overflow-hidden">
              <Image
                src={profile.profileImage || "/placeholder.svg?height=600&width=600"}
                alt={profile.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <GlassmorphicCard>
              <p className="text-lg text-neutral-slate-700">{profile.about}</p>
              <p className="mt-4 text-lg text-neutral-slate-700">{profile.description}</p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-neutral-slate-500">이름</div>
                  <div className="font-medium">{profile.name}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-slate-500">이메일</div>
                  <div className="font-medium break-all">{profile.email}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-slate-500">위치</div>
                  <div className="font-medium">{profile.location}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-slate-500">상태</div>
                  <div className="font-medium text-brand-blue-700">{profile.status}</div>
                </div>
              </div>
            </GlassmorphicCard>
          </div>

          <div className="mt-12">
            <h3 className="text-xl font-bold text-neutral-slate-800">핵심 기술</h3>
            {(profile.skills || []).length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {profile.skills.slice(0, 8).map((skill, index) => (
                  <SkillBadge key={index} name={skill.name} level={skill.level} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-neutral-slate-500">아직 등록된 기술 정보가 없습니다.</p>
            )}
          </div>
        </div>
      </section>

      <section id="projects" className="section-spacing">
        <div className="container">
          <SectionHeading title="대표 프로젝트" subtitle="핵심 결과 중심으로" />

          {featuredProjects.length > 0 ? (
            <>
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id || index}
                    id={project.id}
                    title={project.title}
                    description={project.description || project.longDescription || ""}
                    tags={project.techStack || []}
                    image={(project.images && project.images[0]) || "/placeholder.svg"}
                    demoUrl={project.liveUrl}
                    repoUrl={project.githubUrl}
                  />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Button className="bg-brand-blue-600 text-white hover:bg-brand-blue-700" asChild>
                  <Link href="/projects">
                    모든 프로젝트 보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <GlassmorphicCard className="mt-12 text-center">
              <p className="text-neutral-slate-600">표시할 프로젝트가 아직 없습니다.</p>
              <Button className="mt-4 bg-brand-blue-600 text-white hover:bg-brand-blue-700" asChild>
                <Link href="/projects">프로젝트 페이지로 이동</Link>
              </Button>
            </GlassmorphicCard>
          )}
        </div>
      </section>

      <section id="blog" className="section-spacing">
        <div className="container">
          <SectionHeading title="최신 글" subtitle="핵심 주제만 먼저" />

          {latestPosts.length > 0 ? (
            <>
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post) => (
                  <BlogCard key={post.id} {...transformToBlogPost(post)} />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Button className="bg-brand-blue-600 text-white hover:bg-brand-blue-700" asChild>
                  <Link href="/blog">
                    모든 포스트 보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <GlassmorphicCard className="mt-12 text-center">
              <p className="text-neutral-slate-600">아직 게시된 글이 없습니다.</p>
              <Button className="mt-4 bg-brand-blue-600 text-white hover:bg-brand-blue-700" asChild>
                <Link href="/blog">블로그로 이동</Link>
              </Button>
            </GlassmorphicCard>
          )}
        </div>
      </section>

      <section id="contact" className="section-spacing">
        <div className="container">
          <SectionHeading title="연락하기" subtitle="프로젝트/협업 문의" />

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <GlassmorphicCard>
              <h3 className="mb-4 text-xl font-bold text-neutral-slate-800">연락처</h3>
              <p className="mb-6 text-neutral-slate-600">프로젝트 제안, 협업, 채용 문의를 언제든 남겨주세요.</p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-brand-blue-50 p-3">
                    <Mail className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-slate-500">이메일</div>
                    <div className="font-medium break-all">{profile.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-brand-blue-50 p-3">
                    <Github className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-slate-500">GitHub</div>
                    <div className="font-medium break-all">{profile.github}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-brand-blue-50 p-3">
                    <Linkedin className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-slate-500">LinkedIn</div>
                    <div className="font-medium break-all">{profile.linkedin}</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-neutral-slate-200 pt-6">
                <h4 className="mb-2 text-base font-medium">현재 상태</h4>
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${profile.isAvailable ? "bg-brand-blue-500" : "bg-slate-400"}`} />
                  <span className="text-sm text-neutral-slate-700">
                    {profile.statusMessage || "새로운 프로젝트와 협업 기회를 찾고 있습니다"}
                  </span>
                </div>
              </div>
            </GlassmorphicCard>

            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-slate-200 bg-white py-10">
        <div className="container flex flex-col items-center justify-between gap-5 md:flex-row">
          <div>
            <Link href="/" className="text-xl font-bold text-neutral-slate-800">
              {profile.name} 블로그
            </Link>
            <p className="mt-2 text-sm text-neutral-slate-500">© {new Date().getFullYear()} {profile.name}. 모든 권리 보유.</p>
          </div>
          <div className="flex gap-3">
            <Link href={profile.github || "https://github.com"} target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white border border-brand-blue-200 text-neutral-slate-700 hover:bg-brand-blue-50"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <Link href={profile.linkedin || "https://linkedin.com"} target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white border border-brand-blue-200 text-neutral-slate-700 hover:bg-brand-blue-50"
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Button>
            </Link>
            {profile.email && (
              <Link href={`mailto:${profile.email}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white border border-brand-blue-200 text-neutral-slate-700 hover:bg-brand-blue-50"
                >
                  <Mail className="h-5 w-5" />
                  <span className="sr-only">이메일</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
