import { ApiProperty } from '@nestjs/swagger';

export class AssistantMessageResponseDto {
  @ApiProperty({ example: '좋습니다. 먼저 문제 상황을 짧게 제시하고 JWT 가드 흐름을 분리해서 설명해봅시다.' })
  reply: string;

  @ApiProperty({ type: [String], example: ['독자 수준을 더 구체화하기', '코드 예시 섹션 추가'] })
  suggestions: string[];

  @ApiProperty({ example: '원본 대화 핵심: NestJS 인증 에러 원인 분석, TypeORM relation 정리, guard 흐름 개선.' })
  continuationBrief: string;
}
