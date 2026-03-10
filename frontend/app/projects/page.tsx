import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/project/project-card"
import { SectionHeading } from "@/components/common/section-heading"
import { getProjects, Project } from "@/lib/api"

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
            <Link href="/" className="text-lg font-bold text-neutral-slate-800 md:text-xl">박준하 블로그</Link>
          </div>
        </div>
      </header>

      <div className="container py-10 md:py-12">
        <SectionHeading title="프로젝트" subtitle="제가 작업한 프로젝트들을 소개합니다" />

        {projects.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id || index}
                id={project.id}
                title={project.title}
                description={project.description}
                tags={project.techStack || []}
                image={(project.images && project.images[0]) || "/placeholder.svg"}
                demoUrl={project.liveUrl}
                repoUrl={project.githubUrl}
              />
            ))}
          </div>
        ) : (
          <div className="surface-default mt-12 py-10 text-center text-neutral-slate-500">표시할 프로젝트가 없습니다.</div>
        )}
      </div>
    </div>
  )
}
