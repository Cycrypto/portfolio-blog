import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectList } from "@/components/project/project-list"
import { SectionHeading } from "@/components/common/section-heading"
import { getProjects, Project } from "@/lib/api"
import { absoluteUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: "프로젝트 | 박준하 포트폴리오",
  description: "프로젝트를 한눈에 볼 수 있는 목록입니다.",
  alternates: {
    canonical: absoluteUrl('/projects'),
  },
  openGraph: {
    title: "프로젝트 | 박준하 포트폴리오",
    description: "프로젝트를 한눈에 볼 수 있는 목록입니다.",
    url: absoluteUrl('/projects'),
    type: 'website',
  },
}

export const dynamic = "force-dynamic"

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
        <SectionHeading
          title="프로젝트"
          subtitle="프로젝트 목록"
        />

        <ProjectList
          projects={projects}
          trackingLocation="projects_list"
          emptyMessage="공개할 프로젝트를 준비 중입니다."
        />
      </div>
    </div>
  )
}
