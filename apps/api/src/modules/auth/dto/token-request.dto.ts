import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsEnum,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum UserRole {
  Admin = 'admin',
  Responsable = 'responsable',
  Donante = 'donante',
}

// Datos del formulario de registro. Solo se usan al hacer bootstrap de un
// usuario/organización nuevos; si la wallet ya existe se ignoran.
export class RegistrationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  orgName?: string;

  @IsOptional()
  @Matches(/^[A-Za-z]{2}$/, { message: 'country must be a 2-letter ISO code' })
  country?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  // id de wallet del Stellar Wallets Kit (freighter, albedo, xbull, …).
  @IsOptional()
  @IsString()
  @MaxLength(40)
  provider?: string;
}

export class TokenRequestDto {
  @IsString()
  @IsNotEmpty()
  transaction: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegistrationDto)
  registration?: RegistrationDto;
}
