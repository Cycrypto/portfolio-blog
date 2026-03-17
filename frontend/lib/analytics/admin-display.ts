const EVENT_LABELS: Record<string, string> = {
  cta_click: "주요 이동 클릭",
  social_click: "소셜 링크 클릭",
  blog_search: "블로그 검색",
  blog_filter: "블로그 필터 적용",
  post_engaged: "읽기 완료",
  post_share: "글 공유",
  post_like: "좋아요",
  comment_submit_success: "댓글 작성 완료",
  project_gallery_interaction: "프로젝트 갤러리 탐색",
  project_outbound_click: "서비스·코드 이동",
  contact_form_start: "문의 시작",
  contact_submit_success: "문의 완료",
}

const TARGET_LABELS: Record<string, string> = {
  project: "프로젝트 보기",
  projects: "프로젝트 목록 보기",
  blog: "블로그 보기",
  contact: "문의하기",
  resume: "이력서 보기",
  repo: "코드 보기",
  demo: "서비스 보기",
}

function normalizePath(path: string) {
  const [withoutQuery] = path.split("?")
  const [withoutHash] = withoutQuery.split("#")

  if (withoutHash.length > 1 && withoutHash.endsWith("/")) {
    return withoutHash.slice(0, -1)
  }

  return withoutHash || path
}

export function getAnalyticsEventLabel(name: string) {
  return EVENT_LABELS[name] ?? name
}

export function getAnalyticsTargetLabel(value: string) {
  return TARGET_LABELS[value] ?? value
}

export function getAnalyticsPageLabel(path: string) {
  const normalizedPath = normalizePath(path)

  if (normalizedPath === "/" || normalizedPath === "") {
    return "홈"
  }

  if (normalizedPath === "/blog") {
    return "블로그"
  }

  if (normalizedPath === "/projects") {
    return "프로젝트"
  }

  if (normalizedPath === "/contact") {
    return "문의"
  }

  if (normalizedPath.startsWith("/blog/")) {
    return "블로그 상세"
  }

  if (normalizedPath.startsWith("/projects/")) {
    return "프로젝트 상세"
  }

  return normalizedPath
}
