import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class GenerateIdeaDraftRequestDto {
  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @Min(1)
  @IsOptional()
  sessionId?: number;

  @ApiPropertyOptional({
    enum: ['short', 'medium', 'long'],
    example: 'medium',
  })
  @IsIn(['short', 'medium', 'long'])
  @IsOptional()
  targetLength?: 'short' | 'medium' | 'long';
}
