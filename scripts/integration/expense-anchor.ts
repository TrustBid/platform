import { createHash, randomBytes, randomUUID } from 'crypto';
import { Client as ExpenseAnchorClient } from '@trustbid/soroban-bindings/expense-anchor';
import { getContractIdsFromArtifacts } from '@trustbid/soroban-bindings';
import { SorobanService } from '../../apps/api/src/modules/soroban/soroban.service';
import {
  assert,
  buildConfig,
  clientOptions,
  projectSym as toProjectSym,
} from './helpers';

export async function testExpenseAnchorDeep(secret: string): Promise<void> {
  const ids = getContractIdsFromArtifacts('testnet');
  assert(ids?.expenseAnchor, 'Missing expense-anchor contract ID');

  const { keypair, ...opts } = clientOptions(secret);
  const client = new ExpenseAnchorClient({
    contractId: ids.expenseAnchor,
    ...opts,
  });

  // S5-01 anchor + get_expense (bindings)
  const expenseSym = toProjectSym(randomUUID());
  const projectSym = toProjectSym(randomUUID());
  const receiptHash = randomBytes(32);
  await (await client.anchor({
    caller: keypair.publicKey(),
    expense_id: expenseSym,
    project_id: projectSym,
    amount_xlm: 5_000_000n,
    receipt_hash: receiptHash,
  })).signAndSend();

  const readTx = await client.get_expense({ expense_id: expenseSym });
  await readTx.simulate();
  assert(readTx.result, 'S5-01: expense should exist');
  const storedHash = Buffer.from(readTx.result!.receipt_hash as Uint8Array).toString('hex');
  assert(storedHash === receiptHash.toString('hex'), 'S5-01: receipt hash mismatch');
  console.log('  ✓ S5-01 anchor + get_expense (bindings)');

  // S5-02 expense inexistente
  const missingTx = await client.get_expense({
    expense_id: toProjectSym(randomUUID()),
  });
  await missingTx.simulate();
  assert(missingTx.result == null, 'S5-02: expected null');
  console.log('  ✓ S5-02 expense inexistente → null');

  // S5-03 re-anchor overwrite
  const overwriteSym = toProjectSym(randomUUID());
  const hash1 = randomBytes(32);
  const hash2 = randomBytes(32);
  await (await client.anchor({
    caller: keypair.publicKey(),
    expense_id: overwriteSym,
    project_id: projectSym,
    amount_xlm: 1_000_000n,
    receipt_hash: hash1,
  })).signAndSend();
  await (await client.anchor({
    caller: keypair.publicKey(),
    expense_id: overwriteSym,
    project_id: projectSym,
    amount_xlm: 2_000_000n,
    receipt_hash: hash2,
  })).signAndSend();
  const overwriteRead = await client.get_expense({ expense_id: overwriteSym });
  await overwriteRead.simulate();
  const overwriteHash = Buffer.from(
    overwriteRead.result!.receipt_hash as Uint8Array,
  ).toString('hex');
  assert(overwriteHash === hash2.toString('hex'), 'S5-03: overwrite failed');
  console.log('  ✓ S5-03 re-anchor overwrite');

  // S5-04 hash curto (edge)
  const shortSym = toProjectSym(randomUUID());
  const shortHash = Buffer.from('abc', 'utf8');
  await (await client.anchor({
    caller: keypair.publicKey(),
    expense_id: shortSym,
    project_id: projectSym,
    amount_xlm: 100n,
    receipt_hash: shortHash,
  })).signAndSend();
  const shortRead = await client.get_expense({ expense_id: shortSym });
  await shortRead.simulate();
  assert(shortRead.result, 'S5-04: short hash expense should exist');
  console.log('  ✓ S5-04 hash curto aceito');

  // S5-05 independent expenses (multi-caller on testnet requires extra signers; covered in Rust unit tests)
  const expC = toProjectSym(randomUUID());
  const expD = toProjectSym(randomUUID());
  await (await client.anchor({
    caller: keypair.publicKey(),
    expense_id: expC,
    project_id: projectSym,
    amount_xlm: 100n,
    receipt_hash: randomBytes(32),
  })).signAndSend();
  await (await client.anchor({
    caller: keypair.publicKey(),
    expense_id: expD,
    project_id: projectSym,
    amount_xlm: 200n,
    receipt_hash: randomBytes(32),
  })).signAndSend();
  const readC = await client.get_expense({ expense_id: expC });
  await readC.simulate();
  const readD = await client.get_expense({ expense_id: expD });
  await readD.simulate();
  assert(readC.result && readD.result, 'S5-05: both expenses should exist');
  assert(
    readC.result!.amount_xlm !== readD.result!.amount_xlm,
    'S5-05: expenses should be independent',
  );
  console.log('  ✓ S5-05 independent expenses');

  // S5-06 + S5-07 SorobanService + SHA-256 real
  const service = new SorobanService(buildConfig(secret));
  const expenseId = randomUUID();
  const projectId = randomUUID();
  const content = `${expenseId}:${projectId}:report-title:100:2026-01-01:2026-01-31`;
  const sha256Hash = createHash('sha256').update(content).digest('hex');

  const anchorHash = await service.anchorExpense({
    expenseId,
    projectId,
    amountXlm: 1.0,
    receiptHash: sha256Hash,
    callerPublicKey: keypair.publicKey(),
  });
  assert(anchorHash, 'S5-06: anchorExpense returned null');
  const expense = await service.readExpense(expenseId);
  assert(expense?.receiptHash === sha256Hash, 'S5-07: SHA-256 round-trip failed');
  console.log('  ✓ S5-06 SorobanService anchor + S5-07 SHA-256 round-trip');
}
