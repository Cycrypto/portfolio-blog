import { IdeaGeneratorMode } from '../entity/idea-import.entity';

export interface IdeaSummaryPackage {
  summaryShort: string;
  summaryLong: string;
  keyPoints: string[];
  technicalTopics: string[];
  decisions: string[];
  openQuestions: string[];
  evidenceSnippets: string[];
  continuationBrief: string;
}

export interface WorkerIdeaCandidate {
  title: string;
  category: string;
  tags: string[];
  keywords: string[];
  evidenceSnippet: string;
  score: number;
  continuationBrief?: string | null;
  sourceMessageRefs?: number[];
}

export interface WorkerImportChatGptResult {
  workerImportId: string;
  summary: IdeaSummaryPackage;
  candidates: WorkerIdeaCandidate[];
}

export interface WorkerAssistantSessionResult {
  workerSessionId: string;
  starterMessage: string;
  sessionSummary: string;
}

export interface WorkerAssistantReplyResult {
  reply: string;
  suggestions: string[];
  continuationBrief: string;
  sessionSummary: string;
}

export interface WorkerDraftResult {
  title: string;
  category: string;
  tags: string[];
  markdown: string;
}

export interface PersistedIdeaCandidateInput extends WorkerIdeaCandidate {
  generator: IdeaGeneratorMode;
}
