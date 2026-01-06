"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { PostHeading } from "@/lib/api"

interface TableOfContentsProps {
  headings?: PostHeading[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("")
  const tocItems = headings || []

  useEffect(() => {
    if (tocItems.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-20% 0% -35% 0%" },
    )

    tocItems.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [tocItems])

  if (tocItems.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>
        <div className="relative">
          <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">목차</h3>
          <p className="text-neutral-slate-500 text-sm">목차가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 p-6">
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25"></div>

      <div className="relative">
        <h3 className="text-lg font-semibold mb-4 text-neutral-slate-800">목차</h3>
        <nav className="space-y-2">
          {tocItems.map((item) => (
            <motion.a
              key={item.id}
              href={`#${item.id}`}
              className={`block text-sm transition-colors ${
                activeId === item.id ? "text-brand-blue-600 font-medium" : "text-neutral-slate-600 hover:text-brand-blue-600"
              }`}
              style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              whileHover={{ x: 4 }}
            >
              {item.text}
            </motion.a>
          ))}
        </nav>
      </div>
    </div>
  )
}
