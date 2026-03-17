"use client"

import { useEffect, useState } from "react"
import { Clock3, Eye, FileText, Heart, MousePointerClick, Send, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TokenManager } from "@/lib/auth/token-manager"
import { getAnalyticsEventLabel, getAnalyticsPageLabel, getAnalyticsTargetLabel } from "@/lib/analytics/admin-display"

type SummaryRange = "7d" | "30d" | "90d"

interface AnalyticsSummaryResponse {
  range: {
    key: SummaryRange
    label: string
    startAt: number
    endAt: number
  }
  overview: {
    pageviews: number
    visitors: number
    visits: number
    bounces: number
    totaltime: number
    activeVisitors: number
    averageVisitTime: number
  }
  eventTotals: Record<string, number>
  breakdowns: {
    ctaTargets: Array<{ value: string; total: number }>
    projectTargets: Array<{ value: string; total: number }>
  }
  derived: {
    leadCompletionRate: number | null
    projectActionRate: number | null
    engagementRate: number | null
  }
  topPages: Array<{
    path: string
    pageviews: number
    visitors: number
    visits: number
  }>
  generatedAt: string
}

interface AggregatedTopPage {
  label: string
  pageviews: number
  visitors: number
  visits: number
}

const RANGE_OPTIONS: Array<{ key: SummaryRange; label: string }> = [
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
  { key: "90d", label: "90일" },
]

const KEY_EVENT_NAMES = [
  "post_engaged",
  "project_outbound_click",
  "contact_form_start",
  "contact_submit_success",
]

function formatInteger(value: number) {
  return value.toLocaleString("ko-KR")
}

