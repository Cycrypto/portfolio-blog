import { apiRequest } from '../client/base'
import {
  Experience,
  ExperienceType,
  CreateExperienceRequest,
  UpdateExperienceRequest,
} from '../../types/api'

function normalizeExperience(raw: any): Experience {
  const type = (raw?.type || 'career') as ExperienceType

  return {
    id: Number(raw?.id || 0),
    type: type === 'team_project' || type === 'club' ? type : 'career',
    title: raw?.title || '',
    organization: raw?.organization || raw?.company || '',
    startDate: raw?.startDate || '',
    endDate: raw?.endDate || undefined,
    description: raw?.description || undefined,
  }
}

export async function getExperiences(): Promise<Experience[]> {
  const result = await apiRequest<{ data: Experience[] }>('/experiences', {
    requireAuth: false,
    cache: 'no-store',
  })
  const data = (result as any)?.data?.data ?? (result as any)?.data ?? []
  return Array.isArray(data) ? data.map(normalizeExperience) : []
}

export async function createExperience(dto: CreateExperienceRequest): Promise<Experience> {
  const result = await apiRequest<{ data: Experience }>('/experiences', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
  return normalizeExperience((result as any)?.data?.data ?? (result as any)?.data)
}

export async function updateExperience(id: string, dto: UpdateExperienceRequest): Promise<Experience> {
  const result = await apiRequest<{ data: Experience }>(`/experiences/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  })
  return normalizeExperience((result as any)?.data?.data ?? (result as any)?.data)
}

export async function deleteExperience(id: string): Promise<void> {
  await apiRequest(`/experiences/${id}`, { method: 'DELETE' })
}
