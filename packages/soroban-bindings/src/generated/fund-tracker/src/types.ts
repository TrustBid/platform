import {Address} from '@stellar/stellar-sdk';

    /**
 * Union: DataKey
 */
 export type DataKey =
  { tag: "Allocation"; values: readonly [string] } |
  { tag: "Admin"; values: void };

/**
 * Struct: FundAllocation
 */
export interface FundAllocation {
  allocated_at: bigint;
  amount_xlm: bigint;
  organization: string;
  project_id: string;
}
    