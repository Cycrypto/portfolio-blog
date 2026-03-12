"use client"

import { forwardRef, type AnchorHTMLAttributes } from "react"
import Link, { type LinkProps } from "next/link"

import { type AnalyticsEventName, trackEvent } from "@/lib/analytics/track"

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

interface TrackedLinkProps extends LinkProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  eventName: AnalyticsEventName
  eventPayload?: AnalyticsPayload
}

export const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(function TrackedLink(
  { eventName, eventPayload, onClick, ...props },
  ref,
) {
  return (
    <Link
      ref={ref}
      {...props}
      onClick={(event) => {
        trackEvent(eventName, eventPayload)
        onClick?.(event)
      }}
    />
  )
})
