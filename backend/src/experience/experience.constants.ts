export const EXPERIENCE_TYPES = ['career', 'team_project', 'club'] as const;

export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];
