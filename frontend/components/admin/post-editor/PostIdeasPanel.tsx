"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  AiStatusResponse,
  IdeaCandidate,
} from "@/lib/types/api"
import {
  Copy,
  ExternalLink,
  FilePenLine,
  Lightbulb,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react"

interface PostIdeasPanelProps {
  actionError?: string | null
  aiStatus?: AiStatusResponse | null
  error?: string | null
  hasSavedDraft?: boolean
  ideas: IdeaCandidate[]
  isCheckingSavedDraft?: boolean
  isDismissingAllIdeas?: boolean
  isGeneratingDraft?: boolean
  isDismissingIdeaId?: number | null
  isLoading: boolean
  isLoadingSavedDraft?: boolean
  onDismissAllIdeas?: () => void
  onDismissIdea?: (idea: IdeaCandidate) => void
  onCopyContinuationBrief?: () => void
  onGenerateDraft?: () => void
  onLoadSavedDraft?: () => void
  onOpenSource: (url: string) => void
  onSelectIdea: (idea: IdeaCandidate) => void
  selectedIdea: IdeaCandidate | null
}

const AI_STATUS_LABELS: Record<
  NonNullable<AiStatusResponse["mode"]>,
  { className: string; label: string }
> = {
  worker: {
    className: "border-green-200 bg-green-50 text-green-700",
    label: "AI 사용 가능",
  },
  fallback: {
    className: "border-amber-200 bg-amber-50 text-amber-700",
    label: "fallback 모드",
  },
  unavailable: {
    className: "border-red-200 bg-red-50 text-red-600",
    label: "AI 사용 불가",
  },
}

export function PostIdeasPanel({
  actionError,
  aiStatus,
  error,
  hasSavedDraft = false,
  ideas,
  isCheckingSavedDraft = false,
  isDismissingAllIdeas = false,
  isGeneratingDraft = false,
  isDismissingIdeaId = null,
  isLoading,
  isLoadingSavedDraft = false,
  onDismissAllIdeas,
  onDismissIdea,
  onCopyContinuationBrief,
  onGenerateDraft,
  onLoadSavedDraft,
  onOpenSource,
  onSelectIdea,
  selectedIdea,
}: PostIdeasPanelProps) {
  const remainingIdeas = selectedIdea
    ? ideas.filter((idea) => idea.id !== selectedIdea.id)
    : ideas

  const selectedContinuationBrief =
    selectedIdea?.continuationBrief?.trim() || null
  const canGenerateDraft =
    aiStatus?.draftAvailable === true && Boolean(selectedIdea)
  const canLoadSavedDraft = Boolean(selectedIdea) && hasSavedDraft

  return (
    <div className="space-y-4">
      <Card className="border-brand-blue-100 shadow-none">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base text-neutral-slate-800">
              <Lightbulb className="h-4 w-4 text-brand-blue-600" />
              최근 핵심 주제 후보
            </CardTitle>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={ideas.length === 0 || isLoading || isDismissingAllIdeas}
              onClick={onDismissAllIdeas}
            >
              {isDismissingAllIdeas ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              전체 삭제
            </Button>
          </div>

          {aiStatus ? (
            <div className="space-y-2">
              <Badge
                variant="outline"
                className={AI_STATUS_LABELS[aiStatus.mode].className}
              >
                {AI_STATUS_LABELS[aiStatus.mode].label}
              </Badge>
              {aiStatus.reason ? (
                <p className="text-xs leading-5 text-neutral-slate-500">
                  {aiStatus.reason}
                </p>
              ) : null}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4">
          {selectedIdea ? (
            <div className="overflow-hidden rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-4 sm:p-5">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue-700">
                    선택한 핵심 주제
                  </p>
                  <h3 className="mt-1 break-keep text-[15px] font-semibold leading-7 text-neutral-slate-800 sm:text-base">
                    {selectedIdea.title}
                  </h3>
                </div>
                <Badge className="max-w-full self-start bg-white text-brand-blue-700 hover:bg-white">
                  {selectedIdea.category}
                </Badge>
              </div>

              <p className="break-keep text-sm leading-7 text-neutral-slate-600">
                {selectedIdea.evidenceSnippet}
              </p>

              {selectedIdea.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedIdea.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-white text-neutral-slate-600"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full whitespace-normal border-red-200 bg-white px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={isDismissingIdeaId === selectedIdea.id}
                  onClick={() => onDismissIdea?.(selectedIdea)}
                >
                  {isDismissingIdeaId === selectedIdea.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                    주제 삭제
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full whitespace-normal border-brand-blue-200 bg-white px-4 py-3 text-brand-blue-700 hover:bg-white"
                  onClick={() => onOpenSource(selectedIdea.sourceUrl)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  관련 채팅 열기
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full whitespace-normal px-4 py-3"
                  disabled={!selectedContinuationBrief}
                  onClick={onCopyContinuationBrief}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  ChatGPT 이어쓰기 프롬프트 복사
                </Button>

                {isCheckingSavedDraft || hasSavedDraft ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full whitespace-normal border-brand-blue-200 bg-white px-4 py-3 text-brand-blue-700 hover:bg-white"
                    disabled={
                      !canLoadSavedDraft ||
                      isLoadingSavedDraft ||
                      isCheckingSavedDraft
                    }
                    onClick={onLoadSavedDraft}
                  >
                    {isLoadingSavedDraft || isCheckingSavedDraft ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FilePenLine className="mr-2 h-4 w-4" />
                    )}
                    저장된 초안 불러오기
                  </Button>
                ) : null}

                <Button
                  type="button"
                  className="h-auto w-full whitespace-normal bg-brand-blue-600 px-4 py-3 text-white hover:bg-brand-blue-700"
                  disabled={!canGenerateDraft || isGeneratingDraft}
                  onClick={onGenerateDraft}
                >
                  {isGeneratingDraft ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FilePenLine className="mr-2 h-4 w-4" />
                  )}
                  초안 생성
                </Button>
              </div>

              {selectedContinuationBrief ? (
                <div className="mt-4 rounded-xl border border-white/70 bg-white/80 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-neutral-slate-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    이어쓰기 브리프
                  </div>
                  <p className="break-keep text-xs leading-6 text-neutral-slate-600">
                    {selectedContinuationBrief}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {actionError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {actionError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-brand-blue-100 p-8 text-sm text-neutral-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              핵심 주제 후보를 불러오는 중...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          ) : remainingIdeas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-blue-100 p-4 text-sm text-neutral-slate-500">
              아직 가져온 핵심 주제 후보가 없습니다. ChatGPT 대화에서 핵심 주제를 가져오면 여기에 표시됩니다.
            </div>
          ) : (
            <div className="space-y-3">
              {remainingIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="rounded-2xl border border-neutral-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-keep text-sm font-semibold leading-6 text-neutral-slate-800">
                        {idea.title}
                      </h3>
                      <p className="mt-2 break-keep text-sm leading-6 text-neutral-slate-600">
                        {idea.evidenceSnippet}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 self-start">
                      {idea.category}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        idea.generator === "worker"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }
                    >
                      {idea.generator === "worker" ? "AI 생성" : "fallback"}
                    </Badge>
                    {idea.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {idea.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      className="bg-brand-blue-600 text-white hover:bg-brand-blue-700 sm:col-span-2"
                      onClick={() => onSelectIdea(idea)}
                    >
                      이 주제 사용
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-0 whitespace-normal"
                      disabled={isDismissingIdeaId === idea.id}
                      onClick={() => onOpenSource(idea.sourceUrl)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      채팅 열기
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-0 whitespace-normal border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={isDismissingIdeaId === idea.id}
                      onClick={() => onDismissIdea?.(idea)}
                    >
                      {isDismissingIdeaId === idea.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
