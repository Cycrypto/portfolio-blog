"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Github } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { normalizeImageUrl } from "@/lib/utils/image"

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
  const normalizedImage = normalizeImageUrl(image)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="surface-elevated h-full overflow-hidden">
        <div className="flex h-full flex-col">
          {normalizedImage && (
            <div className="relative h-48 overflow-hidden">
              <Image
                src={normalizedImage}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

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
                  className="bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 border-brand-blue-200"
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
                <Link href={demoUrl || `/projects/${id}`} target={demoUrl ? "_blank" : undefined} rel={demoUrl ? "noopener noreferrer" : undefined}>
                  {demoUrl ? "라이브 데모" : "자세히 보기"}
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
