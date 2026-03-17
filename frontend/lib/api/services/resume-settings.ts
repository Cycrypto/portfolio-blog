import { apiRequest } from '../client/base';
import type {
  ResumeSettings,
  UpdateResumeSettingsRequest,
} from '../../types/api';
import { normalizeUrlFields } from '@/lib/utils/url';

export async function getResumeSettings(): Promise<ResumeSettings> {
  const result = await apiRequest<{ data: ResumeSettings }>('/resume-settings', {
    requireAuth: false,
    cache: 'no-store',
  });
  return normalizeResumeSettings((result as any)?.data?.data ?? (result as any)?.data);
}

export async function updateResumeSettings(
  data: UpdateResumeSettingsRequest,
): Promise<ResumeSettings> {
  const result = await apiRequest<{ data: ResumeSettings }>('/resume-settings', {
    method: 'PUT',
    body: JSON.stringify(normalizeResumeSettings(data)),
  });
  return normalizeResumeSettings((result as any)?.data?.data ?? (result as any)?.data);
}

function normalizeResumeSettings<T extends Partial<ResumeSettings>>(settings: T): T {
  return normalizeUrlFields(settings, ['github', 'linkedin', 'photoUrl']);
}
