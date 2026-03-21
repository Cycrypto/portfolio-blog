import { apiRequest, type ApiDataResponse, unwrapApiResponseData } from '../client/base';
import type {
  ResumeSettings,
  UpdateResumeSettingsRequest,
} from '../../types/api';
import { normalizeUrlFields } from '@/lib/utils/url';
import {
  RESUME_MAX_FEATURED_SKILLS,
  RESUME_MAX_SELECTED_PROJECTS,
  RESUME_MAX_SUMMARY_BULLETS,
} from '@/lib/resume/constants';
import { normalizeResumeStringArray } from '@/lib/portfolio/resume-content';

export async function getResumeSettings(): Promise<ResumeSettings> {
  const result = await apiRequest<ApiDataResponse<ResumeSettings>>('/resume-settings', {
    requireAuth: false,
    cache: 'no-store',
  });
  return normalizeResumeSettings(unwrapApiResponseData(result));
}

export async function updateResumeSettings(
  data: UpdateResumeSettingsRequest,
): Promise<ResumeSettings> {
  const result = await apiRequest<ApiDataResponse<ResumeSettings>>('/resume-settings', {
    method: 'PUT',
    body: JSON.stringify(normalizeResumeSettings(data)),
  });
  return normalizeResumeSettings(unwrapApiResponseData(result));
}

function normalizeResumeSettings<T extends Partial<ResumeSettings>>(settings: T): T {
  const normalized = normalizeUrlFields(settings, ['github', 'linkedin', 'photoUrl']);

  if ('summaryBullets' in normalized) {
    (normalized as ResumeSettings).summaryBullets = normalizeResumeStringArray(
      (normalized as ResumeSettings).summaryBullets || [],
      RESUME_MAX_SUMMARY_BULLETS,
    );
  }

  if ('featuredSkillNames' in normalized) {
    (normalized as ResumeSettings).featuredSkillNames = normalizeResumeStringArray(
      (normalized as ResumeSettings).featuredSkillNames || [],
      RESUME_MAX_FEATURED_SKILLS,
    );
  }

  if ('selectedProjectIds' in normalized) {
    (normalized as ResumeSettings).selectedProjectIds = Array.from(
      new Set(((normalized as ResumeSettings).selectedProjectIds || []).filter((id) => id > 0)),
    ).slice(0, RESUME_MAX_SELECTED_PROJECTS);
  }

  return normalized;
}
