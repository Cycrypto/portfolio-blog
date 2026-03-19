import { apiRequest } from '../client/base';
import {
  IdeaCandidate,
  IdeaCandidateStatus,
  ImportChatGptIdeaRequest,
  ImportChatGptIdeaResponse,
} from '../../types/api';

export async function importChatGptIdeas(
  payload: ImportChatGptIdeaRequest,
): Promise<ImportChatGptIdeaResponse> {
  const result = await apiRequest<{ data: ImportChatGptIdeaResponse }>(
    '/idea-imports/chatgpt',
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
