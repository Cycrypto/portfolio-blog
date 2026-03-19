import { ApiProperty } from '@nestjs/swagger';
import { IdeaCandidateStatus } from '../../entity/idea-candidate.entity';

export class IdeaCandidateResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'NestJS에서 인증 문제 해결하기' })
  title: string;

  @ApiProperty({ example: 'backend' })
  category: string;

  @ApiProperty({ type: [String], example: ['NestJS', 'Auth'] })
  tags: string[];

  @ApiProperty({ type: [String], example: ['NestJS', '인증', '에러'] })
  keywords: string[];

  @ApiProperty({ example: 'NestJS JWT 인증 플로우를 정리하고 에러 원인을 분석했다.' })
  evidenceSnippet: string;

  @ApiProperty({ example: 13 })
  score: number;

  @ApiProperty({ example: 'open', enum: IdeaCandidateStatus })
  status: IdeaCandidateStatus;

  @ApiProperty({ example: 'https://chatgpt.com/c/1234567890' })
  sourceUrl: string;

  @ApiProperty({ example: '2026-03-19T02:30:00.000Z' })
  createdAt: string;
}
