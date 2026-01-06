import { apiRequest } from '../client/base'
import { Experience, CreateExperienceRequest, UpdateExperienceRequest } from '../../types/api'

export async function getExperiences(): Promise<Experience[]> {
  const result = await apiRequest<{ data: Experience[] }>('/experiences', { requireAuth: false })
  const data = (result as any)?.data?.data ?? (result as any)?.data ?? []
  return Array.isArray(data) ? data : []
}

export async function createExperience(dto: CreateExperienceRequest): Promise<Experience> {
  const result = await apiRequest<{ data: Experience }>('/experiences', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
  return (result as any)?.data?.data ?? (result as any)?.data
}

export async function updateExperience(id: string, dto: UpdateExperienceRequest): Promise<Experience> {
  const result = await apiRequest<{ data: Experience }>(`/experiences/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  })
  return (result as any)?.data?.data ?? (result as any)?.data
}

export async function deleteExperience(id: string): Promise<void> {
  await apiRequest(`/experiences/${id}`, { method: 'DELETE' })
}
