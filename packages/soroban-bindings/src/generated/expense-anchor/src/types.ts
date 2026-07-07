import {Address} from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';

    /**
 * Union: DataKey
 */
 export type DataKey =
  { tag: "Expense"; values: readonly [string] } |
  { tag: "Admin"; values: void };

/**
 * Struct: AnchoredExpense
 */
export interface AnchoredExpense {
  amount_xlm: bigint;
  anchored_at: bigint;
  expense_id: string;
  project_id: string;
  receipt_hash: Buffer;
  submitted_by: string;
}
    