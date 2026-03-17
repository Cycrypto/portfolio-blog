import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/project/project-card"
import { SectionHeading } from "@/components/common/section-heading"
import { getProjects, Project } from "@/lib/api"
import { normalizeImageUrl } from "@/lib/utils/image"
import { absoluteUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: "프로젝트 | 박준하 포트폴리오",
  description: "문제 정의, 접근, 성과를 기준으로 정리한 프로젝트 목록입니다.",
  alternates: {
    canonical: absoluteUrl('/projects'),
  },
  openGraph: {
    title: "프로젝트 | 박준하 포트폴리오",
    description: "문제 정의, 접근, 성과를 기준으로 정리한 프로젝트 목록입니다.",
    url: absoluteUrl('/projects'),
    type: 'website',
  },
}

export const dynamic = "force-dynamic"

const getPrimaryImage = (images?: string[]) =>
  (images || []).map((image) => normalizeImageUrl(image)).find((image): image is string => Boolean(image))

export default async function ProjectsPage() {
  let projects: Project[] = []
  try {
    projects = await getProjects()
  } catch (error) {
    console.error('Failed to fetch projects:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-slate-50 via-white to-brand-blue-50">
      <header className="sticky top-0 z-40 border-b border-neutral-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="text-lg font-bold text-neutral-slate-800 md:text-xl">박준하 포트폴리오</Link>
          </div>
        </div>
      </header>

      <div className="container py-10 md:py-12">
        <SectionHeading title="프로젝트" subtitle="문제와 해결 과정을 한눈에" />

        {projects.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id || index}
                id={project.id}
                slug={project.slug}
                title={project.title}
                description={project.description}
                tags={project.techStack || []}
                image={getPrimaryImage(project.images)}
                demoUrl={project.liveUrl}
                repoUrl={project.githubUrl}
                trackingLocation="projects_list_card"
              />
            ))}
          </div>
        ) : (
          <div className="surface-default mt-12 py-10 text-center text-neutral-slate-500">공개할 프로젝트를 준비 중입니다.</div>
        )}
      </div>
    </div>
  )
}
