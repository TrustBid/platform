import { createHash, randomUUID } from 'crypto';
import { SorobanService } from '../../apps/api/src/modules/soroban/soroban.service';
import { assert, buildConfig, clientOptions } from './helpers';

/** S9-01: projeto alocado → report ancorado no mesmo projectId */
export async function testCrossContract(secret: string): Promise<void> {
  const service = new SorobanService(buildConfig(secret));
  const { keypair } = clientOptions(secret);
  const caller = keypair.publicKey();

  const projectId = randomUUID();
  const budgetXlm = 10.5;
  const allocateHash = await service.allocateFunds(projectId, budgetXlm, caller);
  assert(allocateHash, 'S9-01: allocate failed');

  const allocation = await service.readAllocation(projectId);
  assert(allocation, 'S9-01: allocation read failed');
  assert(
    Math.abs(allocation.amountXlm - budgetXlm) < 0.0001,
    'S9-01: allocation amount mismatch',
  );

  const reportId = randomUUID();
  const receiptHash = createHash('sha256')
    .update(`${reportId}:${projectId}:cross-contract:100:2026-01-01:2026-01-31`)
    .digest('hex');

  const anchorHash = await service.anchorExpense({
    expenseId: reportId,
    projectId,
    amountXlm: 1.0,
    receiptHash,
    callerPublicKey: caller,
  });
  assert(anchorHash, 'S9-01: anchor failed');

  const expense = await service.readExpense(reportId);
  assert(expense?.receiptHash === receiptHash, 'S9-01: expense hash mismatch');

  const projectSym = projectId.replace(/-/g, '').slice(-12);
  assert(
    expense?.projectId === projectSym,
    'S9-01: project Symbol must match truncated UUID',
  );
  console.log('  ✓ S9-01 cross-contract projectId consistency');
}
