import { ApiProperty } from '@nestjs/swagger';

export class DraftGenerationResponseDto {
  @ApiProperty({ example: 9 })
  generationId: number;

  @ApiProperty({ example: 'NestJS JWT 인증 문제를 정리하며 정돈한 디버깅 포인트' })
  title: string;

  @ApiProperty({ example: 'backend' })
  category: string;

  @ApiProperty({ type: [String], example: ['NestJS', 'Auth', 'JWT'] })
  tags: string[];

  @ApiProperty({ example: '# 제목\n\n본문...' })
  markdown: string;

  @ApiProperty({
    example: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
  })
  contentJson: Record<string, unknown>;
}
