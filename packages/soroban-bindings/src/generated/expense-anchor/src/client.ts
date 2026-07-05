import {AnchoredExpense} from './types.js';
import {Spec, AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions} from '@stellar/stellar-sdk/contract';
import {Address} from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';

export interface Client {
  anchor({ caller, expense_id, project_id, amount_xlm, receipt_hash }: { caller: string | Address; expense_id: string; project_id: string; amount_xlm: bigint; receipt_hash: Buffer }, options?: MethodOptions): Promise<AssembledTransaction<void>>;
  initialize({ admin }: { admin: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<void>>;
  get_expense({ expense_id }: { expense_id: string }, options?: MethodOptions): Promise<AssembledTransaction<AnchoredExpense | null>>;
}

export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new Spec(["AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAAB0V4cGVuc2UAAAAAAQAAABEAAAAAAAAAAAAAAAVBZG1pbgAAAA==", "AAAAAAAAAAAAAAAGYW5jaG9yAAAAAAAFAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACmV4cGVuc2VfaWQAAAAAABEAAAAAAAAACnByb2plY3RfaWQAAAAAABEAAAAAAAAACmFtb3VudF94bG0AAAAAAAsAAAAAAAAADHJlY2VpcHRfaGFzaAAAAA4AAAAA", "AAAAAQAAAAAAAAAAAAAAD0FuY2hvcmVkRXhwZW5zZQAAAAAGAAAAAAAAAAphbW91bnRfeGxtAAAAAAALAAAAAAAAAAthbmNob3JlZF9hdAAAAAAGAAAAAAAAAApleHBlbnNlX2lkAAAAAAARAAAAAAAAAApwcm9qZWN0X2lkAAAAAAARAAAAAAAAAAxyZWNlaXB0X2hhc2gAAAAOAAAAAAAAAAxzdWJtaXR0ZWRfYnkAAAAT", "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==", "AAAAAAAAAAAAAAALZ2V0X2V4cGVuc2UAAAAAAQAAAAAAAAAKZXhwZW5zZV9pZAAAAAAAEQAAAAEAAAPoAAAH0AAAAA9BbmNob3JlZEV4cGVuc2UA"]),
      options
    );
  }

   static deploy<T = Client>(options: MethodOptions & Omit<ContractClientOptions, 'contractId'> & { wasmHash: Buffer | string; salt?: Buffer | Uint8Array; format?: "hex" | "base64"; address?: string; }): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options);
  }
  public readonly fromJSON = {
    anchor : this.txFromJSON<void>,  initialize : this.txFromJSON<void>,  get_expense : this.txFromJSON<AnchoredExpense | null>
  };
}