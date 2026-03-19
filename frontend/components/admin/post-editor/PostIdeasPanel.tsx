"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type {
  AiStatusResponse,
  IdeaCandidate,
} from "@/lib/types/api"
import {
  Bot,
  Copy,
  ExternalLink,
  FilePenLine,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react"

interface AssistantChatMessage {
  content: string
  role: "assistant" | "user"
}

interface PostIdeasPanelProps {
  actionError?: string | null
  aiStatus?: AiStatusResponse | null
  assistantMessages: AssistantChatMessage[]
  error?: string | null
  ideas: IdeaCandidate[]
  isGeneratingDraft?: boolean
  isLoading: boolean
  isSendingAssistantMessage?: boolean
  isStartingAssistant?: boolean
  onCopyContinuationBrief?: () => void
  onGenerateDraft?: () => void
  onOpenSource: (url: string) => void
  onSelectIdea: (idea: IdeaCandidate) => void
  onSendAssistantMessage?: (message: string) => void
  onStartAssistant?: () => void
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
  assistantMessages,
  error,
  ideas,
  isGeneratingDraft = false,
  isLoading,
  isSendingAssistantMessage = false,
  isStartingAssistant = false,
  onCopyContinuationBrief,
  onGenerateDraft,
  onOpenSource,
  onSelectIdea,
  onSendAssistantMessage,
  onStartAssistant,
  selectedIdea,
}: PostIdeasPanelProps) {
  const [assistantInput, setAssistantInput] = useState("")

  const remainingIdeas = selectedIdea
    ? ideas.filter((idea) => idea.id !== selectedIdea.id)
    : ideas

  const selectedContinuationBrief =
    selectedIdea?.continuationBrief?.trim() || null
  const canUseAssistant =
    aiStatus?.assistantAvailable === true && Boolean(selectedIdea)
  const canGenerateDraft =
    aiStatus?.draftAvailable === true && Boolean(selectedIdea)

  const handleAssistantSubmit = () => {
    const nextMessage = assistantInput.trim()
    if (!nextMessage || !onSendAssistantMessage) {
      return
    }

    void onSendAssistantMessage(nextMessage)
    setAssistantInput("")
  }

  return (
    <div className="space-y-4">
      <Card className="border-brand-blue-100 shadow-none">
        <CardHeader className="space-y-3 pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-neutral-slate-800">
            <Lightbulb className="h-4 w-4 text-brand-blue-600" />
            최근 글감 후보
          </CardTitle>

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
            <div className="rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue-700">
                    선택한 글감
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-neutral-slate-800">
                    {selectedIdea.title}
                  </h3>
                </div>
                <Badge className="bg-white text-brand-blue-700 hover:bg-white">
                  {selectedIdea.category}
                </Badge>
              </div>

              <p className="text-sm leading-6 text-neutral-slate-600">
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

              <div className="mt-4 grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-brand-blue-200 bg-white text-brand-blue-700 hover:bg-white"
                  onClick={() => onOpenSource(selectedIdea.sourceUrl)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  관련 채팅 열기
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedContinuationBrief}
                  onClick={onCopyContinuationBrief}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  ChatGPT 이어쓰기 프롬프트 복사
                </Button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canUseAssistant || isStartingAssistant}
                    onClick={onStartAssistant}
                  >
                    {isStartingAssistant ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    assistant 시작
                  </Button>

                  <Button
                    type="button"
                    className="bg-brand-blue-600 text-white hover:bg-brand-blue-700"
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
              </div>

              {selectedContinuationBrief ? (
                <div className="mt-4 rounded-xl border border-white/70 bg-white/80 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-neutral-slate-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    이어쓰기 브리프
                  </div>
                  <p className="text-xs leading-5 text-neutral-slate-600">
                    {selectedContinuationBrief}
                  </p>
                </div>
              ) : null}

              {assistantMessages.length > 0 || canUseAssistant ? (
                <div className="mt-4 rounded-xl border border-white/70 bg-white/80 p-3">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-neutral-slate-600">
                    <Bot className="h-3.5 w-3.5" />
                    블로그 assistant
                  </div>

                  {assistantMessages.length > 0 ? (
                    <div className="space-y-2">
                      {assistantMessages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`rounded-xl px-3 py-2 text-sm leading-6 ${
                            message.role === "assistant"
                              ? "bg-brand-blue-50 text-neutral-slate-700"
                              : "bg-neutral-slate-100 text-neutral-slate-700"
                          }`}
                        >
                          {message.content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-neutral-slate-500">
                      assistant를 시작하면 글의 각도, 구조, 포함할 사례를 빠르게 정리할 수 있습니다.
                    </p>
                  )}

                  <div className="mt-3 flex flex-col gap-2">
                    <Textarea
                      value={assistantInput}
                      onChange={(event) => setAssistantInput(event.target.value)}
                      placeholder={
                        canUseAssistant
                          ? "예: 이 글의 독자 수준과 섹션 구조를 정리해줘"
                          : "AI worker가 없으면 assistant 대화는 비활성화됩니다."
                      }
                      className="min-h-[96px] bg-white"
                      disabled={!canUseAssistant || isSendingAssistantMessage}
                    />
                    <Button
                      type="button"
                      onClick={handleAssistantSubmit}
                      disabled={
                        !canUseAssistant ||
                        !assistantInput.trim() ||
                        isSendingAssistantMessage
                      }
                    >
                      {isSendingAssistantMessage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      assistant에게 보내기
                    </Button>
                  </div>
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
              글감 후보를 불러오는 중...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          ) : remainingIdeas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-blue-100 p-4 text-sm text-neutral-slate-500">
              아직 가져온 글감 후보가 없습니다. ChatGPT 대화에서 글감을 가져오면 여기에 표시됩니다.
            </div>
          ) : (
            <div className="space-y-3">
              {remainingIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="rounded-2xl border border-neutral-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold leading-6 text-neutral-slate-800">
                        {idea.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-slate-600">
                        {idea.evidenceSnippet}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
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

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      className="flex-1 bg-brand-blue-600 text-white hover:bg-brand-blue-700"
                      onClick={() => onSelectIdea(idea)}
                    >
                      이 글감 사용
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onOpenSource(idea.sourceUrl)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      채팅 열기
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
