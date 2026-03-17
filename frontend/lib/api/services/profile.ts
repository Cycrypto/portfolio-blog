import { apiRequest } from '../client/base'
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

export const profileService = {
  // 프로필 데이터 가져오기
  async getProfile(): Promise<ProfileData> {
    try {
      const response = await apiRequest<{ data: ProfileData }>('/profile', { requireAuth: false, cache: 'no-store' })
      // ResponseInterceptor 래핑 + 컨트롤러 { data: profile }
      // => response.data?.data에 실데이터가 있음
      // 호환성을 위해 두 경로 모두 체크
      // @ts-ignore
      return normalizeProfileLinks((response as any)?.data?.data || (response as any)?.data || response as any)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      throw new Error('프로필 데이터를 가져오는데 실패했습니다.')
    }
  },

  // 프로필 데이터 업데이트
  async updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
    try {
      const response = await apiRequest<{ data: ProfileData }>('/profile', {
        method: 'PUT',
        body: JSON.stringify(normalizeProfileLinks(data)),
      })
      // 동일하게 래핑된 구조 처리
      // @ts-ignore
      return normalizeProfileLinks((response as any)?.data?.data || (response as any)?.data || response as any)
    } catch (error) {
      console.error('Failed to update profile:', error)
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
}

function normalizeProfileLinks<T extends Partial<ProfileData>>(profile: T): T {
  return normalizeUrlFields(profile, ['github', 'linkedin'])
}
