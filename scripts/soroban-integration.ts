/**
 * Soroban integration runner — bindings + SorobanService against testnet.
 * Covers sprints 4–7 and S9-01 cross-contract (see scripts/integration/*).
 */
import {
  loadEnvLocal,
  resolveServerSecret,
} from './integration/helpers';
import { testFundTrackerDeep } from './integration/fund-tracker';
import { testExpenseAnchorDeep } from './integration/expense-anchor';
import { testSbtBadgeDeep } from './integration/sbt-badge';
import {
  testSorobanServiceConfig,
  testSorobanServiceFlow,
} from './integration/soroban-service';
import { testCrossContract } from './integration/cross-contract';

async function main(): Promise<void> {
  loadEnvLocal();
  const secret = resolveServerSecret();
  if (!secret) {
    console.error(
      'Missing signer: set STELLAR_SERVER_SECRET or configure Stellar CLI identity (CAATINGA_SOURCE, default trustbid)',
    );
    process.exit(1);
  }
  process.env.STELLAR_SERVER_SECRET = secret;

  console.log('=== Sprint 4: fund-tracker ===');
  await testFundTrackerDeep(secret);

  console.log('\n=== Sprint 5: expense-anchor ===');
  await testExpenseAnchorDeep(secret);

  console.log('\n=== Sprint 6: sbt-badge ===');
  await testSbtBadgeDeep(secret);

  console.log('\n=== Sprint 7: SorobanService ===');
  await testSorobanServiceFlow(secret);
  await testSorobanServiceConfig(secret);

  console.log('\n=== Sprint 9: cross-contract ===');
  await testCrossContract(secret);

  console.log('\nAll integration checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
