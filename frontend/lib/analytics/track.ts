"use client"

export type AnalyticsEventName =
  | "cta_click"
  | "social_click"
  | "blog_search"
  | "blog_filter"
  | "post_engaged"
  | "post_share"
  | "post_like"
  | "comment_submit_success"
  | "project_gallery_interaction"
  | "project_outbound_click"
  | "contact_form_start"
  | "contact_submit_success"

type AnalyticsPrimitive = string | number | boolean
type AnalyticsPayload = Record<string, AnalyticsPrimitive | null | undefined>

interface UmamiTracker {
  track: (eventName: string, payload?: Record<string, AnalyticsPrimitive>) => void
}

declare global {
  interface Window {
    umami?: UmamiTracker
    umamiBeforeSend?: (type: string, payload?: { url?: string }) => false | { url?: string }
  }
}

const SESSION_EVENT_PREFIX = "analytics:event:"
const ADMIN_ROUTE_PREFIX = "/admin"

function sanitizePayload(payload: AnalyticsPayload): Record<string, AnalyticsPrimitive> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && value !== ""),
  ) as Record<string, AnalyticsPrimitive>
}

function isAdminPath(pathname: string) {
  return pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`)
}

export function trackEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined" || isAdminPath(window.location.pathname)) {
    return false
  }

  if (typeof window.umami?.track !== "function") {
    return false
  }

  const normalizedPayload = sanitizePayload(payload)

  try {
    window.umami.track(eventName, normalizedPayload)
    return true
  } catch (error) {
    console.error(`Failed to track analytics event "${eventName}"`, error)
    return false
  }
}

export function hasTrackedInSession(key: string) {
  if (typeof window === "undefined") {
    return false
  }

  try {
    return window.sessionStorage.getItem(`${SESSION_EVENT_PREFIX}${key}`) === "1"
  } catch {
    return false
  }
}

export function markTrackedInSession(key: string) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.setItem(`${SESSION_EVENT_PREFIX}${key}`, "1")
  } catch {
    return
  }
}

export function trackEventOncePerSession(eventName: AnalyticsEventName, key: string, payload: AnalyticsPayload = {}) {
  if (hasTrackedInSession(key)) {
    return false
  }

  const didTrack = trackEvent(eventName, payload)
  if (!didTrack) {
    return false
  }

  markTrackedInSession(key)
  return true
}
