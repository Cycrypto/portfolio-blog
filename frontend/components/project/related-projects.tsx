"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getProjects, Project } from "@/lib/api"

interface RelatedProjectsProps {
  currentSlug: string
}

export function RelatedProjects({ currentSlug }: RelatedProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const list = await getProjects()
        setProjects(list.filter((p) => p.id?.toString() !== currentSlug))
      } catch (e) {
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentSlug])

  const related = projects.slice(0, 3)

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
        <div className="relative">
          <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">비슷한 프로젝트</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-lg border border-neutral-slate-200 p-3 animate-pulse">
                <div className="h-4 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (related.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
        <div className="relative">
          <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">비슷한 프로젝트</h3>
          <p className="text-sm text-neutral-slate-500">다른 프로젝트를 준비 중입니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>

      <div className="relative">
        <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">비슷한 프로젝트</h3>
        <div className="space-y-4">
          {related.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block group">
              <div className="p-3 rounded-lg border border-neutral-slate-200 hover:border-brand-blue-200 transition-colors">
                <h4 className="font-medium text-neutral-slate-800 group-hover:text-brand-blue-600 transition-colors mb-2">
                  {project.title}
                </h4>
                {(project.techStack || []).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {(project.techStack || []).map((tag, index) => (
                      <span key={index} className="text-xs bg-slate-100 text-neutral-slate-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-slate-500">기술 정보 정리 중</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <Button variant="ghost" className="w-full mt-4 text-brand-blue-600 hover:text-brand-blue-700 hover:bg-brand-blue-50" asChild>
          <Link href="/projects">
            프로젝트 목록 보기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
