import { usePositionsStore } from '@/state/positions/positions';
import { userAssetsStore } from './userAssets';

let unsubscribe: (() => void) | null = null;

/**
 * Sets up a subscription to the positions store to reprocess assets
 * only when position token addresses actually change.
 * Uses Zustand's subscribe to compare previous and current addresses.
 */
export function setupPositionsAssetsSync() {
  cleanupPositionsAssetsSync();

  unsubscribe = usePositionsStore.subscribe(
    state => state.getPositionTokenAddresses(),
    (currentAddresses, prevAddresses) => {
      const addressesChanged =
        currentAddresses.size !== prevAddresses.size ||
        [...currentAddresses].some(addr => !prevAddresses.has(addr)) ||
        [...prevAddresses].some(addr => !currentAddresses.has(addr));

      if (addressesChanged) {
        userAssetsStore.getState().reprocessAssetsData();
      }
    }
  );
}

export function cleanupPositionsAssetsSync() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
