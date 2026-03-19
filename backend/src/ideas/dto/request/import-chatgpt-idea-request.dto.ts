import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ImportChatGptMessageDto {
  @ApiProperty({ example: 0 })
  @IsInt()
  order: number;

  @ApiProperty({ example: 'user', enum: ['user', 'assistant', 'unknown'] })
  @IsIn(['user', 'assistant', 'unknown'])
  role: 'user' | 'assistant' | 'unknown';

  @ApiProperty({ example: 'NestJS에서 인증 구현 중 발생한 에러 정리' })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class ImportChatGptIdeaRequestDto {
  @ApiProperty({ example: 'NestJS 인증 구현 관련 대화' })
  @IsString()
  @IsNotEmpty()
  sourceTitle: string;

  @ApiProperty({ example: 'https://chatgpt.com/c/1234567890' })
  @IsString()
  @IsNotEmpty()
  sourceUrl: string;

  @ApiProperty({ example: '2026-03-19T02:30:00.000Z' })
  @IsString()
  @IsNotEmpty()
  extractedAt: string;

  @ApiProperty({ type: [ImportChatGptMessageDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportChatGptMessageDto)
  messages: ImportChatGptMessageDto[];
}
