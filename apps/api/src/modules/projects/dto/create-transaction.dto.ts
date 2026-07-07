import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @MaxLength(255)
  beneficiary: string;

  @IsString()
  @MaxLength(120)
  concept: string;

  @IsString()
  @MaxLength(100)
  category: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  assetCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  /** Cómo se liquidó el gasto: on_chain (pago Stellar verificable) o cash (efectivo, atestiguado). */
  @IsOptional()
  @IsIn(['on_chain', 'cash'])
  settlementType?: 'on_chain' | 'cash';
}
