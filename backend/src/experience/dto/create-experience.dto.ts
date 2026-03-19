import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
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

  @IsOptional()
  @IsBoolean()
  resumeVisible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  resumeOrder?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  @IsString({ each: true })
  resumeHighlights?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  linkedProjectIds?: number[];
}
