"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { CharacterCount } from "@/components/admin/CharacterCount"
import { ResumePreviewButton } from "@/components/admin/ResumePreviewButton"
import { AdminShell } from "@/components/admin/AdminShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { createExperience, deleteExperience, getExperiences, getProjects, updateExperience } from "@/lib/api"
import {
  EXPERIENCE_TYPE_OPTIONS,
  compareExperiences,
  formatExperiencePeriod,
  getExperienceTypeLabel,
  getExperienceTypeTheme,
} from "@/lib/experience/utils"
import { normalizeResumeStringArray } from "@/lib/portfolio/resume-content"
import { RESUME_MAX_EXPERIENCE_HIGHLIGHTS } from "@/lib/resume/constants"
import { dispatchResumePreviewRefresh } from "@/lib/resume/preview-events"
import { CreateExperienceRequest, Experience, ExperienceType, Project } from "@/lib/types/api"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const EMPTY_FORM: CreateExperienceRequest = {
  type: "career",
  title: "",
  organization: "",
  startDate: "",
  endDate: "",
  description: "",
  resumeVisible: true,
  resumeOrder: 0,
  resumeHighlights: [],
  linkedProjectIds: [],
}

function sortExperienceRows(experiences: Experience[]) {
  return [...experiences].sort((left, right) => {
    if ((left.resumeOrder || 0) !== (right.resumeOrder || 0)) {
      return (left.resumeOrder || 0) - (right.resumeOrder || 0)
    }

    return compareExperiences(left, right)
  })
}

