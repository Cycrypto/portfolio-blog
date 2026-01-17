"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Github, Linkedin, Mail, BookOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/project/project-card"
import { SkillBadge } from "@/components/common/skill-badge"
import { Timeline } from "@/components/home/timeline"
import { ContactForm } from "@/components/common/contact-form"
import { CreativeHero } from "@/components/home/creative-hero"
import { FloatingNav } from "@/components/common/layout/floating-nav"
import { ScrollProgress } from "@/components/common/scroll-progress"
import { SectionHeading } from "@/components/common/section-heading"
import { GlassmorphicCard } from "@/components/common/glassmorphic-card"
import { BlogCard } from "@/components/blog/blog-card"
import { getPosts, Post, getProjects, Project } from "@/lib/api"
import { profileService, type ProfileData } from "@/lib/api/services/profile"

export default function Portfolio() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [latestPosts, setLatestPosts] = useState<Post[]>([])
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([])

  const transformToBlogPost = (post: Post) => {
    return {
      title: post.title,
      excerpt: post.excerpt || `${post.category} 카테고리의 게시물입니다.`,
      date: new Date(post.publishDate).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      readTime: `${post.readTime}분`,
      tags: post.tags || [post.category],
      image: post.image || "/placeholder.svg?height=200&width=400",
      slug: post.slug || post.id.toString(),
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        console.log('[DEBUG] Starting to load data...')
        const [postsRes, projectsRes, profileRes] = await Promise.all([
          getPosts(1, 6),
          getProjects(),
          profileService.getProfile(),
        ])
        console.log('[DEBUG] Data loaded successfully', { postsRes, projectsRes, profileRes })
        setLatestPosts(postsRes.posts || [])
        setFeaturedProjects((projectsRes || []).slice(0, 6))
        setProfile(profileRes)
      } catch (error) {
        console.error('[DEBUG] Failed to load landing data:', error)
        const defaultProfile = profileService.getDefaultProfile()
        console.log('[DEBUG] Using default profile:', defaultProfile)
        setProfile(defaultProfile)
      }
    }
    load()
  }, [])

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
        <div className="text-neutral-slate-600">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50 text-neutral-slate-900 overflow-hidden">
      <ScrollProgress />
      <FloatingNav />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-brand-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-brand-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block">
              <div className="relative px-4 py-2 text-sm font-medium rounded-full bg-brand-blue-100 border border-brand-blue-200 mb-4 mt-4">
                <span className="relative z-10 text-brand-blue-700">{profile.title}</span>
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 animate-pulse"></span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="block text-neutral-slate-800">안녕하세요,</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-900">
                {profile.name}입니다
              </span>
            </h1>
            <p className="text-xl text-neutral-slate-600 max-w-[600px]">
              {profile.subtitle}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                className="relative overflow-hidden group bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 border-0 hover:from-brand-blue-600 hover:to-brand-blue-900 text-white"
                asChild
              >
                <Link href="/blog">
                  <span className="relative z-10 flex items-center">
                    블로그 보기 <BookOpen className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-brand-blue-200 text-brand-blue-600 hover:text-brand-blue-900 hover:border-brand-blue-500 hover:bg-brand-blue-50 bg-transparent"
                asChild
              >
                <Link href="#contact">연락하기</Link>
              </Button>
            </div>
            <div className="flex gap-4 pt-4">
              <Link href={profile.github || "https://github.com"} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-slate-600 hover:text-neutral-slate-800"
                >
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Button>
              </Link>
              <Link href={profile.linkedin || "https://linkedin.com"} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-slate-600 hover:text-neutral-slate-800"
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
                    className="rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-slate-600 hover:text-neutral-slate-800"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">이메일</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <CreativeHero profileImage={profile.profileImage} />
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-brand-blue-200 flex justify-center items-start p-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-brand-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="container relative z-10">
          <SectionHeading title="소개" subtitle="저에 대해 알아보세요" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-16">
            <div className="relative">
              <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl opacity-70"></div>
              <div className="relative aspect-square rounded-xl overflow-hidden border border-brand-blue-200 bg-white">
                <img src={profile.profileImage || "/placeholder.svg?height=600&width=600"} alt={profile.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-neutral-slate-700">{profile.statusMessage || '새로운 기회에 열려있습니다'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <GlassmorphicCard>
                <p className="text-lg text-neutral-slate-700">
                  {profile.about}
                </p>
                <p className="text-lg text-neutral-slate-700 mt-4">
                  {profile.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="space-y-1">
                    <div className="text-sm text-neutral-slate-500">이름</div>
                    <div className="font-medium">{profile.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-neutral-slate-500">이메일</div>
                    <div className="font-medium">{profile.email}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-neutral-slate-500">위치</div>
                    <div className="font-medium">{profile.location}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-neutral-slate-500">상태</div>
                    <div className="font-medium text-green-600">{profile.status}</div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button className="bg-brand-blue-500 hover:bg-brand-blue-600 text-white">이력서 다운로드</Button>
                </div>
              </GlassmorphicCard>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-32 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-brand-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="container relative z-10">
          <SectionHeading title="기술 스택" subtitle="주요 역량과 숙련도" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {(profile.skills || []).map((skill, index) => (
              <SkillBadge key={index} name={skill.name} level={skill.level} />
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-32 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-brand-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="container relative z-10">
          <SectionHeading title="주요 프로젝트" subtitle="제가 작업한 프로젝트들" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {featuredProjects.map((project, index) => (
              <ProjectCard
                key={project.id || index}
                id={project.id}
                title={project.title}
                description={project.description || project.longDescription || ''}
                tags={project.techStack || []}
                image={(project.images && project.images[0]) || "/placeholder.svg"}
                demoUrl={project.liveUrl}
                repoUrl={project.githubUrl}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button className="bg-brand-blue-500 hover:bg-brand-blue-600 text-white" asChild>
              <Link href="/projects">
                모든 프로젝트 보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-32 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-brand-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="container relative z-10">
          <SectionHeading title="경험" subtitle="경력과 성취" />
          <div className="mt-16">
            <Timeline />
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-32 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="container relative z-10">
          <SectionHeading title="블로그" subtitle="최신 글을 만나보세요" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {latestPosts.map((post) => (
              <BlogCard key={post.id} {...transformToBlogPost(post)} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button className="bg-brand-blue-500 hover:bg-brand-blue-600 text-white" asChild>
              <Link href="/blog">
                모든 포스트 보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-brand-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-brand-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="container relative z-10">
          <SectionHeading title="연락하기" subtitle="함께 이야기 나눠요" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16">
            <GlassmorphicCard>
              <h3 className="text-xl font-bold text-neutral-slate-800 mb-4">연락처</h3>
              <p className="text-neutral-slate-600 mb-6">
                프로젝트 제안, 협업, 채용 문의 등 언제든 환영합니다.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-blue-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-slate-500">이메일</div>
                    <div className="font-medium">{profile.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-blue-100 flex items-center justify-center">
                    <Github className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-slate-500">GitHub</div>
                    <div className="font-medium">{profile.github}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-blue-100 flex items-center justify-center">
                    <Linkedin className="h-5 w-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-slate-500">LinkedIn</div>
                    <div className="font-medium">{profile.linkedin}</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-neutral-slate-200">
                <h4 className="text-lg font-medium mb-4">현재 상태</h4>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${profile.isAvailable ? 'bg-green-500' : 'bg-slate-400'} animate-pulse`}></div>
                  <span>{profile.statusMessage || '새로운 프로젝트와 협업 기회를 찾고 있습니다'}</span>
                </div>
              </div>
            </GlassmorphicCard>

            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-slate-200 py-12 bg-white/50">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <Link href="/" className="font-bold text-xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-900">{profile.name}</span>
              <span className="text-neutral-slate-800"> 블로그</span>
            </Link>
            <p className="text-sm text-neutral-slate-500 mt-2">© {new Date().getFullYear()} {profile.name}. 모든 권리 보유.</p>
          </div>
          <div className="flex gap-4">
            <Link href={profile.github || "https://github.com"} target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-slate-600 hover:text-neutral-slate-800"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <Link href={profile.linkedin || "https://linkedin.com"} target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-slate-600 hover:text-neutral-slate-800"
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
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-slate-600 hover:text-neutral-slate-800"
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
