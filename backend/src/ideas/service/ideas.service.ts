import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerateIdeaDraftRequestDto } from '../dto/request/generate-idea-draft-request.dto';
import { ImportChatGptIdeaRequestDto } from '../dto/request/import-chatgpt-idea-request.dto';
import { SendAssistantMessageRequestDto } from '../dto/request/send-assistant-message-request.dto';
import { AssistantMessageResponseDto } from '../dto/response/assistant-message-response.dto';
import { AssistantSessionResponseDto } from '../dto/response/assistant-session-response.dto';
import { DraftGenerationResponseDto } from '../dto/response/draft-generation-response.dto';
import { AiStatusResponseDto } from '../dto/response/ai-status-response.dto';
import { IdeaCandidateResponseDto } from '../dto/response/idea-candidate-response.dto';
import {
  AssistantSession,
  AssistantSessionStatus,
} from '../entity/assistant-session.entity';
import { DraftGeneration } from '../entity/draft-generation.entity';
import {
  IdeaCandidate,
  IdeaCandidateStatus,
} from '../entity/idea-candidate.entity';
import {
  IdeaGeneratorMode,
  IdeaImport,
  IdeaSourceType,
} from '../entity/idea-import.entity';
import { WorkerGatewayService } from './worker-gateway.service';
import {
  createSourceFingerprint,
  extractIdeaCandidates,
  type IdeaInputMessage,
} from '../utils/idea-extractor';
import { buildFallbackSummaryPackage } from '../utils/fallback-summary';
import {
  IdeaSummaryPackage,
  PersistedIdeaCandidateInput,
  WorkerImportChatGptResult,
} from '../types/worker.types';
import { convertMarkdownToTiptapJSON } from '../../posts/utils/content-renderer';

type ImportMode = 'worker' | 'fallback';

interface ImportIdeaResult {
  importId: number;
  mode: ImportMode;
  deduped: boolean;
  candidates: IdeaCandidateResponseDto[];
}

@Injectable()
export class IdeasService {
  private readonly logger = new Logger(IdeasService.name);

  constructor(
    @InjectRepository(IdeaImport)
    private readonly ideaImportRepository: Repository<IdeaImport>,
    @InjectRepository(IdeaCandidate)
    private readonly ideaCandidateRepository: Repository<IdeaCandidate>,
    @InjectRepository(AssistantSession)
    private readonly assistantSessionRepository: Repository<AssistantSession>,
    @InjectRepository(DraftGeneration)
    private readonly draftGenerationRepository: Repository<DraftGeneration>,
    private readonly workerGatewayService: WorkerGatewayService,
  ) {}

  async importChatGptConversation(
    payload: ImportChatGptIdeaRequestDto,
    userId: number,
  ): Promise<{
    importId: number;
    deduped: boolean;
    candidates: IdeaCandidateResponseDto[];
  }> {
    const result = await this.importConversation(payload, userId, false);
    return {
      importId: result.importId,
      deduped: result.deduped,
      candidates: result.candidates,
    };
  }

  async importChatGptConversationWithAI(
    payload: ImportChatGptIdeaRequestDto,
    userId: number,
  ): Promise<ImportIdeaResult> {
    return this.importConversation(payload, userId, true);
  }

  async getIdeaCandidates(
    status: IdeaCandidateStatus = IdeaCandidateStatus.OPEN,
    limit: number = 20,
  ): Promise<IdeaCandidateResponseDto[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const candidates = await this.ideaCandidateRepository.find({
      where: { status },
      relations: ['ideaImport'],
      order: {
        createdAt: 'DESC',
        score: 'DESC',
      },
      take: safeLimit,
    });

    return candidates.map((candidate) => this.toIdeaCandidateResponseDto(candidate));
  }

  async getAiStatus(): Promise<AiStatusResponseDto> {
    const health = await this.workerGatewayService.getHealth();
    const response = new AiStatusResponseDto();

    if (health.available) {
      response.mode = 'worker';
      response.assistantAvailable = true;
      response.draftAvailable = true;
      response.workerAvailable = true;
      response.model = health.model;
      response.reason = null;
      return response;
    }

    response.mode = 'fallback';
    response.assistantAvailable = false;
    response.draftAvailable = false;
    response.workerAvailable = false;
    response.model = null;
    response.reason =
      health.reason || 'AI worker를 사용할 수 없어 fallback 모드로 동작합니다.';
    return response;
  }

