import { ApiProperty } from '@nestjs/swagger';

export class AssistantSessionResponseDto {
  @ApiProperty({ example: 12 })
  sessionId: number;

  @ApiProperty({ example: '이 글감은 인증 흐름 정리부터 시작하면 좋겠습니다. 어떤 독자를 상정하고 있나요?' })
  starterMessage: string;
}
