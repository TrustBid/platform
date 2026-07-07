/**
 * Sprint 8 — API HTTP E2E against a running NestJS instance.
 *
 * Required env:
 *   E2E_API_URL          — default http://localhost:3001
 *   E2E_JWT              — valid tb JWT (org + sub claims)
 *   STELLAR_SERVER_SECRET — for on-chain verification via SorobanService
 *
 * Optional:
 *   E2E_SKIP             — set to "1" to skip (e.g. CI without API)
 */
import { createHash, randomUUID } from 'crypto';
import { SorobanService } from '../../apps/api/src/modules/soroban/soroban.service';
import {
  assert,
  buildConfig,
  loadEnvLocal,
  resolveServerSecret,
} from './helpers';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001';

async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const jwt = process.env.E2E_JWT;
  assert(jwt, 'E2E_JWT is required for API HTTP tests');
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      ...(init.headers ?? {}),
    },
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function testApiHttp(secret: string): Promise<void> {
  // S8-01 criar projeto com blockchain
  const projectRes = await apiFetch('/my/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: `E2E Soroban ${Date.now()}`,
      category: 'technology',
      budgetAmount: 3.5,
      budgetAsset: 'XLM',
      blockchainEnabled: true,
    }),
  });
  assert(projectRes.ok, `S8-01: POST project failed (${projectRes.status})`);
  const project = (await projectRes.json()) as {
    id: string;
    allocationTxHash: string | null;
  };
  assert(project.id, 'S8-01: project id missing');
  assert(project.allocationTxHash, 'S8-01: allocation_tx_hash missing');
  console.log('  ✓ S8-01 criar projeto com blockchain');

  // S8-02 verificar on-chain
  const service = new SorobanService(buildConfig(secret));
  const allocation = await service.readAllocation(project.id);
  assert(allocation, 'S8-02: readAllocation returned null');
  assert(
    Math.abs(allocation.amountXlm - 3.5) < 0.0001,
    'S8-02: allocation amount mismatch',
  );
  console.log('  ✓ S8-02 verificar on-chain allocation');

  // S8-03 criar report (anchor async)
  const periodStart = '2026-01-01';
  const periodEnd = '2026-01-31';
  const title = `E2E Report ${Date.now()}`;
  const fundsUsed = 1.25;
  const reportRes = await apiFetch('/my/reports', {
    method: 'POST',
    body: JSON.stringify({
      projectId: project.id,
      reportType: 'progress',
      title,
      periodStart,
      periodEnd,
      fundsUsedAmount: fundsUsed,
      fundsUsedAsset: 'XLM',
    }),
  });
  assert(reportRes.status === 201 || reportRes.ok, `S8-03: POST report failed (${reportRes.status})`);
  const report = (await reportRes.json()) as { id: string };
  assert(report.id, 'S8-03: report id missing');
  console.log('  ✓ S8-03 criar report (resposta imediata)');

  // S8-04 poll anchor_tx_hash
  const receiptHash = createHash('sha256')
    .update(`${report.id}:${project.id}:${title}:${fundsUsed}:${periodStart}:${periodEnd}`)
    .digest('hex');

  let anchorTxHash: string | null = null;
  for (let i = 0; i < 12; i++) {
    await sleep(5000);
    const listRes = await apiFetch('/my/reports');
    assert(listRes.ok, 'S8-04: GET reports failed');
    const reports = (await listRes.json()) as Array<{
      id: string;
      anchorTxHash: string | null;
    }>;
    const found = reports.find((r) => r.id === report.id);
    if (found?.anchorTxHash) {
      anchorTxHash = found.anchorTxHash;
      break;
    }
  }
  assert(anchorTxHash, 'S8-04: anchor_tx_hash not set within 60s');
  console.log('  ✓ S8-04 anchor async — anchor_tx_hash preenchido');

  // S8-05 verificar on-chain expense
  const expense = await service.readExpense(report.id);
  assert(expense?.receiptHash === receiptHash, 'S8-05: receipt hash mismatch');
  console.log('  ✓ S8-05 verificar on-chain expense');

  // S8-06 projeto sem blockchain
  const noChainRes = await apiFetch('/my/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: `E2E No Chain ${Date.now()}`,
      category: 'social',
      budgetAmount: 1,
      blockchainEnabled: false,
    }),
  });
  assert(noChainRes.ok, 'S8-06: POST project without blockchain failed');
  const noChain = (await noChainRes.json()) as { allocationTxHash: string | null };
  assert(
    noChain.allocationTxHash == null,
    'S8-06: should not have allocation tx hash',
  );
  console.log('  ✓ S8-06 projeto sem blockchain');

  // S8-07 falha Soroban — covered by S7-05 unit/integration (RPC down → null)
  console.log('  ✓ S8-07 falha Soroban (covered by SorobanService RPC failure tests)');
}

async function main(): Promise<void> {
  if (process.env.E2E_SKIP === '1') {
    console.log('API HTTP E2E skipped (E2E_SKIP=1)');
    return;
  }

  if (!process.env.E2E_JWT) {
    console.log(
      'API HTTP E2E skipped — set E2E_JWT (+ running API at E2E_API_URL) to enable Sprint 8',
    );
    return;
  }

  loadEnvLocal();
  const secret = resolveServerSecret();
  assert(secret, 'STELLAR_SERVER_SECRET required for on-chain verification');
  process.env.STELLAR_SERVER_SECRET = secret;

  console.log('=== Sprint 8: API HTTP E2E ===');
  await testApiHttp(secret);
  console.log('API HTTP E2E passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
