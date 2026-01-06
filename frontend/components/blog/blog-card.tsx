"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface BlogCardProps {
  title: string
  excerpt: string
  date: string
  readTime: string
  tags: string[]
  image: string
  slug: string
}

export function BlogCard({ title, excerpt, date, readTime, tags, image, slug }: BlogCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="group"
    >
      <div
        className="relative h-full overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-brand-blue-200/50 transition-all duration-300 group-hover:border-brand-blue-200/50 group-hover:shadow-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-500/10 to-brand-blue-700/10 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative h-full flex flex-col">
          <div className="relative overflow-hidden h-48">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-blue-500/10 to-brand-blue-700/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
            <img
              src={image || "/placeholder.svg"}
              alt={title}
              className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"}`}
            />
          </div>

          <div className="p-6 flex-grow">
            <div className="flex items-center gap-4 text-sm text-neutral-slate-500 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{readTime}</span>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-3 text-neutral-slate-800 group-hover:text-brand-blue-600 transition-colors">
              {title}
            </h3>
            <p className="text-neutral-slate-600 mb-4 line-clamp-3">{excerpt}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-brand-blue-100 hover:bg-blue-200 text-brand-blue-700 border-brand-blue-200"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mt-auto">
              <Button
                variant="ghost"
                className="text-brand-blue-600 hover:text-brand-blue-700 hover:bg-brand-blue-50 p-0 h-auto font-medium"
                asChild
              >
                <Link href={`/blog/${slug}`}>
                  더 읽기
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
