import { apiRequest } from '../client/base'
import { ApiError } from '../client/base'
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../../types/api'
import { normalizeUrlFields } from '@/lib/utils/url'

function normalizeLinkedExperience(raw: any) {
  if (!raw) {
    return null
  }

  const type = raw?.type === 'team_project' || raw?.type === 'club' ? raw.type : 'career'

  return {
    id: Number(raw?.id || 0),
    type,
    title: raw?.title || '',
    organization: raw?.organization || '',
    startDate: raw?.startDate || '',
    endDate: raw?.endDate || undefined,
  }
}

export async function getProjects(): Promise<Project[]> {
  const result = await apiRequest<{ data: Project[] }>('/projects', {
    requireAuth: false,
    cache: 'no-store',
  })
  const projects = (result as any)?.data?.data ?? (result as any)?.data ?? []
  return Array.isArray(projects) ? projects.map(normalizeProjectLinks) : []
}

export async function getProject(id: string): Promise<Project> {
  const result = await apiRequest<{ data: Project }>(`/projects/${id}`, {
    requireAuth: false,
    cache: 'no-store',
  })
  return normalizeProjectLinks((result as any)?.data?.data ?? (result as any)?.data)
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const result = await apiRequest<{ data: Project }>('/projects', {
    method: 'POST',
    body: JSON.stringify(normalizeProjectLinks(data)),
  })
  return normalizeProjectLinks(result.data)
}

export async function updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
  const result = await apiRequest<{ data: Project }>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(normalizeProjectLinks(data)),
  })
  return normalizeProjectLinks(result.data)
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await apiRequest(`/projects/${id}`, { method: 'DELETE' })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return
    }
    throw error
  }
}

function normalizeProjectLinks<T extends Partial<Project>>(project: T): T {
  const normalized = normalizeUrlFields(project, ['githubUrl', 'liveUrl'])

  if ('experience' in normalized) {
    ;(normalized as Project).experience = normalizeLinkedExperience((normalized as Project).experience)
  }

  return normalized
}
