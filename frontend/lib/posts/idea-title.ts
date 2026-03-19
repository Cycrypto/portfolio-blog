import type { IdeaCandidate } from "@/lib/types/api"

const TITLE_MAX_LENGTH = 40
const TITLE_MIN_LENGTH = 24

export function buildSuggestedTitleFromIdea(
  idea: Pick<IdeaCandidate, "title" | "keywords" | "tags">,
) {
  const themeCore = sanitizeThemeCore(idea.title)
  const technicalLead = pickTechnicalLead([...idea.tags, ...idea.keywords])
  const dedupedThemeCore = stripLeadingKeyword(themeCore, technicalLead)

  const composed = normalizeWhitespace(
    [technicalLead, dedupedThemeCore]
      .filter(Boolean)
      .join(" "),
  )

  const fallbackTitle = normalizeWhitespace(
    technicalLead || dedupedThemeCore || "핵심 주제 정리",
  )

  let nextTitle = trimTitle(composed || fallbackTitle)

  if (nextTitle.length < TITLE_MIN_LENGTH && !/정리|메모|노트|가이드/u.test(nextTitle)) {
    nextTitle = trimTitle(`${nextTitle} 정리`)
  }

  return nextTitle
}

function sanitizeThemeCore(value: string) {
  return normalizeWhitespace(
    String(value || "")
      .replace(/^이 대화는\s*/u, "")
      .replace(/\s+(흐름|내용|과정)이다[.]?$/u, "")
      .replace(/\s+문제를 분석하고 해결 방향을 정리하는$/u, " 문제 해결")
      .replace(/\s+구현 방향을 정리하는$/u, " 구현")
      .replace(/\s+를 중심으로 정리하는$/u, "")
      .replace(/\s+과정을 점검하는$/u, " 점검")
      .replace(/\s+/g, " "),
  )
}

function pickTechnicalLead(values: string[]) {
  return uniqueStrings(values)
    .find((value) =>
      /[A-Za-z]/.test(value) ||
      /\.([tj]sx?|sql|ya?ml|json)$/i.test(value) ||
      value.startsWith("@"),
    ) || ""
}

function stripLeadingKeyword(value: string, keyword: string) {
  if (!keyword) {
    return value
  }

  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return normalizeWhitespace(
    value.replace(new RegExp(`^${escapedKeyword}\\s*`, "i"), ""),
  )
}

function trimTitle(value: string) {
  if (value.length <= TITLE_MAX_LENGTH) {
    return value
  }

  return `${value.slice(0, TITLE_MAX_LENGTH - 1).trim()}…`
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeWhitespace(value))
        .filter(Boolean),
    ),
  )
}

function normalizeWhitespace(value: string) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}
