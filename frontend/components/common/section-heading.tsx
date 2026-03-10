"use client"

import { motion } from "framer-motion"

interface SectionHeadingProps {
  title: string
  subtitle: string
}

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="text-center">
      <motion.p
        className="inline-flex items-center rounded-full border border-brand-blue-200 bg-brand-blue-50 px-3 py-1 text-sm font-medium text-brand-blue-700"
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        viewport={{ once: true }}
      >
        {subtitle}
      </motion.p>
      <motion.h2
        className="mt-3 text-3xl font-extrabold tracking-tight text-neutral-slate-800 md:text-4xl"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        viewport={{ once: true }}
      >
        {title}
      </motion.h2>
      <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-brand-blue-500" />
    </div>
  )
}
