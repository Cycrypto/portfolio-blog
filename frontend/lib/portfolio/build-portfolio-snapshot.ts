import { getExperiences, getPosts, getProjects } from '@/lib/api';
import {
  calculateCareerMonths,
  formatCareerDuration,
} from '@/lib/experience/utils';
import {
  profileService,
  type ProfileData,
} from '@/lib/api/services/profile';
import type { Experience, Post, Project } from '@/lib/types/api';

const MAX_SNAPSHOT_POSTS = 100;
const MAX_SNAPSHOT_PROJECTS = 100;

export interface PortfolioMetric {
  label: string;
  value: string;
  description: string;
}

export interface PortfolioSnapshot {
  profile: ProfileData;
  experiences: Experience[];
  featuredProjects: Project[];
  allProjects: Project[];
  featuredPosts: Post[];
  allPosts: Post[];
  careerDurationMonths: number;
  careerDurationLabel: string;
  metrics: PortfolioMetric[];
  availableForWork: boolean;
}

function compareNumbers(a: number, b: number): number {
  return a - b;
}

function compareDatesDesc(a?: string, b?: string): number {
  return new Date(b || 0).getTime() - new Date(a || 0).getTime();
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }

    if (a.isFeatured && b.isFeatured && a.featuredOrder !== b.featuredOrder) {
      return compareNumbers(a.featuredOrder, b.featuredOrder);
    }

    const dateDiff = compareDatesDesc(
      a.endDate || a.startDate,
      b.endDate || b.startDate,
    );
    if (dateDiff !== 0) {
      return dateDiff;
    }

    return b.id - a.id;
  });
}

function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) {
      return a.isFeatured ? -1 : 1;
    }

    if (a.isFeatured && b.isFeatured && a.featuredOrder !== b.featuredOrder) {
      return compareNumbers(a.featuredOrder, b.featuredOrder);
    }

    return compareDatesDesc(a.publishDate, b.publishDate);
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

export async function buildPortfolioSnapshot(): Promise<PortfolioSnapshot> {
  const [postsResult, projectsResult, profileResult, experiencesResult] =
    await Promise.allSettled([
      getPosts(1, MAX_SNAPSHOT_POSTS),
      getProjects(),
      profileService.getProfile(),
      getExperiences(),
    ]);

  const profile =
    profileResult.status === 'fulfilled'
      ? sanitizeProfile(profileResult.value)
      : sanitizeProfile(profileService.getDefaultProfile());

  const experiences =
    experiencesResult.status === 'fulfilled' ? experiencesResult.value : [];
  const sortedProjects =
    projectsResult.status === 'fulfilled'
      ? sortProjects(projectsResult.value.slice(0, MAX_SNAPSHOT_PROJECTS))
      : [];
  const sortedPosts =
    postsResult.status === 'fulfilled'
      ? sortPosts(postsResult.value.posts)
      : [];

  const featuredProjects = sortedProjects.filter((project) => project.isFeatured);
  const fallbackProjects = featuredProjects.length > 0
    ? featuredProjects
    : sortedProjects.slice(0, 3);
  const featuredPosts = sortedPosts.filter((post) => post.isFeatured);
  const fallbackPosts = featuredPosts.length > 0
    ? featuredPosts
    : sortedPosts.slice(0, 3);
  const careerDurationMonths = calculateCareerMonths(experiences);
  const careerDurationLabel = formatCareerDuration(careerDurationMonths);

  const metrics: PortfolioMetric[] = [
    {
      label: '실무 경력',
      value: careerDurationLabel || '정리 중',
      description: 'career 타입 기준',
    },
    {
      label: '대표 프로젝트',
      value: `${fallbackProjects.length}`,
      description: '랜딩과 이력서에 반영',
    },
    {
      label: '기술 글',
      value: `${sortedPosts.length}`,
      description: '공개된 구현 기록',
    },
    {
      label: '핵심 기술',
      value: `${(profile.skills || []).length}`,
      description: '프로필에 정리된 스택',
    },
  ];

  return {
    profile,
    experiences,
    featuredProjects: fallbackProjects.slice(0, 3),
    allProjects: sortedProjects,
    featuredPosts: fallbackPosts.slice(0, 3),
    allPosts: sortedPosts,
    careerDurationMonths,
    careerDurationLabel,
    metrics,
    availableForWork: Boolean(profile.isAvailable),
  };
}
