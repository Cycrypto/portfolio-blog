import Link from "next/link"
import { ArrowLeft, Calendar, Github, ExternalLink } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ProjectGallery } from "@/components/project/project-gallery"
import { RelatedProjects } from "@/components/project/related-projects"
import { getProject } from "@/lib/api"

interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  let project: any = null

  try {
    project = await getProject(slug)
  } catch (error) {
    console.error('Failed to fetch project:', error)
    notFound()
  }

  if (!project) {
    notFound()
  }

  const images = project.images && project.images.length > 0 ? project.images : ["/placeholder.svg"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <header className="border-b border-neutral-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/projects">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link href="/" className="font-bold text-xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-600 to-brand-blue-900">박준하</span>
              <span className="text-neutral-slate-800"> 블로그</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <Button variant="outline" size="sm" asChild>
                <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  코드 보기
                </Link>
              </Button>
            )}
            {project.liveUrl && (
              <Button size="sm" className="bg-brand-blue-500 hover:bg-brand-blue-600" asChild>
                <Link href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  라이브 데모
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3 space-y-12">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {(project.techStack || []).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-brand-blue-100 text-brand-blue-700">
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-neutral-slate-800">{project.title}</h1>
              {project.description && <p className="text-xl text-neutral-slate-600 mb-6">{project.description}</p>}

              <div className="flex items-center gap-6 text-sm text-neutral-slate-500 mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {project.startDate || '시작일 미정'} {project.endDate && `- ${project.endDate}`}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="mb-8" />

            <ProjectGallery images={images} title={project.title} />

            {project.longDescription && (
              <div className="prose prose-lg max-w-none">
                <div className="bg-white p-8 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">프로젝트 개요</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{project.longDescription}</p>
                </div>
              </div>
            )}

            <RelatedProjects currentSlug={slug} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
                <div className="relative space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-slate-800">프로젝트 정보</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-neutral-slate-500">상태:</span>
                      <span className="ml-2 font-medium text-green-600">{project.status || '정보 없음'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-slate-500">기술 스택:</span>
                      <span className="ml-2 font-medium">{(project.techStack || []).join(', ') || '없음'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <RelatedProjects currentSlug={slug} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
