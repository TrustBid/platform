import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
} from 'class-validator';

export class CreateDonationDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsNumber()
  @IsPositive()
  @Max(1_000_000)
  amountUsd: number;

  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  @IsString()
  walletProvider?: string;

  // Hash de la tx Stellar real (testnet) cuando la donación se firmó on-chain.
  @IsOptional()
  @IsString()
  txHash?: string;
}
