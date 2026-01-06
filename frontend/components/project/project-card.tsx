"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Github } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ProjectCardProps {
  id: number | string
  title: string
  description?: string
  tags?: string[]
  image?: string
  demoUrl?: string
  repoUrl?: string
}

export function ProjectCard({ id, title, description = "", tags = [], image, demoUrl = "", repoUrl = "" }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")

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
            <Link href={`/projects/${id}`}>
              <h3 className="text-xl font-bold mb-2 text-neutral-slate-800 hover:text-brand-blue-600 transition-colors cursor-pointer">
                {title}
              </h3>
            </Link>
            <p className="text-neutral-slate-600 mb-4">{description}</p>

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

            <div className="flex justify-between mt-auto pt-4 border-t border-neutral-slate-200">
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-slate-600 hover:text-neutral-slate-800 hover:bg-slate-100"
                asChild
              >
                <Link href={repoUrl || '#'} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  코드
                </Link>
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0"
                asChild
              >
                <Link href={`/projects/${id}`}>
                  자세히 보기
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="absolute top-3 right-3 z-20">
            <div
              className={`w-3 h-3 rounded-full ${isHovered ? "bg-green-500" : "bg-slate-400"} transition-colors duration-300`}
            ></div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
