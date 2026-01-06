import { apiRequest } from '../client/base'
import { Post, Project } from '../../types/api'

export interface StatsData {
  totals: {
    posts: number
    projects: number
    comments: number
  }
  recentPosts: Post[]
  recentProjects: Project[]
}

export async function getStats(): Promise<StatsData> {
  const result = await apiRequest<{ data: StatsData }>('/stats', { requireAuth: false })
  return (result as any)?.data?.data ?? (result as any)?.data
}
