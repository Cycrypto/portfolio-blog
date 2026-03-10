"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"
import { getExperiences, Experience } from "@/lib/api"

export function Timeline() {
  const isMobile = useMobile()
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [])

  const sorted = useMemo(() => {
    return [...experiences].sort((a, b) => {
      const aDate = new Date(a.startDate).getTime()
      const bDate = new Date(b.startDate).getTime()
      return bDate - aDate
    })
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
    return <div className="surface-default px-6 py-8 text-center text-neutral-slate-500">등록된 경력 정보가 없습니다.</div>
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
            <div className="surface-elevated p-6">
              <h3 className="text-xl font-bold text-neutral-slate-800">{experience.title}</h3>
              <div className="text-neutral-slate-600 mb-4">
                {experience.company} | {experience.startDate}
                {experience.endDate ? ` - ${experience.endDate}` : " - 현재"}
              </div>
              <p className="text-neutral-slate-700">{experience.description}</p>
            </div>
          </motion.div>

          {!isMobile && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
              <motion.div
                className="w-6 h-6 rounded-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 z-10 flex items-center justify-center"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </motion.div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
