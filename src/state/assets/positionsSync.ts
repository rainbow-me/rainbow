import { usePositionsTokenAddresses } from '@/state/positions/positions';
import { useUserAssetsStore } from './userAssets';

/**
 * Sets up a subscription to the positions store to reprocess assets
 * only when position token addresses actually change.
 */
export function startPositionsAssetsSync() {
  usePositionsTokenAddresses.subscribe(
    state => state,
    (currentAddresses, prevAddresses) => {
      const addressesChanged =
        currentAddresses.size !== prevAddresses.size ||
        [...currentAddresses].some(addr => !prevAddresses.has(addr)) ||
        [...prevAddresses].some(addr => !currentAddresses.has(addr));

      if (addressesChanged) useUserAssetsStore.getState().reprocessAssetsData(currentAddresses);
    }
  );
}
