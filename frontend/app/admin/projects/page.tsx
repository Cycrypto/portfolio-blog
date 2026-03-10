"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Edit, ExternalLink, Eye, PlusCircle, Search, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteProject, getProjects, Project } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { AdminShell } from "@/components/admin/AdminShell"

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
      setError(null)
      const data = await getProjects()
      setProjects(data)
    } catch (err) {
      setError("프로젝트를 불러오는데 실패했습니다.")
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
        const matchStatus = statusFilter === "all" ? true : project.status === statusFilter
        return matchSearch && matchStatus
      })
    : []

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 프로젝트를 삭제하시겠습니까?`)) return
    try {
      setDeletingId(id)
      await deleteProject(id.toString())
      toast({ title: "삭제 완료", description: "프로젝트가 삭제되었습니다." })
      fetchProjects()
    } catch {
      toast({ title: "삭제 실패", description: "프로젝트 삭제 중 오류가 발생했습니다.", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminShell
      active="projects"
      title="프로젝트 관리"
      description="포트폴리오 프로젝트를 생성, 수정, 삭제합니다"
      actions={
        <Button asChild className="bg-brand-blue-600 text-white hover:bg-brand-blue-700">
          <Link href="/admin/projects/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            새 프로젝트 추가
          </Link>
        </Button>
      }
    >
      <Card className="surface-default shadow-none">
        <CardHeader className="border-b border-brand-blue-100">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="text-xl text-neutral-slate-800">프로젝트 목록</CardTitle>
              <CardDescription>총 {filteredProjects.length}개의 프로젝트</CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-slate-400" />
                <Input
                  placeholder="프로젝트 검색..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">진행중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="planned">계획</SelectItem>
                  <SelectItem value="in-progress">진행중(in-progress)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-brand-blue-600" />
              <div className="text-neutral-slate-500">프로젝트를 불러오는 중...</div>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-12 text-center text-neutral-slate-500">등록된 프로젝트가 없습니다</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프로젝트명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>기술 스택</TableHead>
                    <TableHead>진행률</TableHead>
                    <TableHead>기간</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="font-semibold text-neutral-slate-800">{project.title}</div>
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
                        >
                          {project.status === "completed"
                            ? "완료"
                            : project.status === "active" || project.status === "in-progress"
                              ? "진행중"
                              : "계획"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{project.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(project.techStack || []).slice(0, 2).map((tech) => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                          {(project.techStack || []).length > 2 && <Badge variant="outline">+{(project.techStack || []).length - 2}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-neutral-slate-200">
                            <div className="h-2 rounded-full bg-brand-blue-600" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-sm text-neutral-slate-600">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-neutral-slate-600">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {project.startDate}
                          </div>
                          <div className="text-xs">~ {project.endDate}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {project.liveUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={project.liveUrl} target="_blank">
                                <ExternalLink className="mr-1 h-3 w-3" />
                                링크
                              </Link>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>
                              <Eye className="mr-1 h-3 w-3" />
                              보기
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/projects/${project.id}/edit`}>
                              <Edit className="mr-1 h-3 w-3" />
                              수정
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(project.id, project.title)}
                            disabled={deletingId === project.id}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            {deletingId === project.id ? (
                              "삭제 중..."
                            ) : (
                              <>
                                <Trash2 className="mr-1 h-3 w-3" />
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
    </AdminShell>
  )
}
