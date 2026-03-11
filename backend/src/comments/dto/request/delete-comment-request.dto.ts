import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteCommentRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  password?: string;
}
