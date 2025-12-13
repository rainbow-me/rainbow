import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';

export async function refetchPolymarketStores(): Promise<void> {
  await Promise.allSettled([
    usePolymarketPositionsStore.getState().fetch(undefined, { force: true }),
    usePolymarketBalanceStore.getState().fetch(undefined, { force: true }),
  ]);
}
