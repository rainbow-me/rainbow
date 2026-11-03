import { type Address } from 'viem';

import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { polymarketPositionsActions } from '@/features/polymarket/stores/polymarketPositionsStore';

/** Refetches the active or explicitly addressed Polymarket collateral balance. */
export async function refetchPolymarketBalance(proxyAddress?: Address): Promise<void> {
  await usePolymarketBalanceStore.getState().fetch(proxyAddress ? { address: proxyAddress } : undefined, {
    force: true,
  });
}

function refetchPolymarketPositions(proxyAddress?: Address) {
  return polymarketPositionsActions.fetch(proxyAddress ? { proxyAddress } : undefined, { force: true });
}

/** A settlement read supplies the final balance. Refresh positions after it succeeds. */
export async function refetchPolymarketStores(proxyAddress?: Address, settlementRead?: Promise<boolean>): Promise<void> {
  if (settlementRead && (await settlementRead)) {
    await refetchPolymarketPositions(proxyAddress);
    return;
  }

  await Promise.allSettled([refetchPolymarketPositions(proxyAddress), refetchPolymarketBalance(proxyAddress)]);
}
