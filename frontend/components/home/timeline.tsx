"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"
import { getExperiences, Experience } from "@/lib/api"

export function Timeline() {
  const isMobile = useMobile()
  const [experiences, setExperiences] = useState<Experience[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getExperiences()
        setExperiences(data)
      } catch (e) {
        setExperiences([])
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
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6 transition-all duration-300 hover:border-brand-blue-200/50 hover:shadow-lg">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25 hover:opacity-100 transition duration-1000 hover:duration-200"></div>

              <div className="relative">
                <h3 className="text-xl font-bold text-neutral-slate-800">{experience.title}</h3>
                <div className="text-neutral-slate-600 mb-4">
                  {experience.company} | {experience.startDate}
                  {experience.endDate ? ` - ${experience.endDate}` : ' - 현재'}
                </div>
                <p className="text-neutral-slate-700">{experience.description}</p>
              </div>
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
