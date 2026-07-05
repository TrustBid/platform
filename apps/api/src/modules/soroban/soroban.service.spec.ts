jest.mock('@stellar/stellar-sdk', () => ({
  Keypair: {
    fromSecret: jest.fn((secret: string) => {
      if (!secret.startsWith('S') || secret.length < 20) {
        throw new Error('Invalid Stellar secret');
      }
      return { publicKey: () => 'GTESTPUBKEY000000000000000000000000000000000000000' };
    }),
  },
  Networks: { TESTNET: 'Test SDF Network ; September 2015', PUBLIC: 'Public Network ; September 2017' },
  scValToNative: jest.fn(),
  xdr: { ScVal: class ScVal {} },
}));

jest.mock('@stellar/stellar-sdk/contract', () => ({
  basicNodeSigner: jest.fn(() => ({ signTransaction: jest.fn() })),
}));

jest.mock('@trustbid/soroban-bindings/fund-tracker', () => ({
  Client: jest.fn().mockImplementation(() => ({
    allocate: jest.fn(),
    get_allocation: jest.fn(),
  })),
}));

jest.mock('@trustbid/soroban-bindings/expense-anchor', () => ({
  Client: jest.fn().mockImplementation(() => ({
    anchor: jest.fn(),
    get_expense: jest.fn(),
  })),
}));

