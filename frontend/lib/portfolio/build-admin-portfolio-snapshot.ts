import { getExperiences, getProjects } from '@/lib/api';
import { getResumeSettings } from '@/lib/api/services/resume-settings';
import { profileService, type ProfileData } from '@/lib/api/services/profile';
import {
  calculateCareerMonths,
  compareExperiences,
  formatCareerDuration,
} from '@/lib/experience/utils';
import type {
  Experience,
  Project,
  ResumeSettings,
} from '@/lib/types/api';
import {
  RESUME_MAX_FEATURED_SKILLS,
  RESUME_MAX_SUMMARY_BULLETS,
} from '@/lib/resume/constants';
import {
  extractSummaryBullets,
  normalizeResumeStringArray,
} from './resume-content';

const MAX_FEATURED_PROJECTS = 3;

export interface AdminPortfolioMetric {
  label: string;
  value: string;
  description: string;
}

export interface AdminPortfolioSnapshot {
  profile: ProfileData;
  settings: ResumeSettings;
  summaryBullets: string[];
  featuredSkills: string[];
  selectedExperiences: Experience[];
  featuredProjects: Project[];
  secondaryProjects: Project[];
  metrics: AdminPortfolioMetric[];
  generatedAt: string;
}

const EMPTY_SETTINGS: ResumeSettings = {
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

function compareNumbers(left: number, right: number): number {
  return left - right;
}

function compareDatesDesc(left?: string, right?: string): number {
  return new Date(right || 0).getTime() - new Date(left || 0).getTime();
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((left, right) => {
    if (left.isFeatured !== right.isFeatured) {
      return left.isFeatured ? -1 : 1;
    }

    if (
      left.isFeatured &&
      right.isFeatured &&
      left.featuredOrder !== right.featuredOrder
    ) {
      return compareNumbers(left.featuredOrder, right.featuredOrder);
    }

    const dateDiff = compareDatesDesc(
      left.endDate || left.startDate,
      right.endDate || right.startDate,
    );

    if (dateDiff !== 0) {
      return dateDiff;
    }

    return (right.id || 0) - (left.id || 0);
  });
}

function sanitizeProfile(profile: ProfileData): ProfileData {
  return {
    ...profile,
    email: profile.email?.includes('example.com') ? '' : profile.email,
    github:
      profile.github === 'https://github.com/parkjunha' ? '' : profile.github,
    linkedin:
      profile.linkedin === 'https://www.linkedin.com/in/parkjunha/'
        ? ''
        : profile.linkedin,
    profileImage:
      profile.profileImage === '/placeholder.svg' ? '' : profile.profileImage,
  };
}

function sanitizeSettings(settings: ResumeSettings): ResumeSettings {
  return {
    ...settings,
    email: settings.email?.includes('example.com') ? '' : settings.email,
    github:
      settings.github === 'https://github.com/parkjunha' ? ''
      : settings.github,
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
      ? Array.from(new Set(settings.selectedProjectIds.filter((id) => id > 0)))
      : [],
  };
}

function buildFallbackSettings(profile: ProfileData): ResumeSettings {
  return sanitizeSettings({
    ...EMPTY_SETTINGS,
    name: profile.name || '',
    title: profile.title || '',
    headline: profile.subtitle || profile.about || profile.description || '',
    email: profile.email || '',
    location: profile.location || '',
    github: profile.github || '',
    linkedin: profile.linkedin || '',
    photoUrl: profile.profileImage || '',
    summaryBullets: extractSummaryBullets(
      [profile.subtitle, profile.about, profile.description],
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

function pickSummaryBullets(
  settings: ResumeSettings,
  profile: ProfileData,
): string[] {
  return settings.summaryBullets.length > 0
    ? settings.summaryBullets
    : extractSummaryBullets(
        [settings.headline, profile.subtitle, profile.about, profile.description],
        RESUME_MAX_SUMMARY_BULLETS,
      );
}

function pickFeaturedSkills(
  settings: ResumeSettings,
  profile: ProfileData,
): string[] {
  return settings.featuredSkillNames.length > 0
    ? settings.featuredSkillNames
    : normalizeResumeStringArray(
        [...(profile.skills || [])]
          .sort((left, right) => (right.level || 0) - (left.level || 0))
          .map((skill) => skill.name),
        RESUME_MAX_FEATURED_SKILLS,
      );
}

function pickExperiences(experiences: Experience[]): Experience[] {
  const visible = experiences.filter((experience) => experience.resumeVisible !== false);
  const source = visible.length > 0 ? visible : experiences;

  return [...source].sort((left, right) => {
    if ((left.resumeOrder || 0) !== (right.resumeOrder || 0)) {
      return (left.resumeOrder || 0) - (right.resumeOrder || 0);
    }

    return compareExperiences(left, right);
  });
}

function pickFeaturedProjects(projects: Project[]): Project[] {
  const featured = projects.filter((project) => project.isFeatured);
  const source = featured.length > 0 ? featured : projects;
  return source.slice(0, MAX_FEATURED_PROJECTS);
}

function buildMetrics(
  experiences: Experience[],
  projects: Project[],
  featuredSkills: string[],
  profile: ProfileData,
): AdminPortfolioMetric[] {
  const careerMonths = calculateCareerMonths(experiences);
  const completedProjects = projects.filter(
    (project) => project.status === 'completed',
  ).length;

  return [
    {
      label: '실무 경력',
      value: formatCareerDuration(careerMonths) || '정리 중',
      description: 'career 타입 기준',
    },
    {
      label: '프로젝트',
      value: `${projects.length}`,
      description: `완료 ${completedProjects}건 포함`,
    },
    {
      label: '핵심 기술',
      value: `${featuredSkills.length}`,
      description: '제출용 요약 기준',
    },
    {
      label: '협업 상태',
      value: profile.isAvailable ? '가능' : '협의 필요',
      description: profile.location || '원격/현장 협의',
    },
  ];
}

export async function buildAdminPortfolioSnapshot(): Promise<AdminPortfolioSnapshot> {
  const [profileResult, settingsResult, projectsResult, experiencesResult] =
    await Promise.allSettled([
      profileService.getProfile(),
      getResumeSettings(),
      getProjects(),
      getExperiences(),
    ]);

  const profile =
    profileResult.status === 'fulfilled'
      ? sanitizeProfile(profileResult.value)
      : sanitizeProfile(profileService.getDefaultProfile());

  const settings =
    settingsResult.status === 'fulfilled'
      ? sanitizeSettings(settingsResult.value)
      : buildFallbackSettings(profile);

  const allProjects =
    projectsResult.status === 'fulfilled'
      ? sortProjects(projectsResult.value)
      : [];
  const selectedExperiences =
    experiencesResult.status === 'fulfilled'
      ? pickExperiences(experiencesResult.value)
      : [];
  const featuredSkills = pickFeaturedSkills(settings, profile);
  const featuredProjects = pickFeaturedProjects(allProjects);
  const featuredProjectIds = new Set(featuredProjects.map((project) => project.id));
  const secondaryProjects = allProjects.filter(
    (project) => !featuredProjectIds.has(project.id),
  );

  return {
    profile,
    settings,
    summaryBullets: pickSummaryBullets(settings, profile),
    featuredSkills,
    selectedExperiences,
    featuredProjects,
    secondaryProjects,
    metrics: buildMetrics(
      selectedExperiences,
      allProjects,
      featuredSkills,
      profile,
    ),
    generatedAt: new Date().toISOString(),
  };
}
