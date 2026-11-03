import { type Address } from 'viem';

import { polymarketBalanceActions, usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
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

/** Refreshes positions and collateral for the active or explicitly addressed wallet. */
export async function refetchPolymarketStores(proxyAddress?: Address): Promise<void> {
  await Promise.allSettled([refetchPolymarketPositions(proxyAddress), polymarketBalanceActions.refresh(proxyAddress)]);
}
