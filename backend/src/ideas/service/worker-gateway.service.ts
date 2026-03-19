import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImportChatGptIdeaRequestDto } from '../dto/request/import-chatgpt-idea-request.dto';
import {
  WorkerAssistantReplyResult,
  WorkerAssistantSessionResult,
  WorkerDraftResult,
  WorkerImportChatGptResult,
} from '../types/worker.types';

interface WorkerHealthResponse {
  ok?: boolean;
  model?: string | null;
  reason?: string | null;
  status?: 'worker' | 'fallback' | 'unavailable';
  upstreamReady?: boolean;
}

@Injectable()
export class WorkerGatewayService {
  private readonly logger = new Logger(WorkerGatewayService.name);

  constructor(private readonly configService: ConfigService) {}

  async getHealth(): Promise<{
    available: boolean;
    model: string | null;
    reason: string | null;
  }> {
    const workerUrl = this.getWorkerUrl();
    if (!workerUrl) {
      return {
        available: false,
        model: null,
        reason: 'AI worker URL이 설정되지 않았습니다.',
      };
    }

    try {
      const response = await this.request<WorkerHealthResponse>(
        'GET',
        '/internal/health',
      );

      return {
        available: response.ok === true,
        model: response.model || null,
        reason: response.reason || null,
      };
    } catch (error) {
      return {
        available: false,
        model: null,
        reason: error instanceof Error ? error.message : 'AI worker에 연결하지 못했습니다.',
      };
    }
  }

  async importChatGptConversation(
    payload: ImportChatGptIdeaRequestDto,
  ): Promise<WorkerImportChatGptResult> {
    return this.request<WorkerImportChatGptResult>(
      'POST',
      '/internal/imports/chatgpt',
      payload,
    );
  }

  async startAssistantSession(input: {
    ideaCandidateId: number;
    workerImportId?: string | null;
    sourceTitle: string;
    sourceUrl: string;
    summaryShort: string;
    summaryLong: string;
    keyPoints: string[];
    technicalTopics: string[];
    decisions: string[];
    openQuestions: string[];
    evidenceSnippets: string[];
    continuationBrief: string | null;
    title: string;
    category: string;
    tags: string[];
    keywords: string[];
    evidenceSnippet: string;
  }): Promise<WorkerAssistantSessionResult> {
    return this.request<WorkerAssistantSessionResult>(
      'POST',
      `/internal/ideas/${input.ideaCandidateId}/session`,
      input,
    );
  }

  async sendAssistantMessage(input: {
    sessionId: string;
    message: string;
  }): Promise<WorkerAssistantReplyResult> {
    return this.request<WorkerAssistantReplyResult>(
      'POST',
      `/internal/sessions/${input.sessionId}/messages`,
      { message: input.message },
    );
  }

  async generateDraft(input: {
    ideaCandidateId: number;
    workerImportId?: string | null;
    sessionId?: string;
    targetLength?: 'short' | 'medium' | 'long';
    sourceTitle: string;
    sourceUrl: string;
    summaryShort: string;
    summaryLong: string;
    keyPoints: string[];
    technicalTopics: string[];
    decisions: string[];
    openQuestions: string[];
    evidenceSnippets: string[];
    continuationBrief: string | null;
    title: string;
    category: string;
    tags: string[];
    keywords: string[];
    evidenceSnippet: string;
  }): Promise<WorkerDraftResult> {
    return this.request<WorkerDraftResult>(
      'POST',
      `/internal/ideas/${input.ideaCandidateId}/draft`,
      input,
    );
  }

  private getWorkerUrl(): string | null {
    const workerUrl = this.configService.get<string>('AI_WORKER_URL');
    return workerUrl?.trim() || null;
  }

  private getWorkerToken(): string | null {
    const workerToken = this.configService.get<string>('AI_WORKER_TOKEN');
    return workerToken?.trim() || null;
  }

  private getTimeoutMs(): number {
    const rawTimeout = this.configService.get<string>('AI_WORKER_TIMEOUT_MS');
    const parsedTimeout = Number(rawTimeout);
    return Number.isFinite(parsedTimeout) && parsedTimeout > 0
      ? parsedTimeout
      : 30000;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const workerUrl = this.getWorkerUrl();
    if (!workerUrl) {
      throw new ServiceUnavailableException(
        'AI worker URL이 설정되지 않았습니다.',
      );
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.getTimeoutMs());

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = this.getWorkerToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${workerUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ServiceUnavailableException(
          `AI worker 요청 실패: ${response.status} ${errorText || response.statusText}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logger.warn(
        `AI worker request failed for ${method} ${path}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );

      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'AI worker에 연결하지 못했습니다.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
