import { apiRequest, type ApiDataResponse, unwrapApiResponseData } from '../client/base';
import { Post, Project } from '../../types/api';

export interface StatsData {
  totals: {
    posts: number;
    projects: number;
    comments: number;
    views: number;
  };
  recentPosts: Post[];
  recentProjects: Project[];
}

export async function getStats(): Promise<StatsData> {
  const result = await apiRequest<ApiDataResponse<StatsData>>('/stats');
  return unwrapApiResponseData(result);
}
