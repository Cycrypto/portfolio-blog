import type { Experience, ExperienceType } from '@/lib/types/api'

interface ExperienceTheme {
  label: string
  badgeClassName: string
  cardAccentClassName: string
  dotClassName: string
  dotRingClassName: string
  pdfColor: string
  pdfTint: string
}

const EXPERIENCE_TYPE_THEME: Record<ExperienceType, ExperienceTheme> = {
  career: {
    label: '경력',
    badgeClassName: 'border-brand-blue-200 bg-brand-blue-50 text-brand-blue-700',
    cardAccentClassName: 'border-l-brand-blue-500',
    dotClassName: 'bg-brand-blue-600',
    dotRingClassName: 'ring-brand-blue-100',
    pdfColor: '#547792',
    pdfTint: '#EDF4F7',
  },
  team_project: {
    label: '팀 프로젝트',
    badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cardAccentClassName: 'border-l-emerald-500',
    dotClassName: 'bg-emerald-600',
    dotRingClassName: 'ring-emerald-100',
    pdfColor: '#059669',
    pdfTint: '#ECFDF5',
  },
  club: {
    label: '동아리',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    cardAccentClassName: 'border-l-amber-500',
    dotClassName: 'bg-amber-600',
    dotRingClassName: 'ring-amber-100',
    pdfColor: '#D97706',
    pdfTint: '#FFFBEB',
  },
}

export const EXPERIENCE_TYPE_OPTIONS: Array<{ value: ExperienceType; label: string }> = [
  { value: 'career', label: '경력' },
  { value: 'team_project', label: '팀 프로젝트' },
  { value: 'club', label: '동아리' },
]

interface ParsedYearMonth {
  year: number
  month: number
  monthIndex: number
}

const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/

function parseYearMonth(value?: string | null): ParsedYearMonth | null {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const match = normalized.match(YEAR_MONTH_PATTERN)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }

  return {
    year,
    month,
    monthIndex: year * 12 + (month - 1),
  }
}

function compareMonthIndexDesc(left?: string | null, right?: string | null): number {
  const leftValue = parseYearMonth(left)?.monthIndex ?? -Infinity
  const rightValue = parseYearMonth(right)?.monthIndex ?? -Infinity

  return rightValue - leftValue
}

export function getExperienceTypeLabel(type?: ExperienceType | null): string {
  return EXPERIENCE_TYPE_THEME[type ?? 'career']?.label ?? EXPERIENCE_TYPE_THEME.career.label
}

export function getExperienceTypeTheme(type?: ExperienceType | null): ExperienceTheme {
  return EXPERIENCE_TYPE_THEME[type ?? 'career'] ?? EXPERIENCE_TYPE_THEME.career
}

export function formatExperienceDate(value?: string | null): string {
  const parsed = parseYearMonth(value)
  if (!parsed) {
    return value?.trim() || ''
  }

  return `${parsed.year}.${String(parsed.month).padStart(2, '0')}`
}

export function formatExperiencePeriod(startDate?: string | null, endDate?: string | null): string {
  const start = formatExperienceDate(startDate)
  const end = formatExperienceDate(endDate)

  if (!start && !end) {
    return ''
  }

  if (!start) {
    return end
  }

  return `${start} - ${end || '현재'}`
}

export function isCurrentExperience(experience: Pick<Experience, 'endDate'>): boolean {
  return !experience.endDate?.trim()
}

export function compareExperiences(left: Experience, right: Experience): number {
  const leftCurrent = isCurrentExperience(left)
  const rightCurrent = isCurrentExperience(right)

  if (leftCurrent !== rightCurrent) {
    return leftCurrent ? -1 : 1
  }

  if (leftCurrent && rightCurrent) {
    const startDiff = compareMonthIndexDesc(left.startDate, right.startDate)
    if (startDiff !== 0) {
      return startDiff
    }

    return (right.id ?? 0) - (left.id ?? 0)
  }

  const endDiff = compareMonthIndexDesc(left.endDate || left.startDate, right.endDate || right.startDate)
  if (endDiff !== 0) {
    return endDiff
  }

  const startDiff = compareMonthIndexDesc(left.startDate, right.startDate)
  if (startDiff !== 0) {
    return startDiff
  }

  return (right.id ?? 0) - (left.id ?? 0)
}

export function sortExperiences(experiences: Experience[]): Experience[] {
  return [...experiences].sort(compareExperiences)
}

function getCurrentMonthIndex(now: Date): number {
  return now.getFullYear() * 12 + now.getMonth()
}

function getCareerMonthRanges(experiences: Experience[], now: Date): Array<{ start: number; end: number }> {
  const currentMonthIndex = getCurrentMonthIndex(now)

  return experiences
    .filter((experience) => experience.type === 'career')
    .map((experience) => {
      const start = parseYearMonth(experience.startDate)?.monthIndex
      if (start === undefined) {
        return null
      }

      const parsedEnd = parseYearMonth(experience.endDate)?.monthIndex
      const end = parsedEnd === undefined ? currentMonthIndex : Math.max(parsedEnd, start)

      return { start, end }
    })
    .filter((range): range is { start: number; end: number } => Boolean(range))
    .sort((left, right) => left.start - right.start)
}

export function calculateCareerMonths(experiences: Experience[], now = new Date()): number {
  const ranges = getCareerMonthRanges(experiences, now)
  if (ranges.length === 0) {
    return 0
  }

  const merged: Array<{ start: number; end: number }> = []

  for (const range of ranges) {
    const previous = merged[merged.length - 1]
    if (!previous) {
      merged.push({ ...range })
      continue
    }

    if (range.start <= previous.end + 1) {
      previous.end = Math.max(previous.end, range.end)
      continue
    }

    merged.push({ ...range })
  }

  return merged.reduce((total, range) => total + (range.end - range.start + 1), 0)
}

export function formatCareerDuration(months: number): string {
  if (months <= 0) {
    return ''
  }

  if (months < 12) {
    return `${months}개월`
  }

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (remainingMonths === 0) {
    return `${years}년`
  }

  return `${years}년 ${remainingMonths}개월`
}

export function getCareerDurationLabel(experiences: Experience[], now = new Date()): string {
  return formatCareerDuration(calculateCareerMonths(experiences, now))
}