jest.mock('@trustbid/soroban-bindings/sbt-badge', () => ({
  Client: jest.fn().mockImplementation(() => ({
    mint_badge: jest.fn(),
    revoke_badge: jest.fn(),
    get_badges: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bindings from '@trustbid/soroban-bindings';
import { Client as SbtBadgeClient } from '@trustbid/soroban-bindings/sbt-badge';
import { SorobanService } from './soroban.service';

const VALID_SECRET = 'SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const CONTRACT_IDS = {
  FUND_TRACKER_CONTRACT_ID: 'CC6OJ26655KKLDZB6HXBV2IN4WWU7GMU57IX7WQSF3SKAEJRMAPQVHYS',
  EXPENSE_ANCHOR_CONTRACT_ID: 'CABW2KK4CRLHOB4GATGIT2MDGE3HLTDTI5YZOFOQHGLONQTNU3MYYOAW',
  SBT_BADGE_CONTRACT_ID: 'CCBTM23SCCOEA7Y55DL4ENJNWID7OATWB7RXHAS7MD6CQHW3PMG4CDNK',
};

describe('SorobanService', () => {
  function buildModule(config: Record<string, string | undefined>) {
    return Test.createTestingModule({
      providers: [
        SorobanService,
        { provide: ConfigService, useValue: new ConfigService(config) },
      ],
    }).compile();
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should_throw_when_contract_ids_unavailable', async () => {
    jest.spyOn(bindings, 'getContractIdsFromArtifacts').mockReturnValue(null);
    await expect(
      buildModule({
        STELLAR_SERVER_SECRET: VALID_SECRET,
        STELLAR_NETWORK: 'testnet',
      }),
    ).rejects.toThrow();
    jest.restoreAllMocks();
  });

  it('should_construct_with_contract_ids_from_env', async () => {
    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'testnet',
      STELLAR_RPC_URL: 'https://soroban-testnet.stellar.org',
      ...CONTRACT_IDS,
    });
    expect(module.get(SorobanService)).toBeDefined();
  });

  it('should_fail_on_invalid_secret', async () => {
    await expect(
      buildModule({
        STELLAR_SERVER_SECRET: 'not-a-valid-stellar-secret',
        ...CONTRACT_IDS,
      }),
    ).rejects.toThrow('Invalid Stellar secret');
  });

  it('should_return_empty_badges_when_simulate_fails', async () => {
    const mockClient = {
      get_badges: jest.fn().mockRejectedValue(new Error('rpc down')),
    };
    (SbtBadgeClient as jest.Mock).mockImplementation(() => mockClient);

    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'testnet',
      ...CONTRACT_IDS,
    });
    const service = module.get(SorobanService);
    const badges = await service.readBadges('GORG');
    expect(badges).toEqual([]);
  });

  it('should_return_null_from_allocateFunds_on_client_failure', async () => {
    const { Client: FundTrackerClient } = jest.requireMock(
      '@trustbid/soroban-bindings/fund-tracker',
    );
    (FundTrackerClient as jest.Mock).mockImplementation(() => ({
      allocate: jest.fn().mockRejectedValue(new Error('rpc down')),
    }));

    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'testnet',
      ...CONTRACT_IDS,
    });
    const service = module.get(SorobanService);
    const result = await service.allocateFunds(
      '00000000-0000-0000-0000-000000000001',
      1,
      'GTEST',
    );
    expect(result).toBeNull();
  });

  it('should_resolve_contract_ids_from_artifacts_when_env_unset', async () => {
    jest.spyOn(bindings, 'getContractIdsFromArtifacts').mockReturnValue({
      fundTracker: CONTRACT_IDS.FUND_TRACKER_CONTRACT_ID,
      expenseAnchor: CONTRACT_IDS.EXPENSE_ANCHOR_CONTRACT_ID,
      sbtBadge: CONTRACT_IDS.SBT_BADGE_CONTRACT_ID,
    });

    const mockClient = {
      get_badges: jest.fn().mockResolvedValue({
        simulate: jest.fn(),
        result: [],
      }),
    };
    (SbtBadgeClient as jest.Mock).mockImplementation(() => mockClient);

    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'testnet',
      STELLAR_RPC_URL: 'https://soroban-testnet.stellar.org',
    });
    const service = module.get(SorobanService);
    const badges = await service.readBadges('GORG');
    expect(Array.isArray(badges)).toBe(true);
    jest.restoreAllMocks();
  });

  it('should_use_public_passphrase_when_network_is_public', async () => {
    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'public',
      ...CONTRACT_IDS,
    });
    expect(module.get(SorobanService)).toBeDefined();
  });

  it('should_return_tx_hash_from_allocateFunds_on_success', async () => {
    const { Client: FundTrackerClient } = jest.requireMock(
      '@trustbid/soroban-bindings/fund-tracker',
    );
    (FundTrackerClient as jest.Mock).mockImplementation(() => ({
      allocate: jest.fn().mockResolvedValue({
        signAndSend: jest.fn().mockResolvedValue({
          sendTransactionResponse: { hash: 'abc123allocate' },
        }),
      }),
    }));

    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'testnet',
      ...CONTRACT_IDS,
    });
    const service = module.get(SorobanService);
    const result = await service.allocateFunds(
      '00000000-0000-0000-0000-000000000001',
      10,
      'GTEST',
    );
    expect(result).toBe('abc123allocate');
  });

  it('should_return_tx_hash_from_anchorExpense_on_success', async () => {
    const { Client: ExpenseAnchorClient } = jest.requireMock(
      '@trustbid/soroban-bindings/expense-anchor',
    );
    (ExpenseAnchorClient as jest.Mock).mockImplementation(() => ({
      anchor: jest.fn().mockResolvedValue({
        signAndSend: jest.fn().mockResolvedValue({
          sendTransactionResponse: { hash: 'abc123anchor' },
        }),
      }),
    }));

    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'testnet',
      ...CONTRACT_IDS,
    });
    const service = module.get(SorobanService);
    const result = await service.anchorExpense({
      expenseId: '00000000-0000-0000-0000-000000000002',
      projectId: '00000000-0000-0000-0000-000000000001',
      amountXlm: 5,
      receiptHash: 'a'.repeat(64),
      callerPublicKey: 'GTEST',
    });
    expect(result).toBe('abc123anchor');
  });

  it('should_retry_anchorExpense_with_retry_helper', async () => {
    jest.useFakeTimers();
    const { Client: ExpenseAnchorClient } = jest.requireMock(
      '@trustbid/soroban-bindings/expense-anchor',
    );
    let calls = 0;
    (ExpenseAnchorClient as jest.Mock).mockImplementation(() => ({
      anchor: jest.fn().mockImplementation(() => {
        calls++;
        if (calls === 1) {
          return Promise.reject(new Error('transient'));
        }
        return Promise.resolve({
          signAndSend: jest.fn().mockResolvedValue({
            sendTransactionResponse: { hash: 'retry-hash' },
          }),
        });
      }),
    }));

    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'testnet',
      ...CONTRACT_IDS,
    });
    const service = module.get(SorobanService);
    const promise = service.anchorExpenseWithRetry({
      expenseId: '00000000-0000-0000-0000-000000000003',
      projectId: '00000000-0000-0000-0000-000000000001',
      amountXlm: 1,
      receiptHash: 'b'.repeat(64),
      callerPublicKey: 'GTEST',
    });
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('retry-hash');
    expect(calls).toBe(2);
    jest.useRealTimers();
  });

  it('should_return_allocation_from_readAllocation', async () => {
    const { Client: FundTrackerClient } = jest.requireMock(
      '@trustbid/soroban-bindings/fund-tracker',
    );
    (FundTrackerClient as jest.Mock).mockImplementation(() => ({
      get_allocation: jest.fn().mockResolvedValue({
        simulate: jest.fn(),
        result: {
          organization: 'GORG',
          amount_xlm: BigInt(50_000_000),
          allocated_at: BigInt(123),
        },
      }),
    }));

    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'testnet',
      ...CONTRACT_IDS,
    });
    const service = module.get(SorobanService);
    const allocation = await service.readAllocation(
      '00000000-0000-0000-0000-000000000001',
    );
    expect(allocation?.amountXlm).toBe(5);
  });

  it('should_return_expense_from_readExpense', async () => {
    const { Client: ExpenseAnchorClient } = jest.requireMock(
      '@trustbid/soroban-bindings/expense-anchor',
    );
    (ExpenseAnchorClient as jest.Mock).mockImplementation(() => ({
      get_expense: jest.fn().mockResolvedValue({
        simulate: jest.fn(),
        result: {
          project_id: '000000000001',
          submitted_by: 'GORG',
          amount_xlm: BigInt(10_000_000),
          receipt_hash: Buffer.alloc(32, 0xab),
          anchored_at: BigInt(456),
        },
      }),
    }));

    const module = await buildModule({
      STELLAR_SERVER_SECRET: VALID_SECRET,
      STELLAR_NETWORK: 'testnet',
      ...CONTRACT_IDS,
    });
    const service = module.get(SorobanService);
    const expense = await service.readExpense(
      '00000000-0000-0000-0000-000000000002',
    );
    expect(expense?.amountXlm).toBe(1);
    expect(expense?.receiptHash).toBeTruthy();
  });
});
