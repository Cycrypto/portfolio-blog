"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Check, Save, Search, Trash2 } from "lucide-react"

import { getProjects, getResumeSettings, updateResumeSettings } from "@/lib/api"
import type { Project, ResumeSettings } from "@/lib/types/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const MAX_SELECTED_PROJECTS = 3

function normalizeSettings(settings: ResumeSettings): ResumeSettings {
  return {
    ...settings,
    selectedProjectIds: Array.isArray(settings.selectedProjectIds)
      ? settings.selectedProjectIds
      : [],
  }
}

export function ResumeSettingsEditor() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [settings, setSettings] = useState<ResumeSettings | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [resumeSettings, projects] = await Promise.all([
          getResumeSettings(),
          getProjects(),
        ])
        setSettings(normalizeSettings(resumeSettings))
        setAllProjects(projects)
      } catch (loadError) {
        console.error(loadError)
        setError("이력서 설정을 불러오지 못했습니다.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const projectById = useMemo(() => {
    return new Map(allProjects.map((project) => [project.id, project]))
  }, [allProjects])

  const selectedProjects = useMemo(() => {
    if (!settings) {
      return []
    }

    return settings.selectedProjectIds
      .map((projectId) => projectById.get(projectId))
      .filter((project): project is Project => Boolean(project))
  }, [projectById, settings])

  const filteredProjects = useMemo(() => {
    const selectedSet = new Set(settings?.selectedProjectIds ?? [])
    const keyword = query.trim().toLowerCase()
    return allProjects
      .filter((project) => !selectedSet.has(project.id))
      .filter((project) => {
        if (!keyword) {
          return true
        }
        const haystack = [
          project.title,
          project.category,
          ...(project.techStack || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return haystack.includes(keyword)
      })
      .sort((a, b) => b.id - a.id)
  }, [allProjects, query, settings?.selectedProjectIds])

  const selectedCount = settings?.selectedProjectIds.length ?? 0
  const canSelectMore = selectedCount < MAX_SELECTED_PROJECTS

  const updateField = <K extends keyof ResumeSettings>(
    field: K,
    value: ResumeSettings[K],
  ) => {
    setSettings((current) => {
      if (!current) {
        return current
      }
      return { ...current, [field]: value }
    })
  }

  const addProject = (projectId: number) => {
    if (!canSelectMore) {
      toast({
        title: "최대 선택 수 초과",
        description: `프로젝트는 최대 ${MAX_SELECTED_PROJECTS}개까지 선택할 수 있습니다.`,
        variant: "destructive",
      })
      return
    }

    setSettings((current) => {
      if (!current || current.selectedProjectIds.includes(projectId)) {
        return current
      }
      return {
        ...current,
        selectedProjectIds: [...current.selectedProjectIds, projectId],
      }
    })
  }

  const removeProject = (projectId: number) => {
    setSettings((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        selectedProjectIds: current.selectedProjectIds.filter((id) => id !== projectId),
      }
    })
  }

  const moveProject = (projectId: number, direction: "up" | "down") => {
    setSettings((current) => {
      if (!current) {
        return current
      }

      const currentIndex = current.selectedProjectIds.findIndex((id) => id === projectId)
      if (currentIndex < 0) {
        return current
      }

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= current.selectedProjectIds.length) {
        return current
      }

      const nextIds = [...current.selectedProjectIds]
      const [movedId] = nextIds.splice(currentIndex, 1)
      nextIds.splice(targetIndex, 0, movedId)

      return {
        ...current,
        selectedProjectIds: nextIds,
      }
    })
  }

  const handleSave = async () => {
    if (!settings) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const saved = await updateResumeSettings({
        name: settings.name,
        title: settings.title,
        headline: settings.headline,
        email: settings.email,
        location: settings.location,
        github: settings.github,
        linkedin: settings.linkedin,
        photoUrl: settings.photoUrl,
        showPhoto: settings.showPhoto,
        selectedProjectIds: settings.selectedProjectIds,
      })

      setSettings(normalizeSettings(saved))
      toast({
        title: "저장 완료",
        description: "이력서 설정을 저장했습니다.",
      })
    } catch (saveError) {
      console.error(saveError)
      setError("저장 중 오류가 발생했습니다.")
      toast({
        title: "저장 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="surface-default shadow-none">
        <CardContent className="py-16 text-center text-neutral-slate-500">
          이력서 설정을 불러오는 중...
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card className="surface-default shadow-none">
        <CardContent className="py-16 text-center text-red-500">
          {error || "이력서 설정 데이터를 읽지 못했습니다."}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2 space-y-6">
        <Card className="surface-default shadow-none">
          <CardHeader>
            <CardTitle>PDF 헤더 정보</CardTitle>
            <CardDescription>이력서 상단에 표시되는 텍스트를 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resume-name">이름</Label>
                <Input
                  id="resume-name"
                  value={settings.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume-title">직무 타이틀</Label>
                <Input
                  id="resume-title"
                  value={settings.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="백엔드 개발자"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-headline">헤드라인</Label>
              <Textarea
                id="resume-headline"
                value={settings.headline}
                onChange={(event) => updateField("headline", event.target.value)}
                rows={4}
                placeholder="짧은 소개 문구를 입력하세요"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resume-email">이메일</Label>
                <Input
                  id="resume-email"
                  value={settings.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume-location">위치</Label>
                <Input
                  id="resume-location"
                  value={settings.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  placeholder="서울, 대한민국"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume-github">GitHub</Label>
                <Input
                  id="resume-github"
                  value={settings.github}
                  onChange={(event) => updateField("github", event.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume-linkedin">LinkedIn</Label>
                <Input
                  id="resume-linkedin"
                  value={settings.linkedin}
                  onChange={(event) => updateField("linkedin", event.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-default shadow-none">
          <CardHeader>
            <CardTitle>사진 블록</CardTitle>
            <CardDescription>헤더 텍스트와 분리된 사진 영역 표시 여부를 설정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-brand-blue-100 bg-brand-blue-50/40 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-neutral-slate-800">사진 표시</p>
                <p className="text-xs text-neutral-slate-500">끄면 PDF에서 사진 블록을 숨깁니다.</p>
              </div>
              <Switch
                checked={settings.showPhoto}
                onCheckedChange={(checked) => updateField("showPhoto", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-photo">사진 URL</Label>
              <Input
                id="resume-photo"
                value={settings.photoUrl}
                onChange={(event) => updateField("photoUrl", event.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="surface-default shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>선택 프로젝트</CardTitle>
                <CardDescription>PDF에 넣을 프로젝트를 선택하고 순서를 조정하세요.</CardDescription>
              </div>
              <Badge variant={canSelectMore ? "outline" : "destructive"}>
                {selectedCount}/{MAX_SELECTED_PROJECTS}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedProjects.length === 0 ? (
              <div className="rounded-md border border-dashed border-neutral-slate-300 px-3 py-6 text-center text-sm text-neutral-slate-500">
                선택된 프로젝트가 없습니다.
              </div>
            ) : (
              selectedProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="rounded-lg border border-brand-blue-100 bg-white px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-slate-800">
                        {index + 1}. {project.title}
                      </p>
                      <p className="mt-1 text-xs text-neutral-slate-500">
                        {project.category || "분류 없음"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveProject(project.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveProject(project.id, "down")}
                      disabled={index === selectedProjects.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="surface-default shadow-none">
          <CardHeader>
            <CardTitle>프로젝트 선택기</CardTitle>
            <CardDescription>검색으로 필요한 프로젝트를 추가합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="제목, 카테고리, 기술 스택 검색"
                className="pl-9"
              />
            </div>
            <Separator />
            <ScrollArea className="h-[340px]">
              <div className="space-y-2 pr-3">
                {filteredProjects.length === 0 ? (
                  <div className="text-sm text-neutral-slate-500">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg border border-neutral-slate-200 bg-white p-3"
                    >
                      <p className="text-sm font-semibold text-neutral-slate-800">
                        {project.title}
                      </p>
                      <p className="mt-1 text-xs text-neutral-slate-500">
                        {project.category || "분류 없음"}
                      </p>
                      <Button
                        className="mt-2 h-8 w-full"
                        variant="outline"
                        onClick={() => addProject(project.id)}
                        disabled={!canSelectMore}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        선택
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="surface-default shadow-none">
          <CardContent className="pt-6">
            {error ? (
              <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}
            <Button
              className="w-full bg-brand-blue-600 text-white hover:bg-brand-blue-700"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "저장 중..." : "이력서 설정 저장"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
