"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { useMobile } from "@/hooks/use-mobile"
import {
  formatExperiencePeriod,
  getExperienceTypeLabel,
  getExperienceTypeTheme,
  sortExperiences,
} from "@/lib/experience/utils"
import { getExperiences, Experience } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TimelineProps {
  initialExperiences?: Experience[]
}

export function Timeline({ initialExperiences = [] }: TimelineProps) {
  const isMobile = useMobile()
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences)
  const [loading, setLoading] = useState(initialExperiences.length === 0)

  useEffect(() => {
    if (initialExperiences.length > 0) {
      setExperiences(initialExperiences)
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const data = await getExperiences()
        setExperiences(data)
      } catch (e) {
        setExperiences([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [initialExperiences])

  const sorted = useMemo(() => {
    return sortExperiences(experiences)
  }, [experiences])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="surface-default h-32 animate-pulse" />
        <div className="surface-default h-32 animate-pulse" />
      </div>
    )
  }

  if (sorted.length === 0) {
    return <div className="surface-default px-6 py-8 text-center text-neutral-slate-500">등록된 경험 정보가 없습니다.</div>
  }

  return (
    <div
      className={`space-y-12 relative ${
        !isMobile
          ? "before:absolute before:inset-0 before:left-1/2 before:ml-0 before:-translate-x-px before:border-l-2 before:border-brand-blue-200 before:h-full before:z-0"
          : ""
      }`}
    >
      {sorted.map((experience, index) => (
        <div
          key={experience.id ?? index}
          className={`relative z-10 flex items-center ${index % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row"}`}
        >
          <motion.div
            className={`w-full md:w-1/2 ${index % 2 === 0 ? "md:pl-10" : "md:pr-10"}`}
            initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            viewport={{ once: true }}
          >
            <div
              className={cn(
                "surface-elevated border-l-4 p-6",
                getExperienceTypeTheme(experience.type).cardAccentClassName,
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Badge className={cn("border", getExperienceTypeTheme(experience.type).badgeClassName)}>
                  {getExperienceTypeLabel(experience.type)}
                </Badge>
                <span className="text-sm text-neutral-slate-500">
                  {formatExperiencePeriod(experience.startDate, experience.endDate)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-slate-800">{experience.title}</h3>
              <div className="mb-4 text-neutral-slate-600">{experience.organization}</div>
              <p className="text-neutral-slate-700">{experience.description || "설명을 준비 중입니다."}</p>
            </div>
          </motion.div>

          {!isMobile && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
              <motion.div
                className={cn(
                  "z-10 flex h-6 w-6 items-center justify-center rounded-full ring-4",
                  getExperienceTypeTheme(experience.type).dotClassName,
                  getExperienceTypeTheme(experience.type).dotRingClassName,
                )}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="h-2 w-2 rounded-full bg-white"></div>
              </motion.div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
