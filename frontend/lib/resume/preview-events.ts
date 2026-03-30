export const RESUME_PREVIEW_REFRESH_EVENT = "admin-resume-preview:refresh"

export function dispatchResumePreviewRefresh() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent(RESUME_PREVIEW_REFRESH_EVENT))
}