function formatDuration(milliseconds: number) {
  if (!milliseconds) {
    return "0초"
  }

  const totalSeconds = Math.round(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds}초`
  }

  return `${minutes}분 ${seconds}초`
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "-"
  }

  return `${(value * 100).toFixed(1)}%`
}

function getFriendlyAnalyticsErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""

  if (message.includes("unauthorized") || message.includes("401")) {
    return "지표를 아직 불러오지 못했습니다. 관리자 인증을 확인한 뒤 다시 시도해 주세요."
  }

  if (
    message.includes("umami") ||
    message.includes("configuration is incomplete") ||
    message.includes("인증에 실패") ||
    message.includes("설정")
  ) {
    return "지표를 아직 불러오지 못했습니다. 아래 도움말에서 분석 연결 상태를 확인해 주세요."
  }

  return "지표를 아직 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
}

function aggregateTopPages(
  topPages: AnalyticsSummaryResponse["topPages"],
): AggregatedTopPage[] {
  const groupedPages = new Map<string, AggregatedTopPage>()

  for (const page of topPages) {
    const label = getAnalyticsPageLabel(page.path)
    const existingPage = groupedPages.get(label)

    if (existingPage) {
      existingPage.pageviews += page.pageviews
      existingPage.visitors += page.visitors
      existingPage.visits += page.visits
      continue
    }

    groupedPages.set(label, {
      label,
      pageviews: page.pageviews,
      visitors: page.visitors,
      visits: page.visits,
    })
  }

  return Array.from(groupedPages.values())
    .sort((left, right) => right.pageviews - left.pageviews || right.visitors - left.visitors)
    .slice(0, 5)
}

export function AnalyticsOverviewPanel() {
  const [range, setRange] = useState<SummaryRange>("30d")
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadSummary = async () => {
      const authorization = TokenManager.getAuthorizationHeader()

      if (!authorization) {
        if (mounted) {
          setError("지표를 아직 불러오지 못했습니다. 관리자 인증을 확인한 뒤 다시 시도해 주세요.")
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        setError(null)

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        const response = await fetch(
          `/api/admin/analytics/summary?range=${range}&timezone=${encodeURIComponent(timezone)}`,
          {
            headers: {
              Authorization: authorization,
            },
            cache: "no-store",
          },
        )

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result?.message || "행동 통계를 불러오지 못했습니다.")
        }

        if (mounted) {
          setSummary(result)
        }
      } catch (loadError) {
        if (mounted) {
          setError(getFriendlyAnalyticsErrorMessage(loadError))
          setSummary(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadSummary()

    return () => {
      mounted = false
    }
  }, [range])

  const ctaTargets = summary?.breakdowns.ctaTargets || []
  const projectTargets = summary?.breakdowns.projectTargets || []
  const projectInterestCount = ctaTargets.find((item) => item.value === "project")?.total ?? 0
  const leadStartCount = summary?.eventTotals.contact_form_start || 0
  const leadSubmitCount = summary?.eventTotals.contact_submit_success || 0
  const engagementCount = summary?.eventTotals.post_engaged || 0
  const socialActionCount =
    (summary?.eventTotals.post_share || 0) +
    (summary?.eventTotals.post_like || 0) +
    (summary?.eventTotals.comment_submit_success || 0)
  const groupedTopPages = summary ? aggregateTopPages(summary.topPages) : []
  const updatedAt = summary ? new Date(summary.generatedAt).toLocaleString("ko-KR") : null

  return (
    <div className="space-y-6">
      <Card className="surface-default shadow-none">
        <CardHeader className="border-b border-brand-blue-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl text-neutral-slate-800">핵심 지표</CardTitle>
              <CardDescription>최근 기간의 방문, 읽기, 전환 흐름을 한 번에 확인합니다.</CardDescription>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap gap-2">
                {RANGE_OPTIONS.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    variant={range === option.key ? "default" : "outline"}
                    className={range === option.key ? "bg-brand-blue-600 text-white hover:bg-brand-blue-700" : "border-brand-blue-200 text-brand-blue-700"}
                    onClick={() => setRange(option.key)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {updatedAt ? <p className="text-xs text-neutral-slate-500">업데이트됨 {updatedAt}</p> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {loading ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="h-28 animate-pulse rounded-xl bg-neutral-slate-100" />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-28 animate-pulse rounded-xl bg-neutral-slate-100" />
                <div className="h-28 animate-pulse rounded-xl bg-neutral-slate-100" />
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-36 animate-pulse rounded-xl bg-neutral-slate-100" />
                ))}
              </div>
              <div className="h-64 animate-pulse rounded-xl bg-neutral-slate-100" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : summary ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <Users className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-slate-500">방문자</p>
                      <p className="text-2xl font-bold text-neutral-slate-800">{formatInteger(summary.overview.visitors)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <Eye className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-slate-500">페이지뷰</p>
                      <p className="text-2xl font-bold text-neutral-slate-800">{formatInteger(summary.overview.pageviews)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <FileText className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-slate-500">읽기 완료율</p>
                      <p className="text-2xl font-bold text-neutral-slate-800">{formatPercent(summary.derived.engagementRate)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <MousePointerClick className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-slate-500">프로젝트 액션률</p>
                      <p className="text-2xl font-bold text-neutral-slate-800">{formatPercent(summary.derived.projectActionRate)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <Send className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-slate-500">문의 완료율</p>
                      <p className="text-2xl font-bold text-neutral-slate-800">{formatPercent(summary.derived.leadCompletionRate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-brand-blue-100 bg-brand-blue-50/40 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2">
                      <Clock3 className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-slate-500">평균 방문 시간</p>
                      <p className="text-lg font-semibold text-neutral-slate-800">{formatDuration(summary.overview.averageVisitTime)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-brand-blue-100 bg-brand-blue-50/40 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2">
                      <Users className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-slate-500">현재 활성 방문자</p>
                      <p className="text-lg font-semibold text-neutral-slate-800">{formatInteger(summary.overview.activeVisitors)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-brand-blue-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <MousePointerClick className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-slate-800">프로젝트 관심</h3>
                      <p className="mt-1 text-sm text-neutral-slate-500">프로젝트 보기 이후 실제 서비스 또는 코드 이동까지 확인합니다.</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">프로젝트 보기</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(projectInterestCount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">서비스·코드 이동</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(summary.eventTotals.project_outbound_click || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-brand-blue-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <Heart className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-slate-800">콘텐츠 몰입</h3>
                      <p className="mt-1 text-sm text-neutral-slate-500">읽기 완료와 반응 행동을 함께 보면서 콘텐츠 반응을 확인합니다.</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">읽기 완료</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(engagementCount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">공유·좋아요·댓글</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(socialActionCount)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-brand-blue-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <Send className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-slate-800">문의 전환</h3>
                      <p className="mt-1 text-sm text-neutral-slate-500">문의 시작과 실제 완료 사이에서 이탈이 있는지 빠르게 파악합니다.</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">문의 시작</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(leadStartCount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">문의 완료</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(leadSubmitCount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-neutral-slate-800">자주 방문한 페이지</h3>
                    <p className="mt-1 text-sm text-neutral-slate-500">{summary.range.label} 기준으로 가장 많이 본 페이지입니다.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {groupedTopPages.length > 0 ? (
                    groupedTopPages.map((page) => (
                      <div key={page.label} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg border border-brand-blue-50 px-3 py-3 text-sm">
                        <span className="truncate text-neutral-slate-700">{page.label}</span>
                        <span className="text-neutral-slate-500">조회수 {formatInteger(page.pageviews)}</span>
                        <span className="text-neutral-slate-500">방문자 {formatInteger(page.visitors)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-slate-500">표시할 페이지 데이터가 없습니다.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-xl border border-brand-blue-100 bg-white p-4 xl:col-span-1">
                  <h3 className="font-semibold text-neutral-slate-800">많이 눌린 이동</h3>
                  <div className="mt-4 space-y-3">
                    {ctaTargets.length > 0 ? (
                      ctaTargets.map((item) => (
                        <div key={item.value} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-slate-600">{getAnalyticsTargetLabel(item.value)}</span>
                          <span className="font-medium text-neutral-slate-800">{formatInteger(item.total)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-slate-500">표시할 이동 데이터가 없습니다.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-brand-blue-100 bg-white p-4 xl:col-span-1">
                  <h3 className="font-semibold text-neutral-slate-800">프로젝트 외부 이동</h3>
                  <div className="mt-4 space-y-3">
                    {projectTargets.length > 0 ? (
                      projectTargets.map((item) => (
                        <div key={item.value} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-slate-600">{getAnalyticsTargetLabel(item.value)}</span>
                          <span className="font-medium text-neutral-slate-800">{formatInteger(item.total)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-slate-500">표시할 프로젝트 액션 데이터가 없습니다.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-brand-blue-100 bg-white p-4 xl:col-span-1">
                  <h3 className="font-semibold text-neutral-slate-800">주요 행동</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    {KEY_EVENT_NAMES.map((eventName) => (
                      <div key={eventName} className="flex items-center justify-between">
                        <span className="text-neutral-slate-600">{getAnalyticsEventLabel(eventName)}</span>
                        <span className="font-medium text-neutral-slate-800">{formatInteger(summary.eventTotals[eventName] || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
