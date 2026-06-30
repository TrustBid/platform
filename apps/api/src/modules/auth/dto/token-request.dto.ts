import { IsString, IsNotEmpty } from 'class-validator';

export class TokenRequestDto {
  @IsString()
  @IsNotEmpty()
  transaction: string;
}