  async startAssistantSession(
    ideaCandidateId: number,
  ): Promise<AssistantSessionResponseDto> {
    await this.ensureWorkerAvailable();
    const ideaCandidate = await this.requireIdeaCandidate(ideaCandidateId);

    const workerSession = await this.workerGatewayService.startAssistantSession(
      buildWorkerIdeaContext(ideaCandidate),
    );

    const savedSession = await this.assistantSessionRepository.save(
      this.assistantSessionRepository.create({
        ideaCandidateId: ideaCandidate.id,
        workerSessionId: workerSession.workerSessionId,
        status: AssistantSessionStatus.ACTIVE,
        sessionSummary: workerSession.sessionSummary,
        lastMessageAt: new Date(),
      }),
    );

    const response = new AssistantSessionResponseDto();
    response.sessionId = savedSession.id;
    response.starterMessage = workerSession.starterMessage;
    return response;
  }

  async sendAssistantMessage(
    sessionId: number,
    payload: SendAssistantMessageRequestDto,
  ): Promise<AssistantMessageResponseDto> {
    await this.ensureWorkerAvailable();

    const session = await this.assistantSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('어시스턴트 세션을 찾을 수 없습니다.');
    }

    if (session.status !== AssistantSessionStatus.ACTIVE) {
      throw new BadRequestException('활성 상태가 아닌 어시스턴트 세션입니다.');
    }

    const workerReply = await this.workerGatewayService.sendAssistantMessage({
      sessionId: session.workerSessionId,
      message: payload.message.trim(),
    });

    session.sessionSummary = workerReply.sessionSummary;
    session.lastMessageAt = new Date();
    await this.assistantSessionRepository.save(session);

