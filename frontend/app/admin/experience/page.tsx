"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  EXPERIENCE_TYPE_OPTIONS,
  formatExperiencePeriod,
  getExperienceTypeLabel,
  getExperienceTypeTheme,
  sortExperiences,
} from "@/lib/experience/utils"
import { createExperience, deleteExperience, getExperiences, getProjects, updateExperience } from "@/lib/api"
import { CreateExperienceRequest, Experience, ExperienceType, Project } from "@/lib/types/api"
import { useToast } from "@/hooks/use-toast"
import { AdminShell } from "@/components/admin/AdminShell"
import { cn } from "@/lib/utils"

const EMPTY_FORM: CreateExperienceRequest = {
  type: "career",
  title: "",
  organization: "",
  startDate: "",
  endDate: "",
  description: "",
  linkedProjectIds: [],
}

export default function AdminExperience() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateExperienceRequest>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [projectSearch, setProjectSearch] = useState("")
  const { toast } = useToast()

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setProjectSearch("")
  }

  const load = async () => {
    try {
      const data = await getExperiences()
      setExperiences(sortExperiences(data))
    } catch {
      toast({ title: "로드 실패", description: "경험을 불러오지 못했습니다.", variant: "destructive" })
    }
  }

  const loadProjects = async () => {
    try {
      setLoadingProjects(true)
      const data = await getProjects()
      setProjects(data)
    } catch {
      toast({ title: "로드 실패", description: "프로젝트를 불러오지 못했습니다.", variant: "destructive" })
    } finally {
      setLoadingProjects(false)
    }
  }

  useEffect(() => {
    void load()
    void loadProjects()
  }, [])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.organization.trim() || !form.startDate.trim()) {
      toast({ title: "필수 입력 누락", description: "직책, 조직명, 시작일을 입력하세요.", variant: "destructive" })
      return
    }
    try {
      setLoading(true)
      if (editingId) {
        await updateExperience(editingId.toString(), form)
        toast({ title: "수정 완료", description: "경험이 수정되었습니다." })
      } else {
        await createExperience(form)
        toast({ title: "등록 완료", description: "경험이 추가되었습니다." })
      }
      resetForm()
      await Promise.all([load(), loadProjects()])
    } catch {
      toast({ title: "저장 실패", description: "경험 저장 중 오류가 발생했습니다.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (exp: Experience) => {
    setEditingId(exp.id)
    setForm({
      type: exp.type || "career",
      title: exp.title || "",
      organization: exp.organization || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      description: exp.description || "",
      linkedProjectIds: (exp.linkedProjects || []).map((project) => project.id),
    })
  }

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return
    try {
      await deleteExperience(id.toString())
      toast({ title: "삭제 완료", description: "경험이 삭제되었습니다." })
      await Promise.all([load(), loadProjects()])
    } catch {
      toast({ title: "삭제 실패", description: "삭제 중 오류가 발생했습니다.", variant: "destructive" })
    }
  }

  const toggleLinkedProject = (projectId: number) => {
    setForm((current) => {
      const linkedProjectIds = current.linkedProjectIds || []

      return {
        ...current,
        linkedProjectIds: linkedProjectIds.includes(projectId)
          ? linkedProjectIds.filter((id) => id !== projectId)
          : [...linkedProjectIds, projectId],
      }
    })
  }

  const linkedProjectIds = form.linkedProjectIds || []
  const filteredProjects = projects
    .filter((project) => project.title.toLowerCase().includes(projectSearch.toLowerCase()))
    .sort((left, right) => {
      const rightDate = new Date(right.endDate || right.startDate || 0).getTime()
      const leftDate = new Date(left.endDate || left.startDate || 0).getTime()

      if (leftDate !== rightDate) {
        return rightDate - leftDate
      }

      return right.id - left.id
    })

  return (
    <AdminShell active="experience" title="경험 관리" description="타임라인과 PDF에 노출될 경험 정보를 관리합니다">
      <div className="space-y-6">
        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <CardTitle className="text-xl text-neutral-slate-800">{editingId ? "경험 수정" : "새 경험 추가"}</CardTitle>
            <CardDescription>경력, 팀 프로젝트, 동아리를 하나의 경험 모델로 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="type">타입</Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as ExperienceType })}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">직책/역할</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="organization">조직/회사/팀명</Label>
                <Input
                  id="organization"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="start">시작일 (YYYY-MM 또는 YYYY-MM-DD)</Label>
                <Input id="start" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="end">종료일 (재직 중이면 비워두세요)</Label>
                <Input id="end" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="desc">설명</Label>
              <Textarea id="desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="project-search">연결 프로젝트</Label>
                <p className="mt-1 text-sm text-neutral-slate-500">이 경험에 속하는 프로젝트를 여러 개 연결할 수 있습니다.</p>
              </div>
              <Input
                id="project-search"
                placeholder="프로젝트 제목으로 검색"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
              />
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-brand-blue-100 p-3">
                {loadingProjects ? (
                  <p className="text-sm text-neutral-slate-500">프로젝트를 불러오는 중...</p>
                ) : filteredProjects.length === 0 ? (
                  <p className="text-sm text-neutral-slate-500">조건에 맞는 프로젝트가 없습니다.</p>
                ) : (
                  filteredProjects.map((project) => {
                    const checked = linkedProjectIds.includes(project.id)
                    const assignedToOtherExperience = Boolean(project.experienceId && project.experienceId !== editingId)
                    const disabled = assignedToOtherExperience && !checked

                    return (
                      <label
                        key={project.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-md border p-3",
                          disabled
                            ? "border-neutral-slate-200 bg-neutral-slate-50 text-neutral-slate-400"
                            : "border-brand-blue-100 hover:bg-brand-blue-50/50",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={() => toggleLinkedProject(project.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-slate-800">{project.title}</p>
                          <p className="mt-1 text-xs text-neutral-slate-500">
                            {[project.category, formatExperiencePeriod(project.startDate, project.endDate)].filter(Boolean).join(" · ") || "기간 정보 없음"}
                          </p>
                          {assignedToOtherExperience ? (
                            <p className="mt-1 text-xs text-amber-600">
                              다른 경험에 연결됨: {project.experience?.title || `ID ${project.experienceId}`}
                            </p>
                          ) : null}
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
              <p className="text-xs text-neutral-slate-500">선택됨: {linkedProjectIds.length}개</p>
            </div>
            <div className="flex justify-end gap-2">
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  취소
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={loading} className="bg-brand-blue-600 text-white hover:bg-brand-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                {loading ? "저장 중..." : editingId ? "경험 수정" : "경험 추가"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <CardTitle className="text-xl text-neutral-slate-800">경험 목록</CardTitle>
            <CardDescription>현재 진행 중 우선, 이후 종료일 기준 최신순</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {experiences.length === 0 ? (
              <div className="py-12 text-center text-neutral-slate-500">등록된 경험이 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>타입</TableHead>
                      <TableHead>직책/역할</TableHead>
                      <TableHead>조직</TableHead>
                      <TableHead>기간</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead>연결 프로젝트</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {experiences.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>
                          <Badge className={cn("border", getExperienceTypeTheme(exp.type).badgeClassName)}>
                            {getExperienceTypeLabel(exp.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-neutral-slate-800">{exp.title}</TableCell>
                        <TableCell className="text-neutral-slate-700">{exp.organization}</TableCell>
                        <TableCell className="text-sm text-neutral-slate-600">
                          {formatExperiencePeriod(exp.startDate, exp.endDate)}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-neutral-slate-600">{exp.description || "-"}</TableCell>
                        <TableCell className="max-w-sm">
                          {(exp.linkedProjects || []).length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {(exp.linkedProjects || []).map((project) => (
                                <Badge key={project.id} variant="outline" className="border-brand-blue-200 bg-brand-blue-50 text-brand-blue-700">
                                  {project.title}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(exp)}>
                              수정
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(exp.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              삭제
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
    </AdminShell>
  )
}
