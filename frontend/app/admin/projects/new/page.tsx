"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Upload, X, Plus, LinkIcon, Github } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createProject, getAllAdminPosts, getExperiences, uploadMedia } from "@/lib/api"
import { AdminShell } from "@/components/admin/AdminShell"
import { normalizeImageUrl } from "@/lib/utils/image"
import { generateSlug } from "@/lib/utils/slug"
import { Experience, Post } from "@/lib/types/api"
import { formatExperiencePeriod } from "@/lib/experience/utils"

export default function NewProject() {
  const router = useRouter()
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const slugPreview = useMemo(() => generateSlug(title), [title])

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
      setError("프로젝트명을 입력하세요.")
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await createProject({
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
      router.push('/admin/projects')
    } catch (err) {
      setError('프로젝트 저장에 실패했습니다.')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredPosts = adminPosts
    .filter((post) => post.title.toLowerCase().includes(postSearch.toLowerCase()))
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())

  return (
    <AdminShell
      active="projects"
      title="새 프로젝트 추가"
      description="새로운 포트폴리오 프로젝트를 추가하세요"
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            프로젝트 목록으로
          </Link>
        </Button>
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
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">프로젝트명</Label>
                    <Input
                      id="title"
                      placeholder="프로젝트 이름을 입력하세요"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg"
                    />
                    {slugPreview ? (
                      <p className="mt-2 text-xs text-neutral-slate-500">
                        공개 URL: <code>{`/projects/${slugPreview}`}</code>
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="description">짧은 소개 (선택)</Label>
                    <Textarea
                      id="description"
                      placeholder="비워두면 연결된 글 제목이 프로젝트 맥락을 대신합니다"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="long-description">추가 메모 (선택)</Label>
                    <Textarea
                      id="long-description"
                      placeholder="상세 설명을 길게 적지 않아도 됩니다. 필요할 때만 보조 메모를 남기세요"
                      value={longDescription}
                      onChange={(e) => setLongDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>케이스 스터디</CardTitle>
                  <CardDescription>랜딩, 상세 페이지, 이력서 PDF에서 재사용됩니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="role">내 역할</Label>
                    <Textarea
                      id="role"
                      placeholder="예: 백엔드 설계 및 인증/배포 전담"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="problem">문제 정의</Label>
                    <Textarea
                      id="problem"
                      placeholder="어떤 문제를 해결하려는 프로젝트였는지 적어주세요"
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="approach">접근 방식</Label>
                    <Textarea
                      id="approach"
                      placeholder="설계 판단, 핵심 구현, 기술 선택 이유를 정리하세요"
                      value={approach}
                      onChange={(e) => setApproach(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="outcomes">결과 및 회고</Label>
                    <Textarea
                      id="outcomes"
                      placeholder="결과, 개선 효과, 회고를 정리하세요"
                      value={outcomes}
                      onChange={(e) => setOutcomes(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>성과 지표</Label>
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
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>이력서용 내용</CardTitle>
                  <CardDescription>PDF 이력서에 보여줄 요약 내용을 편집합니다</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resume-title">이력서용 프로젝트 제목</Label>
                    <Input
                      id="resume-title"
                      placeholder="기본 프로젝트명을 그대로 쓰려면 비워두세요"
                      value={resumeTitle}
                      onChange={(e) => setResumeTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resume-summary">이력서용 요약</Label>
                    <Textarea
                      id="resume-summary"
                      placeholder="이 프로젝트를 이력서에서 어떻게 소개할지 작성하세요"
                      rows={4}
                      value={resumeSummary}
                      onChange={(e) => setResumeSummary(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>이력서 하이라이트</Label>
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
                    <div className="flex flex-wrap gap-2">
                      {resumeHighlights.map((highlight) => (
                        <Badge key={highlight} variant="secondary" className="flex items-center gap-1">
                          {highlight}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeResumeHighlight(highlight)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
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
                        const assignedToOtherProject = Boolean(post.projectId)
                        const checked = linkedPostIds.includes(post.id)
                        const disabled = assignedToOtherProject && !checked

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
                              {assignedToOtherProject ? (
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
                      placeholder="주요 기능 입력"
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
                  <div className="space-y-2">
                    {features.map((feature, index) => (
                      <div key={feature} className="flex items-center justify-between p-2 border rounded">
                        <span>
                          {index + 1}. {feature}
                        </span>
                        <X className="w-4 h-4 cursor-pointer text-destructive" onClick={() => removeFeature(feature)} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 사이드바 설정 */}
            <div className="space-y-6">
              {/* 프로젝트 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 상태</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">상태</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">계획</SelectItem>
                        <SelectItem value="in-progress">진행중</SelectItem>
                        <SelectItem value="active">활성</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">카테고리</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
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
                  </div>

                  <div>
                    <Label htmlFor="experience">연결 경험</Label>
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
                    <p className="mt-2 text-xs text-neutral-slate-500">프로젝트는 하나의 경험에만 연결됩니다.</p>
                  </div>

                  <div>
                    <Label>진행률: {progress[0]}%</Label>
                    <Slider value={progress} onValueChange={setProgress} max={100} step={5} className="mt-2" />
                  </div>

                  <div className="rounded-lg border border-brand-blue-100 bg-brand-blue-50/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="featured-project">대표 프로젝트 노출</Label>
                        <p className="mt-1 text-xs text-neutral-slate-500">랜딩과 이력서 PDF에 우선 사용됩니다</p>
                      </div>
                      <Switch id="featured-project" checked={isFeatured} onCheckedChange={setIsFeatured} />
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="featured-order">대표 노출 순서</Label>
                      <Input
                        id="featured-order"
                        type="number"
                        min={0}
                        value={featuredOrder}
                        onChange={(e) => setFeaturedOrder(Number(e.target.value) || 0)}
                        disabled={!isFeatured}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Separator />

                  {error && <div className="text-sm text-destructive">{error}</div>}

                  <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? '저장 중...' : '프로젝트 저장'}
                  </Button>
                </CardContent>
              </Card>

              {/* 프로젝트 기간 */}
              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 기간</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="start-date">시작일</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">종료일</Label>
                    <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* 링크 */}
              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 링크</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="github-url">GitHub URL</Label>
                    <div className="flex gap-2">
                      <Github className="w-5 h-5 text-neutral-slate-500 mt-2" />
                      <Input
                        id="github-url"
                        placeholder="https://github.com/username/repo"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="live-url">라이브 URL</Label>
                    <div className="flex gap-2">
                      <LinkIcon className="w-5 h-5 text-neutral-slate-500 mt-2" />
                      <Input
                        id="live-url"
                        placeholder="https://your-project.com"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 프로젝트 이미지 */}
              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 이미지</CardTitle>
                  <CardDescription>이미지는 선택 사항입니다. 없으면 표시하지 않습니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="이미지 URL 입력"
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
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
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
                      className="w-full bg-transparent"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isSaving ? '업로드 중...' : '이미지 업로드'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {images
                      .map((image) => normalizeImageUrl(image))
                      .filter((image): image is string => Boolean(image))
                      .map((image, index) => (
                        <div key={image} className="relative border rounded-lg p-2">
                          <img
                            src={image}
                            alt={`프로젝트 이미지 ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-1 right-1 bg-transparent"
                            onClick={() => removeImage(image)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
    </AdminShell>
  )
}
