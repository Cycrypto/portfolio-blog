import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EXPERIENCE_TYPES, ExperienceType } from '../experience.constants';

export class CreateExperienceDto {
  @IsString()
  @IsIn(EXPERIENCE_TYPES)
  type: ExperienceType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  organization: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
