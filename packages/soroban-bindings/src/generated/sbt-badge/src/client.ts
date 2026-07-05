import {Badge} from './types.js';
import {Spec, AssembledTransaction, Client as ContractClient, ClientOptions as ContractClientOptions, MethodOptions} from '@stellar/stellar-sdk/contract';
import {Address} from '@stellar/stellar-sdk';

export interface Client {
  /**
   * Returns a badge by token_id. None if it does not exist.
   */
  get_badge({ token_id }: { token_id: bigint }, options?: MethodOptions): Promise<AssembledTransaction<Badge | null>>;
  /**
   * All badges (active + revoked) for an organization.
   */
  get_badges({ organization }: { organization: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<Array<Badge>>>;
  /**
   * Initializes the contract. Can only be called once.
   */
  initialize({ admin }: { admin: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<void>>;
  /**
   * Mints a reputation SBT to `organization`.
   * Only the admin can call this function.
   */
  mint_badge({ organization, badge_type }: { organization: string | Address; badge_type: string }, options?: MethodOptions): Promise<AssembledTransaction<bigint>>;
  /**
   * Revokes a badge. The original record remains on ledger with status=Revoked.
   * Only the admin can revoke.
   */
  revoke_badge({ token_id }: { token_id: bigint }, options?: MethodOptions): Promise<AssembledTransaction<void>>;
  /**
   * Only active badges for an organization.
   */
  get_active_badges({ organization }: { organization: string | Address }, options?: MethodOptions): Promise<AssembledTransaction<Array<Badge>>>;
}

export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new Spec(["AAAAAQAAAAAAAAAAAAAABUJhZGdlAAAAAAAABgAAAAAAAAAKYmFkZ2VfdHlwZQAAAAAAEQAAAAAAAAAJaXNzdWVkX2F0AAAAAAAABgAAAAAAAAAMb3JnYW5pemF0aW9uAAAAEwAAAAAAAAAKcmV2b2tlZF9hdAAAAAAABgAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAC0JhZGdlU3RhdHVzAAAAAAAAAAAIdG9rZW5faWQAAAAG", "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAALTmV4dFRva2VuSWQAAAAAAQAAAAAAAAAJQmFkZ2VCeUlkAAAAAAAAAQAAAAYAAAABAAAAAAAAAAlPcmdCYWRnZXMAAAAAAAABAAAAEw==", "AAAAAgAAAAAAAAAAAAAAC0JhZGdlU3RhdHVzAAAAAAIAAAAAAAAAAAAAAAZBY3RpdmUAAAAAAAAAAAAAAAAAB1Jldm9rZWQA", "AAAAAAAAADdSZXR1cm5zIGEgYmFkZ2UgYnkgdG9rZW5faWQuIE5vbmUgaWYgaXQgZG9lcyBub3QgZXhpc3QuAAAAAAlnZXRfYmFkZ2UAAAAAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAYAAAABAAAD6AAAB9AAAAAFQmFkZ2UAAAA=", "AAAAAAAAADJBbGwgYmFkZ2VzIChhY3RpdmUgKyByZXZva2VkKSBmb3IgYW4gb3JnYW5pemF0aW9uLgAAAAAACmdldF9iYWRnZXMAAAAAAAEAAAAAAAAADG9yZ2FuaXphdGlvbgAAABMAAAABAAAD6gAAB9AAAAAFQmFkZ2UAAAA=", "AAAAAAAAADJJbml0aWFsaXplcyB0aGUgY29udHJhY3QuIENhbiBvbmx5IGJlIGNhbGxlZCBvbmNlLgAAAAAACmluaXRpYWxpemUAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=", "AAAAAAAAAFBNaW50cyBhIHJlcHV0YXRpb24gU0JUIHRvIGBvcmdhbml6YXRpb25gLgpPbmx5IHRoZSBhZG1pbiBjYW4gY2FsbCB0aGlzIGZ1bmN0aW9uLgAAAAptaW50X2JhZGdlAAAAAAACAAAAAAAAAAxvcmdhbml6YXRpb24AAAATAAAAAAAAAApiYWRnZV90eXBlAAAAAAARAAAAAQAAAAY=", "AAAAAAAAAGZSZXZva2VzIGEgYmFkZ2UuIFRoZSBvcmlnaW5hbCByZWNvcmQgcmVtYWlucyBvbiBsZWRnZXIgd2l0aCBzdGF0dXM9UmV2b2tlZC4KT25seSB0aGUgYWRtaW4gY2FuIHJldm9rZS4AAAAAAAxyZXZva2VfYmFkZ2UAAAABAAAAAAAAAAh0b2tlbl9pZAAAAAYAAAAA", "AAAAAAAAACdPbmx5IGFjdGl2ZSBiYWRnZXMgZm9yIGFuIG9yZ2FuaXphdGlvbi4AAAAAEWdldF9hY3RpdmVfYmFkZ2VzAAAAAAAAAQAAAAAAAAAMb3JnYW5pemF0aW9uAAAAEwAAAAEAAAPqAAAH0AAAAAVCYWRnZQAAAA=="]),
      options
    );
  }

   static deploy<T = Client>(options: MethodOptions & Omit<ContractClientOptions, 'contractId'> & { wasmHash: Buffer | string; salt?: Buffer | Uint8Array; format?: "hex" | "base64"; address?: string; }): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options);
  }
  public readonly fromJSON = {
    get_badge : this.txFromJSON<Badge | null>,  get_badges : this.txFromJSON<Array<Badge>>,  initialize : this.txFromJSON<void>,  mint_badge : this.txFromJSON<bigint>,  revoke_badge : this.txFromJSON<void>,  get_active_badges : this.txFromJSON<Array<Badge>>
  };
}