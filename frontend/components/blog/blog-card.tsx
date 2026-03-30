"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Calendar, Clock } from "lucide-react"
import { motion } from "framer-motion"

import { trackEvent } from "@/lib/analytics/track"
import { cn } from "@/lib/utils"
import { normalizeImageUrl } from "@/lib/utils/image"

interface BlogCardProps {
  title: string
  excerpt: string
  date: string
  readTime: string
  tags: string[]
  image?: string
  slug: string
  eyebrow?: string
  trackingLocation?: string
  variant?: "featured" | "list"
  className?: string
}

export function BlogCard({
  title,
  excerpt,
  date,
  readTime,
  tags,
  image,
  slug,
  eyebrow,
  trackingLocation = "blog_list_card",
  variant = "list",
  className,
}: BlogCardProps) {
  const normalizedImage = normalizeImageUrl(image)
  const visibleTags = tags.slice(0, variant === "featured" ? 4 : 3)
  const remainingTagCount = Math.max(tags.length - visibleTags.length, 0)

  const trackClick = () => {
    trackEvent("cta_click", {
      location: trackingLocation,
      target: "blog",
      content_id: slug,
    })
  }

  if (variant === "featured") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        viewport={{ once: true }}
        className={cn("border-y border-brand-blue-100 py-8 md:py-10", className)}
      >
        <div
          className={cn(
            "grid gap-6 md:gap-8",
            normalizedImage
              ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start"
              : "",
          )}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-slate-400">
              {eyebrow ? <span>{eyebrow}</span> : null}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {readTime}
              </span>
            </div>

            <Link
              href={`/blog/${slug}`}
              onClick={trackClick}
              className="group/title mt-4 inline-flex max-w-full items-start gap-2 text-3xl font-semibold leading-tight tracking-tight text-neutral-slate-900 transition-colors hover:text-brand-blue-700 md:text-[2.4rem]"
            >
              <span className="text-balance">{title}</span>
              <ArrowUpRight className="mt-1 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover/title:-translate-y-0.5 group-hover/title:translate-x-0.5" />
            </Link>

            <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-slate-600 md:text-lg">
              {excerpt}
            </p>

            {visibleTags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-x-3 gap-y-2 text-sm text-neutral-slate-500">
                {visibleTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-brand-blue-300" />
                    {tag}
                  </span>
                ))}
                {remainingTagCount > 0 ? <span>+{remainingTagCount}</span> : null}
              </div>
            ) : null}

            <Link
              href={`/blog/${slug}`}
              onClick={trackClick}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-blue-700 transition-colors hover:text-brand-blue-800"
            >
              글 읽기
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {normalizedImage ? (
            <Link
              href={`/blog/${slug}`}
              onClick={trackClick}
              className="group/image relative block aspect-[4/3] overflow-hidden rounded-[28px] border border-brand-blue-100 bg-brand-blue-50"
            >
              <Image
                src={normalizedImage}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 34vw"
                className="object-cover transition-transform duration-500 group-hover/image:scale-[1.03]"
              />
            </Link>
          ) : null}
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      viewport={{ once: true }}
      className={cn("border-b border-brand-blue-100/80 py-6", className)}
    >
      <div
        className={cn(
          "grid gap-5 md:grid-cols-[minmax(0,1fr)_160px] md:items-start",
          !normalizedImage && "md:grid-cols-1",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-slate-400">
            {eyebrow ? <span>{eyebrow}</span> : null}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {readTime}
            </span>
          </div>

          <Link
            href={`/blog/${slug}`}
            onClick={trackClick}
            className="group/title mt-3 inline-flex max-w-full items-start gap-2 text-2xl font-semibold tracking-tight text-neutral-slate-900 transition-colors hover:text-brand-blue-700"
          >
            <span className="line-clamp-2 text-balance">{title}</span>
            <ArrowUpRight className="mt-1 h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover/title:-translate-y-0.5 group-hover/title:translate-x-0.5" />
          </Link>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-slate-600 md:text-[15px]">
            {excerpt}
          </p>

          {visibleTags.length > 0 || remainingTagCount > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-slate-500">
              {visibleTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-brand-blue-300" />
                  {tag}
                </span>
              ))}
              {remainingTagCount > 0 ? <span>+{remainingTagCount}</span> : null}
            </div>
          ) : null}

          <Link
            href={`/blog/${slug}`}
            onClick={trackClick}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-blue-700 transition-colors hover:text-brand-blue-800"
          >
            글 읽기
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {normalizedImage ? (
          <Link
            href={`/blog/${slug}`}
            onClick={trackClick}
            className="group/image relative order-first block aspect-[4/3] overflow-hidden rounded-2xl border border-brand-blue-100 bg-brand-blue-50 md:order-none"
          >
            <Image
              src={normalizedImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 160px"
              className="object-cover transition-transform duration-500 group-hover/image:scale-[1.04]"
            />
          </Link>
        ) : null}
      </div>
    </motion.article>
  )
}
