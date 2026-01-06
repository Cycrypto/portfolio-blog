"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, FolderOpen, MessageSquare, Eye, ArrowUpRight, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"
import { getStats, StatsData } from "@/lib/api"
import { Post, Project } from "@/lib/types/api"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getStats()
        setStats(data)
      } catch (e) {
        setError('통계를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const recentPosts: Post[] = stats?.recentPosts || []
  const recentProjects: Project[] = stats?.recentProjects || []

  const statCards = [
    {
      title: "총 블로그 포스트",
      value: stats?.totals.posts ?? '-',
      description: "게시/임시/예약 포함",
      icon: FileText,
      gradient: "from-brand-blue-500 to-brand-blue-700",
      link: "/admin/posts"
    },
    {
      title: "총 프로젝트",
      value: stats?.totals.projects ?? '-',
      description: "전체 프로젝트 수",
      icon: FolderOpen,
      gradient: "from-brand-blue-600 to-brand-blue-900",
      link: "/admin/projects"
    },
    {
      title: "총 조회수",
      value: "-",
      description: "조회수 집계 미연동",
      icon: Eye,
      gradient: "from-brand-blue-500 to-brand-blue-700",
      link: "#"
    },
    {
      title: "총 댓글",
      value: stats?.totals.comments ?? '-',
      description: "삭제 제외",
      icon: MessageSquare,
      gradient: "from-brand-blue-600 to-brand-blue-900",
      link: "/admin/comments"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <div className="flex">
        <AdminSidebar active="dashboard" />

        {/* 메인 콘텐츠 */}
        <div className="flex-1 p-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-700 to-brand-blue-900">
                  대시보드
                </h1>
                <p className="text-neutral-slate-600 mt-2 text-lg">포트폴리오 사이트 관리 현황을 한눈에 확인하세요</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-slate-600">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 통계 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <Link href={stat.link} key={index}>
                <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-neutral-slate-700">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-black text-brand-blue-900">
                          {stat.value}
                        </div>
                        <p className="text-xs text-neutral-slate-500 mt-1">{stat.description}</p>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-brand-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 최근 블로그 포스트 */}
            <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-brand-blue-900">최근 블로그 포스트</CardTitle>
                    <CardDescription className="text-neutral-slate-600 mt-1">
                      최근에 작성된 블로그 포스트들
                    </CardDescription>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0 shadow-md"
                  >
                    <Link href="/admin/posts/new">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      새 포스트
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-neutral-slate-100 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-neutral-slate-300 mb-4" />
                    <p className="text-neutral-slate-500">아직 작성된 포스트가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPosts.map((post) => (
                      <Link href={`/admin/posts/${post.id}/edit`} key={post.id}>
                        <div className="group p-4 border border-brand-indigo-500/20 rounded-lg hover:shadow-md hover:border-brand-blue-500/40 transition-all duration-200 bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-brand-blue-900 group-hover:text-brand-blue-600 transition-colors line-clamp-1">
                                {post.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant={post.status === "published" ? "default" : "secondary"}
                                  className={post.status === "published"
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-neutral-slate-200 text-neutral-slate-700"
                                  }
                                >
                                  {post.status === "published" ? "게시됨" : "임시저장"}
                                </Badge>
                                <span className="text-xs text-neutral-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {post.publishDate}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-neutral-slate-600 bg-neutral-slate-50 px-3 py-1 rounded-full">
                              <Eye className="w-4 h-4" />
                              {post.views}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-6 border-brand-indigo-500 text-brand-blue-700"
                  asChild
                >
                  <Link href="/admin/posts">
                    모든 포스트 보기
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* 최근 프로젝트 */}
            <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-brand-blue-900">최근 프로젝트</CardTitle>
                    <CardDescription className="text-neutral-slate-600 mt-1">
                      진행 중인 프로젝트들
                    </CardDescription>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0 shadow-md"
                  >
                    <Link href="/admin/projects/new">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      새 프로젝트
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-neutral-slate-100 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-12 h-12 mx-auto text-neutral-slate-300 mb-4" />
                    <p className="text-neutral-slate-500">아직 생성된 프로젝트가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentProjects.map((project) => (
                      <Link href={`/admin/projects/${project.id}/edit`} key={project.id}>
                        <div className="group p-4 border border-brand-indigo-500/20 rounded-lg hover:shadow-md hover:border-brand-blue-500/40 transition-all duration-200 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-brand-blue-900 group-hover:text-brand-blue-600 transition-colors line-clamp-1 flex-1">
                              {project.title}
                            </h4>
                            <Badge
                              variant={
                                project.status === "completed"
                                  ? "default"
                                  : project.status === "active"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                project.status === "completed"
                                  ? "bg-green-500 hover:bg-green-600 text-white"
                                  : project.status === "active"
                                    ? "bg-brand-blue-500 hover:bg-brand-blue-600 text-white"
                                    : "border-neutral-slate-300 text-neutral-slate-600"
                              }
                            >
                              {project.status === "completed" ? "완료" : project.status === "active" ? "활성" : "진행중"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(project.techStack || []).slice(0, 4).map((tech) => (
                              <Badge
                                key={tech}
                                variant="outline"
                                className="text-xs border-brand-indigo-500 text-brand-blue-700 bg-brand-blue-50/50"
                              >
                                {tech}
                              </Badge>
                            ))}
                            {(project.techStack || []).length > 4 && (
                              <Badge variant="outline" className="text-xs border-brand-indigo-500 text-neutral-slate-500">
                                +{(project.techStack || []).length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-6 border-brand-indigo-500 text-brand-blue-700"
                  asChild
                >
                  <Link href="/admin/projects">
                    모든 프로젝트 보기
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
