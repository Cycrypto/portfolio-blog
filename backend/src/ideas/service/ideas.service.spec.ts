import type { Repository } from 'typeorm';
import { IdeasService } from './ideas.service';
import { IdeaCandidate, IdeaCandidateStatus } from '../entity/idea-candidate.entity';
import { IdeaImport } from '../entity/idea-import.entity';
import { AssistantSession } from '../entity/assistant-session.entity';
import { DraftGeneration } from '../entity/draft-generation.entity';
import { IdeaGeneratorMode, IdeaSourceType } from '../entity/idea-import.enums';
import { WorkerGatewayService } from './worker-gateway.service';

jest.mock('../../posts/utils/content-renderer', () => ({
  convertMarkdownToTiptapJSON: jest.fn(() => ({
    type: 'doc',
    content: [],
  })),
}));

type MockRepository<T extends object> = Partial<
  Record<Exclude<keyof Repository<T>, 'manager'>, jest.Mock>
> & {
  manager?: {
    transaction: jest.Mock;
  };
};

function createImportQueryBuilder(result: IdeaImport | null) {
  return {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(result),
  };
}

describe('IdeasService', () => {
  let service: IdeasService;
  let ideaImportRepository: MockRepository<IdeaImport>;
  let ideaCandidateRepository: MockRepository<IdeaCandidate>;
  let assistantSessionRepository: MockRepository<AssistantSession>;
  let draftGenerationRepository: MockRepository<DraftGeneration>;
  let transactionIdeaImportRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let transactionIdeaCandidateRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let workerGatewayService: Pick<
    WorkerGatewayService,
    'getHealth' | 'importChatGptConversation'
  >;

  beforeEach(() => {
    transactionIdeaImportRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({
        id: 1,
        sourceType: IdeaSourceType.CHATGPT,
        createdAt: new Date('2026-03-21T00:00:00.000Z'),
        ...value,
      })),
    };
    transactionIdeaCandidateRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (values) =>
        values.map((value: Partial<IdeaCandidate>, index: number) => ({
          id: index + 1,
          status: IdeaCandidateStatus.OPEN,
          createdAt: new Date('2026-03-21T00:00:00.000Z'),
          ...value,
        })),
      ),
    };
    const transactionManager = {
      getRepository: jest.fn((entity) => {
        if (entity === IdeaImport) {
          return transactionIdeaImportRepository;
        }

        if (entity === IdeaCandidate) {
          return transactionIdeaCandidateRepository;
        }

        throw new Error('unexpected repository request');
      }),
    };

    ideaImportRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(createImportQueryBuilder(null)),
      manager: {
        transaction: jest.fn(async (callback) => callback(transactionManager)),
      },
    };
    ideaCandidateRepository = {};
    assistantSessionRepository = {};
    draftGenerationRepository = {};
    workerGatewayService = {
      getHealth: jest.fn().mockRejectedValue(new Error('health should not be called')),
      importChatGptConversation: jest.fn().mockResolvedValue({
        workerImportId: 'worker-import-1',
        summary: {
          summaryShort: '짧은 요약',
          summaryLong: '긴 요약',
          keyPoints: ['key-point'],
          technicalTopics: ['nestjs'],
          decisions: ['decision'],
          openQuestions: ['question'],
          evidenceSnippets: ['snippet'],
          continuationBrief: 'continue',
        },
        candidates: [
          {
            title: 'NestJS 인증 글감',
            category: 'tutorial',
            tags: ['nestjs', 'auth'],
            keywords: ['jwt', 'guard'],
            evidenceSnippet: '인증 흐름을 정리한 대화',
            score: 4,
            continuationBrief: 'continue',
            sourceMessageRefs: [0],
          },
        ],
      }),
    };

    service = new IdeasService(
      ideaImportRepository as unknown as Repository<IdeaImport>,
      ideaCandidateRepository as unknown as Repository<IdeaCandidate>,
      assistantSessionRepository as unknown as Repository<AssistantSession>,
      draftGenerationRepository as unknown as Repository<DraftGeneration>,
      workerGatewayService as WorkerGatewayService,
    );
  });

  it('attempts the worker import without a health preflight', async () => {
    const result = await service.importChatGptConversationWithAI(
      {
        sourceTitle: ' NestJS 인증 구현 관련 대화 ',
        sourceUrl: ' https://chatgpt.com/c/123 ',
        extractedAt: ' 2026-03-19T02:30:00.000Z ',
        messages: [
          {
            order: 0,
            role: 'user',
            text: ' NestJS 인증 구현 중 발생한 에러를 정리해줘. ',
          },
        ],
      },
      7,
    );

    expect(workerGatewayService.getHealth).not.toHaveBeenCalled();
    expect(workerGatewayService.importChatGptConversation).toHaveBeenCalledWith({
      sourceTitle: 'NestJS 인증 구현 관련 대화',
      sourceUrl: 'https://chatgpt.com/c/123',
      extractedAt: '2026-03-19T02:30:00.000Z',
      messages: [
        {
          order: 0,
          role: 'user',
          text: 'NestJS 인증 구현 중 발생한 에러를 정리해줘.',
        },
      ],
    });
    expect(result).toMatchObject({
      importId: 1,
      mode: 'worker',
      deduped: false,
      candidates: [
        {
          title: 'NestJS 인증 글감',
          generator: IdeaGeneratorMode.WORKER,
          sourceUrl: 'https://chatgpt.com/c/123',
        },
      ],
    });
  });

  it('falls back and persists fallback candidates when the worker import fails', async () => {
    (
      workerGatewayService.importChatGptConversation as jest.Mock
    ).mockRejectedValueOnce(new Error('worker unavailable'));

    const result = await service.importChatGptConversationWithAI(
      {
        sourceTitle: ' NestJS 인증 구현 관련 대화 ',
        sourceUrl: ' https://chatgpt.com/c/456 ',
        extractedAt: ' 2026-03-19T02:30:00.000Z ',
        messages: [
          {
            order: 0,
            role: 'user',
            text: 'NestJS JWT 인증 구현 중 오류가 났다.',
          },
          {
            order: 1,
            role: 'assistant',
            text: 'JwtAuthGuard와 토큰 검증 흐름을 점검하고 수정해서 해결하자.',
          },
        ],
      },
      7,
    );

    expect(workerGatewayService.getHealth).not.toHaveBeenCalled();
    expect(workerGatewayService.importChatGptConversation).toHaveBeenCalledTimes(1);
    expect(transactionIdeaImportRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        generator: IdeaGeneratorMode.FALLBACK,
        workerImportId: null,
      }),
    );
    expect(transactionIdeaCandidateRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          generator: IdeaGeneratorMode.FALLBACK,
        }),
      ]),
    );
    expect(result.mode).toBe('fallback');
    expect(result.deduped).toBe(false);
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          generator: IdeaGeneratorMode.FALLBACK,
          sourceUrl: 'https://chatgpt.com/c/456',
        }),
      ]),
    );
  });
});
