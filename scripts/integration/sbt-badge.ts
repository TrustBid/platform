import { Keypair } from '@stellar/stellar-sdk';
import { Client as SbtBadgeClient } from '@trustbid/soroban-bindings/sbt-badge';
import { getContractIdsFromArtifacts } from '@trustbid/soroban-bindings';
import { SorobanService } from '../../apps/api/src/modules/soroban/soroban.service';
import { assert, buildConfig, clientOptions, withSilencedNestErrors } from './helpers';

const BADGE_TYPES = [
  'kyb_verified',
  'transparency_bronze',
  'transparency_silver',
  'transparency_gold',
] as const;

export async function testSbtBadgeDeep(secret: string): Promise<void> {
  const ids = getContractIdsFromArtifacts('testnet');
  assert(ids?.sbtBadge, 'Missing sbt-badge contract ID');

  const { keypair, ...opts } = clientOptions(secret);
  const client = new SbtBadgeClient({
    contractId: ids.sbtBadge,
    ...opts,
  });
  const org = keypair.publicKey();

  // S6-01 mint_badge via bindings
  const mintTx = await client.mint_badge({
    organization: org,
    badge_type: 'kyb_verified',
  });
  const minted = await mintTx.signAndSend();
  const tokenId = Number(minted.result ?? 0);
  assert(tokenId > 0, 'S6-01: tokenId should be positive');
  console.log('  ✓ S6-01 mint_badge via bindings');

  // S6-02 get_badges / get_active_badges
  const badgesTx = await client.get_badges({ organization: org });
  await badgesTx.simulate();
  const badge = (badgesTx.result ?? []).find(
    (b) => Number(b.token_id) === tokenId,
  );
  assert(badge, 'S6-02: minted badge in get_badges');

  const activeTx = await client.get_active_badges({ organization: org });
  await activeTx.simulate();
  const inActive = (activeTx.result ?? []).some(
    (b) => Number(b.token_id) === tokenId,
  );
  assert(inActive, 'S6-02: minted badge in get_active_badges');
  console.log('  ✓ S6-02 get_badges / get_active_badges');

  // S6-03 revoke_badge
  await (await client.revoke_badge({ token_id: BigInt(tokenId) })).signAndSend();
  const afterRevokeTx = await client.get_badges({ organization: org });
  await afterRevokeTx.simulate();
  const revoked = (afterRevokeTx.result ?? []).find(
    (b) => Number(b.token_id) === tokenId,
  );
  assert(
    revoked?.status?.tag === 'Revoked' ||
      (revoked?.status as { Revoked?: unknown })?.Revoked !== undefined,
    'S6-03: badge should be revoked',
  );
  console.log('  ✓ S6-03 revoke_badge');

  // S6-04 todos badge types válidos
  for (const badgeType of BADGE_TYPES) {
    const tx = await client.mint_badge({ organization: org, badge_type: badgeType });
    const sent = await tx.signAndSend();
    assert(Number(sent.result ?? 0) > 0, `S6-04: mint failed for ${badgeType}`);
  }
  console.log('  ✓ S6-04 todos badge types válidos');

  // S6-05 badges por organização
  const otherOrg = Keypair.random().publicKey();
  const otherBadgesTx = await client.get_badges({ organization: otherOrg });
  await otherBadgesTx.simulate();
  assert(
    (otherBadgesTx.result ?? []).length === 0,
    'S6-05: unknown org should have no badges',
  );
  console.log('  ✓ S6-05 badges por organização');

  // S6-06 SorobanService mint + revoke
  const service = new SorobanService(buildConfig(secret));
  const mintedSvc = await service.mintBadge({
    organization: org,
    badgeType: 'transparency_gold',
  });
  assert(mintedSvc?.txHash, 'S6-06: mintBadge returned null');
  const active = await service.readBadges(org);
  const svcBadge = active.find((b) => b.tokenId === mintedSvc!.tokenId);
  assert(svcBadge?.status === 'Active', 'S6-06: minted badge not active');
  const revokeHash = await service.revokeBadge(mintedSvc!.tokenId);
  assert(revokeHash, 'S6-06: revokeBadge returned null');
  console.log('  ✓ S6-06 SorobanService mint + revoke');

  // S6-07 double revoke
  const mintForDouble = await service.mintBadge({
    organization: org,
    badgeType: 'kyb_verified',
  });
  assert(mintForDouble?.tokenId, 'S6-07: setup mint failed');
  await service.revokeBadge(mintForDouble!.tokenId);
  const secondRevoke = await withSilencedNestErrors(() =>
    service.revokeBadge(mintForDouble!.tokenId),
  );
  assert(secondRevoke === null, 'S6-07: double revoke should return null');
  console.log('  ✓ S6-07 double revoke falha gracefully');
}
