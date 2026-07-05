import { createHash, randomUUID } from 'crypto';
import { SorobanService } from '../../apps/api/src/modules/soroban/soroban.service';
import { assert, buildConfig, clientOptions, withSilencedNestErrors } from './helpers';

export async function testSorobanServiceFlow(secret: string): Promise<void> {
  const service = new SorobanService(buildConfig(secret));
  const { keypair } = clientOptions(secret);
  const callerPublicKey = keypair.publicKey();

  // S7-01 fluxo feliz completo
  const projectId = randomUUID();
  const allocateHash = await service.allocateFunds(
    projectId,
    2.25,
    callerPublicKey,
  );
  assert(allocateHash, 'S7-01: allocateFunds returned null');
  const allocation = await service.readAllocation(projectId);
  assert(allocation, 'S7-01: readAllocation returned null');
  assert(
    Math.abs(allocation.amountXlm - 2.25) < 0.0001,
    'S7-01: allocation amount mismatch',
  );

  const expenseId = randomUUID();
  const receiptHash = createHash('sha256')
    .update(`expense-${expenseId}`)
    .digest('hex');
  const anchorHash = await service.anchorExpense({
    expenseId,
    projectId: randomUUID(),
    amountXlm: 0.5,
    receiptHash,
    callerPublicKey,
  });
  assert(anchorHash, 'S7-01: anchorExpense returned null');
  const expense = await service.readExpense(expenseId);
  assert(expense?.receiptHash === receiptHash, 'S7-01: receipt hash mismatch');

  const minted = await service.mintBadge({
    organization: callerPublicKey,
    badgeType: 'kyb_verified',
  });
  assert(minted?.txHash, 'S7-01: mintBadge returned null');
  const active = await service.readBadges(callerPublicKey);
  const badge = active.find((b) => b.tokenId === minted!.tokenId);
  assert(badge?.status === 'Active', 'S7-01: minted badge not active');

  const revokeHash = await service.revokeBadge(minted!.tokenId);
  assert(revokeHash, 'S7-01: revokeBadge returned null');
  console.log('  ✓ S7-01 fluxo feliz completo');
}

export async function testSorobanServiceConfig(secret: string): Promise<void> {
  const ids = {
    fundTracker: process.env.FUND_TRACKER_CONTRACT_ID,
    expenseAnchor: process.env.EXPENSE_ANCHOR_CONTRACT_ID,
    sbtBadge: process.env.SBT_BADGE_CONTRACT_ID,
  };

  // S7-02 contract ID via env
  const saved = { ...process.env };
  process.env.FUND_TRACKER_CONTRACT_ID = ids.fundTracker!;
  process.env.EXPENSE_ANCHOR_CONTRACT_ID = ids.expenseAnchor!;
  process.env.SBT_BADGE_CONTRACT_ID = ids.sbtBadge!;
  const fromEnv = new SorobanService(buildConfig(secret));
  const envRead = await fromEnv.readBadges(clientOptions(secret).keypair.publicKey());
  assert(Array.isArray(envRead), 'S7-02: env-based service should read badges');
  console.log('  ✓ S7-02 contract ID via env');

  // S7-03 contract ID via artifacts (unset env IDs)
  delete process.env.FUND_TRACKER_CONTRACT_ID;
  delete process.env.EXPENSE_ANCHOR_CONTRACT_ID;
  delete process.env.SBT_BADGE_CONTRACT_ID;
  const fromArtifacts = new SorobanService(buildConfig(secret));
  const artRead = await fromArtifacts.readBadges(clientOptions(secret).keypair.publicKey());
  assert(Array.isArray(artRead), 'S7-03: artifacts fallback should work');
  console.log('  ✓ S7-03 contract ID via artifacts fallback');

  Object.assign(process.env, saved);

  // S7-05 RPC inválido — allocateFunds retorna null (HTTPS closed port avoids allowHttp noise)
  process.env.STELLAR_RPC_URL = 'https://127.0.0.1:9';
  const badRpc = new SorobanService(buildConfig(secret));
  const failed = await withSilencedNestErrors(() =>
    badRpc.allocateFunds(
      randomUUID(),
      1,
      clientOptions(secret).keypair.publicKey(),
    ),
  );
  assert(failed === null, 'S7-05: invalid RPC should return null');
  process.env.STELLAR_RPC_URL = saved.STELLAR_RPC_URL;
  console.log('  ✓ S7-05 RPC inválido retorna null');
}
