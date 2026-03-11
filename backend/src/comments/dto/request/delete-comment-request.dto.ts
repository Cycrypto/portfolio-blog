import { IsEmail, IsOptional, MaxLength } from 'class-validator';

export class DeleteCommentRequestDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  authorEmail?: string;
}
