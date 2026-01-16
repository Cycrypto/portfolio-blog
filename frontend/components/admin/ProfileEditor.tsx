"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Save, Upload, X, Plus, Trash2, Lock } from "lucide-react"
import { profileService, ProfileData } from "@/lib/api/services/profile"
import { TokenManager } from "@/lib/auth/token-manager"



const defaultProfileData = profileService.getDefaultProfile()

const ensureSkills = (data: any) => ({
  ...data,
  skills: Array.isArray(data?.skills) ? data.skills : [],
})

export function ProfileEditor() {
  const [profileData, setProfileData] = useState<ProfileData>(ensureSkills(defaultProfileData))
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // 사용자 ID 변경 상태
  const [currentPasswordForUsername, setCurrentPasswordForUsername] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [isChangingUsername, setIsChangingUsername] = useState(false)

  // 컴포넌트 마운트 시 프로필 데이터 로드
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileService.getProfile()
        setProfileData(ensureSkills(data))
      } catch (error) {
        console.error('Failed to load profile:', error)
        toast({
          title: "프로필 로드 실패",
          description: "기본 프로필 데이터를 사용합니다.",
          variant: "destructive",
        })
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSkillChange = (index: number, field: 'name' | 'level', value: string | number) => {
    const newSkills = [...profileData.skills]
    newSkills[index] = {
      ...newSkills[index],
      [field]: field === 'level' ? Number(value) : value
    }
    setProfileData(prev => ensureSkills({
      ...prev,
      skills: newSkills
    }))
  }

  const addSkill = () => {
    setProfileData(prev => ensureSkills({
      ...prev,
      skills: [...(prev.skills || []), { name: "", level: 50 }]
    }))
  }

  const removeSkill = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updated = await profileService.updateProfile(profileData)
      setProfileData(ensureSkills(updated))
      toast({
        title: "프로필이 저장되었습니다",
        description: "변경사항이 랜딩 페이지에 반영되었습니다.",
      })
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "프로필 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const result = await profileService.uploadProfileImage(file)
        handleInputChange('profileImage', result.imageUrl)
        toast({
          title: "이미지 업로드 성공",
          description: "프로필 이미지가 업로드되었습니다.",
        })
      } catch (error) {
        toast({
          title: "이미지 업로드 실패",
          description: "이미지 업로드 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    }
  }

  const handleChangePassword = async () => {
    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "비밀번호 길이 오류",
        description: "새 비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const token = TokenManager.getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '비밀번호 변경에 실패했습니다.')
      }

      toast({
        title: "비밀번호 변경 성공",
        description: result.data?.message || result.message || "비밀번호가 성공적으로 변경되었습니다.",
      })

      // 입력 필드 초기화
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast({
        title: "비밀번호 변경 실패",
        description: error.message || "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleChangeUsername = async () => {
    // 유효성 검사
    if (!currentPasswordForUsername || !newUsername) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (newUsername.length < 3) {
      toast({
        title: "사용자 ID 길이 오류",
        description: "사용자 ID는 최소 3자 이상이어야 합니다.",
        variant: "destructive",
      })
      return
    }

    if (newUsername.length > 20) {
      toast({
        title: "사용자 ID 길이 오류",
        description: "사용자 ID는 최대 20자까지 가능합니다.",
        variant: "destructive",
      })
      return
    }

    setIsChangingUsername(true)
    try {
      const token = TokenManager.getToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/change-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPasswordForUsername,
          newUsername,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '사용자 ID 변경에 실패했습니다.')
      }

      // 새 토큰 저장
      if (result.access_token) {
        TokenManager.setToken(result.access_token)
      }

      toast({
        title: "사용자 ID 변경 성공",
        description: result.message || "사용자 ID가 성공적으로 변경되었습니다. 새 ID로 다시 로그인해주세요.",
      })

      // 입력 필드 초기화
      setCurrentPasswordForUsername('')
      setNewUsername('')

      // 2초 후 로그아웃 및 로그인 페이지로 이동
      setTimeout(() => {
        TokenManager.clearToken()
        window.location.href = '/admin/login'
      }, 2000)
    } catch (error: any) {
      toast({
        title: "사용자 ID 변경 실패",
        description: error.message || "사용자 ID 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsChangingUsername(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mb-4"></div>
        <p className="text-neutral-slate-600">프로필 데이터를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-brand-indigo-500/30">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="about">소개</TabsTrigger>
          <TabsTrigger value="skills">기술 스택</TabsTrigger>
          <TabsTrigger value="social">소셜 & 연락처</TabsTrigger>
          <TabsTrigger value="security">보안</TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="basic" className="space-y-6">
          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <CardTitle className="text-xl font-bold text-brand-blue-900">기본 정보</CardTitle>
              <CardDescription className="text-neutral-slate-600 mt-1">
                이름, 직함, 상태 등 기본적인 프로필 정보를 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-brand-blue-900">이름</Label>
                  <Input
                    id="name"
                    value={profileData.name ?? ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="border-brand-indigo-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-brand-blue-900">직함</Label>
                  <Input
                    id="title"
                    value={profileData.title ?? ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="직함을 입력하세요"
                    className="border-brand-indigo-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-brand-blue-900">부제목</Label>
                  <Textarea
                    id="subtitle"
                    value={profileData.subtitle ?? ''}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    placeholder="간단한 소개 문구를 입력하세요"
                    rows={2}
                    className="border-brand-indigo-500/50"
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-brand-blue-900">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email ?? ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="이메일을 입력하세요"
                    className="border-brand-indigo-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-brand-blue-900">위치</Label>
                  <Input
                    id="location"
                  value={profileData.location ?? ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="위치를 입력하세요"
                    className="border-brand-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-brand-blue-900">상태</Label>
                  <Input
                    id="status"
                    value={profileData.status ?? ''}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    placeholder="현재 상태를 입력하세요"
                    className="border-brand-indigo-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusMessage" className="text-brand-blue-900">상태 메시지</Label>
                  <Input
                    id="statusMessage"
                    value={profileData.statusMessage ?? ''}
                    onChange={(e) => handleInputChange('statusMessage', e.target.value)}
                    placeholder="상태에 대한 자세한 설명"
                    className="border-brand-indigo-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={!!profileData.isAvailable}
                    onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
                  />
                  <Label htmlFor="isAvailable" className="text-neutral-slate-700">새로운 기회에 열려있음</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showStatus"
                    checked={!!profileData.showStatus}
                    onCheckedChange={(checked) => handleInputChange('showStatus', checked)}
                  />
                  <Label htmlFor="showStatus" className="text-neutral-slate-700">상태 표시</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <CardTitle className="text-xl font-bold text-brand-blue-900">프로필 이미지</CardTitle>
              <CardDescription className="text-neutral-slate-600 mt-1">
                프로필에 표시될 이미지를 업로드합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-brand-indigo-500">
                  <img
                    src={profileData.profileImage || '/placeholder.svg'}
                    alt="프로필 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-upload" className="text-brand-blue-900">이미지 업로드</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      이미지 선택
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleInputChange('profileImage', '/placeholder.svg')}
                      className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
                    >
                      <X className="h-4 w-4 mr-2" />
                      제거
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 소개 탭 */}
        <TabsContent value="about" className="space-y-6">
          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <CardTitle className="text-xl font-bold text-brand-blue-900">자기소개</CardTitle>
              <CardDescription className="text-neutral-slate-600 mt-1">
                랜딩 페이지에 표시될 자기소개 내용을 작성합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="about" className="text-brand-blue-900">간단한 소개</Label>
                <Textarea
                  id="about"
                  value={profileData.about ?? ''}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  placeholder="자신에 대한 간단한 소개를 작성하세요"
                  rows={4}
                  className="border-brand-indigo-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-brand-blue-900">상세 설명</Label>
                <Textarea
                  id="description"
                  value={profileData.description ?? ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="자신의 경험과 전문성에 대한 상세한 설명을 작성하세요"
                  rows={6}
                  className="border-brand-indigo-500/50"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 기술 스택 탭 */}
        <TabsContent value="skills" className="space-y-6">
          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <CardTitle className="text-xl font-bold text-brand-blue-900">기술 스택</CardTitle>
              <CardDescription className="text-neutral-slate-600 mt-1">
                보유한 기술과 숙련도를 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-4">
                {(profileData.skills || []).map((skill, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-brand-indigo-500/30 rounded-lg bg-brand-blue-50/20">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`skill-name-${index}`} className="text-brand-blue-900">기술명</Label>
                    <Input
                      id={`skill-name-${index}`}
                      value={skill.name ?? ''}
                      onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                      placeholder="기술명을 입력하세요"
                      className="border-brand-indigo-500/50"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`skill-level-${index}`} className="text-brand-blue-900">숙련도 (%)</Label>
                    <Input
                      id={`skill-level-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      value={skill.level ?? 0}
                      onChange={(e) => handleSkillChange(index, 'level', e.target.value)}
                      placeholder="0-100"
                      className="border-brand-indigo-500/50"
                    />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSkill(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={addSkill}
                className="w-full border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                기술 추가
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 소셜 & 연락처 탭 */}
        <TabsContent value="social" className="space-y-6">
          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <CardTitle className="text-xl font-bold text-brand-blue-900">소셜 미디어 & 연락처</CardTitle>
              <CardDescription className="text-neutral-slate-600 mt-1">
                소셜 미디어 링크와 연락처 정보를 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-brand-blue-900">GitHub</Label>
                  <Input
                    id="github"
                    value={profileData.github}
                    onChange={(e) => handleInputChange('github', e.target.value)}
                    placeholder="GitHub 프로필 URL"
                    className="border-brand-indigo-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-brand-blue-900">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={profileData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    placeholder="LinkedIn 프로필 URL"
                    className="border-brand-indigo-500/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 보안 탭 */}
        <TabsContent value="security" className="space-y-6">
          {/* 사용자 ID 변경 카드 */}
          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-indigo-500 to-brand-indigo-700 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-brand-blue-900">사용자 ID 변경</CardTitle>
                  <CardDescription className="text-neutral-slate-600 mt-1">
                    관리자 계정의 사용자 ID를 변경합니다
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPasswordForUsername" className="text-brand-blue-900">현재 비밀번호</Label>
                  <Input
                    id="currentPasswordForUsername"
                    type="password"
                    value={currentPasswordForUsername}
                    onChange={(e) => setCurrentPasswordForUsername(e.target.value)}
                    placeholder="본인 확인을 위해 현재 비밀번호를 입력하세요"
                    className="border-brand-indigo-500/50"
                    autoComplete="current-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newUsername" className="text-brand-blue-900">새 사용자 ID</Label>
                  <Input
                    id="newUsername"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="새 사용자 ID를 입력하세요 (3-20자)"
                    className="border-brand-indigo-500/50"
                    autoComplete="username"
                  />
                </div>

                <Separator className="bg-brand-indigo-500/30 my-4" />

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 font-medium mb-2">⚠️ 주의사항</p>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                    <li>사용자 ID는 3자 이상 20자 이하여야 합니다</li>
                    <li>변경 후 새 ID로 다시 로그인해야 합니다</li>
                    <li>중복된 ID는 사용할 수 없습니다</li>
                  </ul>
                </div>

                <Button
                  onClick={handleChangeUsername}
                  disabled={isChangingUsername}
                  className="w-full bg-gradient-to-r from-brand-indigo-500 to-brand-indigo-700 hover:from-brand-indigo-600 hover:to-brand-indigo-900 border-0 shadow-md text-white"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isChangingUsername ? "변경 중..." : "사용자 ID 변경"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 비밀번호 변경 카드 */}
          <Card className="border-brand-indigo-500/30 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-brand-indigo-500/20 bg-gradient-to-r from-brand-blue-50 to-brand-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue-500 to-brand-blue-700 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-brand-blue-900">비밀번호 변경</CardTitle>
                  <CardDescription className="text-neutral-slate-600 mt-1">
                    관리자 계정의 비밀번호를 변경합니다
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-brand-blue-900">현재 비밀번호</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="border-brand-indigo-500/50"
                    autoComplete="current-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-brand-blue-900">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                    className="border-brand-indigo-500/50"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-brand-blue-900">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className="border-brand-indigo-500/50"
                    autoComplete="new-password"
                  />
                </div>

                <Separator className="bg-brand-indigo-500/30 my-4" />

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 font-medium mb-2">⚠️ 보안 권장사항</p>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                    <li>최소 6자 이상의 비밀번호를 사용하세요</li>
                    <li>영문, 숫자, 특수문자를 조합하면 더 안전합니다</li>
                    <li>정기적으로 비밀번호를 변경하세요</li>
                  </ul>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0 shadow-md text-white"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="bg-brand-indigo-500/30" />

      {/* 저장 버튼 */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          className="border-brand-indigo-500/50 hover:bg-brand-blue-50 hover:border-brand-blue-500"
        >
          미리보기
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-700 hover:from-brand-blue-600 hover:to-brand-blue-900 border-0 shadow-md"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  )
}
