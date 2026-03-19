"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { IdeaCandidate } from "@/lib/types/api"
import { ExternalLink, Lightbulb, Loader2 } from "lucide-react"

interface PostIdeasPanelProps {
  error?: string | null
  ideas: IdeaCandidate[]
  isLoading: boolean
  onOpenSource: (url: string) => void
  onSelectIdea: (idea: IdeaCandidate) => void
  selectedIdea: IdeaCandidate | null
}

export function PostIdeasPanel({
  error,
  ideas,
  isLoading,
  onOpenSource,
  onSelectIdea,
  selectedIdea,
}: PostIdeasPanelProps) {
  const remainingIdeas = selectedIdea
    ? ideas.filter((idea) => idea.id !== selectedIdea.id)
    : ideas;

  return (
    <div className="space-y-4">
      <Card className="border-brand-blue-100 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-neutral-slate-800">
            <Lightbulb className="h-4 w-4 text-brand-blue-600" />
            최근 글감 후보
          </CardTitle>
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

              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full border-brand-blue-200 bg-white text-brand-blue-700 hover:bg-white"
                onClick={() => onOpenSource(selectedIdea.sourceUrl)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                관련 채팅 열기
              </Button>
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

                  {idea.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {idea.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

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
