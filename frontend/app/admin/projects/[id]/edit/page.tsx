"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Upload, X, Plus, LinkIcon, Github } from "lucide-react"
import Link from "next/link"
import { getAllAdminPosts, getExperiences, getProject, updateProject, uploadMedia } from "@/lib/api"
import { Experience, Post, Project } from "@/lib/types/api"
import { AdminShell } from "@/components/admin/AdminShell"
import { CharacterCount } from "@/components/admin/CharacterCount"
import { ResumePreviewButton } from "@/components/admin/ResumePreviewButton"
import { normalizeImageUrl } from "@/lib/utils/image"
import { generateSlug } from "@/lib/utils/slug"
import { formatExperiencePeriod } from "@/lib/experience/utils"
import { dispatchResumePreviewRefresh } from "@/lib/resume/preview-events"

export default function EditProject() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [longDescription, setLongDescription] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("planned")
  const [isFeatured, setIsFeatured] = useState(false)
  const [featuredOrder, setFeaturedOrder] = useState(0)
  const [progress, setProgress] = useState([0])
  const [techStack, setTechStack] = useState<string[]>([])
  const [newTech, setNewTech] = useState("")
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")
  const [role, setRole] = useState("")
  const [problem, setProblem] = useState("")
  const [approach, setApproach] = useState("")
  const [outcomes, setOutcomes] = useState("")
  const [impactMetrics, setImpactMetrics] = useState<string[]>([])
  const [newMetric, setNewMetric] = useState("")
  const [resumeTitle, setResumeTitle] = useState("")
  const [resumeSummary, setResumeSummary] = useState("")
  const [resumeHighlights, setResumeHighlights] = useState<string[]>([])
  const [newResumeHighlight, setNewResumeHighlight] = useState("")
  const [linkedPostIds, setLinkedPostIds] = useState<number[]>([])
  const [adminPosts, setAdminPosts] = useState<Post[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [postSearch, setPostSearch] = useState("")
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [experienceId, setExperienceId] = useState("none")
  const [githubUrl, setGithubUrl] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [newImage, setNewImage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imageInputId = "project-image-upload"
  const slugPreview = useMemo(
    () => project?.slug || generateSlug(title),
    [project?.slug, title],
  )

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProject(id)
        setProject(data)
        setTitle(data.title)
        setDescription(data.description || "")
        setLongDescription(data.longDescription || "")
        setCategory(data.category || "")
        setStatus(data.status || "planned")
        setIsFeatured(Boolean(data.isFeatured))
        setFeaturedOrder(data.featuredOrder || 0)
        setProgress([data.progress || 0])
        setTechStack(data.techStack || [])
        setFeatures(data.features || [])
        setRole(data.role || "")
        setProblem(data.problem || "")
        setApproach(data.approach || "")
        setOutcomes(data.outcomes || "")
        setImpactMetrics(data.impactMetrics || [])
        setResumeTitle(data.resumeTitle || "")
        setResumeSummary(data.resumeSummary || "")
        setResumeHighlights(data.resumeHighlights || [])
        setStartDate(data.startDate || "")
        setEndDate(data.endDate || "")
        setExperienceId(data.experienceId ? String(data.experienceId) : "none")
        setGithubUrl(data.githubUrl || "")
        setLiveUrl(data.liveUrl || "")
        setLinkedPostIds((data.linkedPosts || []).map((post) => post.id))
        setImages((data.images || []).map((image) => normalizeImageUrl(image)).filter((image): image is string => Boolean(image)))
      } catch (err) {
        setError('프로젝트를 불러오는 데 실패했습니다.')
      }
    }
    if (id) load()
  }, [id])

  useEffect(() => {
    const loadExperiences = async () => {
      try {
        setIsLoadingExperiences(true)
        const result = await getExperiences()
        setExperiences(result)
      } catch (loadError) {
        console.error(loadError)
        setError("연결 가능한 경험을 불러오지 못했습니다.")
      } finally {
        setIsLoadingExperiences(false)
      }
    }

    void loadExperiences()
  }, [])

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoadingPosts(true)
        const result = await getAllAdminPosts()
        setAdminPosts(result.posts || [])
      } catch (loadError) {
        console.error(loadError)
        setError("연결 가능한 블로그 글을 불러오지 못했습니다.")
      } finally {
        setIsLoadingPosts(false)
      }
    }

    void loadPosts()
  }, [])

  const addTech = () => {
    if (newTech.trim() && !techStack.includes(newTech.trim())) {
      setTechStack([...techStack, newTech.trim()])
      setNewTech("")
    }
  }

  const removeTech = (techToRemove: string) => {
    setTechStack(techStack.filter((tech) => tech !== techToRemove))
  }

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature("")
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setFeatures(features.filter((feature) => feature !== featureToRemove))
  }

  const addMetric = () => {
    const trimmed = newMetric.trim()
    if (!trimmed || impactMetrics.includes(trimmed)) return
    setImpactMetrics([...impactMetrics, trimmed])
    setNewMetric("")
  }

  const addResumeHighlight = () => {
    const trimmed = newResumeHighlight.trim()
    if (!trimmed || resumeHighlights.includes(trimmed)) return
    setResumeHighlights([...resumeHighlights, trimmed])
    setNewResumeHighlight("")
  }

  const removeResumeHighlight = (highlightToRemove: string) => {
    setResumeHighlights(
      resumeHighlights.filter((highlight) => highlight !== highlightToRemove),
    )
  }

  const toggleLinkedPost = (postId: number) => {
    setLinkedPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((selectedId) => selectedId !== postId)
        : [...prev, postId],
    )
  }

  const removeMetric = (metricToRemove: string) => {
    setImpactMetrics(impactMetrics.filter((metric) => metric !== metricToRemove))
  }

  const addImage = () => {
    const normalized = normalizeImageUrl(newImage)
    if (!normalized || images.includes(normalized)) return
    setImages([...images, normalized])
    setNewImage("")
  }

  const removeImage = (imageToRemove: string) => {
    setImages(images.filter((image) => image !== imageToRemove))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('프로젝트명을 입력하세요.')
      return
    }
    try {
      setIsSaving(true)
      setError(null)
      await updateProject(id, {
        title: title.trim(),
        slug: slugPreview,
        description: description.trim(),
        longDescription: longDescription.trim(),
        category,
        status,
        isFeatured,
        featuredOrder: isFeatured ? featuredOrder : 0,
        progress: progress[0],
        techStack,
        features,
        role: role.trim(),
        problem: problem.trim(),
        approach: approach.trim(),
        outcomes: outcomes.trim(),
        impactMetrics,
        resumeTitle: resumeTitle.trim(),
        resumeSummary: resumeSummary.trim(),
        resumeHighlights,
        startDate,
        endDate,
        experienceId: experienceId === "none" ? null : Number(experienceId),
        githubUrl,
        liveUrl,
        images: images.map((image) => normalizeImageUrl(image)).filter((image): image is string => Boolean(image)),
        linkedPostIds,
      })
      dispatchResumePreviewRefresh()
      router.push('/admin/projects')
    } catch (err) {
      setError('프로젝트 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-slate-500">프로젝트를 불러오는 중...</div>
  }

  const currentProjectId = Number(id)
  const filteredPosts = adminPosts
    .filter((post) => post.title.toLowerCase().includes(postSearch.toLowerCase()))
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
  const titleError =
    !title.trim() && error === "프로젝트명을 입력하세요."
      ? error
      : undefined
  const formError = error && error !== titleError ? error : null

  return (
    <AdminShell
      active="projects"
      title="프로젝트 수정"
      description="프로젝트 정보를 수정하세요"
      actions={
        <div className="flex gap-2">
          <ResumePreviewButton />
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              프로젝트 목록으로
            </Link>
          </Button>
        </div>
      }
    >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 메인 정보 */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                  <CardDescription>프로젝트명과 짧은 맥락만 먼저 정리하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field invalid={Boolean(titleError)}>
                      <FieldLabel htmlFor="title">프로젝트명</FieldLabel>
                      <Input
                        id="title"
                        placeholder="프로젝트 이름을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg"
                        aria-invalid={Boolean(titleError)}
                      />
                      {slugPreview ? (
                        <FieldDescription>
                          공개 URL: <code>{`/projects/${slugPreview}`}</code>
                        </FieldDescription>
                      ) : null}
                      <FieldError>{titleError}</FieldError>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="description">짧은 소개 (선택)</FieldLabel>
                      <Textarea
                        id="description"
                        placeholder="비워두면 연결된 글 제목이 프로젝트 맥락을 대신합니다"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="long-description">추가 메모 (선택)</FieldLabel>
                      <Textarea
                        id="long-description"
                        placeholder="상세 설명을 길게 적지 않아도 됩니다. 필요할 때만 보조 메모를 남기세요"
                        value={longDescription}
                        onChange={(e) => setLongDescription(e.target.value)}
                        rows={4}
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>케이스 스터디</CardTitle>
                  <CardDescription>랜딩, 상세 페이지, 이력서 PDF에서 재사용됩니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="role">내 역할</FieldLabel>
                      <Textarea
                        id="role"
                        placeholder="예: 백엔드 설계 및 인증/배포 전담"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        rows={3}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="problem">문제 정의</FieldLabel>
                      <Textarea
                        id="problem"
                        placeholder="어떤 문제를 해결하려는 프로젝트였는지 적어주세요"
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        rows={4}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="approach">접근 방식</FieldLabel>
                      <Textarea
                        id="approach"
                        placeholder="설계 판단, 핵심 구현, 기술 선택 이유를 정리하세요"
                        value={approach}
                        onChange={(e) => setApproach(e.target.value)}
                        rows={5}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="outcomes">결과 및 회고</FieldLabel>
                      <Textarea
                        id="outcomes"
                        placeholder="결과, 개선 효과, 회고를 정리하세요"
                        value={outcomes}
                        onChange={(e) => setOutcomes(e.target.value)}
                        rows={4}
                      />
                    </Field>

                    <Field>
                      <FieldLabel>성과 지표</FieldLabel>
                      <FieldDescription>
                        정량 지표나 개선 결과를 한 줄씩 추가하세요.
                      </FieldDescription>
                      <div className="flex gap-2">
                        <Input
                          placeholder="예: 응답 시간을 35% 단축"
                          value={newMetric}
                          onChange={(e) => setNewMetric(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addMetric()
                            }
                          }}
                        />
                        <Button onClick={addMetric} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {impactMetrics.map((metric) => (
                          <Badge key={metric} variant="secondary" className="flex items-center gap-1">
                            {metric}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => removeMetric(metric)} />
                          </Badge>
                        ))}
                      </div>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>이력서용 내용</CardTitle>
                  <CardDescription>PDF 이력서에 보여줄 요약 내용을 편집합니다</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="resume-title">이력서용 프로젝트 제목</FieldLabel>
                      <Input
                        id="resume-title"
                        placeholder="기본 프로젝트명을 그대로 쓰려면 비워두세요"
                        value={resumeTitle}
                        onChange={(e) => setResumeTitle(e.target.value)}
                      />
                      <CharacterCount value={resumeTitle} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="resume-summary">이력서용 요약</FieldLabel>
                      <Textarea
                        id="resume-summary"
                        placeholder="이 프로젝트를 이력서에서 어떻게 소개할지 작성하세요"
                        rows={4}
                        value={resumeSummary}
                        onChange={(e) => setResumeSummary(e.target.value)}
                      />
                      <CharacterCount value={resumeSummary} />
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between gap-3">
                        <FieldLabel>이력서 하이라이트</FieldLabel>
                        <ResumePreviewButton className="h-8" />
                      </div>
                      <FieldDescription>
                        짧은 bullet 형태로 핵심 성과를 정리합니다.
                      </FieldDescription>
                      <div className="flex gap-2">
                        <Input
                          placeholder="예: 결제 실패율 22% 감소"
                          value={newResumeHighlight}
                          onChange={(e) => setNewResumeHighlight(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addResumeHighlight()
                            }
                          }}
                        />
                        <Button onClick={addResumeHighlight} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <CharacterCount value={newResumeHighlight} helper="입력 중 bullet" />
                      <div className="flex flex-wrap gap-2">
                        {resumeHighlights.map((highlight) => (
                          <Badge key={highlight} variant="secondary" className="flex items-center gap-1">
                            {highlight}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => removeResumeHighlight(highlight)} />
                          </Badge>
                        ))}
                      </div>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>연결할 블로그 글</CardTitle>
                  <CardDescription>상세 설명 대신 이 글 제목들이 프로젝트를 설명합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="제목으로 검색"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                  />
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-brand-blue-100 p-3">
                    {isLoadingPosts ? (
                      <p className="text-sm text-neutral-slate-500">블로그 글을 불러오는 중...</p>
                    ) : filteredPosts.length === 0 ? (
                      <p className="text-sm text-neutral-slate-500">조건에 맞는 글이 없습니다.</p>
                    ) : (
                      filteredPosts.map((post) => {
                        const linkedToOtherProject = Boolean(
                          post.projectId && post.projectId !== currentProjectId,
                        )
                        const checked = linkedPostIds.includes(post.id)
                        const disabled = linkedToOtherProject && !checked

                        return (
                          <label
                            key={post.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                              disabled
                                ? "border-neutral-slate-200 bg-neutral-slate-50 text-neutral-slate-400"
                                : "border-brand-blue-100 hover:bg-brand-blue-50/50"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={() => toggleLinkedPost(post.id)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{post.title}</p>
                              <p className="mt-1 text-xs text-neutral-slate-500">
                                {post.category} · {new Date(post.publishDate).toLocaleDateString("ko-KR")}
                              </p>
                              {linkedToOtherProject ? (
                                <p className="mt-1 text-xs text-amber-600">
                                  다른 프로젝트에 연결됨: {post.project?.title || `ID ${post.projectId}`}
                                </p>
                              ) : null}
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                  <p className="text-xs text-neutral-slate-500">
                    선택됨: {linkedPostIds.length}개
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>기술 스택</CardTitle>
                  <CardDescription>프로젝트에 사용된 기술들을 추가하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="기술 스택 입력 (예: React, Node.js)"
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addTech()
                        }
                      }}
                    />
                    <Button onClick={addTech} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                      <Badge key={tech} variant="secondary" className="flex items-center gap-1">
                        {tech}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeTech(tech)} />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>주요 기능</CardTitle>
                  <CardDescription>프로젝트의 주요 기능들을 나열하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="기능 입력"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addFeature()
                        }
                      }}
                    />
                    <Button onClick={addFeature} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeFeature(feature)} />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>이미지</CardTitle>
                  <CardDescription>이미지는 선택 사항입니다. 없으면 표시하지 않습니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="이미지 URL"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addImage()
                        }
                      }}
                    />
                    <Button onClick={addImage} size="sm">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={imageInputId}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setIsSaving(true)
                          const url = await uploadMedia(file)
                          const normalized = normalizeImageUrl(url)
                          if (normalized) {
                            setImages((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]))
                          }
                        } catch (err) {
                          setError('이미지 업로드에 실패했습니다.')
                        } finally {
                          setIsSaving(false)
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(imageInputId)?.click()}
                      disabled={isSaving}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isSaving ? '업로드 중...' : '이미지 업로드'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((img) => (
                      <div key={img} className="relative border rounded">
                        <img src={img} alt="프로젝트 이미지" className="w-full h-32 object-cover" />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeImage(img)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 사이드바 설정 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 상태</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="status">상태</FieldLabel>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="상태 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">계획</SelectItem>
                          <SelectItem value="in-progress">진행중</SelectItem>
                          <SelectItem value="active">활성</SelectItem>
                          <SelectItem value="completed">완료</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="category">카테고리</FieldLabel>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web">웹 애플리케이션</SelectItem>
                          <SelectItem value="mobile">모바일 앱</SelectItem>
                          <SelectItem value="desktop">데스크톱 앱</SelectItem>
                          <SelectItem value="ai">AI/ML</SelectItem>
                          <SelectItem value="blockchain">블록체인</SelectItem>
                          <SelectItem value="game">게임</SelectItem>
                          <SelectItem value="tool">도구/유틸리티</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="experience">연결 경험</FieldLabel>
                      <Select value={experienceId} onValueChange={setExperienceId}>
                        <SelectTrigger id="experience">
                          <SelectValue placeholder={isLoadingExperiences ? "경험 불러오는 중..." : "경험 선택"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">연결 안 함</SelectItem>
                          {experiences.map((experience) => (
                            <SelectItem key={experience.id} value={String(experience.id)}>
                              {experience.title} · {experience.organization} · {formatExperiencePeriod(experience.startDate, experience.endDate)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        프로젝트는 하나의 경험에만 연결됩니다.
                      </FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel>진행률: {progress[0]}%</FieldLabel>
                      <Slider value={progress} onValueChange={setProgress} max={100} step={5} />
                    </Field>

                    <Field className="rounded-lg border border-brand-blue-100 bg-brand-blue-50/60 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <FieldLabel htmlFor="featured-project">대표 프로젝트 노출</FieldLabel>
                          <FieldDescription className="text-xs">
                            랜딩과 이력서 PDF에 우선 사용됩니다
                          </FieldDescription>
                        </div>
                        <Switch id="featured-project" checked={isFeatured} onCheckedChange={setIsFeatured} />
                      </div>
                      <Field disabled={!isFeatured}>
                        <FieldLabel htmlFor="featured-order">대표 노출 순서</FieldLabel>
                        <Input
                          id="featured-order"
                          type="number"
                          min={0}
                          value={featuredOrder}
                          onChange={(e) => setFeaturedOrder(Number(e.target.value) || 0)}
                          disabled={!isFeatured}
                        />
                      </Field>
                    </Field>

                    <Separator />

                    {formError ? (
                      <Alert variant="destructive">
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    ) : null}

                    <Button onClick={handleSave} className="w-full" disabled={isSaving} aria-busy={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? '저장 중...' : '프로젝트 수정'}
                    </Button>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 기간</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="start-date">시작일</FieldLabel>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="end-date">종료일</FieldLabel>
                      <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 링크</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="github">GitHub</FieldLabel>
                      <div className="relative">
                        <Github className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-slate-500" />
                        <Input
                          id="github"
                          className="pl-10"
                          placeholder="https://github.com/..."
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                        />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="live">라이브 링크</FieldLabel>
                      <div className="relative">
                        <LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-neutral-slate-500" />
                        <Input
                          id="live"
                          className="pl-10"
                          placeholder="https://example.com"
                          value={liveUrl}
                          onChange={(e) => setLiveUrl(e.target.value)}
                        />
                      </div>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </div>
          </div>
    </AdminShell>
  )
}
