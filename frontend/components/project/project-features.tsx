"use client"

import { CheckCircle } from "lucide-react"

interface Feature {
  title: string
  description: string
}

interface ProjectFeaturesProps {
  features: Feature[]
}

export function ProjectFeatures({ features }: ProjectFeaturesProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-neutral-slate-800">주요 기능</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
            <div className="relative flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-neutral-slate-800">{feature.title}</h3>
                <p className="text-neutral-slate-600">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
