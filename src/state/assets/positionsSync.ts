import { usePositionsStore } from '@/features/positions/stores/positionsStore';

import { type UserAssetsStoreType } from './types';

let unsubscribe: (() => void) | null = null;

/** Reprocesses user assets when the set of position token addresses changes. */
export function setupPositionsAssetsSync(userAssetsStore: UserAssetsStoreType): void {
  cleanupPositionsAssetsSync();

  unsubscribe = usePositionsStore.subscribe(
    state => state.getTokenAddresses(),
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

export function cleanupPositionsAssetsSync(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
