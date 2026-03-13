"use client"

import { useEffect, useState } from "react"
import { Activity, Eye, MousePointerClick, Send, TimerReset, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TokenManager } from "@/lib/auth/token-manager"

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

const RANGE_OPTIONS: Array<{ key: SummaryRange; label: string }> = [
  { key: "7d", label: "7일" },
  { key: "30d", label: "30일" },
  { key: "90d", label: "90일" },
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
          setError("관리자 인증이 필요합니다.")
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
          setError(loadError instanceof Error ? loadError.message : "행동 통계를 불러오지 못했습니다.")
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

  return (
    <div className="space-y-6">
      <Card className="surface-default shadow-none">
        <CardHeader className="border-b border-brand-blue-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl text-neutral-slate-800">내부 KPI</CardTitle>
              <CardDescription>Umami API에서 최근 행동 데이터를 읽어와 관리자 화면 안에서 바로 보여줍니다.</CardDescription>
            </div>
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
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-xl bg-neutral-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : summary ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                      <Activity className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-slate-500">실시간 활성</p>
                      <p className="text-2xl font-bold text-neutral-slate-800">{formatInteger(summary.overview.activeVisitors)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <TimerReset className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-slate-500">평균 방문 시간</p>
                      <p className="text-2xl font-bold text-neutral-slate-800">{formatDuration(summary.overview.averageVisitTime)}</p>
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

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-xl border border-brand-blue-100 bg-white p-4 xl:col-span-1">
                  <h3 className="font-semibold text-neutral-slate-800">CTA 타깃 분포</h3>
                  <div className="mt-4 space-y-3">
                    {ctaTargets.length > 0 ? (
                      ctaTargets.map((item) => (
                        <div key={item.value} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-slate-600">{item.value}</span>
                          <span className="font-medium text-neutral-slate-800">{formatInteger(item.total)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-slate-500">표시할 CTA 데이터가 없습니다.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-brand-blue-100 bg-white p-4 xl:col-span-1">
                  <h3 className="font-semibold text-neutral-slate-800">프로젝트 외부 이동</h3>
                  <div className="mt-4 space-y-3">
                    {projectTargets.length > 0 ? (
                      projectTargets.map((item) => (
                        <div key={item.value} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-slate-600">{item.value}</span>
                          <span className="font-medium text-neutral-slate-800">{formatInteger(item.total)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-slate-500">표시할 프로젝트 액션 데이터가 없습니다.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-brand-blue-100 bg-white p-4 xl:col-span-1">
                  <h3 className="font-semibold text-neutral-slate-800">핵심 이벤트</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">post_engaged</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(summary.eventTotals.post_engaged || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">project_outbound_click</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(summary.eventTotals.project_outbound_click || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">contact_form_start</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(summary.eventTotals.contact_form_start || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-slate-600">contact_submit_success</span>
                      <span className="font-medium text-neutral-slate-800">{formatInteger(summary.eventTotals.contact_submit_success || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-neutral-slate-800">상위 페이지</h3>
                    <p className="mt-1 text-sm text-neutral-slate-500">{summary.range.label} 기준 pageviews 상위 5개입니다.</p>
                  </div>
                  <div className="text-xs text-neutral-slate-500">
                    생성 시각 {new Date(summary.generatedAt).toLocaleString("ko-KR")}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {summary.topPages.length > 0 ? (
                    summary.topPages.map((page) => (
                      <div key={page.path} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg border border-brand-blue-50 px-3 py-3 text-sm">
                        <span className="truncate text-neutral-slate-700">{page.path}</span>
                        <span className="text-neutral-slate-500">PV {formatInteger(page.pageviews)}</span>
                        <span className="text-neutral-slate-500">UV {formatInteger(page.visitors)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-slate-500">표시할 페이지 데이터가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
