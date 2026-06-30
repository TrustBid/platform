import { IsString, Matches } from 'class-validator';

export class ChallengeQueryDto {
  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, { message: 'Invalid Stellar account address' })
  account: string;
}
