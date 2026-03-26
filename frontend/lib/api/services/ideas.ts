import { ApiError, apiRequest } from '../client/base';
import {
  AiStatusResponse,
  AssistantReply,
  AssistantSession,
  DismissIdeaCandidatesResponse,
  DraftGenerationResponse,
  IdeaCandidate,
  IdeaCandidateStatus,
  ImportChatGptIdeaRequest,
  ImportChatGptIdeaResponse,
} from '../../types/api';

export async function importChatGptIdeas(
  payload: ImportChatGptIdeaRequest,
): Promise<ImportChatGptIdeaResponse> {
  const result = await apiRequest<{ data: ImportChatGptIdeaResponse }>(
    '/ai-imports/chatgpt',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return result.data;
}

export async function getIdeaCandidates(
  status: IdeaCandidateStatus = 'open',
  limit: number = 20,
): Promise<IdeaCandidate[]> {
  const result = await apiRequest<{ data: IdeaCandidate[] }>(
    `/idea-candidates?status=${encodeURIComponent(status)}&limit=${limit}`,
  );

  return result.data || [];
}

export async function dismissIdeaCandidate(
  ideaId: number,
): Promise<IdeaCandidate> {
  const result = await apiRequest<{ data: IdeaCandidate }>(
    `/idea-candidates/${ideaId}`,
    {
      method: 'DELETE',
    },
  );

  return result.data;
}

export async function dismissAllIdeaCandidates(): Promise<DismissIdeaCandidatesResponse> {
  const result = await apiRequest<{ data: DismissIdeaCandidatesResponse }>(
    '/idea-candidates',
    {
      method: 'DELETE',
    },
  );

  return result.data;
}

export async function getAiStatus(): Promise<AiStatusResponse> {
  const result = await apiRequest<{ data: AiStatusResponse }>('/ai/status');
  return result.data;
}

export async function startIdeaAssistantSession(
  ideaId: number,
): Promise<AssistantSession> {
  const result = await apiRequest<{ data: AssistantSession }>(
    `/ideas/${ideaId}/session`,
    {
      method: 'POST',
    },
  );

  return result.data;
}

export async function sendAssistantMessage(
  sessionId: number,
  message: string,
): Promise<AssistantReply> {
  const result = await apiRequest<{ data: AssistantReply }>(
    `/assistant/sessions/${sessionId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    },
  );

  return result.data;
}

export async function generateIdeaDraft(
  ideaId: number,
  payload: {
    sessionId?: number;
    targetLength?: 'short' | 'medium' | 'long';
  } = {},
): Promise<DraftGenerationResponse> {
  const result = await apiRequest<{ data: DraftGenerationResponse }>(
    `/ideas/${ideaId}/draft`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  return result.data;
}

export async function getLatestIdeaDraft(
  ideaId: number,
): Promise<DraftGenerationResponse | null> {
  try {
    const result = await apiRequest<{ data: DraftGenerationResponse }>(
      `/ideas/${ideaId}/draft`,
      {
        method: 'GET',
      },
    );

    return result.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
