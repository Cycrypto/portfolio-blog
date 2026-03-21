import {
  apiRequest,
  type ApiDataResponse,
  unwrapApiResponseData,
} from '../client/base'
import {
  Experience,
  ExperienceType,
  CreateExperienceRequest,
  UpdateExperienceRequest,
} from '../../types/api'
import { RESUME_MAX_EXPERIENCE_HIGHLIGHTS } from '@/lib/resume/constants'
import { normalizeResumeStringArray } from '@/lib/portfolio/resume-content'

function normalizeLinkedProject(raw: any) {
  return {
    id: Number(raw?.id || 0),
    title: raw?.title || '',
    slug: raw?.slug || undefined,
    category: raw?.category || undefined,
    status: raw?.status || undefined,
    startDate: raw?.startDate || undefined,
    endDate: raw?.endDate || undefined,
  }
}

function normalizeExperience(raw: any): Experience {
  const type = (raw?.type || 'career') as ExperienceType
  const linkedProjects = Array.isArray(raw?.linkedProjects ?? raw?.projects)
    ? (raw?.linkedProjects ?? raw?.projects).map(normalizeLinkedProject)
    : []

  return {
    id: Number(raw?.id || 0),
    type: type === 'team_project' || type === 'club' ? type : 'career',
    title: raw?.title || '',
    organization: raw?.organization || raw?.company || '',
    startDate: raw?.startDate || '',
    endDate: raw?.endDate || undefined,
    description: raw?.description || undefined,
    resumeVisible: raw?.resumeVisible !== false,
    resumeOrder: Number(raw?.resumeOrder || 0),
    resumeHighlights: normalizeResumeStringArray(
      raw?.resumeHighlights || [],
      RESUME_MAX_EXPERIENCE_HIGHLIGHTS,
    ),
    linkedProjects,
  }
}

export async function getExperiences(): Promise<Experience[]> {
  const result = await apiRequest<ApiDataResponse<Experience[]>>(
    '/experiences',
    {
    requireAuth: false,
    cache: 'no-store',
    }
  )
  const data = unwrapApiResponseData(result)
  return Array.isArray(data) ? data.map(normalizeExperience) : []
}

export async function createExperience(dto: CreateExperienceRequest): Promise<Experience> {
  const result = await apiRequest<ApiDataResponse<Experience>>('/experiences', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
  return normalizeExperience(unwrapApiResponseData(result))
}

export async function updateExperience(id: string, dto: UpdateExperienceRequest): Promise<Experience> {
  const result = await apiRequest<ApiDataResponse<Experience>>(
    `/experiences/${id}`,
    {
    method: 'PATCH',
    body: JSON.stringify(dto),
    }
  )
  return normalizeExperience(unwrapApiResponseData(result))
}

export async function deleteExperience(id: string): Promise<void> {
  await apiRequest(`/experiences/${id}`, { method: 'DELETE' })
}
