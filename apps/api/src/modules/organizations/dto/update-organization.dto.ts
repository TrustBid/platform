import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const ORG_TYPES = ['ong', 'fundacion', 'asociacion', 'empresa_b', 'cooperativa', 'otra'] as const;
const GEO_SCOPES = ['local', 'regional', 'nacional', 'internacional'] as const;

export class UpdateOrganizationDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @MaxLength(255) legal_name?: string;
  @IsOptional() @IsString() @MaxLength(30)  acronym?: string;
  @IsOptional() @IsString() @MaxLength(100) fiscal_id?: string;
  @IsOptional() @IsIn(ORG_TYPES)            org_type?: string;
  @IsOptional() @IsString() @MaxLength(2)   country?: string;
  @IsOptional() @IsString() @MaxLength(100) state_province?: string;
  @IsOptional() @IsString()                 address_1?: string;
  @IsOptional() @IsString()                 address_2?: string;
  @IsOptional() @IsString() @MaxLength(20)  postal_code?: string;
  @IsOptional() @IsString() @MaxLength(30)  phone?: string;
  @IsOptional() @IsString()                 website?: string;
  @IsOptional() @IsString()                 social_instagram?: string;
  @IsOptional() @IsString()                 social_linkedin?: string;
  @IsOptional() @IsString()                 social_x?: string;
  @IsOptional() @IsString()                 social_facebook?: string;
  @IsOptional() @IsIn(GEO_SCOPES)           geographic_scope?: string;
  @IsOptional() @IsString()                 annual_budget_range?: string;
  @IsOptional() @IsBoolean()                onboarding_completed?: boolean;

  @IsOptional() @IsArray() @IsString({ each: true }) intervention_area_slugs?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) target_population_slugs?: string[];
  @IsOptional() @IsArray()                            ods_goal_ids?: number[];
}
