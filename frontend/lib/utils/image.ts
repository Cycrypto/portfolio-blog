export function normalizeImageUrl(value?: string | null): string | undefined {
  if (!value) return undefined

  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (trimmed.startsWith("/placeholder.svg")) {
    return undefined
  }

  return trimmed
}
