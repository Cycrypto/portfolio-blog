const ABSOLUTE_PROTOCOL_PATTERN = /^[a-z][a-z\d+.-]*:/i
const BLOCKED_PROTOCOL_PATTERN = /^(javascript|data|vbscript):/i
const RELATIVE_URL_PATTERN = /^(#|\/|\.\/|\.\.\/)/
const DOMAIN_LIKE_PATTERN =
  /^(?:(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+|localhost|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?(?:[/?#].*)?$/i

export function normalizeUrl(value?: string | null): string {
  const trimmed = value?.trim() ?? ""

  if (!trimmed) {
    return ""
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`
  }

  if (BLOCKED_PROTOCOL_PATTERN.test(trimmed)) {
    return ""
  }

  if (RELATIVE_URL_PATTERN.test(trimmed)) {
    return trimmed
  }

  const malformedHttpMatch = trimmed.match(/^(https?):(.*)$/i)
  if (malformedHttpMatch && !trimmed.startsWith(`${malformedHttpMatch[1]}://`)) {
    const remainder = malformedHttpMatch[2].replace(/^\/+/, "")
    return remainder ? `${malformedHttpMatch[1]}://${remainder}` : ""
  }

  if (DOMAIN_LIKE_PATTERN.test(trimmed)) {
    return `https://${trimmed}`
  }

  if (ABSOLUTE_PROTOCOL_PATTERN.test(trimmed)) {
    return trimmed
  }

  return trimmed
}

export function normalizeUrlFields<T extends object, K extends keyof T>(
  source: T,
  fields: readonly K[],
): T {
  const normalized = { ...source }
  const normalizedRecord = normalized as Record<PropertyKey, unknown>

  for (const field of fields) {
    const value = normalizedRecord[field as PropertyKey]

    if (typeof value === "string") {
      normalizedRecord[field as PropertyKey] = normalizeUrl(value)
    }
  }

  return normalized
}
