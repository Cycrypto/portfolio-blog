import { getExperiences, getProjects, getResumeSettings } from '@/lib/api';
import type { ProfileData } from '@/lib/api/services/profile';
import { profileService } from '@/lib/api/services/profile';
import type {
  Experience,
  Project,
  ResumeSettings,
} from '@/lib/types/api';
import { compareExperiences } from '@/lib/experience/utils';
import {
  RESUME_MAX_FEATURED_SKILLS,
  RESUME_MAX_SELECTED_PROJECTS,
  RESUME_MAX_SUMMARY_BULLETS,
} from '@/lib/resume/constants';
import {
  extractSummaryBullets,
  normalizeResumeStringArray,
} from './resume-content';

export interface ResumeSnapshot {
  settings: ResumeSettings;
  profile: ProfileData;
  summaryBullets: string[];
  featuredSkills: string[];
  selectedExperiences: Experience[];
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
  summaryBullets: [],
  featuredSkillNames: [],
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
    summaryBullets: normalizeResumeStringArray(
      settings.summaryBullets || [],
      RESUME_MAX_SUMMARY_BULLETS,
    ),
    featuredSkillNames: normalizeResumeStringArray(
      settings.featuredSkillNames || [],
      RESUME_MAX_FEATURED_SKILLS,
    ),
    selectedProjectIds: Array.isArray(settings.selectedProjectIds)
      ? [...new Set(settings.selectedProjectIds.filter((id) => id > 0))].slice(
          0,
          RESUME_MAX_SELECTED_PROJECTS,
        )
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
    summaryBullets: extractSummaryBullets(
      [profile.subtitle || '', profile.about || '', profile.description || ''],
      RESUME_MAX_SUMMARY_BULLETS,
    ),
    featuredSkillNames: normalizeResumeStringArray(
      [...(profile.skills || [])]
        .sort((left, right) => (right.level || 0) - (left.level || 0))
        .map((skill) => skill.name),
      RESUME_MAX_FEATURED_SKILLS,
    ),
  });
}

function pickSelectedProjects(
  settings: ResumeSettings,
  allProjects: Project[],
): Project[] {
  if (settings.selectedProjectIds.length === 0) {
    return allProjects.slice(0, RESUME_MAX_SELECTED_PROJECTS);
  }

  const byId = new Map(allProjects.map((project) => [project.id, project]));
  const selected = settings.selectedProjectIds
    .map((projectId) => byId.get(projectId))
    .filter((project): project is Project => Boolean(project));

  return (selected.length > 0 ? selected : allProjects).slice(
    0,
    RESUME_MAX_SELECTED_PROJECTS,
  );
}

function pickSummaryBullets(
  settings: ResumeSettings,
  profile: ProfileData,
): string[] {
  const explicitBullets = extractSummaryBullets(
    settings.summaryBullets,
    RESUME_MAX_SUMMARY_BULLETS,
  )

  return explicitBullets.length > 0
    ? explicitBullets
    : extractSummaryBullets(
        [
          settings.headline,
          profile.subtitle,
          profile.about,
          profile.description,
        ],
        RESUME_MAX_SUMMARY_BULLETS,
      );
}

function pickFeaturedSkills(
  settings: ResumeSettings,
  profile: ProfileData,
): string[] {
  if (settings.featuredSkillNames.length > 0) {
    return settings.featuredSkillNames;
  }

  return normalizeResumeStringArray(
    [...(profile.skills || [])]
      .sort((left, right) => (right.level || 0) - (left.level || 0))
      .map((skill) => skill.name),
    RESUME_MAX_FEATURED_SKILLS,
  );
}

function pickResumeExperiences(experiences: Experience[]): Experience[] {
  const visibleExperiences = experiences.filter((experience) => experience.resumeVisible !== false);
  const source = visibleExperiences.length > 0 ? visibleExperiences : experiences;

  return [...source].sort((left, right) => {
    if (left.resumeOrder !== right.resumeOrder) {
      return left.resumeOrder - right.resumeOrder;
    }

    return compareExperiences(left, right);
  });
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
    summaryBullets: pickSummaryBullets(settings, profile),
    featuredSkills: pickFeaturedSkills(settings, profile),
    selectedExperiences: pickResumeExperiences(experiences),
    selectedProjects,
  };
}
