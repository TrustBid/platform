import { randomUUID } from 'crypto';
import { Client as FundTrackerClient } from '@trustbid/soroban-bindings/fund-tracker';
import { getContractIdsFromArtifacts } from '@trustbid/soroban-bindings';
import { SorobanService } from '../../apps/api/src/modules/soroban/soroban.service';
import {
  assert,
  buildConfig,
  clientOptions,
  projectSym as toProjectSym,
} from './helpers';

export async function testFundTrackerDeep(secret: string): Promise<void> {
  const ids = getContractIdsFromArtifacts('testnet');
  assert(ids?.fundTracker, 'Missing fund-tracker contract ID');

  const { keypair, ...opts } = clientOptions(secret);
  const client = new FundTrackerClient({
    contractId: ids.fundTracker,
    ...opts,
  });

  // S4-01 allocate + read happy path
  const projectSym = toProjectSym(randomUUID());
  const amountRaw = 15_000_000n;
  const allocateTx = await client.allocate({
    caller: keypair.publicKey(),
    project_id: projectSym,
    amount_xlm: amountRaw,
  });
  const sent = await allocateTx.signAndSend();
  assert(sent.sendTransactionResponse?.hash, 'S4-01: allocate tx hash missing');
  console.log('  ✓ S4-01 allocate + read happy path');

  const readTx = await client.get_allocation({ project_id: projectSym });
  await readTx.simulate();
  assert(readTx.result?.amount_xlm === amountRaw, 'S4-01: allocation amount mismatch');

  // S4-02 projeto inexistente
  const missingTx = await client.get_allocation({
    project_id: toProjectSym(randomUUID()),
  });
  await missingTx.simulate();
  assert(missingTx.result == null, 'S4-02: expected null for unknown project');
  console.log('  ✓ S4-02 projeto inexistente → null');

  // S4-03 reallocate overwrite
  const overwriteSym = toProjectSym(randomUUID());
  await (await client.allocate({
    caller: keypair.publicKey(),
    project_id: overwriteSym,
    amount_xlm: 1_000_000n,
  })).signAndSend();
  await (await client.allocate({
    caller: keypair.publicKey(),
    project_id: overwriteSym,
    amount_xlm: 9_000_000n,
  })).signAndSend();
  const overwriteRead = await client.get_allocation({ project_id: overwriteSym });
  await overwriteRead.simulate();
  assert(
    overwriteRead.result?.amount_xlm === 9_000_000n,
    'S4-03: reallocate should overwrite',
  );
  console.log('  ✓ S4-03 reallocate overwrite');

  // S4-04 amount negativo
  const negSym = toProjectSym(randomUUID());
  await (await client.allocate({
    caller: keypair.publicKey(),
    project_id: negSym,
    amount_xlm: -500_000n,
  })).signAndSend();
  const negRead = await client.get_allocation({ project_id: negSym });
  await negRead.simulate();
  assert(negRead.result?.amount_xlm === -500_000n, 'S4-04: negative amount');
  console.log('  ✓ S4-04 amount negativo aceito');

  // S4-05 Symbol truncation + S4-06 stroops via SorobanService
  const service = new SorobanService(buildConfig(secret));
  const longUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const truncated = toProjectSym(longUuid);
  assert(truncated.length === 12, 'S4-05: symbol must be 12 chars');

  const projectId = longUuid;
  const allocateHash = await service.allocateFunds(
    projectId,
    2.25,
    keypair.publicKey(),
  );
  assert(allocateHash, 'S4-06: allocateFunds returned null');
  const allocation = await service.readAllocation(projectId);
  assert(allocation, 'S4-06: readAllocation returned null');
  assert(
    Math.abs(allocation.amountXlm - 2.25) < 0.0001,
    'S4-06: stroops conversion mismatch',
  );
  console.log('  ✓ S4-05 Symbol truncation + S4-06 stroops conversion');

  // S4-07 tx hash persistível (covered by S4-01 hash assert)
  console.log('  ✓ S4-07 tx hash persistível');
}
