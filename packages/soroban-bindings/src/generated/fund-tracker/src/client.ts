import {FundAllocation} from './types.js';
import {Spec, AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions} from '@stellar/stellar-sdk/contract';
import {Address} from '@stellar/stellar-sdk';

export interface Client {
  allocate({ caller, project_id, amount_xlm }: { caller: string | Address; project_id: string; amount_xlm: bigint }, options?: MethodOptions): Promise<AssembledTransaction<void>>;
  initialize({ admin }: { admin: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<void>>;
  get_allocation({ project_id }: { project_id: string }, options?: MethodOptions): Promise<AssembledTransaction<FundAllocation | null>>;
}

export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new Spec(["AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAgAAAAEAAAAAAAAACkFsbG9jYXRpb24AAAAAAAEAAAARAAAAAAAAAAAAAAAFQWRtaW4AAAA=", "AAAAAAAAAAAAAAAIYWxsb2NhdGUAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACnByb2plY3RfaWQAAAAAABEAAAAAAAAACmFtb3VudF94bG0AAAAAAAsAAAAA", "AAAAAQAAAAAAAAAAAAAADkZ1bmRBbGxvY2F0aW9uAAAAAAAEAAAAAAAAAAxhbGxvY2F0ZWRfYXQAAAAGAAAAAAAAAAphbW91bnRfeGxtAAAAAAALAAAAAAAAAAxvcmdhbml6YXRpb24AAAATAAAAAAAAAApwcm9qZWN0X2lkAAAAAAAR", "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==", "AAAAAAAAAAAAAAAOZ2V0X2FsbG9jYXRpb24AAAAAAAEAAAAAAAAACnByb2plY3RfaWQAAAAAABEAAAABAAAD6AAAB9AAAAAORnVuZEFsbG9jYXRpb24AAA=="]),
      options
    );
  }

   static deploy<T = Client>(options: MethodOptions & Omit<ContractClientOptions, 'contractId'> & { wasmHash: Buffer | string; salt?: Buffer | Uint8Array; format?: "hex" | "base64"; address?: string; }): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options);
  }
  public readonly fromJSON = {
    allocate : this.txFromJSON<void>,  initialize : this.txFromJSON<void>,  get_allocation : this.txFromJSON<FundAllocation | null>
  };
}