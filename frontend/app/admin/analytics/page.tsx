import Link from "next/link"
import { BarChart3, CheckCircle2, ExternalLink, MousePointerClick, Search, Send, Settings } from "lucide-react"

import { AnalyticsOverviewPanel } from "@/components/admin/AnalyticsOverviewPanel"
import { AdminShell } from "@/components/admin/AdminShell"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

const umamiDashboardUrl = process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL || ""
const isFrontendTrackingConfigured = Boolean(
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
)
const hasDashboardLink = Boolean(umamiDashboardUrl)
const hasUmamiApiBaseUrl = Boolean(process.env.UMAMI_API_BASE_URL)
const hasUmamiApiWebsiteId = Boolean(process.env.UMAMI_WEBSITE_ID)
const hasUmamiApiKey = Boolean(process.env.UMAMI_API_KEY)
const hasUmamiApiToken = Boolean(process.env.UMAMI_API_TOKEN)
const hasUmamiApiCredential = hasUmamiApiKey || hasUmamiApiToken
const isAdminKpiConfigured = hasUmamiApiBaseUrl && hasUmamiApiWebsiteId && hasUmamiApiCredential
const hasMixedCredentials = hasUmamiApiKey && hasUmamiApiToken
const umamiApiBaseUrl = process.env.UMAMI_API_BASE_URL || ""

function isUmamiCloudBaseUrl(baseUrl: string) {
  try {
    return new URL(baseUrl).hostname === "api.umami.is"
  } catch {
    return false
  }
}

const expectsCloudApiKey = umamiApiBaseUrl ? isUmamiCloudBaseUrl(umamiApiBaseUrl) : null
const hasCredentialMismatch =
  expectsCloudApiKey === true
    ? !hasUmamiApiKey && hasUmamiApiToken
    : expectsCloudApiKey === false
      ? !hasUmamiApiToken && hasUmamiApiKey
      : false

const measuredFlows = [
  {
    title: "프로젝트 관심",
    icon: MousePointerClick,
    description: "홈 진입부터 프로젝트 보기, 상세 확인, 서비스·코드 이동까지 이어지는 흐름을 확인합니다.",
  },
  {
    title: "콘텐츠 몰입",
    icon: Search,
    description: "블로그 검색, 필터, 읽기 완료, 공유와 좋아요 반응을 함께 살펴봅니다.",
  },
  {
    title: "문의 전환",
    icon: Send,
    description: "문의 시작부터 실제 완료까지 이어지는 전환 흐름을 확인합니다.",
  },
]

const helpWarnings = [
  !hasDashboardLink ? "외부 대시보드 바로가기가 아직 연결되지 않았습니다." : null,
  !isAdminKpiConfigured ? "관리자 화면 안에서 지표를 집계하려면 분석 API 연결과 인증 정보가 더 필요합니다." : null,
  hasMixedCredentials ? "관리자용 인증값이 두 종류 함께 설정되어 있어 충돌 가능성이 있습니다. 한 가지만 쓰는 구성이 안전합니다." : null,
  hasCredentialMismatch ? "현재 분석 API 주소 기준으로 인증 방식이 맞지 않을 수 있습니다." : null,
].filter(Boolean) as string[]

const overallStatusLabel = isFrontendTrackingConfigured && isAdminKpiConfigured ? "준비됨" : "확인 필요"

