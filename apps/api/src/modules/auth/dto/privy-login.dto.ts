import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrationDto } from './token-request.dto';

export class PrivyLoginDto {
  // Access token de Privy (JWT ES256) obtenido en el cliente tras login email/OTP.
  @IsString()
  @IsNotEmpty()
  token: string;

  // Datos de bootstrap (org/país/rol) si es el primer login. provider se fuerza a 'privy'.
  @IsOptional()
  @ValidateNested()
  @Type(() => RegistrationDto)
  registration?: RegistrationDto;
}
