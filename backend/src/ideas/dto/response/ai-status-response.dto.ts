import { ApiProperty } from '@nestjs/swagger';

export class AiStatusResponseDto {
  @ApiProperty({ enum: ['worker', 'fallback', 'unavailable'], example: 'worker' })
  mode: 'worker' | 'fallback' | 'unavailable';

  @ApiProperty({ example: true })
  assistantAvailable: boolean;

  @ApiProperty({ example: true })
  draftAvailable: boolean;

  @ApiProperty({ example: true })
  workerAvailable: boolean;

  @ApiProperty({ example: 'gpt-5.4', required: false, nullable: true })
  model?: string | null;

  @ApiProperty({ example: 'Worker unavailable, fallback extractor active.', required: false, nullable: true })
  reason?: string | null;
}
