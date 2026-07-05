import { IsIn, IsString, Matches } from 'class-validator';

const BADGE_TYPES = [
  'kyb_verified',
  'transparency_bronze',
  'transparency_silver',
  'transparency_gold',
] as const;

export type BadgeTypeDto = (typeof BADGE_TYPES)[number];

export class MintBadgeDto {
  @IsString()
  organizationId!: string;

  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, { message: 'organizationWallet must be a valid Stellar public key' })
  organizationWallet!: string;

  @IsIn(BADGE_TYPES)
  badgeType!: BadgeTypeDto;
}

export class RevokeBadgeDto {
  @IsString()
  organizationId!: string;
}
