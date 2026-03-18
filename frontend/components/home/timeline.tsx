"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

const MOBILE_COLLAPSED_ITEM_COUNT = 1
const DESKTOP_COLLAPSED_ITEM_COUNT = 2

export function Timeline({ initialExperiences = [] }: TimelineProps) {
  const isMobile = useMobile()
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences)
  const [loading, setLoading] = useState(initialExperiences.length === 0)
  const [expanded, setExpanded] = useState(false)
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null)
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])

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

  const collapsedItemCount = isMobile ? MOBILE_COLLAPSED_ITEM_COUNT : DESKTOP_COLLAPSED_ITEM_COUNT
  const collapsedPeekHeight = isMobile ? 72 : 96
  const hasOverflowContent = sorted.length > collapsedItemCount
  const hasToggle =
    hasOverflowContent &&
    collapsedHeight !== null &&
    contentHeight !== null &&
    collapsedHeight < contentHeight - 8

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, sorted.length)
  }, [sorted.length])

  useEffect(() => {
    if (!hasOverflowContent) {
      setExpanded(false)
    }
  }, [hasOverflowContent])

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) {
      return
    }

    const updateHeights = () => {
      const nextContentHeight = content.scrollHeight
      setContentHeight(nextContentHeight)

      if (!hasOverflowContent) {
        setCollapsedHeight(nextContentHeight)
        return
      }

      const lastVisibleItem = itemRefs.current[collapsedItemCount - 1]
      if (!lastVisibleItem) {
        setCollapsedHeight(nextContentHeight)
        return
      }

      const contentRect = content.getBoundingClientRect()
      const itemRect = lastVisibleItem.getBoundingClientRect()
      const nextCollapsedHeight = Math.min(
        nextContentHeight,
        Math.ceil(itemRect.bottom - contentRect.top + collapsedPeekHeight),
      )

      setCollapsedHeight(nextCollapsedHeight)
    }

    updateHeights()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeights)

      return () => {
        window.removeEventListener("resize", updateHeights)
      }
    }

    const resizeObserver = new ResizeObserver(updateHeights)
    resizeObserver.observe(content)

    const lastVisibleItem = itemRefs.current[collapsedItemCount - 1]
    if (lastVisibleItem) {
      resizeObserver.observe(lastVisibleItem)
    }

    const nextHiddenItem = itemRefs.current[collapsedItemCount]
    if (nextHiddenItem) {
      resizeObserver.observe(nextHiddenItem)
    }

    window.addEventListener("resize", updateHeights)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateHeights)
    }
  }, [collapsedItemCount, collapsedPeekHeight, hasOverflowContent, sorted])

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

  const visibleHeight = hasToggle && !expanded ? collapsedHeight ?? undefined : contentHeight ?? undefined

  return (
    <div className="space-y-6">
      <div className="relative">
        <div
          className="overflow-hidden transition-[max-height] duration-500 ease-out"
          style={visibleHeight ? { maxHeight: `${visibleHeight}px` } : undefined}
        >
          <div
            ref={contentRef}
            className={`relative space-y-12 ${
              !isMobile
                ? "before:absolute before:inset-0 before:left-1/2 before:ml-0 before:-translate-x-px before:border-l-2 before:border-brand-blue-200 before:h-full before:z-0"
                : ""
            }`}
          >
            {sorted.map((experience, index) => (
              <div
                key={experience.id ?? index}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
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
                  <div className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center">
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
        </div>

        {hasToggle && !expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-white/0 via-white/90 to-neutral-slate-50" />
        ) : null}
      </div>

      {hasToggle ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded-full border-brand-blue-200 bg-white/95 px-5 text-brand-blue-700 shadow-sm hover:bg-brand-blue-50"
          >
            {expanded ? "경험 접기" : "경험 펼치기"}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
