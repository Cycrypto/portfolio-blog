import { IsEmail, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsOptional()
  @MaxLength(255)
  subject?: string;

  @IsNotEmpty()
  @MaxLength(5000)
  message: string;
}
