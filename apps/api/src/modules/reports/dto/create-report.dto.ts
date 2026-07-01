import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

export enum ReportType {
  Financial = 'financial',
  Milestone = 'milestone',
  Audit = 'audit',
}

export class CreateReportDto {
  @IsUUID()
  projectId: string;

  @IsEnum(ReportType)
  reportType: ReportType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fundsUsedAmount?: number;

  @IsOptional()
  @IsString()
  @IsEnum(['XLM', 'USDC'])
  fundsUsedAsset?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  milestoneProgress?: number;
}
