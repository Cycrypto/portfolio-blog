import { apiRequest } from '../client/base'
import { TokenManager } from '../../auth/token-manager'

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
      return (response as any)?.data?.data || (response as any)?.data || response as any
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
        body: JSON.stringify(data),
      })
      // 동일하게 래핑된 구조 처리
      // @ts-ignore
      return (response as any)?.data?.data || (response as any)?.data || response as any
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
      title: "백엔드 개발자 & 기술 블로거",
      subtitle: "견고하고 확장 가능한 백엔드 시스템을 설계하고 구축하며, 개발 경험과 지식을 블로그를 통해 공유합니다.",
      email: "parkjunha@example.com",
      location: "서울, 대한민국",
      status: "새로운 기회 모색 중",
      statusMessage: "새로운 프로젝트와 협업 기회를 찾고 있습니다",
      github: "https://github.com/parkjunha",
      linkedin: "https://www.linkedin.com/in/parkjunha/",
      about: "안녕하세요! 저는 5년 경력의 백엔드 개발자 박준하입니다. Java와 Spring 생태계를 중심으로 확장 가능하고 안정적인 서버 시스템을 구축하는 것을 전문으로 합니다.",
      description: "마이크로서비스 아키텍처, 클라우드 네이티브 애플리케이션, 그리고 대용량 트래픽 처리에 대한 경험과 지식을 쌓아왔으며, 이를 블로그를 통해 개발자 커뮤니티와 공유하고 있습니다.",
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
      profileImage: "/placeholder.svg",
      isAvailable: true,
      showStatus: true
    }
  }
}
