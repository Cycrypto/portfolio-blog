import { type ExtractedIdeaCandidate, type IdeaInputMessage, normalizeConversationText } from './idea-extractor';
import { IdeaSummaryPackage } from '../types/worker.types';

const DECISION_PATTERN = /결정|선택|채택|정하기|사용하기|쓰기로/i;
const OPEN_QUESTION_PATTERN = /\?|TODO|남은|어떻게|다음 단계|추가로/i;

export function buildFallbackSummaryPackage(input: {
  sourceTitle: string;
  sourceUrl: string;
  messages: IdeaInputMessage[];
  candidates: ExtractedIdeaCandidate[];
}): IdeaSummaryPackage {
  const normalizedText = normalizeConversationText(input.messages);
  const sentences = normalizedText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12);

  const evidenceSnippets = uniqueStrings(
    input.candidates.map((candidate) => candidate.evidenceSnippet),
  ).slice(0, 5);

  const technicalTopics = uniqueStrings(
    input.candidates.flatMap((candidate) => [...candidate.tags, ...candidate.keywords]),
  ).slice(0, 8);

  const decisions = uniqueStrings(
    sentences.filter((sentence) => DECISION_PATTERN.test(sentence)).slice(0, 4),
  );

  const openQuestions = uniqueStrings(
    sentences.filter((sentence) => OPEN_QUESTION_PATTERN.test(sentence)).slice(0, 4),
  );

  const keyPoints = uniqueStrings([
    ...input.candidates.map((candidate) => candidate.title),
    ...evidenceSnippets,
  ]).slice(0, 6);

  const summaryShort = trimText(
    evidenceSnippets[0] || input.candidates[0]?.title || input.sourceTitle,
    180,
  );

  const summaryLong = trimText(
    [
      input.sourceTitle,
      keyPoints.length > 0 ? `핵심 포인트: ${keyPoints.join(' / ')}` : '',
      technicalTopics.length > 0 ? `기술 주제: ${technicalTopics.join(', ')}` : '',
      openQuestions.length > 0 ? `남은 질문: ${openQuestions.join(' / ')}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    1200,
  );

  const continuationBrief = trimText(
    [
      `원본 대화 제목: ${input.sourceTitle}`,
      `원본 링크: ${input.sourceUrl}`,
      summaryShort ? `짧은 요약: ${summaryShort}` : '',
      keyPoints.length > 0 ? `핵심 포인트: ${keyPoints.join(' | ')}` : '',
      technicalTopics.length > 0 ? `기술 주제: ${technicalTopics.join(', ')}` : '',
      openQuestions.length > 0 ? `열린 질문: ${openQuestions.join(' | ')}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    1500,
  );

  return {
    summaryShort,
    summaryLong,
    keyPoints,
    technicalTopics,
    decisions,
    openQuestions,
    evidenceSnippets,
    continuationBrief,
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
}

function trimText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}
