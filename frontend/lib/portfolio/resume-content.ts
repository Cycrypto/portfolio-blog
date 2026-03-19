const SENTENCE_SPLIT_PATTERN = /(?<=[.!?])\s+|(?<=다\.)\s+/u
const BULLET_SPLIT_PATTERN = /\n+|\s+-\s+/u
const LOW_SIGNAL_PATTERNS = [/^안녕하세요/u, /^반갑습니다/u]

function collapseWhitespace(value?: string | null): string {
  return (value || "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function stripBulletPrefix(value: string): string {
  return value
    .replace(/^[\-•·]+\s*/u, "")
    .replace(/^\d+\.\s*/u, "")
    .trim()
}

export function normalizeResumeStringArray(
  values: Array<string | null | undefined>,
  limit: number,
): string[] {
  const items: string[] = []

  for (const value of values) {
    const normalized = stripBulletPrefix(collapseWhitespace(value))
    if (!normalized || items.includes(normalized)) {
      continue
    }

    items.push(normalized)
    if (items.length >= limit) {
      break
    }
  }

  return items
}

function splitCandidateText(value?: string | null): string[] {
  const normalized = (value || "").replace(/\r/g, "\n").replace(/[•·]/g, "-")
  if (!normalized.trim()) {
    return []
  }

  return normalized
    .split(BULLET_SPLIT_PATTERN)
    .flatMap((segment) => segment.split(SENTENCE_SPLIT_PATTERN))
    .map((segment) => stripBulletPrefix(collapseWhitespace(segment)))
    .filter(Boolean)
}

function isLowSignalItem(value: string, minLength: number): boolean {
  return value.length < minLength || LOW_SIGNAL_PATTERNS.some((pattern) => pattern.test(value))
}

function clampText(value: string, limit: number): string {
  if (value.length <= limit) {
    return value
  }

  return `${value.slice(0, Math.max(0, limit - 3)).trimEnd()}...`
}

function extractStructuredItems(
  sources: Array<string | null | undefined>,
  limit: number,
  minLength: number,
  charLimit: number,
): string[] {
  const items: string[] = []

  for (const source of sources) {
    for (const candidate of splitCandidateText(source)) {
      if (isLowSignalItem(candidate, minLength)) {
        continue
      }

      const clamped = clampText(candidate, charLimit)
      if (items.includes(clamped)) {
        continue
      }

      items.push(clamped)
      if (items.length >= limit) {
        return items
      }
    }
  }

  return items
}

export function extractSummaryBullets(
  sources: Array<string | null | undefined>,
  limit = 3,
): string[] {
  return extractStructuredItems(sources, limit, 10, 122)
}

export function extractExperienceHighlights(
  sources: Array<string | null | undefined>,
  limit = 2,
): string[] {
  return extractStructuredItems(sources, limit, 8, 110)
}
