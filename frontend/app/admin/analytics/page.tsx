import Link from "next/link"
import { ArrowUpRight, BarChart3, CheckCircle2, ExternalLink, MousePointerClick, Search, Send, Settings } from "lucide-react"

import { AnalyticsOverviewPanel } from "@/components/admin/AnalyticsOverviewPanel"
import { AdminShell } from "@/components/admin/AdminShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const umamiDashboardUrl = process.env.NEXT_PUBLIC_UMAMI_DASHBOARD_URL || ""
const isUmamiConfigured = Boolean(process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID)
const hasDashboardLink = Boolean(umamiDashboardUrl)

const trackedEvents = [
  {
    name: "cta_click",
    description: "홈, 블로그, 프로젝트 화면에서 주요 이동 CTA를 눌렀을 때 기록됩니다.",
  },
  {
    name: "social_click",
    description: "GitHub, LinkedIn, 이메일 클릭을 채널별로 분리해서 기록합니다.",
  },
  {
    name: "blog_search / blog_filter",
    description: "검색 실행과 태그 필터 적용 후 결과 수를 함께 남깁니다.",
  },
  {
    name: "post_engaged",
    description: "글에서 45초 이상 머물고 스크롤 70%를 넘긴 세션을 읽음 완료로 간주합니다.",
  },
  {
    name: "post_share / post_like / comment_submit_success",
    description: "공유, 좋아요, 댓글 성공을 행동 전환으로 기록합니다.",
  },
  {
    name: "project_outbound_click / project_gallery_interaction",
    description: "프로젝트 상세 관심과 외부 이동 의도를 측정합니다.",
  },
  {
    name: "contact_form_start / contact_submit_success",
    description: "리드 퍼널 시작과 실제 문의 성공을 구분합니다.",
  },
]

const funnelCards = [
  {
    title: "프로젝트 관심 퍼널",
    icon: MousePointerClick,
    steps: ["홈 진입", "프로젝트 카드 클릭", "프로젝트 상세 진입", "서비스 보기 / 코드 보기"],
  },
  {
    title: "콘텐츠 전환 퍼널",
    icon: Search,
    steps: ["홈 또는 블로그 목록", "글 상세 진입", "post_engaged", "문의 폼 시작 / 문의 성공"],
  },
  {
    title: "리드 퍼널",
    icon: Send,
    steps: ["문의 섹션 방문", "contact_form_start", "contact_submit_success"],
  },
]

export default function AdminAnalyticsPage() {
  return (
    <AdminShell
      active="analytics"
      title="행동 통계"
      description="Umami 기준 행동 추적과 퍼널을 확인합니다"
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
                <CardTitle className="text-xl text-neutral-slate-800">연결 상태</CardTitle>
                <CardDescription>현재 프론트엔드 행동 추적이 어떻게 연결되어 있는지 보여줍니다.</CardDescription>
              </div>
              <Badge variant={isUmamiConfigured ? "default" : "secondary"}>
                {isUmamiConfigured ? "Umami 연결됨" : "설정 필요"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
            <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-blue-50 p-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-slate-800">수집 중인 화면</h3>
                  <p className="mt-1 text-sm text-neutral-slate-600">
                    홈, 블로그 목록, 글 상세, 프로젝트 카드/상세, 문의 폼에서 주요 행동 이벤트를 보냅니다.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-brand-blue-100 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-blue-50 p-2">
                  <Settings className="h-4 w-4 text-brand-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-slate-800">설정 값</h3>
                  <p className="mt-1 text-sm text-neutral-slate-600">
                    `NEXT_PUBLIC_UMAMI_SCRIPT_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`, `NEXT_PUBLIC_UMAMI_DASHBOARD_URL`
                    를 사용합니다.
                  </p>
                </div>
              </div>
            </div>

            {!hasDashboardLink && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 md:col-span-2">
                `NEXT_PUBLIC_UMAMI_DASHBOARD_URL`이 비어 있어 관리자에서 바로 Umami를 열 수 없습니다. 공유 링크 또는 대시보드 URL을
                환경변수에 넣으면 상단 버튼이 활성화됩니다.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {funnelCards.map((funnel) => {
            const Icon = funnel.icon

            return (
              <Card key={funnel.title} className="surface-default shadow-none">
                <CardHeader className="border-b border-brand-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-blue-50 p-2">
                      <Icon className="h-4 w-4 text-brand-blue-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-neutral-slate-800">{funnel.title}</CardTitle>
                      <CardDescription>Umami Funnel에서 그대로 만들 수 있는 흐름입니다.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <ol className="space-y-3 text-sm text-neutral-slate-700">
                    {funnel.steps.map((step, index) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue-600 text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <CardTitle className="text-xl text-neutral-slate-800">추적 이벤트 목록</CardTitle>
            <CardDescription>Umami Events 탭에서 아래 이름으로 필터링하면 됩니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {trackedEvents.map((event) => (
              <div key={event.name} className="rounded-xl border border-brand-blue-100 bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="bg-brand-blue-50 font-mono text-brand-blue-700">
                    {event.name}
                  </Badge>
                  <p className="text-sm text-neutral-slate-600">{event.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <CardTitle className="text-xl text-neutral-slate-800">추천 확인 순서</CardTitle>
            <CardDescription>운영 중에는 이 순서로 보면 변화를 빠르게 파악할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5 text-sm text-neutral-slate-700">
            <p>1. Events에서 `contact_submit_success`, `project_outbound_click`, `post_engaged` 증감 확인</p>
            <p>2. Funnels에서 프로젝트 관심 퍼널과 리드 퍼널 전환율 확인</p>
            <p>3. Pages에서 랜딩 페이지별 유입과 이탈이 높은 페이지 확인</p>
            <p>4. Referrers와 UTM으로 어떤 채널이 실제 문의와 프로젝트 클릭을 만드는지 확인</p>
            {hasDashboardLink && (
              <Button asChild variant="outline" className="mt-2 border-brand-blue-200 text-brand-blue-700">
                <Link href={umamiDashboardUrl} target="_blank" rel="noopener noreferrer">
                  행동 통계 바로 열기
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
