import { NextRequest, NextResponse } from "next/server"

type SummaryRange = "7d" | "30d" | "90d"

interface UmamiWebsiteStats {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
}

interface UmamiActiveStats {
  visitors: number
}

interface UmamiExpandedMetric {
  name: string
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
}

interface UmamiEventSeriesItem {
  x: string
  t: string
  y: number
}

interface UmamiValueMetric {
  value: string
  total: number
}

const RANGE_DAYS: Record<SummaryRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
}

const TRACKED_EVENT_NAMES = [
  "cta_click",
  "social_click",
  "blog_search",
  "blog_filter",
  "post_engaged",
  "post_share",
  "post_like",
  "comment_submit_success",
  "project_gallery_interaction",
  "project_outbound_click",
  "contact_form_start",
  "contact_submit_success",
] as const

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
}

function getRangeKey(range: string | null): SummaryRange {
  if (range === "7d" || range === "30d" || range === "90d") {
    return range
  }

  return "30d"
}

function formatRangeLabel(range: SummaryRange) {
  if (range === "7d") return "최근 7일"
  if (range === "90d") return "최근 90일"
  return "최근 30일"
}

function aggregateEventTotals(series: UmamiEventSeriesItem[]) {
  const totals = Object.fromEntries(
    TRACKED_EVENT_NAMES.map((eventName) => [eventName, 0]),
  ) as Record<(typeof TRACKED_EVENT_NAMES)[number], number>

  for (const item of series) {
    if (item.x in totals) {
      totals[item.x as keyof typeof totals] += Number(item.y || 0)
    }
  }

  return totals
}

function mapValueMetrics(metrics: UmamiValueMetric[]) {
  return metrics.map((metric) => ({
    value: metric.value,
    total: Number(metric.total || 0),
  }))
}

async function verifyAdminAccess(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"

  if (!authorization) {
    return false
  }

  try {
    const response = await fetch(`${apiBaseUrl}/profile`, {
      headers: {
        Authorization: authorization,
      },
      cache: "no-store",
    })

    return response.ok
  } catch {
    return false
  }
}

function getUmamiRequestConfig() {
  const baseUrl = process.env.UMAMI_API_BASE_URL
  const websiteId = process.env.UMAMI_WEBSITE_ID
  const apiKey = process.env.UMAMI_API_KEY
  const apiToken = process.env.UMAMI_API_TOKEN

  if (!baseUrl || !websiteId) {
    return null
  }

  if (!apiKey && !apiToken) {
    return null
  }

  const headers: HeadersInit = {
    Accept: "application/json",
  }

  if (apiKey) {
    headers["x-umami-api-key"] = apiKey
  } else if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`
  }

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    websiteId,
    headers,
  }
}

async function fetchUmamiJson<T>(
  config: { baseUrl: string; websiteId: string; headers: HeadersInit },
  path: string,
  searchParams: URLSearchParams,
) {
  const url = new URL(path, config.baseUrl)
  url.search = searchParams.toString()

  const response = await fetch(url, {
    headers: config.headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Umami request failed: ${response.status} ${message}`)
  }

  return (await response.json()) as T
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminAccess(request)
  if (!isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const umamiConfig = getUmamiRequestConfig()
  if (!umamiConfig) {
    return NextResponse.json(
      {
        message: "Umami API configuration is incomplete.",
      },
      { status: 503 },
    )
  }

  const range = getRangeKey(request.nextUrl.searchParams.get("range"))
  const timezone = request.nextUrl.searchParams.get("timezone") || "UTC"
  const now = Date.now()
  const startAt = now - RANGE_DAYS[range] * 24 * 60 * 60 * 1000
  const commonParams = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(now),
  })

  try {
    const [stats, active, topPages, eventSeries, ctaTargets, projectTargets] =
      await Promise.all([
        fetchUmamiJson<UmamiWebsiteStats>(
          umamiConfig,
          `websites/${umamiConfig.websiteId}/stats`,
          commonParams,
        ),
        fetchUmamiJson<UmamiActiveStats>(
          umamiConfig,
          `websites/${umamiConfig.websiteId}/active`,
          new URLSearchParams(),
        ),
        fetchUmamiJson<UmamiExpandedMetric[]>(
          umamiConfig,
          `websites/${umamiConfig.websiteId}/metrics/expanded`,
          new URLSearchParams({
            ...Object.fromEntries(commonParams.entries()),
            type: "path",
            limit: "5",
          }),
        ),
        fetchUmamiJson<UmamiEventSeriesItem[]>(
          umamiConfig,
          `websites/${umamiConfig.websiteId}/events/series`,
          new URLSearchParams({
            ...Object.fromEntries(commonParams.entries()),
            unit: "day",
            timezone,
          }),
        ),
        fetchUmamiJson<UmamiValueMetric[]>(
          umamiConfig,
          `websites/${umamiConfig.websiteId}/event-data/values`,
          new URLSearchParams({
            ...Object.fromEntries(commonParams.entries()),
            event: "cta_click",
            propertyName: "target",
          }),
        ),
        fetchUmamiJson<UmamiValueMetric[]>(
          umamiConfig,
          `websites/${umamiConfig.websiteId}/event-data/values`,
          new URLSearchParams({
            ...Object.fromEntries(commonParams.entries()),
            event: "project_outbound_click",
            propertyName: "target",
          }),
        ),
      ])

    const eventTotals = aggregateEventTotals(eventSeries)
    const projectInterestCount =
      mapValueMetrics(ctaTargets).find((item) => item.value === "project")?.total ?? 0
    const leadStartCount = eventTotals.contact_form_start
    const leadSubmitCount = eventTotals.contact_submit_success

    return NextResponse.json({
      range: {
        key: range,
        label: formatRangeLabel(range),
        startAt,
        endAt: now,
      },
      overview: {
        pageviews: Number(stats.pageviews || 0),
        visitors: Number(stats.visitors || 0),
        visits: Number(stats.visits || 0),
        bounces: Number(stats.bounces || 0),
        totaltime: Number(stats.totaltime || 0),
        activeVisitors: Number(active.visitors || 0),
        averageVisitTime: stats.visits ? Number(stats.totaltime || 0) / Number(stats.visits || 1) : 0,
      },
      eventTotals,
      breakdowns: {
        ctaTargets: mapValueMetrics(ctaTargets),
        projectTargets: mapValueMetrics(projectTargets),
      },
      derived: {
        leadCompletionRate: leadStartCount > 0 ? leadSubmitCount / leadStartCount : null,
        projectActionRate:
          projectInterestCount > 0 ? eventTotals.project_outbound_click / projectInterestCount : null,
        engagementRate:
          stats.pageviews > 0 ? eventTotals.post_engaged / Number(stats.pageviews || 1) : null,
      },
      topPages: topPages.map((page) => ({
        path: page.name,
        pageviews: Number(page.pageviews || 0),
        visitors: Number(page.visitors || 0),
        visits: Number(page.visits || 0),
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to fetch Umami analytics summary", error)

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to fetch analytics summary.",
      },
      { status: 502 },
    )
  }
}
