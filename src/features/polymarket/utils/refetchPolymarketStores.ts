import { type Address } from 'viem';

import { polymarketBalanceActions, usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { polymarketPositionsActions } from '@/features/polymarket/stores/polymarketPositionsStore';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { delay } from '@/utils/delay';

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

const MAX_ATTEMPTS = 30;
const DELAY = time.seconds(1);

export async function waitForPositionSizeUpdate(tokenId: string): Promise<void> {
  try {
    const initialSize = polymarketPositionsActions.getData()?.[tokenId]?.size ?? 0;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await polymarketPositionsActions.fetch(undefined, { force: true });
      const position = polymarketPositionsActions.getData()?.[tokenId];
      const currentSize = position?.size ?? 0;
      if (currentSize !== initialSize) {
        await usePolymarketBalanceStore.getState().fetch(undefined, { force: true });
        return;
      }
      await delay(DELAY);
    }
  } catch (e) {
    logger.error(new RainbowError('[waitForPositionSizeUpdate] Error waiting for position size update', e));
  }
}
