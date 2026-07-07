import {Address} from '@stellar/stellar-sdk';

    /**
 * Struct: Badge
 */
export interface Badge {
  badge_type: string;
  issued_at: bigint;
  organization: string;
  revoked_at: bigint;
  status: BadgeStatus;
  token_id: bigint;
}

/**
 * Union: DataKey
 */
 export type DataKey =
  { tag: "Admin"; values: void } |
  { tag: "NextTokenId"; values: void } |
  { tag: "BadgeById"; values: readonly [bigint] } |
  { tag: "OrgBadges"; values: readonly [string] };

/**
 * Union: BadgeStatus
 */
 export type BadgeStatus =
  { tag: "Active"; values: void } |
  { tag: "Revoked"; values: void };
    