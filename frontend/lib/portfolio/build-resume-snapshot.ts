import { getExperiences, getProjects, getResumeSettings } from '@/lib/api';
import type { ProfileData } from '@/lib/api/services/profile';
import { profileService } from '@/lib/api/services/profile';
import type {
  Experience,
  Project,
  ResumeSettings,
} from '@/lib/types/api';

export interface ResumeSnapshot {
  settings: ResumeSettings;
  profile: ProfileData;
  experiences: Experience[];
  selectedProjects: Project[];
}

const EMPTY_RESUME_SETTINGS: ResumeSettings = {
  id: 0,
  name: '',
  title: '',
  headline: '',
  email: '',
  location: '',
  github: '',
  linkedin: '',
  photoUrl: '',
  showPhoto: true,
  selectedProjectIds: [],
};

function sanitizeSettings(settings: ResumeSettings): ResumeSettings {
  return {
    ...settings,
    email: settings.email?.includes('example.com') ? '' : settings.email,
    github:
      settings.github === 'https://github.com/parkjunha' ? '' : settings.github,
    linkedin:
      settings.linkedin === 'https://www.linkedin.com/in/parkjunha/'
        ? ''
        : settings.linkedin,
    photoUrl:
      settings.photoUrl === '/placeholder.svg' ? '' : settings.photoUrl,
    selectedProjectIds: Array.isArray(settings.selectedProjectIds)
      ? [...new Set(settings.selectedProjectIds.filter((id) => id > 0))]
      : [],
  };
}

function buildFallbackSettings(profile: ProfileData): ResumeSettings {
  return sanitizeSettings({
    ...EMPTY_RESUME_SETTINGS,
    name: profile.name || '',
    title: profile.title || '',
    headline: profile.subtitle || profile.description || profile.about || '',
    email: profile.email || '',
    location: profile.location || '',
    github: profile.github || '',
    linkedin: profile.linkedin || '',
    photoUrl: profile.profileImage || '',
  });
}

function pickSelectedProjects(
  settings: ResumeSettings,
  allProjects: Project[],
): Project[] {
  if (settings.selectedProjectIds.length === 0) {
    return allProjects.slice(0, 3);
  }

  const byId = new Map(allProjects.map((project) => [project.id, project]));
  const selected = settings.selectedProjectIds
    .map((projectId) => byId.get(projectId))
    .filter((project): project is Project => Boolean(project));

  return (selected.length > 0 ? selected : allProjects).slice(0, 3);
}

export async function buildResumeSnapshot(): Promise<ResumeSnapshot> {
  const [settingsResult, projectsResult, experiencesResult, profileResult] =
    await Promise.allSettled([
      getResumeSettings(),
      getProjects(),
      getExperiences(),
      profileService.getProfile(),
    ]);

  const profile =
    profileResult.status === 'fulfilled'
      ? profileResult.value
      : profileService.getDefaultProfile();

  const settings =
    settingsResult.status === 'fulfilled'
      ? sanitizeSettings(settingsResult.value)
      : buildFallbackSettings(profile);

  const allProjects =
    projectsResult.status === 'fulfilled' ? projectsResult.value : [];
  const selectedProjects = pickSelectedProjects(settings, allProjects);
  const experiences =
    experiencesResult.status === 'fulfilled' ? experiencesResult.value : [];

  return {
    settings,
    profile,
    experiences,
    selectedProjects,
  };
}
