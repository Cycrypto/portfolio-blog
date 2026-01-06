import { apiRequest } from '../client/base'
import { ApiError } from '../client/base'
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../../types/api'

export async function getProjects(): Promise<Project[]> {
  const result = await apiRequest<{ data: Project[] }>('/projects', { requireAuth: false })
  const projects = (result as any)?.data?.data ?? (result as any)?.data ?? []
  return Array.isArray(projects) ? projects : []
}

export async function getProject(id: string): Promise<Project> {
  const result = await apiRequest<{ data: Project }>(`/projects/${id}`, { requireAuth: false })
  return (result as any)?.data?.data ?? (result as any)?.data
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const result = await apiRequest<{ data: Project }>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return result.data
}

export async function updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
  const result = await apiRequest<{ data: Project }>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return result.data
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
