import { ApiError, apiRequest, unwrapApiResponseData, type ApiDataResponse } from '../client/base'
import { TokenManager } from '../../auth/token-manager'
import { normalizeUrlFields } from '@/lib/utils/url'

export interface ProfileData {
  // 기본 정보
  name: string
  title: string
  subtitle: string
  email: string
  location: string
  status: string
  statusMessage: string
  
  // 소셜 링크
  github: string
  linkedin: string
  
  // 소개
  about: string
  description: string
  
  // 기술 스택
  skills: Array<{
    name: string
    level: number
  }>
  
  // 프로필 이미지
  profileImage: string
  
  // 상태 표시
  isAvailable: boolean
  showStatus: boolean
}

const PROFILE_FIELDS = [
  'name',
  'title',
  'subtitle',
  'email',
  'location',
  'status',
  'statusMessage',
  'github',
  'linkedin',
  'about',
  'description',
  'skills',
  'profileImage',
  'isAvailable',
  'showStatus',
] as const

export const profileService = {
  // 프로필 데이터 가져오기
  async getProfile(): Promise<ProfileData> {
    try {
      const response = await apiRequest<ApiDataResponse<ProfileData>>('/profile', { requireAuth: false, cache: 'no-store' })
      return sanitizeProfileData(unwrapApiResponseData(response))
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      throw new Error('프로필 데이터를 가져오는데 실패했습니다.')
    }
  },

  // 프로필 데이터 업데이트
  async updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
    try {
      const response = await apiRequest<ApiDataResponse<ProfileData>>('/profile', {
        method: 'PUT',
        body: JSON.stringify(sanitizeProfilePayload(data)),
      })
      return sanitizeProfileData(unwrapApiResponseData(response))
    } catch (error) {
      console.error('Failed to update profile:', error)
      if (error instanceof ApiError) {
        throw new Error(parseApiErrorMessage(error, '프로필 데이터 업데이트에 실패했습니다.'))
      }
      throw new Error('프로필 데이터 업데이트에 실패했습니다.')
    }
  },

  // 프로필 이미지 업로드
  async uploadProfileImage(file: File): Promise<{ imageUrl: string }> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/profile/image`, {
        method: 'POST',
        headers: {
          Authorization: TokenManager.getAuthorizationHeader() || '',
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('업로드 실패')
      }

      return response.json()
    } catch (error) {
      console.error('Failed to upload profile image:', error)
      throw new Error('프로필 이미지 업로드에 실패했습니다.')
    }
  },

  // 기본 프로필 데이터 (임시)
  getDefaultProfile(): ProfileData {
    return createDefaultProfile()
  }
}

function createDefaultProfile(): ProfileData {
  return {
      name: "박준하",
      title: "백엔드 개발자",
      subtitle: "문제를 구조화하고 안정적인 백엔드 시스템을 설계하는 개발자입니다.",
      email: "",
      location: "서울, 대한민국",
      status: "프로필 정리 중",
      statusMessage: "현재 포트폴리오 정보를 정리하고 있습니다",
      github: "",
      linkedin: "",
      about: "백엔드 개발 경험과 기술 기록을 정리하고 있습니다.",
      description: "프로필 정보를 불러오지 못해 기본 메시지로 표시 중입니다.",
      skills: [
        { name: "Java", level: 95 },
        { name: "Spring Boot", level: 90 },
        { name: "Spring Security", level: 85 },
        { name: "JPA/Hibernate", level: 88 },
        { name: "MySQL", level: 85 },
        { name: "PostgreSQL", level: 80 },
        { name: "Redis", level: 75 },
        { name: "MongoDB", level: 70 },
        { name: "Docker", level: 85 },
        { name: "Kubernetes", level: 75 },
        { name: "AWS", level: 80 },
        { name: "Jenkins", level: 70 }
      ],
      profileImage: "",
      isAvailable: true,
      showStatus: true
  }
}

function normalizeProfileLinks<T extends Partial<ProfileData>>(profile: T): T {
  return normalizeUrlFields(profile, ['github', 'linkedin'])
}

function sanitizeProfileData(profile: unknown): ProfileData {
  const normalized = normalizeProfileLinks(pickProfileFields(profile))
  const defaults = createDefaultProfile()

  return {
    ...defaults,
    ...normalized,
    skills: Array.isArray(normalized.skills)
      ? normalized.skills.map((skill) => ({
          name: typeof skill?.name === 'string' ? skill.name : '',
          level: typeof skill?.level === 'number' ? skill.level : Number(skill?.level) || 0,
        }))
      : defaults.skills,
    isAvailable:
      typeof normalized.isAvailable === 'boolean'
        ? normalized.isAvailable
        : defaults.isAvailable,
    showStatus:
      typeof normalized.showStatus === 'boolean'
        ? normalized.showStatus
        : defaults.showStatus,
  }
}

function sanitizeProfilePayload(profile: Partial<ProfileData>): Partial<ProfileData> {
  return normalizeProfileLinks(pickProfileFields(profile))
}

function pickProfileFields(profile: unknown): Partial<ProfileData> {
  if (!profile || typeof profile !== 'object') {
    return {}
  }

  const source = profile as Record<string, unknown>
  const picked: Partial<ProfileData> = {}

  for (const field of PROFILE_FIELDS) {
    if (field in source) {
      ;(picked as Record<string, unknown>)[field] = source[field]
    }
  }

  return picked
}

function parseApiErrorMessage(error: ApiError, fallback: string): string {
  if (!error.response) {
    return fallback
  }

  try {
    const parsed =
      typeof error.response === 'string'
        ? JSON.parse(error.response)
        : error.response
    const message = parsed?.message

    if (Array.isArray(message) && message.length > 0) {
      return message.join(', ')
    }

    if (typeof message === 'string' && message.trim()) {
      return message
    }
  } catch {
    return fallback
  }

  return fallback
}
