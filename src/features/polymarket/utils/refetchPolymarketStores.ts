import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { polymarketPositionsActions } from '@/features/polymarket/stores/polymarketPositionsStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';

export async function refetchPolymarketStores(): Promise<void> {
  await Promise.allSettled([
    polymarketPositionsActions.fetch(undefined, { force: true }),
    usePolymarketBalanceStore.getState().fetch(undefined, { force: true }),
  ]);
}

const MAX_ATTEMPTS = 10;
const DELAY = time.seconds(1);

export async function waitForPositionSizeUpdate(tokenId: string): Promise<void> {
  const initialSize = polymarketPositionsActions.getPosition(tokenId)?.size ?? 0;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await polymarketPositionsActions.fetch(undefined, { force: true });
    const position = polymarketPositionsActions.getPosition(tokenId);
    const currentSize = position?.size ?? 0;
    if (currentSize !== initialSize) {
      await usePolymarketBalanceStore.getState().fetch(undefined, { force: true });
      return;
    }
    await delay(DELAY);
  }
}