export default function AdminAnalyticsPage() {
  return (
    <AdminShell
      active="analytics"
      title="행동 통계"
      description="방문 흐름과 전환 지표를 빠르게 확인합니다"
      actions={
        hasDashboardLink ? (
          <Button asChild className="bg-brand-blue-600 text-white hover:bg-brand-blue-700">
            <Link href={umamiDashboardUrl} target="_blank" rel="noopener noreferrer">
              Umami 열기
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <AnalyticsOverviewPanel />

        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl text-neutral-slate-800">설정 및 측정 도움말</CardTitle>
                <CardDescription>기본 화면은 지표만 보여주고, 연결 상태와 측정 범위는 필요할 때만 펼쳐서 확인합니다.</CardDescription>
              </div>
              <Badge variant={isFrontendTrackingConfigured && isAdminKpiConfigured ? "default" : "secondary"}>
                {overallStatusLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="help" className="border-none">
                <AccordionTrigger className="px-6 py-5 text-left hover:no-underline">
                  <div className="pr-4">
                    <p className="font-semibold text-neutral-slate-800">연결 상태와 측정 범위 보기</p>
                    <p className="mt-1 text-sm text-neutral-slate-500">
                      분석 추적 준비 상태, 현재 측정 중인 흐름, 확인이 필요한 항목을 펼쳐서 볼 수 있습니다.
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-brand-blue-50 p-2">
                            <CheckCircle2 className="h-4 w-4 text-brand-blue-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-neutral-slate-800">연결 준비</h3>
                              <Badge variant={isFrontendTrackingConfigured && isAdminKpiConfigured ? "default" : "secondary"}>
                                {overallStatusLabel}
                              </Badge>
                            </div>
                            <div className="mt-3 space-y-3 text-sm text-neutral-slate-600">
                              <p>방문 추적은 공개 추적 스크립트와 사이트 식별값이 준비되면 자동으로 수집됩니다.</p>
                              <p>관리자 요약은 집계 API 주소, 사이트 식별값, 관리자용 인증 정보가 준비되어야 표시됩니다.</p>
                              <p>외부 대시보드 링크를 연결하면 상단 버튼으로 바로 이동할 수 있습니다.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-brand-blue-50 p-2">
                            <Settings className="h-4 w-4 text-brand-blue-700" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-neutral-slate-800">현재 측정 중인 흐름</h3>
                            <div className="mt-3 space-y-3">
                              {measuredFlows.map((flow) => {
                                const Icon = flow.icon

                                return (
                                  <div key={flow.title} className="flex items-start gap-3 rounded-lg border border-brand-blue-50 px-3 py-3">
                                    <div className="rounded-lg bg-brand-blue-50 p-2">
                                      <Icon className="h-4 w-4 text-brand-blue-700" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-neutral-slate-800">{flow.title}</p>
                                      <p className="mt-1 text-sm text-neutral-slate-600">{flow.description}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-brand-blue-50 p-2">
                          <BarChart3 className="h-4 w-4 text-brand-blue-700" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-neutral-slate-800">자주 확인할 지표</h3>
                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div className="rounded-lg border border-brand-blue-50 px-3 py-3">
                              <p className="font-medium text-neutral-slate-800">프로젝트 반응</p>
                              <p className="mt-1 text-sm text-neutral-slate-600">프로젝트 보기 이후 서비스·코드 이동이 이어지는지 확인합니다.</p>
                            </div>
                            <div className="rounded-lg border border-brand-blue-50 px-3 py-3">
                              <p className="font-medium text-neutral-slate-800">콘텐츠 반응</p>
                              <p className="mt-1 text-sm text-neutral-slate-600">읽기 완료율과 공유·좋아요·댓글 반응을 함께 살펴봅니다.</p>
                            </div>
                            <div className="rounded-lg border border-brand-blue-50 px-3 py-3">
                              <p className="font-medium text-neutral-slate-800">문의 전환</p>
                              <p className="mt-1 text-sm text-neutral-slate-600">문의 시작 대비 실제 완료 비율을 보고 이탈 구간을 찾습니다.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {helpWarnings.length > 0 ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <h3 className="font-semibold text-amber-950">확인 필요 항목</h3>
                        <div className="mt-3 space-y-2 text-sm text-amber-900">
                          {helpWarnings.map((warning) => (
                            <p key={warning}>{warning}</p>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        방문 추적과 관리자 요약 연결이 모두 준비되어 있습니다.
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
