import { ApiProperty } from '@nestjs/swagger';
import { IdeaCandidateResponseDto } from './idea-candidate-response.dto';

export class AiImportChatGptResponseDto {
  @ApiProperty({ example: 1 })
  importId: number;

  @ApiProperty({ enum: ['worker', 'fallback'], example: 'worker' })
  mode: 'worker' | 'fallback';

  @ApiProperty({ example: false })
  deduped: boolean;

  @ApiProperty({ type: [IdeaCandidateResponseDto] })
  candidates: IdeaCandidateResponseDto[];
}