    const response = new AssistantMessageResponseDto();
    response.reply = workerReply.reply;
    response.suggestions = workerReply.suggestions;
    response.continuationBrief = workerReply.continuationBrief;
    return response;
  }

  async generateIdeaDraft(
    ideaCandidateId: number,
    payload: GenerateIdeaDraftRequestDto,
  ): Promise<DraftGenerationResponseDto> {
    await this.ensureWorkerAvailable();
    const ideaCandidate = await this.requireIdeaCandidate(ideaCandidateId);

    let workerSessionId: string | undefined;
    let assistantSessionId: number | null = null;

    if (payload.sessionId) {
      const session = await this.assistantSessionRepository.findOne({
        where: {
          id: payload.sessionId,
          ideaCandidateId,
        },
      });

      if (!session) {
        throw new NotFoundException('선택한 글감의 어시스턴트 세션을 찾을 수 없습니다.');
      }

      workerSessionId = session.workerSessionId;
      assistantSessionId = session.id;
    }

    const workerDraft = await this.workerGatewayService.generateDraft({
      ...buildWorkerIdeaContext(ideaCandidate),
      sessionId: workerSessionId,
      targetLength: payload.targetLength,
    });

    const savedGeneration = await this.draftGenerationRepository.save(
      this.draftGenerationRepository.create({
        ideaCandidateId,
        assistantSessionId,
        title: workerDraft.title,
        category: workerDraft.category,
        tags: workerDraft.tags,
        markdown: workerDraft.markdown,
        createdPostId: null,
      }),
    );

    const response = new DraftGenerationResponseDto();
    response.generationId = savedGeneration.id;
    response.title = workerDraft.title;
    response.category = workerDraft.category;
    response.tags = workerDraft.tags;
    response.markdown = workerDraft.markdown;
    response.contentJson = convertMarkdownToTiptapJSON(
      workerDraft.markdown,
    ) as Record<string, unknown>;
    return response;
  }

  private async importConversation(
    payload: ImportChatGptIdeaRequestDto,
    userId: number,
    preferWorker: boolean,
  ): Promise<ImportIdeaResult> {
    const messages = sanitizeMessages(payload.messages);
    if (messages.length === 0) {
      throw new BadRequestException('가져올 대화 메시지가 없습니다.');
    }

    const sourceTitle = payload.sourceTitle.trim();
    const sourceUrl = payload.sourceUrl.trim();
    const extractedAt = payload.extractedAt.trim();
    const sourceFingerprint = createSourceFingerprint(sourceUrl, messages);

    const dedupedImport = await this.findOpenImportByFingerprint(sourceFingerprint);
    if (dedupedImport) {
      const openCandidates = (dedupedImport.candidates || [])
        .filter((candidate) => candidate.status === IdeaCandidateStatus.OPEN)
        .sort(compareCandidates);

      return {
        importId: dedupedImport.id,
        mode:
          dedupedImport.generator === IdeaGeneratorMode.WORKER
            ? 'worker'
            : 'fallback',
        deduped: true,
        candidates: openCandidates.map((candidate) =>
          this.toIdeaCandidateResponseDto(candidate),
        ),
      };
    }

    if (preferWorker) {
      const health = await this.workerGatewayService.getHealth();
      if (health.available) {
        try {
          const workerResult =
            await this.workerGatewayService.importChatGptConversation({
              ...payload,
              sourceTitle,
              sourceUrl,
              extractedAt,
              messages,
            });

          const savedWorkerImport = await this.persistIdeaImport({
            sourceType: IdeaSourceType.CHATGPT,
            sourceTitle,
            sourceUrl,
            sourceFingerprint,
            messageCount: messages.length,
            extractedAt,
            createdByUserId: userId,
            summary: workerResult.summary,
            generator: IdeaGeneratorMode.WORKER,
            workerImportId: workerResult.workerImportId,
            candidates: normalizeWorkerCandidates(workerResult),
          });

          return {
            importId: savedWorkerImport.importId,
            mode: 'worker',
            deduped: false,
            candidates: savedWorkerImport.candidates,
          };
        } catch (error) {
          this.logger.warn(
            `AI worker import failed for ${sourceUrl}: ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
          );
        }
      }
    }

    const extractedCandidates = extractIdeaCandidates({
      sourceTitle,
      messages,
    });
    const fallbackSummary = buildFallbackSummaryPackage({
      sourceTitle,
      sourceUrl,
      messages,
      candidates: extractedCandidates,
    });

    const savedFallbackImport = await this.persistIdeaImport({
      sourceType: IdeaSourceType.CHATGPT,
      sourceTitle,
      sourceUrl,
      sourceFingerprint,
      messageCount: messages.length,
      extractedAt,
      createdByUserId: userId,
      summary: fallbackSummary,
      generator: IdeaGeneratorMode.FALLBACK,
      workerImportId: null,
      candidates: extractedCandidates.map((candidate) => ({
        ...candidate,
        generator: IdeaGeneratorMode.FALLBACK,
        continuationBrief: fallbackSummary.continuationBrief,
        sourceMessageRefs: [],
      })),
    });

    return {
      importId: savedFallbackImport.importId,
      mode: 'fallback',
      deduped: false,
      candidates: savedFallbackImport.candidates,
    };
  }

  private async persistIdeaImport(input: {
    sourceType: IdeaSourceType;
    sourceTitle: string;
    sourceUrl: string;
    sourceFingerprint: string;
    messageCount: number;
    extractedAt: string;
    createdByUserId: number;
    summary: IdeaSummaryPackage;
    generator: IdeaGeneratorMode;
    workerImportId: string | null;
    candidates: PersistedIdeaCandidateInput[];
  }): Promise<{ importId: number; candidates: IdeaCandidateResponseDto[] }> {
    return this.ideaImportRepository.manager.transaction(async (manager) => {
      const ideaImportRepository = manager.getRepository(IdeaImport);
      const ideaCandidateRepository = manager.getRepository(IdeaCandidate);

      const savedImport = await ideaImportRepository.save(
        ideaImportRepository.create({
          sourceType: input.sourceType,
          sourceTitle: input.sourceTitle,
          sourceUrl: input.sourceUrl,
          sourceFingerprint: input.sourceFingerprint,
          messageCount: input.messageCount,
          extractedAt: input.extractedAt,
          createdByUserId: input.createdByUserId,
          summaryShort: input.summary.summaryShort,
          summaryLong: input.summary.summaryLong,
          keyPoints: input.summary.keyPoints,
          technicalTopics: input.summary.technicalTopics,
          decisions: input.summary.decisions,
          openQuestions: input.summary.openQuestions,
          evidenceSnippets: input.summary.evidenceSnippets,
          continuationBrief: input.summary.continuationBrief,
          generator: input.generator,
          workerImportId: input.workerImportId,
        }),
      );

      const savedCandidates = await ideaCandidateRepository.save(
        input.candidates.map((candidate) =>
          ideaCandidateRepository.create({
            importId: savedImport.id,
            ideaImport: savedImport,
            title: candidate.title,
            category: candidate.category,
            tags: candidate.tags,
            keywords: candidate.keywords,
            evidenceSnippet: candidate.evidenceSnippet,
            score: candidate.score,
            generator: candidate.generator,
            continuationBrief:
              candidate.continuationBrief || input.summary.continuationBrief,
            sourceMessageRefs: candidate.sourceMessageRefs || [],
            status: IdeaCandidateStatus.OPEN,
            usedPostId: null,
            usedAt: null,
          }),
        ),
      );

      return {
        importId: savedImport.id,
        candidates: savedCandidates
          .sort(compareCandidates)
          .map((candidate) => this.toIdeaCandidateResponseDto(candidate)),
      };
    });
  }

  private async ensureWorkerAvailable(): Promise<void> {
    const health = await this.workerGatewayService.getHealth();

    if (!health.available) {
      throw new ServiceUnavailableException(
        health.reason || 'AI worker를 사용할 수 없습니다.',
      );
    }
  }

  private async requireIdeaCandidate(id: number): Promise<IdeaCandidate> {
    const candidate = await this.ideaCandidateRepository.findOne({
      where: { id },
      relations: ['ideaImport'],
    });

    if (!candidate) {
      throw new NotFoundException('글감 후보를 찾을 수 없습니다.');
    }

    return candidate;
  }

  private async findOpenImportByFingerprint(
    fingerprint: string,
  ): Promise<IdeaImport | null> {
    return this.ideaImportRepository
      .createQueryBuilder('ideaImport')
      .innerJoinAndSelect(
        'ideaImport.candidates',
        'candidate',
        'candidate.status = :status',
        { status: IdeaCandidateStatus.OPEN },
      )
      .where('ideaImport.sourceFingerprint = :fingerprint', { fingerprint })
      .orderBy('ideaImport.createdAt', 'DESC')
      .addOrderBy('candidate.score', 'DESC')
      .getOne();
  }

  private toIdeaCandidateResponseDto(
    candidate: IdeaCandidate,
  ): IdeaCandidateResponseDto {
    const responseDto = new IdeaCandidateResponseDto();
    responseDto.id = candidate.id;
    responseDto.title = candidate.title;
    responseDto.category = candidate.category;
    responseDto.tags = candidate.tags || [];
    responseDto.keywords = candidate.keywords || [];
    responseDto.evidenceSnippet = candidate.evidenceSnippet;
    responseDto.score = candidate.score;
    responseDto.status = candidate.status;
    responseDto.sourceUrl = candidate.ideaImport?.sourceUrl || '';
    responseDto.createdAt = candidate.createdAt.toISOString();
    responseDto.generator = candidate.generator;
    responseDto.continuationBrief = candidate.continuationBrief;
    responseDto.sourceMessageRefs = candidate.sourceMessageRefs || [];
    return responseDto;
  }
}

function sanitizeMessages(
  messages: ImportChatGptIdeaRequestDto['messages'],
): IdeaInputMessage[] {
  return messages
    .map((message) => ({
      order: message.order,
      role: message.role,
      text: message.text.trim(),
    }))
    .filter((message) => message.text.length > 0)
    .sort((left, right) => left.order - right.order);
}

function normalizeWorkerCandidates(
  workerResult: WorkerImportChatGptResult,
): PersistedIdeaCandidateInput[] {
  return workerResult.candidates
    .map((candidate) => ({
      ...candidate,
      title: candidate.title.trim(),
      category: candidate.category.trim() || 'tutorial',
      tags: uniqueTrimmed(candidate.tags).slice(0, 5),
      keywords: uniqueTrimmed(candidate.keywords).slice(0, 8),
      evidenceSnippet: candidate.evidenceSnippet.trim(),
      score: Number.isFinite(candidate.score) ? candidate.score : 1,
      continuationBrief: candidate.continuationBrief?.trim() || null,
      sourceMessageRefs: Array.isArray(candidate.sourceMessageRefs)
        ? candidate.sourceMessageRefs
            .filter((value) => Number.isInteger(value) && value >= 0)
            .slice(0, 8)
        : [],
      generator: IdeaGeneratorMode.WORKER,
    }))
    .filter((candidate) => candidate.title.length > 0);
}

function buildWorkerIdeaContext(ideaCandidate: IdeaCandidate) {
  return {
    ideaCandidateId: ideaCandidate.id,
    workerImportId: ideaCandidate.ideaImport.workerImportId,
    sourceTitle: ideaCandidate.ideaImport.sourceTitle,
    sourceUrl: ideaCandidate.ideaImport.sourceUrl,
    summaryShort: ideaCandidate.ideaImport.summaryShort,
    summaryLong: ideaCandidate.ideaImport.summaryLong,
    keyPoints: ideaCandidate.ideaImport.keyPoints || [],
    technicalTopics: ideaCandidate.ideaImport.technicalTopics || [],
    decisions: ideaCandidate.ideaImport.decisions || [],
    openQuestions: ideaCandidate.ideaImport.openQuestions || [],
    evidenceSnippets: ideaCandidate.ideaImport.evidenceSnippets || [],
    continuationBrief:
      ideaCandidate.continuationBrief || ideaCandidate.ideaImport.continuationBrief,
    title: ideaCandidate.title,
    category: ideaCandidate.category,
    tags: ideaCandidate.tags || [],
    keywords: ideaCandidate.keywords || [],
    evidenceSnippet: ideaCandidate.evidenceSnippet,
  };
}

function uniqueTrimmed(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
}

function compareCandidates(left: IdeaCandidate, right: IdeaCandidate): number {
  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return right.createdAt.getTime() - left.createdAt.getTime();
  }

  return right.score - left.score;
}
