"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Search, Edit, Trash2, Eye, Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"
import { deleteProject, getProjects, Project } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const { toast } = useToast()

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await getProjects()
      setProjects(data)
    } catch (err) {
      setError('프로젝트를 불러오는데 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const filteredProjects = Array.isArray(projects)
    ? projects.filter((project) => {
        const matchSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus = statusFilter === 'all' ? true : project.status === statusFilter
        return matchSearch && matchStatus
      })
    : []

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 프로젝트를 삭제하시겠습니까?`)) return
    try {
      setDeletingId(id)
      await deleteProject(id.toString())
      toast({ title: '삭제 완료', description: '프로젝트가 삭제되었습니다.' })
      fetchProjects()
    } catch (err) {
      toast({ title: '삭제 실패', description: '프로젝트 삭제 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-slate-50 via-brand-indigo-50 to-brand-blue-50">
      <div className="flex">
        <AdminSidebar active="projects" />

        {/* 메인 콘텐츠 */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-blue-700 to-brand-blue-900">
                  프로젝트 관리
                </h1>
                <p className="text-neutral-slate-600 mt-2 text-lg">포트폴리오 프로젝트를 생성, 수정, 삭제할 수 있습니다</p>
              </div>
              <Button
                asChild
                className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0 shadow-md"
              >
                <Link href="/admin/projects/new">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  새 프로젝트 추가
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-brand-blue-900">프로젝트 목록</CardTitle>
                  <CardDescription className="text-neutral-slate-600 mt-1">총 {filteredProjects.length}개의 프로젝트</CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-slate-400 w-4 h-4" />
                    <Input
                      placeholder="프로젝트 검색..."
                      className="pl-10 border-brand-indigo-500/50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 border-brand-indigo-500/50">
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="active">진행중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                      <SelectItem value="planned">계획</SelectItem>
                      <SelectItem value="in-progress">진행중</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mb-4"></div>
                  <div className="text-neutral-slate-500">프로젝트를 불러오는 중...</div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <PlusCircle className="w-16 h-16 mx-auto text-neutral-slate-300 mb-4" />
                  <p className="text-neutral-slate-500 text-lg">등록된 프로젝트가 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-brand-blue-50/50 border-brand-indigo-500/20">
                        <TableHead className="font-bold text-brand-blue-900">프로젝트명</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">상태</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">카테고리</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">기술 스택</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">진행률</TableHead>
                        <TableHead className="font-bold text-brand-blue-900">기간</TableHead>
                        <TableHead className="text-right font-bold text-brand-blue-900">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => (
                        <TableRow
                          key={project.id}
                          className="hover:bg-brand-blue-50/30 transition-colors border-brand-indigo-500/10"
                        >
                          <TableCell>
                            <div className="font-semibold text-brand-blue-900">{project.title}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                project.status === "completed"
                                  ? "default"
                                  : project.status === "active" || project.status === "in-progress"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                project.status === "completed"
                                  ? "bg-green-500 hover:bg-green-600 text-white"
                                  : project.status === "active" || project.status === "in-progress"
                                    ? "bg-brand-blue-500 hover:bg-brand-blue-600 text-white"
                                    : "border-neutral-slate-300 text-neutral-slate-600"
                              }
                            >
                              {project.status === "completed"
                                ? "완료"
                                : project.status === "active" || project.status === "in-progress"
                                  ? "진행중"
                                  : "계획"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-brand-indigo-500 text-brand-blue-700 bg-brand-blue-50/50"
                            >
                              {project.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(project.techStack || []).slice(0, 2).map((tech) => (
                                <Badge
                                  key={tech}
                                  variant="outline"
                                  className="text-xs border-brand-indigo-500 text-brand-blue-700 bg-brand-blue-50/50"
                                >
                                  {tech}
                                </Badge>
                              ))}
                              {(project.techStack || []).length > 2 && (
                                <Badge variant="outline" className="text-xs border-brand-indigo-500 text-neutral-slate-500">
                                  +{(project.techStack || []).length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-neutral-slate-200 rounded-full h-2">
                                <div
                                  className="bg-brand-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-neutral-slate-600">{project.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-neutral-slate-600">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {project.startDate}
                              </div>
                              <div className="text-xs">~ {project.endDate}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {project.liveUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
                                >
                                  <Link href={project.liveUrl} target="_blank">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    링크
                                  </Link>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
                              >
                                <Link href={`/projects/${project.id}`}>
                                  <Eye className="w-3 h-3 mr-1" />
                                  보기
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
                              >
                                <Link href={`/admin/projects/${project.id}/edit`}>
                                  <Edit className="w-3 h-3 mr-1" />
                                  수정
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(project.id, project.title)}
                                disabled={deletingId === project.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                              >
                                {deletingId === project.id ? (
                                  "삭제 중..."
                                ) : (
                                  <>
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    삭제
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
