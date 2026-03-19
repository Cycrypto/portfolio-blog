import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdeaImport, IdeaSourceType } from '../entity/idea-import.entity';
import {
  IdeaCandidate,
  IdeaCandidateStatus,
} from '../entity/idea-candidate.entity';
import { ImportChatGptIdeaRequestDto } from '../dto/request/import-chatgpt-idea-request.dto';
import {
  createSourceFingerprint,
  extractIdeaCandidates,
  type IdeaInputMessage,
} from '../utils/idea-extractor';
import { IdeaCandidateResponseDto } from '../dto/response/idea-candidate-response.dto';

@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(IdeaImport)
    private readonly ideaImportRepository: Repository<IdeaImport>,
    @InjectRepository(IdeaCandidate)
    private readonly ideaCandidateRepository: Repository<IdeaCandidate>,
  ) {}

  async importChatGptConversation(
    payload: ImportChatGptIdeaRequestDto,
    createdByUserId: number,
  ): Promise<{
    importId: number;
    deduped: boolean;
    candidates: IdeaCandidateResponseDto[];
  }> {
    const messages = sanitizeMessages(payload.messages);

    if (messages.length === 0) {
      throw new BadRequestException('가져올 대화 메시지가 없습니다.');
    }

    const sourceFingerprint = createSourceFingerprint(payload.sourceUrl, messages);
    const dedupedImport = await this.findOpenImportByFingerprint(sourceFingerprint);

    if (dedupedImport) {
      const openCandidates = (dedupedImport.candidates || [])
        .filter((candidate) => candidate.status === IdeaCandidateStatus.OPEN)
        .sort(compareCandidates);

      return {
        importId: dedupedImport.id,
        deduped: true,
        candidates: openCandidates.map((candidate) =>
          this.toIdeaCandidateResponseDto(candidate),
        ),
      };
    }

    const extractedCandidates = extractIdeaCandidates({
      sourceTitle: payload.sourceTitle,
      messages,
    });

    const savedImport = await this.ideaImportRepository.save(
      this.ideaImportRepository.create({
        sourceType: IdeaSourceType.CHATGPT,
        sourceTitle: payload.sourceTitle.trim(),
        sourceUrl: payload.sourceUrl.trim(),
        sourceFingerprint,
        messageCount: messages.length,
        extractedAt: payload.extractedAt.trim(),
        createdByUserId,
      }),
    );

    const savedCandidates = await this.ideaCandidateRepository.save(
      extractedCandidates.map((candidate) =>
        this.ideaCandidateRepository.create({
          importId: savedImport.id,
          ideaImport: savedImport,
          title: candidate.title,
          category: candidate.category,
          tags: candidate.tags,
          keywords: candidate.keywords,
          evidenceSnippet: candidate.evidenceSnippet,
          score: candidate.score,
          status: IdeaCandidateStatus.OPEN,
          usedPostId: null,
          usedAt: null,
        }),
      ),
    );

    return {
      importId: savedImport.id,
      deduped: false,
      candidates: savedCandidates
        .sort(compareCandidates)
        .map((candidate) => this.toIdeaCandidateResponseDto(candidate)),
    };
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

function compareCandidates(left: IdeaCandidate, right: IdeaCandidate): number {
  if (left.createdAt.getTime() !== right.createdAt.getTime()) {
    return right.createdAt.getTime() - left.createdAt.getTime();
  }

  return right.score - left.score;
}
