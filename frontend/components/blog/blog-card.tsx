"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { trackEvent } from "@/lib/analytics/track"
import { normalizeImageUrl } from "@/lib/utils/image"

interface BlogCardProps {
  title: string
  excerpt: string
  date: string
  readTime: string
  tags: string[]
  image?: string
  slug: string
  trackingLocation?: string
}

export function BlogCard({
  title,
  excerpt,
  date,
  readTime,
  tags,
  image,
  slug,
  trackingLocation = "blog_list_card",
}: BlogCardProps) {
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
                  className="bg-brand-blue-100 hover:bg-brand-blue-200 text-brand-blue-700 border-brand-blue-200"
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
                <Link
                  href={`/blog/${slug}`}
                  onClick={() => {
                    trackEvent("cta_click", {
                      location: trackingLocation,
                      target: "blog",
                      content_id: slug,
                    })
                  }}
                >
                  글 보기
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
