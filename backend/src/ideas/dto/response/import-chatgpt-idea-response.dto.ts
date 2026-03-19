import { ApiProperty } from '@nestjs/swagger';
import { IdeaCandidateResponseDto } from './idea-candidate-response.dto';

export class ImportChatGptIdeaResponseDto {
  @ApiProperty({ example: 1 })
  importId: number;

  @ApiProperty({ example: false })
  deduped: boolean;

  @ApiProperty({ type: [IdeaCandidateResponseDto] })
  candidates: IdeaCandidateResponseDto[];
}
