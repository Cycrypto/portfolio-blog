import { JSONContent } from "@tiptap/react"

interface EditorMetrics {
  plainText: string
  wordCount: number
  characterCount: number
  estimatedReadTime: number
}

function extractText(node: JSONContent | null | undefined): string {
  if (!node) return ""

  const ownText = typeof node.text === "string" ? node.text : ""
  const childText = Array.isArray(node.content) ? node.content.map((child) => extractText(child)).join(" ") : ""

  return `${ownText} ${childText}`.replace(/\s+/g, " ").trim()
}

export function calculateEditorMetrics(content: JSONContent | null | undefined): EditorMetrics {
  const plainText = extractText(content)
  const characterCount = plainText.replace(/\s/g, "").length
  const wordCount = plainText ? plainText.split(/\s+/).length : 0

  // 공백 기반 단어 수와 문자 기반 추정치를 함께 고려해 한/영 혼합 문서에 대응
  const effectiveWordCount = Math.max(wordCount, Math.ceil(characterCount / 4))
  const estimatedReadTime = Math.max(1, Math.ceil(effectiveWordCount / 220))

  return {
    plainText,
    wordCount,
    characterCount,
    estimatedReadTime,
  }
}
