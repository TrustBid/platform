export type BadgeType =
  | 'kyb_verified'
  | 'transparency_bronze'
  | 'transparency_silver'
  | 'transparency_gold';

export type BlockchainAnchorStatus = 'pending' | 'anchored' | 'failed' | null;

export interface OrganizationBadge {
  id: string;
  badgeType: BadgeType;
  status: string;
  tokenId: number | null;
  anchorTxHash: string | null;
  issuedAt: string | null;
}

export interface OnChainBadge {
  tokenId: number;
  badgeType: string;
  status: 'Active' | 'Revoked';
  issuedAt: number;
  revokedAt: number;
}

export interface OrganizationBadgesResponse {
  organizationId: string;
  walletAddress: string | null;
  badges: OrganizationBadge[];
  onChain: OnChainBadge[];
}
