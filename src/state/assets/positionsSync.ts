import { usePositionsStore } from '@/state/positions/positions';
import { userAssetsStore } from './userAssets';

let unsubscribe: (() => void) | null = null;

/**
 * Sets up a subscription to the positions store to reprocess assets
 * only when position token addresses actually change.
 */
export function setupPositionsAssetsSync() {
  cleanupPositionsAssetsSync();

  unsubscribe = usePositionsStore.subscribe(
    state => state.getPositionTokenAddresses(),
    (currentAddresses, prevAddresses) => {
      // Most common case, skip logic below
      if (currentAddresses.size === 0 && prevAddresses.size === 0) return;

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
