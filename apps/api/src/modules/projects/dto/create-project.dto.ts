import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export enum ProjectCategory {
  Infrastructure = 'infrastructure',
  Education = 'education',
  Health = 'health',
  Technology = 'technology',
  Environment = 'environment',
  Social = 'social',
  Other = 'other',
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  beneficiary?: string;

  @IsEnum(ProjectCategory)
  category: ProjectCategory;

  @IsNumber()
  @IsPositive()
  budgetAmount: number;

  @IsOptional()
  @IsString()
  @IsEnum(['XLM', 'USDC'])
  budgetAsset?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  blockchainEnabled?: boolean;
}
