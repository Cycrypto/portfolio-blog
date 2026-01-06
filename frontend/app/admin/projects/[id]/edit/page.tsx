"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Save, Eye, Upload, X, Plus, LinkIcon, Github } from "lucide-react"
import Link from "next/link"
import { getProject, updateProject } from "@/lib/api"
import { Project } from "@/lib/types/api"

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
  const [progress, setProgress] = useState([0])
  const [techStack, setTechStack] = useState<string[]>([])
  const [newTech, setNewTech] = useState("")
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [liveUrl, setLiveUrl] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [newImage, setNewImage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setProgress([data.progress || 0])
        setTechStack(data.techStack || [])
        setFeatures(data.features || [])
        setStartDate(data.startDate || "")
        setEndDate(data.endDate || "")
        setGithubUrl(data.githubUrl || "")
        setLiveUrl(data.liveUrl || "")
        setImages(data.images || [])
      } catch (err) {
        setError('프로젝트를 불러오는 데 실패했습니다.')
      }
    }
    if (id) load()
  }, [id])

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

  const addImage = () => {
    if (newImage.trim() && !images.includes(newImage.trim())) {
      setImages([...images, newImage.trim()])
      setNewImage("")
    }
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
        description: description.trim(),
        longDescription: longDescription.trim(),
        category,
        status,
        progress: progress[0],
        techStack,
        features,
        startDate,
        endDate,
        githubUrl,
        liveUrl,
        images,
      })
      router.push('/admin/projects')
    } catch (err) {
      setError('프로젝트 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">프로젝트를 불러오는 중...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">관리자 대쉬보드</h2>
          </div>
          <nav className="mt-6">
            <Link href="/admin" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
              <Eye className="w-5 h-5 mr-3" />
              대쉬보드
            </Link>
            <Link
              href="/admin/projects"
              className="flex items-center px-6 py-3 text-brand-blue-600 bg-brand-blue-50 border-r-2 border-blue-600"
            >
              <Eye className="w-5 h-5 mr-3" />
              프로젝트
            </Link>
          </nav>
        </div>

        <div className="flex-1 p-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/projects">
                <ArrowLeft className="w-4 h-4 mr-2" />
                프로젝트 목록으로
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">프로젝트 수정</h1>
              <p className="text-gray-600 mt-2">프로젝트 정보를 수정하세요</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 메인 정보 */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                  <CardDescription>프로젝트의 기본 정보를 입력하세요</CardDescription>
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
                  </div>

                  <div>
                    <Label htmlFor="description">간단한 설명</Label>
                    <Textarea
                      id="description"
                      placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="long-description">상세 설명</Label>
                    <Textarea
                      id="long-description"
                      placeholder="프로젝트에 대한 상세한 설명을 마크다운으로 작성하세요"
                      value={longDescription}
                      onChange={(e) => setLongDescription(e.target.value)}
                      rows={10}
                      className="font-mono"
                    />
                  </div>
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
                      onKeyPress={(e) => e.key === "Enter" && addTech()}
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
                      onKeyPress={(e) => e.key === "Enter" && addFeature()}
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
                  <CardDescription>프로젝트 이미지를 추가하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="이미지 URL"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addImage()}
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
                      ref={fileInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setIsLoading(true)
                          const url = await uploadMedia(file)
                          setImages((prev) => [...prev, url])
                        } catch (err) {
                          setError('이미지 업로드에 실패했습니다.')
                        } finally {
                          setIsLoading(false)
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                      <Upload className="w-4 h-4 mr-2" />
                      {isLoading ? '업로드 중...' : '이미지 업로드'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((img) => (
                      <div key={img} className="relative border rounded">
                        <img src={img || '/placeholder.svg'} alt="프로젝트 이미지" className="w-full h-32 object-cover" />
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
                    <Label>진행률: {progress[0]}%</Label>
                    <Slider value={progress} onValueChange={setProgress} max={100} step={5} className="mt-2" />
                  </div>

                  <Separator />

                  {error && <div className="text-sm text-red-500">{error}</div>}

                  <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? '저장 중...' : '프로젝트 수정'}
                  </Button>
                </CardContent>
              </Card>

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

              <Card>
                <CardHeader>
                  <CardTitle>프로젝트 링크</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="github">GitHub</Label>
                    <div className="relative">
                      <Github className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <Input
                        id="github"
                        className="pl-10"
                        placeholder="https://github.com/..."
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="live">라이브 링크</Label>
                    <div className="relative">
                      <LinkIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <Input
                        id="live"
                        className="pl-10"
                        placeholder="https://example.com"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
