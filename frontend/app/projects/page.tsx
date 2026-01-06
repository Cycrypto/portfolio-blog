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
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      {/* Header */}
      <header className="border-b border-neutral-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="font-bold text-xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-900">박준하</span>
              <span className="text-neutral-slate-800"> 블로그</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-12">
        <SectionHeading title="프로젝트" subtitle="제가 작업한 프로젝트들을 소개합니다" />

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
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
      </div>
    </div>
  )
}