export default function AdminExperience() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateExperienceRequest>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [projectSearch, setProjectSearch] = useState("")
  const [newResumeHighlight, setNewResumeHighlight] = useState("")
  const { toast } = useToast()

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setProjectSearch("")
    setNewResumeHighlight("")
  }

  const load = async () => {
    try {
      const data = await getExperiences()
      setExperiences(sortExperienceRows(data))
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
    if (!form.title?.trim() || !form.organization?.trim() || !form.startDate?.trim()) {
      toast({ title: "필수 입력 누락", description: "직책, 조직명, 시작일을 입력하세요.", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      const payload: CreateExperienceRequest = {
        ...form,
        title: form.title.trim(),
        organization: form.organization.trim(),
        startDate: form.startDate.trim(),
        endDate: form.endDate?.trim() || "",
        description: form.description?.trim() || "",
        resumeOrder: Math.max(0, Number(form.resumeOrder || 0)),
        resumeHighlights: normalizeResumeStringArray(
          form.resumeHighlights || [],
          RESUME_MAX_EXPERIENCE_HIGHLIGHTS,
        ),
      }

      if (editingId) {
        await updateExperience(editingId.toString(), payload)
        toast({ title: "수정 완료", description: "경험이 수정되었습니다." })
      } else {
        await createExperience(payload)
        toast({ title: "등록 완료", description: "경험이 추가되었습니다." })
      }
      resetForm()
      await Promise.all([load(), loadProjects()])
      dispatchResumePreviewRefresh()
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
      resumeVisible: exp.resumeVisible !== false,
      resumeOrder: exp.resumeOrder || 0,
      resumeHighlights: exp.resumeHighlights || [],
      linkedProjectIds: (exp.linkedProjects || []).map((project) => project.id),
    })
    setProjectSearch("")
    setNewResumeHighlight("")
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

  const addResumeHighlight = () => {
    const trimmed = newResumeHighlight.trim()
    if (!trimmed) return

    setForm((current) => ({
      ...current,
      resumeHighlights: normalizeResumeStringArray(
        [...(current.resumeHighlights || []), trimmed],
        RESUME_MAX_EXPERIENCE_HIGHLIGHTS,
      ),
    }))
    setNewResumeHighlight("")
  }

  const removeResumeHighlight = (highlightToRemove: string) => {
    setForm((current) => ({
      ...current,
      resumeHighlights: (current.resumeHighlights || []).filter((highlight) => highlight !== highlightToRemove),
    }))
  }

  const linkedProjectIds = form.linkedProjectIds || []
  const canAddMoreHighlights = (form.resumeHighlights || []).length < RESUME_MAX_EXPERIENCE_HIGHLIGHTS
  const filteredProjects = useMemo(() => {
    return [...projects]
      .filter((project) => project.title.toLowerCase().includes(projectSearch.toLowerCase()))
      .sort((left, right) => {
        const rightDate = new Date(right.endDate || right.startDate || 0).getTime()
        const leftDate = new Date(left.endDate || left.startDate || 0).getTime()

        if (leftDate !== rightDate) {
          return rightDate - leftDate
        }

        return right.id - left.id
      })
  }, [projectSearch, projects])

  return (
    <AdminShell
      active="experience"
      title="경험 관리"
      description="타임라인과 PDF에 노출될 경험 정보를 관리합니다"
      actions={<ResumePreviewButton />}
    >
      <div className="space-y-6">
        <Card className="surface-default shadow-none">
          <CardHeader className="border-b border-brand-blue-100">
            <CardTitle className="text-xl text-neutral-slate-800">{editingId ? "경험 수정" : "새 경험 추가"}</CardTitle>
            <CardDescription>경력, 팀 프로젝트, 동아리를 하나의 경험 모델로 관리하고 PDF 노출 순서를 직접 제어합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
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
                <CharacterCount value={form.title} />
              </div>
              <div>
                <Label htmlFor="organization">조직/회사/팀명</Label>
                <Input
                  id="organization"
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                />
                <CharacterCount value={form.organization} />
              </div>
              <div>
                <Label htmlFor="start">시작일 (YYYY-MM 또는 YYYY-MM-DD)</Label>
                <Input id="start" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="end">종료일 (재직 중이면 비워두세요)</Label>
                <Input id="end" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="resume-order">PDF 노출 순서</Label>
                <Input
                  id="resume-order"
                  type="number"
                  min={0}
                  value={String(form.resumeOrder ?? 0)}
                  onChange={(e) => setForm({ ...form, resumeOrder: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-brand-blue-100 bg-brand-blue-50/40 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-neutral-slate-800">PDF 노출</p>
                <p className="text-xs text-neutral-slate-500">끄면 이 경험은 타임라인에는 남고 이력서 PDF에서는 제외됩니다.</p>
              </div>
              <Switch
                checked={form.resumeVisible !== false}
                onCheckedChange={(checked) => setForm({ ...form, resumeVisible: checked })}
              />
            </div>

            <div>
              <Label htmlFor="desc">설명 원문</Label>
              <Textarea
                id="desc"
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <CharacterCount value={form.description} helper="사이트/원문 설명" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-brand-blue-100 bg-brand-blue-50/40 px-4 py-3">
                <div>
                  <Label htmlFor="resume-highlight-input" className="text-sm font-semibold text-neutral-slate-800">
                    PDF 하이라이트
                  </Label>
                  <p className="mt-1 text-xs text-neutral-slate-500">PDF에는 최대 2개의 짧은 bullet만 사용됩니다.</p>
                </div>
                <Badge variant={canAddMoreHighlights ? "outline" : "destructive"}>
                  {(form.resumeHighlights || []).length}/{RESUME_MAX_EXPERIENCE_HIGHLIGHTS}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Input
                  id="resume-highlight-input"
                  placeholder="예: 제약 기반 재계획 로직 설계"
                  value={newResumeHighlight}
                  onChange={(e) => setNewResumeHighlight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addResumeHighlight()
                    }
                  }}
                />
                <Button onClick={addResumeHighlight} disabled={!canAddMoreHighlights || !newResumeHighlight.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  추가
                </Button>
              </div>
              <CharacterCount value={newResumeHighlight} helper="입력 중 bullet" />

              <div className="space-y-2">
                {(form.resumeHighlights || []).length === 0 ? (
                  <div className="rounded-md border border-dashed border-neutral-slate-300 px-3 py-6 text-center text-sm text-neutral-slate-500">
                    등록된 PDF bullet이 없습니다.
                  </div>
                ) : (
                  (form.resumeHighlights || []).map((highlight) => (
                    <div
                      key={highlight}
                      className="flex items-start justify-between gap-3 rounded-lg border border-brand-blue-100 bg-white px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-slate-800">{highlight}</p>
                        <CharacterCount value={highlight} />
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeResumeHighlight(highlight)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
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
              {editingId ? (
                <Button variant="outline" onClick={resetForm}>
                  취소
                </Button>
              ) : null}
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
            <CardDescription>PDF 노출 순서 기준, 동률일 때 최신 경험을 우선 정렬합니다.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {experiences.length === 0 ? (
              <div className="py-12 text-center text-neutral-slate-500">등록된 경험이 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[1320px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] whitespace-nowrap">타입</TableHead>
                      <TableHead className="w-[80px] whitespace-nowrap">PDF</TableHead>
                      <TableHead className="w-[90px] whitespace-nowrap">순서</TableHead>
                      <TableHead className="w-[220px] whitespace-nowrap">직책/역할</TableHead>
                      <TableHead className="w-[220px] whitespace-nowrap">조직</TableHead>
                      <TableHead className="w-[170px] whitespace-nowrap">기간</TableHead>
                      <TableHead className="w-[240px] whitespace-nowrap">PDF bullet</TableHead>
                      <TableHead className="min-w-[260px]">설명</TableHead>
                      <TableHead className="w-[150px] whitespace-nowrap">연결 프로젝트</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {experiences.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>
                          <Badge
                            className={cn(
                              "min-w-[88px] justify-center whitespace-nowrap px-3 py-1 text-[13px] leading-none",
                              "border",
                              getExperienceTypeTheme(exp.type).badgeClassName,
                            )}
                          >
                            {getExperienceTypeLabel(exp.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={exp.resumeVisible !== false ? "outline" : "secondary"}>
                            {exp.resumeVisible !== false ? "노출" : "숨김"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-neutral-slate-700">
                          {exp.resumeOrder || 0}
                        </TableCell>
                        <TableCell className="font-semibold text-neutral-slate-800">{exp.title}</TableCell>
                        <TableCell className="text-neutral-slate-700">{exp.organization}</TableCell>
                        <TableCell className="text-sm text-neutral-slate-600">
                          {formatExperiencePeriod(exp.startDate, exp.endDate)}
                        </TableCell>
                        <TableCell className="text-sm text-neutral-slate-600">
                          {(exp.resumeHighlights || []).length > 0 ? (
                            <div className="space-y-1">
                              {(exp.resumeHighlights || []).map((highlight) => (
                                <p key={highlight} className="truncate">
                                  - {highlight}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-neutral-slate-600">{exp.description || "-"}</TableCell>
                        <TableCell>
                          {(exp.linkedProjects || []).length > 0 ? (
                            <Badge
                              variant="outline"
                              className="min-w-[56px] justify-center whitespace-nowrap border-brand-blue-200 bg-brand-blue-50 px-2.5 py-1 text-[13px] leading-none text-brand-blue-700"
                            >
                              {(exp.linkedProjects || []).length}개
                            </Badge>
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
