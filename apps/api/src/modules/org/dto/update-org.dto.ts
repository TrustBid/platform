import { IsOptional, IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class UpdateOrgDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @Matches(/^[A-Za-z]{2}$/, { message: 'country must be a 2-letter ISO code' })
  country?: string;
}
