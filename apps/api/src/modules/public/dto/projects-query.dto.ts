import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProjectsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
