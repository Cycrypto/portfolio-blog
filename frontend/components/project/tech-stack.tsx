"use client"

import { Badge } from "@/components/ui/badge"

interface TechStackProps {
  techStack: {
    backend: string[]
    database: string[]
    infrastructure: string[]
    tools: string[]
  }
}

export function TechStack({ techStack }: TechStackProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-neutral-slate-800">기술 스택</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold mb-3 text-neutral-slate-800">백엔드</h3>
            <div className="flex flex-wrap gap-2">
              {techStack.backend.map((tech, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-700">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold mb-3 text-neutral-slate-800">데이터베이스</h3>
            <div className="flex flex-wrap gap-2">
              {techStack.database.map((tech, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold mb-3 text-neutral-slate-800">인프라</h3>
            <div className="flex flex-wrap gap-2">
              {techStack.infrastructure.map((tech, index) => (
                <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-700">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold mb-3 text-neutral-slate-800">도구</h3>
            <div className="flex flex-wrap gap-2">
              {techStack.tools.map((tech, index) => (
                <Badge key={index} variant="secondary" className="bg-cyan-100 text-cyan-700">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
