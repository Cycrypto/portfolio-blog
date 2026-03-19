import { ApiProperty } from '@nestjs/swagger';

export class DismissIdeaCandidatesResponseDto {
  @ApiProperty({ example: 3 })
  dismissedCount: number;
}
