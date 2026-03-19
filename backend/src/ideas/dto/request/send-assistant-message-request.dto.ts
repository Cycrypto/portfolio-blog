import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendAssistantMessageRequestDto {
  @ApiProperty({ example: '이 글의 문제-해결 구조를 더 또렷하게 잡아줘.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;
}
